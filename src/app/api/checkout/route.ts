import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Order } from "@/lib/api/contracts";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

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

function generateOrderNumber(): string {
  return `GLM-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

interface ConvexProduct {
  price: number;
  name: string;
  brand: string;
  image: string;
}

async function fetchProductBySlug(slug: string): Promise<ConvexProduct | null> {
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "products:getBySlug",
        args: { slug },
        format: "json",
      }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (body && body.value && body.value.price != null) return body.value as ConvexProduct;
    if (body && body.price != null) return body as ConvexProduct;
    return null;
  } catch {
    return null;
  }
}

function fieldErrors(error: z.ZodError) {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fields[key] ||= [];
    fields[key].push(issue.message);
  }
  return fields;
}

function buildOrder(id: string, orderNumber: string, createdAt: string, data: z.infer<typeof checkoutOrderSchema>, verified: Array<{ name: string; brand: string; price: number; quantity: number }>): Order {
  return {
    id,
    orderNumber,
    customer: { id: "guest", ...data.customer },
    shippingAddress: data.shippingAddress,
    items: data.items.map((item, idx) => ({
      productId: item.productId,
      sku: item.sku || item.productId,
      name: verified[idx]?.name || item.name,
      quantity: item.quantity,
      unitPrice: verified[idx]?.price ?? item.price,
      selectedShade: item.selectedShade,
    })),
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentMethod === "cod" ? "pending" : "failed",
    orderStatus: "pending",
    subtotal: data.subtotal,
    deliveryFee: data.deliveryFee,
    grandTotal: data.grandTotal,
    currency: "NPR",
    createdAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    const parsed = checkoutOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: "error", message: "Validation failed", code: "VALIDATION_ERROR", fieldErrors: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const verifiedItems: Array<{ productId: string; name: string; brand: string; image: string; price: number; quantity: number; selectedShade?: string }> = [];
    for (const item of data.items) {
      const product = await fetchProductBySlug(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, status: "error", message: `Product not found: ${item.productId}`, code: "PRODUCT_NOT_FOUND" },
          { status: 400 },
        );
      }
      const actualPrice = product.price;
      if (Math.abs(actualPrice - item.price) > 1) {
        return NextResponse.json(
          { success: false, status: "error", message: `Price mismatch for ${product.name}. Please refresh your cart.`, code: "PRICE_MISMATCH" },
          { status: 400 },
        );
      }
      verifiedItems.push({
        productId: item.productId,
        name: product.name,
        brand: product.brand,
        image: product.image,
        price: actualPrice,
        quantity: item.quantity,
        selectedShade: item.selectedShade,
      });
    }

    const computedSubtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const computedTotal = computedSubtotal + data.deliveryFee + (data.giftWrap ? 100 : 0);
    if (Math.abs(computedSubtotal - data.subtotal) > 1 || Math.abs(computedTotal - data.grandTotal) > 1) {
      return NextResponse.json(
        { success: false, status: "error", message: "Order totals do not match the cart contents.", code: "TOTAL_MISMATCH" },
        { status: 400 },
      );
    }

    if (!CONVEX_URL) {
      return NextResponse.json(
        { success: false, status: "error", message: "Checkout is not configured yet. Please contact GLAMO Nepal to place this order.", code: "CHECKOUT_NOT_CONFIGURED" },
        { status: 503 },
      );
    }

    const orderNumber = generateOrderNumber();
    const createdAt = new Date().toISOString();

    const convexResponse = await fetch(`${CONVEX_URL}/api/query/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "orders:create",
        args: {
          orderNumber,
          customerName: data.customer.name,
          customerEmail: data.customer.email,
          customerPhone: data.customer.phone,
          items: verifiedItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            brand: item.brand,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
            selectedShade: item.selectedShade,
          })),
          subtotal: data.subtotal,
          deliveryFee: data.deliveryFee,
          giftWrap: data.giftWrap || false,
          giftWrapFee: data.giftWrap ? 100 : 0,
          grandTotal: data.grandTotal,
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          shippingAddress: {
            fullName: data.shippingAddress.fullName,
            phone: data.shippingAddress.phone,
            province: data.shippingAddress.province,
            district: data.shippingAddress.district,
            city: data.shippingAddress.city,
            ward: data.shippingAddress.ward,
            addressLine1: data.shippingAddress.addressLine1,
          },
          orderNotes: data.orderNotes,
        },
        format: "json",
      }),
    });

    if (!convexResponse.ok) {
      return NextResponse.json(
        { success: false, status: "error", message: "Failed to create order. Please try again.", code: "ORDER_CREATION_FAILED" },
        { status: 502 },
      );
    }

    const orderId = await convexResponse.json();
    const id = typeof orderId === "string" ? orderId : crypto.randomUUID();

    return NextResponse.json({ success: true, status: "success", data: buildOrder(id, orderNumber, createdAt, data, verifiedItems) });
  } catch {
    return NextResponse.json(
      { success: false, status: "error", message: "An unexpected error occurred.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}