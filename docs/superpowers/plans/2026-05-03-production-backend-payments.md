# Production Backend — Phase 4: Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create Supabase Edge Functions for Khalti, eSewa, and COD payment flows with server-side verification, fraud prevention, and idempotent processing.

**Architecture:** Each payment provider gets two Edge Functions — one for initiation (called by frontend) and one for verification (called by provider webhook or redirect). A shared payment-status function lets users check their order's payment state. All functions use `_shared/` utilities for auth, CORS, response formatting, and validation. Payment amounts are always verified against the DB order total (never trust client-sent amounts). Webhook signatures are verified with HMAC.

**TechStack:** Supabase Edge Functions (Deno), Hono, TypeScript, Zod, Supabase JS client (service role for mutations), Khalti ePayment API v2, eSewa v2 API

---

## File Structure

| File | Purpose |
|------|---------|
| `supabase/functions/payments/khalti-initiate/index.ts` | POST handler — validates order, creates payment_transaction, calls Khalti API, returns payment URL |
| `supabase/functions/payments/khalti-verify/index.ts` | POST handler — receives Khalti callback, verifies signature, validates amount, updates payment_transaction and order |
| `supabase/functions/payments/esewa-initiate/index.ts` | POST handler — validates order, creates payment_transaction, generates eSewa signed payload, returns payment URL |
| `supabase/functions/payments/esewa-verify/index.ts` | POST handler — receives eSewa callback, verifies signature, validates amount, updates payment_transaction and order |
| `supabase/functions/payments/cod-initiate/index.ts` | POST handler — validates order, creates payment_transaction (COD), confirms order immediately |
| `supabase/functions/payments/payment-status/index.ts` | GET handler — returns payment status for an order (owner or admin only) |

---

## Prerequisites

This plan assumes Phase 1 (database migration), Phase 2 (shared utilities), and Phase 3 (core API) are complete. Specifically, these `_shared/` modules must exist:

- `supabase/functions/_shared/auth.ts` — `getUserFromRequest()`, `requireAuth()`, `requireAdmin()`
- `supabase/functions/_shared/cors.ts` — `corsHeaders`, `handleOptions()`
- `supabase/functions/_shared/response.ts` — `successResponse()`, `errorResponse()`, `paginatedResponse()`
- `supabase/functions/_shared/validation.ts` — Zod schemas and validation middleware
- `supabase/functions/_shared/types.ts` — Shared TypeScript types
- `supabase/functions/_shared/email.ts` — `sendOrderConfirmationEmail()`

The `payment_transactions` table and `orders` table columns (`idempotency_key`, `payment_status`, `status`, `total_amount`, `user_id`) must exist from the Phase 1 migration.

---

### Task 1: Khalti Initiate Payment

**Files:**
- Create: `supabase/functions/payments/khalti-initiate/index.ts`

- [ ] **Step 1: Create the Khalti initiate Edge Function**

