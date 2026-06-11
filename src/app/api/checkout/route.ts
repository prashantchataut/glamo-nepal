import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCsrf } from "@/lib/csrf";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().optional(),
  name: z.string().min(1).max(160),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(20),
  selectedShade: z.string().optional(),
  image: z.string().optional(),
  brand: z.string().optional(),
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

function getApiBaseUrl(): string {
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
}

export async function POST(request: NextRequest) {
  const csrf = await validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ success: false, status: "error", message: csrf.reason, code: "CSRF_ERROR" }, { status: 403 });
  }

  try {
    const parsed = checkoutOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: "error", message: "Validation failed", code: "VALIDATION_ERROR", fieldErrors: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const apiBaseUrl = getApiBaseUrl();
    const upstream = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/checkout/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { success: false, status: "error", message: "An unexpected error occurred.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}