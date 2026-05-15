import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validations/checkout";
import { apiRequest } from "@/lib/api/client";
import { GlamoApiError } from "@/lib/api/client";
import type { Order } from "@/lib/api/contracts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `GLM-${year}-${random}`;
}

function normalizePaymentMethod(payment: string): string {
  const map: Record<string, string> = {
    "Cash on Delivery": "cod",
    "Khalti": "khalti",
    "eSewa": "esewa",
    "Cards": "card",
  };
  return map[payment] ?? payment.toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = checkoutSchema.safeParse(body);
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return NextResponse.json(
        { status: "error", message: "Validation failed", code: "VALIDATION_ERROR", fieldErrors },
        { status: 400 },
      );
    }

    const orderNumber = generateOrderNumber();
    const orderId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const data = result.data;

    if (API_BASE_URL) {
      try {
        const apiPayload = {
          customer: { name: data.name, email: data.email, phone: data.phone },
          shippingAddress: {
            fullName: data.name,
            phone: data.phone,
            province: data.province,
            district: data.district,
            city: data.city,
            ward: data.ward,
            addressLine1: data.address,
          },
          paymentMethod: normalizePaymentMethod(data.payment),
          subtotal: 0,
          deliveryFee: 0,
          grandTotal: 0,
          currency: "NPR" as const,
          items: [],
          giftWrap: data.giftWrap,
          orderNotes: data.notes,
        };
        const apiResponse = await apiRequest<Order>("/orders", {
          method: "POST",
          body: JSON.stringify(apiPayload),
        });
        return NextResponse.json({
          status: "success",
          id: apiResponse.data?.id ?? orderId,
          orderNumber: apiResponse.data?.orderNumber ?? orderNumber,
          createdAt: apiResponse.data?.createdAt ?? createdAt,
        });
      } catch (err) {
        if (err instanceof GlamoApiError && err.code === "API_BASE_URL_MISSING") {
          // Fall through to direct Supabase
        } else {
          const message = err instanceof Error ? err.message : "Order creation failed.";
          return NextResponse.json(
            { status: "error", message, code: "ORDER_CREATION_FAILED" },
            { status: 502 },
          );
        }
      }
    }

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          id: orderId,
          order_number: orderNumber,
          customer_name: data.name,
          customer_email: data.email,
          customer_phone: data.phone,
          shipping_full_name: data.name,
          shipping_phone: data.phone,
          shipping_province: data.province,
          shipping_district: data.district,
          shipping_city: data.city,
          shipping_ward: data.ward,
          shipping_address_line1: data.address,
          payment_method: normalizePaymentMethod(data.payment),
          subtotal: 0,
          delivery_fee: 0,
          grand_total: 0,
          order_status: "pending",
          created_at: createdAt,
          items: [],
        }),
      });

      if (!supabaseResponse.ok) {
        const errorText = await supabaseResponse.text();
        console.error("Supabase order creation failed:", supabaseResponse.status, errorText);
        return NextResponse.json(
          { status: "error", message: "Failed to create order. Please try again.", code: "ORDER_CREATION_FAILED" },
          { status: 502 },
        );
      }

      return NextResponse.json({
        status: "success",
        id: orderId,
        orderNumber,
        createdAt,
      });
    }

    return NextResponse.json({
      status: "success",
      id: orderId,
      orderNumber,
      createdAt,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "An unexpected error occurred.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}