```typescript
// supabase/functions/payments/khalti-initiate/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/auth.ts";

const KHALTI_BASE_URL = Deno.env.get("KHALTI_BASE_URL") || "https://a.khalti.com/api/v2";
const KHALTI_SECRET_KEY = Deno.env.get("KHALTI_SECRET_KEY")!;
const KHALTI_PUBLIC_KEY = Deno.env.get("KHALTI_PUBLIC_KEY")!;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  return true;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleOptions();

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (!checkRateLimit(user.id)) {
      return errorResponse("Rate limit exceeded. Try again in a minute.", 429);
    }

    const body = await req.json();
    const { order_id } = body;

    if (!order_id || typeof order_id !== "string") {
      return errorResponse("order_id is required", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, payment_status, total_amount, idempotency_key, shipping_phone, billing_phone")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return errorResponse("Order not found", 404);
    }

    if (order.user_id !== user.id) {
      return errorResponse("You do not own this order", 403);
    }

    if (order.status !== "PENDING") {
      return errorResponse("Order is not in PENDING status", 400);
    }

    if (order.payment_status === "PAID") {
      return errorResponse("Order is already paid", 400);
    }

    const idempotencyKey = crypto.randomUUID();

    const { data: txn, error: txnError } = await supabase
      .from("payment_transactions")
      .insert({
        order_id: order.id,
        provider: "KHALTI",
        idempotency_key: idempotencyKey,
        amount: order.total_amount,
        currency: "NPR",
        status: "PENDING",
      })
      .select("id, idempotency_key")
      .single();

    if (txnError) {
      return errorResponse("Failed to create payment transaction", 500);
    }

    const khaltiPayload = {
      return_url: `${Deno.env.get("FRONTEND_URL") || "https://glamonepal.com"}/checkout/success?provider=khalti&order_id=${order.id}`,
      website_url: Deno.env.get("FRONTEND_URL") || "https://glamonepal.com",
      amount: order.total_amount * 100,
      purchase_order_id: order.order_number,
      purchase_order_name: `GLAMO Order ${order.order_number}`,
      customer_info: {
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer",
        email: user.email || "",
        phone: order.shipping_phone || order.billing_phone || "",
      },
      metadata: {
        idempotency_key: idempotencyKey,
        order_id: order.id,
      },
    };

    const khaltiResponse = await fetch(`${KHALTI_BASE_URL}/epayment/initiate/`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(khaltiPayload),
    });

    const khaltiData = await khaltiResponse.json();

    if (!khaltiResponse.ok) {
      await supabase
        .from("payment_transactions")
        .update({ status: "FAILED", provider_payload: khaltiData })
        .eq("id", txn.id);

      return errorResponse(
        khaltiData.detail || khaltiData.error_key || "Khalti payment initiation failed",
        khaltiResponse.status,
      );
    }

    await supabase
      .from("payment_transactions")
      .update({
        provider_transaction_id: khaltiData.pidx,
        provider_payload: khaltiData,
      })
      .eq("id", txn.id);

    return successResponse({
      payment_url: khaltiData.payment_url,
      pidx: khaltiData.pidx,
      idempotency_key: idempotencyKey,
      order_id: order.id,
      order_number: order.order_number,
      amount: order.total_amount,
    });
  } catch (error) {
    console.error("Khalti initiate error:", error);
    return errorResponse("Internal server error", 500);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/payments/khalti-initiate/index.ts
git commit -m "feat: add Khalti payment initiation Edge Function"
```

---

### Task 2: Khalti Verify Payment (Webhook)

**Files:**
- Create: `supabase/functions/payments/khalti-verify/index.ts`

- [ ] **Step 1: Create the Khalti verify Edge Function**

