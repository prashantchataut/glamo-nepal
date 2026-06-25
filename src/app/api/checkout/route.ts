import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCsrf } from "@/lib/csrf";
import { backendFetch } from "@/lib/server/backend";
import { PROXY_TRUST_HEADER, hasProxyTrustSecret, signProxyTrust } from "@/lib/proxy-trust";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().optional(),
  name: z.string().min(1).max(200),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(20),
  selectedShade: z.string().optional(),
  image: z.string().optional(),
  brand: z.string().optional(),
  // Also accept a nested `product` object (legacy schema) so the proxy is
  // compatible with both client shapes.
  product: z.object({
    id: z.string().optional(),
    sku: z.string().optional(),
    slug: z.string().optional(),
    name: z.string().optional(),
    brand: z.string().optional(),
    image: z.string().optional(),
    price: z.number().nonnegative().optional(),
  }).passthrough().optional(),
});

const checkoutOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    phone: z.string().regex(/^(\+977\s?)?9[78]\d{8}$/),
  }),
  shippingAddress: z.object({
    fullName: z.string().min(2).max(100),
    phone: z.string().regex(/^(\+977\s?)?9[78]\d{8}$/),
    province: z.string().min(1).max(80),
    district: z.string().min(1).max(80),
    city: z.string().min(1).max(100),
    ward: z.string().min(1).max(10),
    addressLine1: z.string().min(5).max(200),
    addressLine2: z.string().optional(),
    landmark: z.string().optional(),
  }),
  items: z.array(orderItemSchema).min(1, "Cart must contain at least one item"),
  paymentMethod: z.enum(["cod", "khalti", "esewa", "card"]),
  giftWrap: z.boolean().optional(),
  orderNotes: z.string().max(500).optional(),
  deliveryFee: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  grandTotal: z.number().positive(),
  currency: z.literal("NPR"),
});

function fieldErrors(error: z.ZodError) {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fields[key] ||= [];
    fields[key].push(issue.message);
  }
  return fields;
}

async function buildProxyTrustHeader(): Promise<Record<string, string> | undefined> {
  if (!hasProxyTrustSecret()) return undefined;
  try {
    const header = await signProxyTrust({ email: "", role: "", csrfValidated: true });
    return { [PROXY_TRUST_HEADER]: header };
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const csrf = await validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ success: false, status: "error", message: csrf.reason, code: "CSRF_ERROR" }, { status: 403 });
  }

  let parsed: z.infer<typeof checkoutOrderSchema>;
  try {
    const body = await request.json();
    const result = checkoutOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, status: "error", message: "Validation failed", code: "VALIDATION_ERROR", fieldErrors: fieldErrors(result.error) },
        { status: 400 },
      );
    }
    parsed = result.data;
  } catch {
    return NextResponse.json(
      { success: false, status: "error", message: "Invalid request body.", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const trustHeaders = await buildProxyTrustHeader();

  try {
    const upstream = await backendFetch("/checkout/orders", {
      method: "POST",
      body: JSON.stringify(parsed),
      forwardFrom: request,
      headers: trustHeaders,
      timeoutMs: 20000,
    });

    let data: unknown;
    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await upstream.json().catch(() => null);
    } else {
      const text = await upstream.text().catch(() => "");
      data = { raw: text.slice(0, 1000) };
    }

    return NextResponse.json(data ?? { success: false, message: "No response from backend." }, { status: upstream.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json(
      { success: false, status: "error", message, code: "INTERNAL_ERROR" },
      { status: 502 },
    );
  }
}