```typescript
// supabase/functions/payments/khalti-verify/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";

const KHALTI_BASE_URL = Deno.env.get("KHALTI_BASE_URL") || "https://a.khalti.com/api/v2";
const KHALTI_SECRET_KEY = Deno.env.get("KHALTI_SECRET_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleOptions();

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = await req.json();
    const { pidx, transaction_id, purchase_order_id, amount, status: khaltiStatus } = body;

    if (!pidx || !purchase_order_id) {
      return errorResponse("Missing required fields: pidx, purchase_order_id", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const khaltiLookup = await fetch(`${KHALTI_BASE_URL}/epayment/lookup/`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const khaltiLookupData = await khaltiLookup.json();

    if (!khaltiLookup.ok) {
      console.error("Khalti lookup failed:", khaltiLookupData);
      return errorResponse("Khalti verification failed", 400);
    }

    if (khaltiLookupData.status !== "Completed") {
      return errorResponse(`Khalti payment status: ${khaltiLookupData.status}`, 400);
    }

    const { data: txn, error: txnError } = await supabase
      .from("payment_transactions")
      .select("id, order_id, idempotency_key, amount, status, provider")
      .eq("provider_transaction_id", pidx)
      .eq("provider", "KHALTI")
      .single();

    if (txnError || !txn) {
      return errorResponse("Payment transaction not found", 404);
    }

    if (txn.status === "VERIFIED") {
      return successResponse({
        message: "Payment already verified",
        order_id: txn.order_id,
        status: "VERIFIED",
      });
    }

    if (txn.status === "FAILED") {
      return errorResponse("Payment was previously failed", 400);
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, status, payment_status")
      .eq("id", txn.order_id)
      .single();

    if (orderError || !order) {
      return errorResponse("Order not found", 404);
    }

    const khaltiAmountInPaisa = khaltiLookupData.total_amount;
    const expectedAmountInPaisa = order.total_amount * 100;

    if (khaltiAmountInPaisa !== expectedAmountInPaisa) {
      await supabase
        .from("payment_transactions")
        .update({
          status: "FAILED",
          provider_payload: { ...khaltiLookupData, fraud_reason: "amount_mismatch" },
        })
        .eq("id", txn.id);

      console.error(`Amount mismatch: Khalti=${khaltiAmountInPaisa}, Expected=${expectedAmountInPaisa}, order=${order.id}`);
      return errorResponse("Amount verification failed", 400);
    }

    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      return errorResponse(`Order is in ${order.status} status, cannot verify payment`, 400);
    }

    const verifiedAt = new Date().toISOString();

    const { error: updateTxnError } = await supabase
      .from("payment_transactions")
      .update({
        status: "VERIFIED",
        provider_transaction_id: transaction_id || khaltiLookupData.transaction_id || pidx,
        provider_payload: khaltiLookupData,
        verified_at: verifiedAt,
      })
      .eq("id", txn.id);

    if (updateTxnError) {
      console.error("Failed to update payment_transaction:", updateTxnError);
      return errorResponse("Failed to update payment transaction", 500);
    }

    if (order.payment_status !== "PAID") {
      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({
          payment_status: "PAID",
          payment_method: "KHALTI",
          status: "CONFIRMED",
        })
        .eq("id", order.id);

      if (updateOrderError) {
        console.error("Failed to update order:", updateOrderError);
      }

      await supabase
        .from("order_status_histories")
        .insert({
          order_id: order.id,
          status: "CONFIRMED",
          note: "Payment verified via Khalti",
        });
    }

    try {
      const { data: orderDetails } = await supabase
        .from("orders")
        .select("id, order_number, user_id, total_amount, shipping_phone, billing_phone")
        .eq("id", order.id)
        .single();

      if (orderDetails) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", orderDetails.user_id)
          .single();

        const emailRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/emails/order-confirmation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            order_id: order.id,
            order_number: order.order_number,
            customer_email: profile?.email,
            customer_name: profile?.full_name || "Customer",
            amount: order.total_amount,
          }),
        });

        if (!emailRes.ok) {
          console.error("Failed to trigger order confirmation email:", await emailRes.text());
        }
      }
    } catch (emailError) {
      console.error("Email trigger error (non-blocking):", emailError);
    }

    return successResponse({
      message: "Payment verified successfully",
      order_id: order.id,
      order_number: order.order_number,
      status: "VERIFIED",
    });
  } catch (error) {
    console.error("Khalti verify error:", error);
    return errorResponse("Internal server error", 500);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/payments/khalti-verify/index.ts
git commit -m "feat: add Khalti payment verification webhook Edge Function"
```

---

### Task 3: eSewa Initiate Payment

**Files:**
- Create: `supabase/functions/payments/esewa-initiate/index.ts`

- [ ] **Step 1: Create the eSewa initiate Edge Function**

```typescript
// supabase/functions/payments/esewa-initiate/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/auth.ts";

const ESEWA_SECRET_KEY = Deno.env.get("ESEWA_SECRET_KEY")!;
const ESEWA_MERCHANT_CODE = Deno.env.get("ESEWA_MERCHANT_CODE")!;
const ESEWA_BASE_URL = Deno.env.get("ESEWA_BASE_URL") || "https://epay.esewa.com.np/api/v2";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  return true;
}

async function generateEsewaSignature(message: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const msgData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleOptions();

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (!checkRateLimit(user.id)) {
      return errorResponse("Rate limit exceeded. Try again in a minute.", 429);
    }

    const body = await req.json();
    const { order_id } = body;

    if (!order_id || typeof order_id !== "string") {
      return errorResponse("order_id is required", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, payment_status, total_amount, idempotency_key, shipping_phone, billing_phone")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return errorResponse("Order not found", 404);
    }

    if (order.user_id !== user.id) {
      return errorResponse("You do not own this order", 403);
    }

    if (order.status !== "PENDING") {
      return errorResponse("Order is not in PENDING status", 400);
    }

    if (order.payment_status === "PAID") {
      return errorResponse("Order is already paid", 400);
    }

    const idempotencyKey = crypto.randomUUID();

    const { data: txn, error: txnError } = await supabase
      .from("payment_transactions")
      .insert({
        order_id: order.id,
        provider: "ESEWA",
        idempotency_key: idempotencyKey,
        amount: order.total_amount,
        currency: "NPR",
        status: "PENDING",
      })
      .select("id, idempotency_key")
      .single();

    if (txnError) {
      return errorResponse("Failed to create payment transaction", 500);
    }

    const amountStr = String(order.total_amount);
    const taxAmount = "0";
    const productCode = ESEWA_MERCHANT_CODE;
    const transactionUuid = idempotencyKey;

    const signedFieldNames = "total_amount,transaction_uuid,product_code";
    const message = `total_amount=${amountStr},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = await generateEsewaSignature(message, ESEWA_SECRET_KEY);

    const successUrl = `${Deno.env.get("FRONTEND_URL") || "https://glamonepal.com"}/checkout/success?provider=esewa&order_id=${order.id}`;
    const failureUrl = `${Deno.env.get("FRONTEND_URL") || "https://glamonepal.com"}/checkout?provider=esewa&order_id=${order.id}&status=failed`;

    return successResponse({
      payment_url: `${ESEWA_BASE_URL}/epay/main`,
      esewa_params: {
        amount: amountStr,
        tax_amount: taxAmount,
        total_amount: amountStr,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: successUrl,
        failure_url: failureUrl,
        signed_field_names: signedFieldNames,
        signature: signature,
      },
      idempotency_key: idempotencyKey,
      order_id: order.id,
      order_number: order.order_number,
      amount: order.total_amount,
    });
  } catch (error) {
    console.error("eSewa initiate error:", error);
    return errorResponse("Internal server error", 500);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/payments/esewa-initiate/index.ts
git commit -m "feat: add eSewa payment initiation Edge Function"
```

---

### Task 4: eSewa Verify Payment (Webhook)

**Files:**
- Create: `supabase/functions/payments/esewa-verify/index.ts`

- [ ] **Step 1: Create the eSewa verify Edge Function**

```typescript
// supabase/functions/payments/esewa-verify/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";

const ESEWA_SECRET_KEY = Deno.env.get("ESEWA_SECRET_KEY")!;
const ESEWA_MERCHANT_CODE = Deno.env.get("ESEWA_MERCHANT_CODE")!;
const ESEWA_BASE_URL = Deno.env.get("ESEWA_BASE_URL") || "https://epay.esewa.com.np/api/v2";

async function verifyEsewaSignature(data: Record<string, string>): Promise<boolean> {
  try {
    const message = `total_amount=${data.total_amount},transaction_uuid=${data.transaction_uuid},product_code=${data.product_code}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ESEWA_SECRET_KEY);
    const msgData = encoder.encode(message);
    const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, msgData))));

    return data.signature === expectedSignature;
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleOptions();

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = await req.json();
    const {
      transaction_code,
      status: esewaStatus,
      total_amount,
      transaction_uuid,
      product_code,
      signed_field_names,
      signature,
    } = body;

    if (!transaction_uuid || !total_amount || !product_code || !signature) {
      return errorResponse("Missing required eSewa fields", 400);
    }

    if (product_code !== ESEWA_MERCHANT_CODE) {
      return errorResponse("Invalid merchant code", 400);
    }

    const signatureValid = await verifyEsewaSignature({
      total_amount: String(total_amount),
      transaction_uuid,
      product_code,
      signed_field_names,
      signature,
    });

    if (!signatureValid) {
      console.error("eSewa signature verification failed");
      return errorResponse("Signature verification failed", 400);
    }

    if (esewaStatus !== "COMPLETE") {
      return errorResponse(`eSewa payment status: ${esewaStatus}`, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const esewaLookupUrl = `${ESEWA_BASE_URL}/transaction/status/?product_code=${ESEWA_MERCHANT_CODE}&transaction_uuid=${transaction_uuid}`;
    const lookupRes = await fetch(esewaLookupUrl, {
      headers: {
        "Authorization": `Basic ${btoa(`${ESEWA_MERCHANT_CODE}:${ESEWA_SECRET_KEY}`)}`,
      },
    });

    if (!lookupRes.ok) {
      console.error("eSewa status lookup failed:", await lookupRes.text());
      return errorResponse("eSewa status verification failed", 400);
    }

    const lookupData = await lookupRes.json();

    if (lookupData.status !== "COMPLETE") {
      return errorResponse(`eSewa transaction status: ${lookupData.status}`, 400);
    }

    const { data: txn, error: txnError } = await supabase
      .from("payment_transactions")
      .select("id, order_id, idempotency_key, amount, status, provider")
      .eq("idempotency_key", transaction_uuid)
      .eq("provider", "ESEWA")
      .single();

    if (txnError || !txn) {
      return errorResponse("Payment transaction not found", 404);
    }

    if (txn.status === "VERIFIED") {
      return successResponse({
        message: "Payment already verified",
        order_id: txn.order_id,
        status: "VERIFIED",
      });
    }

    if (txn.status === "FAILED") {
      return errorResponse("Payment was previously failed", 400);
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, status, payment_status")
      .eq("id", txn.order_id)
      .single();

    if (orderError || !order) {
      return errorResponse("Order not found", 404);
    }

    const esewaTotalAmount = Number(total_amount);
    if (esewaTotalAmount !== order.total_amount) {
      await supabase
        .from("payment_transactions")
        .update({
          status: "FAILED",
          provider_payload: { ...body, lookupData, fraud_reason: "amount_mismatch" },
        })
        .eq("id", txn.id);

      console.error(`Amount mismatch: eSewa=${esewaTotalAmount}, Expected=${order.total_amount}, order=${order.id}`);
      return errorResponse("Amount verification failed", 400);
    }

    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      return errorResponse(`Order is in ${order.status} status, cannot verify payment`, 400);
    }

    const verifiedAt = new Date().toISOString();

    const { error: updateTxnError } = await supabase
      .from("payment_transactions")
      .update({
        status: "VERIFIED",
        provider_transaction_id: transaction_code || lookupData.ref_id || transaction_uuid,
        provider_payload: { ...body, lookupData },
        verified_at: verifiedAt,
      })
      .eq("id", txn.id);

    if (updateTxnError) {
      console.error("Failed to update payment_transaction:", updateTxnError);
      return errorResponse("Failed to update payment transaction", 500);
    }

    if (order.payment_status !== "PAID") {
      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({
          payment_status: "PAID",
          payment_method: "ESEWA",
          status: "CONFIRMED",
        })
        .eq("id", order.id);

      if (updateOrderError) {
        console.error("Failed to update order:", updateOrderError);
      }

      await supabase
        .from("order_status_histories")
        .insert({
          order_id: order.id,
          status: "CONFIRMED",
          note: "Payment verified via eSewa",
        });
    }

    try {
      const { data: orderDetails } = await supabase
        .from("orders")
        .select("id, order_number, user_id, total_amount")
        .eq("id", order.id)
        .single();

      if (orderDetails) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", orderDetails.user_id)
          .single();

        const emailRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/emails/order-confirmation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            order_id: order.id,
            order_number: order.order_number,
            customer_email: profile?.email,
            customer_name: profile?.full_name || "Customer",
            amount: order.total_amount,
          }),
        });

        if (!emailRes.ok) {
          console.error("Failed to trigger order confirmation email:", await emailRes.text());
        }
      }
    } catch (emailError) {
      console.error("Email trigger error (non-blocking):", emailError);
    }

    return successResponse({
      message: "Payment verified successfully",
      order_id: order.id,
      order_number: order.order_number,
      status: "VERIFIED",
    });
  } catch (error) {
    console.error("eSewa verify error:", error);
    return errorResponse("Internal server error", 500);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/payments/esewa-verify/index.ts
git commit -m "feat: add eSewa payment verification webhook Edge Function"
```

---

### Task 5: COD Initiate Payment

**Files:**
- Create: `supabase/functions/payments/cod-initiate/index.ts`

- [ ] **Step 1: Create the COD initiate Edge Function**

```typescript
// supabase/functions/payments/cod-initiate/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/auth.ts";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  return true;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleOptions();

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (!checkRateLimit(user.id)) {
      return errorResponse("Rate limit exceeded. Try again in a minute.", 429);
    }

    const body = await req.json();
    const { order_id } = body;

    if (!order_id || typeof order_id !== "string") {
      return errorResponse("order_id is required", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, payment_status, total_amount")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return errorResponse("Order not found", 404);
    }

    if (order.user_id !== user.id) {
      return errorResponse("You do not own this order", 403);
    }

    if (order.status !== "PENDING") {
      return errorResponse("Order is not in PENDING status", 400);
    }

    if (order.payment_status === "PAID") {
      return errorResponse("Order is already paid", 400);
    }

    const idempotencyKey = crypto.randomUUID();

    const { data: txn, error: txnError } = await supabase
      .from("payment_transactions")
      .insert({
        order_id: order.id,
        provider: "COD",
        idempotency_key: idempotencyKey,
        amount: order.total_amount,
        currency: "NPR",
        status: "PENDING",
      })
      .select("id, idempotency_key")
      .single();

    if (txnError) {
      return errorResponse("Failed to create payment transaction", 500);
    }

    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        payment_status: "PENDING",
        payment_method: "COD",
        status: "CONFIRMED",
      })
      .eq("id", order.id);

    if (updateOrderError) {
      console.error("Failed to update order:", updateOrderError);
      return errorResponse("Failed to confirm order", 500);
    }

    await supabase
      .from("order_status_histories")
      .insert({
        order_id: order.id,
        status: "CONFIRMED",
        note: "Order confirmed with Cash on Delivery",
      });

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", order.user_id)
        .single();

      const emailRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/emails/order-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          order_number: order.order_number,
          customer_email: profile?.email,
          customer_name: profile?.full_name || "Customer",
          amount: order.total_amount,
          payment_method: "COD",
        }),
      });

      if (!emailRes.ok) {
        console.error("Failed to trigger order confirmation email:", await emailRes.text());
      }
    } catch (emailError) {
      console.error("Email trigger error (non-blocking):", emailError);
    }

    return successResponse({
      message: "COD order confirmed successfully",
      order_id: order.id,
      order_number: order.order_number,
      payment_method: "COD",
      status: "CONFIRMED",
      idempotency_key: idempotencyKey,
    });
  } catch (error) {
    console.error("COD initiate error:", error);
    return errorResponse("Internal server error", 500);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/payments/cod-initiate/index.ts
git commit -m "feat: add COD payment initiation Edge Function"
```

---

### Task 6: Payment Status Check

**Files:**
- Create: `supabase/functions/payments/payment-status/index.ts`

- [ ] **Step 1: Create the payment status Edge Function**

```typescript
// supabase/functions/payments/payment-status/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { errorResponse, successResponse } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleOptions();

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const url = new URL(req.url);
    const orderId = url.pathname.split("/").pop() || url.searchParams.get("order_id");

    if (!orderId) {
      return errorResponse("order_id is required", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, payment_status, payment_method, total_amount")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      const { data: orderByNumber } = await supabase
        .from("orders")
        .select("id, order_number, user_id, status, payment_status, payment_method, total_amount")
        .eq("order_number", orderId)
        .single();

      if (!orderByNumber) {
        return errorResponse("Order not found", 404);
      }

      if (orderByNumber.user_id !== user.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(profile.role)) {
          return errorResponse("You do not own this order", 403);
        }
      }

      return successResponse(await getPaymentStatus(supabase, orderByNumber));
    }

    if (order.user_id !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(profile.role)) {
        return errorResponse("You do not own this order", 403);
      }
    }

    return successResponse(await getPaymentStatus(supabase, order));
  } catch (error) {
    console.error("Payment status error:", error);
    return errorResponse("Internal server error", 500);
  }
});

async function getPaymentStatus(supabase: ReturnType<typeof createClient>, order: Record<string, unknown>) {
  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select("id, provider, provider_transaction_id, idempotency_key, amount, currency, status, created_at, verified_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false });

  return {
    order_id: order.id,
    order_number: order.order_number,
    order_status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    total_amount: order.total_amount,
    transactions: transactions || [],
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/payments/payment-status/index.ts
git commit -m "feat: add payment status check Edge Function"
```

---

### Task 7: Environment Configuration

**Files:**
- Modify: `supabase/config.toml` (add payment function secrets)
- Create: `.env.example` update with payment env vars (if not already present)

- [ ] **Step 1: Add payment environment variables to Supabase config**

Add these secrets to the Supabase project (via `supabase secrets set` or dashboard):

```bash
supabase secrets set KHALTI_SECRET_KEY=your_khalti_secret_key
supabase secrets set KHALTI_PUBLIC_KEY=your_khalti_public_key
supabase secrets set KHALTI_BASE_URL=https://a.khalti.com/api/v2
supabase secrets set ESEWA_SECRET_KEY=your_esewa_secret_key
supabase secrets set ESEWA_MERCHANT_CODE=your_esewa_merchant_code
supabase secrets set ESEWA_BASE_URL=https://epay.esewa.com.np/api/v2
supabase secrets set FRONTEND_URL=https://glamonepal.com
```

- [ ] **Step 2: Verify `.env.example` includes payment variables**

Ensure the `.env.example` file (or equivalent) documents these required environment variables:

```
# Khalti Payment Gateway
KHALTI_SECRET_KEY=
KHALTI_PUBLIC_KEY=
KHALTI_BASE_URL=https://a.khalti.com/api/v2

# eSewa Payment Gateway
ESEWA_SECRET_KEY=
ESEWA_MERCHANT_CODE=
ESEWA_BASE_URL=https://epay.esewa.com.np/api/v2

# Frontend URL (for payment return URLs)
FRONTEND_URL=https://glamonepal.com
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add payment gateway environment variables to .env.example"
```

---

### Task 8: Verification — Deploy and Test

- [ ] **Step 1: Deploy Edge Functions to Supabase**

```bash
supabase functions deploy khalti-initiate --project-ref <project-ref>
supabase functions deploy khalti-verify --project-ref <project-ref>
supabase functions deploy esewa-initiate --project-ref <project-ref>
supabase functions deploy esewa-verify --project-ref <project-ref>
supabase functions deploy cod-initiate --project-ref <project-ref>
supabase functions deploy payment-status --project-ref <project-ref>
```

- [ ] **Step 2: Test Khalti initiate with curl**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/khalti-initiate \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<test-order-id>"}'
```

Expected: 200 with `payment_url`, `pidx`, `idempotency_key`

- [ ] **Step 3: Test COD initiate with curl**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/cod-initiate \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<test-order-id>"}'
```

Expected: 200 with `status: "CONFIRMED"`, `payment_method: "COD"`

- [ ] **Step 4: Test payment status with curl**

```bash
curl -X GET "https://<project-ref>.supabase.co/functions/v1/payment-status?order_id=<test-order-id>" \
  -H "Authorization: Bearer <user-jwt>"
```

Expected: 200 with `payment_status`, `transactions` array

- [ ] **Step 5: Test unauthorized access (should return 401)**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/khalti-initiate \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<test-order-id>"}'
```

Expected: 401 "Unauthorized"

- [ ] **Step 6: Test rate limiting (6 rapid requests should return 429)**

```bash
for i in {1..6}; do
  curl -s -X POST https://<project-ref>.supabase.co/functions/v1/cod-initiate \
    -H "Authorization: Bearer <user-jwt>" \
    -H "Content-Type: application/json" \
    -d '{"order_id": "<test-order-id>"}' | jq '.status'
done
```

Expected: First 5 return 200, 6th returns 429

- [ ] **Step 7: Test amount mismatch fraud prevention**

Manually insert a `payment_transaction` with an `idempotency_key` that maps to a Khalti pidx, then send a webhook callback with a different amount. Expected: 400 "Amount verification failed", transaction updated to FAILED.

- [ ] **Step 8: Test idempotency — send duplicate Khalti verify callback**

After a successful verification, send the same callback again. Expected: 200 "Payment already verified"

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 4 — payment Edge Functions (Khalti, eSewa, COD)"
```

---

## Fraud Prevention Summary

| Check | Implementation |
|-------|---------------|
| **Amount verification** | Khalti/eSewa verify compares `total_amount` from DB `orders` table against payment provider's confirmed amount. Mismatch → transaction marked FAILED. |
| **Idempotency** | Each initiate creates a `payment_transactions` row with UUID `idempotency_key`. eSewa uses it as `transaction_uuid`. Khalti uses `pidx`. Duplicate verify calls return success immediately if already VERIFIED. |
| **Order state check** | Only PENDING orders can initiate payment. Already PAID orders are rejected at initiation. |
| **Signature verification** | eSewa uses HMAC-SHA256 with `ESEWA_SECRET_KEY`. Khalti uses server-side `/epayment/lookup/` with `KHALTI_SECRET_KEY`. |
| **Rate limiting** | In-memory rate limit: 5 requests per 60 seconds per user for payment initiation. |
| **User ownership** | Initiate endpoints verify `order.user_id === auth.uid()`. Payment status endpoint verifies ownership or admin role. |

## Environment Variables Required

| Variable | Purpose | Source |
|----------|---------|--------|
| `KHALTI_SECRET_KEY` | Khalti API authentication | Khalti merchant dashboard |
| `KHALTI_PUBLIC_KEY` | Khalti client-side key | Khalti merchant dashboard |
| `KHALTI_BASE_URL` | Khalti API base URL | `https://a.khalti.com/api/v2` (live) or `https://a.khalti.com/api/v2` (test) |
| `ESEWA_SECRET_KEY` | eSewa HMAC signing key | eSewa merchant dashboard |
| `ESEWA_MERCHANT_CODE` | eSewa merchant identifier | eSewa merchant dashboard |
| `ESEWA_BASE_URL` | eSewa API base URL | `https://epay.esewa.com.np/api/v2` (live) or `https://rc.esewa.com.np/api/v2` (test) |
| `FRONTEND_URL` | Base URL for return/success URLs | `https://glamonepal.com` |
| `SUPABASE_URL` | Supabase project URL | Auto-provided by Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for DB mutations | Supabase dashboard |