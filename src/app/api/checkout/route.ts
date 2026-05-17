import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Order } from "@/lib/api/contracts";
import { PRODUCTS } from "@/lib/data/catalog-products";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

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

function fieldErrors(error: z.ZodError) {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fields[key] ||= [];
    fields[key].push(issue.message);
  }
  return fields;
}

function buildOrder(id: string, orderNumber: string, createdAt: string, data: z.infer<typeof checkoutOrderSchema>): Order {
  return {
    id,
    orderNumber,
    customer: { id: "guest", ...data.customer },
    shippingAddress: data.shippingAddress,
    items: data.items.map((item) => ({
      productId: item.productId,
      sku: item.sku || item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
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
    const inventoryIssues: string[] = [];
    for (const item of data.items) {
      const catalogProduct = PRODUCTS.find((product) => product.id === item.productId || product.sku === item.sku);
      if (!catalogProduct) {
        inventoryIssues.push(`${item.name} is no longer available.`);
        continue;
      }
      if (catalogProduct.stockCount < item.quantity) {
        inventoryIssues.push(`${catalogProduct.name} only has ${catalogProduct.stockCount} left in stock.`);
      }
      if (Math.abs(catalogProduct.price - item.price) > 1) {
        inventoryIssues.push(`${catalogProduct.name} price changed. Please refresh your cart.`);
      }
    }
    if (inventoryIssues.length > 0) {
      return NextResponse.json(
        { success: false, status: "error", message: "Some cart items need review before checkout.", code: "INVENTORY_VALIDATION_FAILED", issues: inventoryIssues },
        { status: 409 },
      );
    }

    const computedSubtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const computedTotal = computedSubtotal + data.deliveryFee + (data.giftWrap ? 100 : 0);
    if (Math.abs(computedSubtotal - data.subtotal) > 1 || Math.abs(computedTotal - data.grandTotal) > 1) {
      return NextResponse.json(
        { success: false, status: "error", message: "Order totals do not match the cart contents.", code: "TOTAL_MISMATCH" },
        { status: 400 },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: false, status: "error", message: "Checkout is not configured yet. Please contact GLAMO Nepal to place this order.", code: "CHECKOUT_NOT_CONFIGURED" },
        { status: 503 },
      );
    }

    const id = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const createdAt = new Date().toISOString();

    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        id,
        order_number: orderNumber,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_phone: data.customer.phone,
        shipping_full_name: data.shippingAddress.fullName,
        shipping_phone: data.shippingAddress.phone,
        shipping_province: data.shippingAddress.province,
        shipping_district: data.shippingAddress.district,
        shipping_city: data.shippingAddress.city,
        shipping_ward: data.shippingAddress.ward,
        shipping_address_line1: data.shippingAddress.addressLine1,
        payment_method: data.paymentMethod,
        subtotal: data.subtotal,
        delivery_fee: data.deliveryFee,
        grand_total: data.grandTotal,
        currency: data.currency,
        order_status: "pending",
        payment_status: data.paymentMethod === "cod" ? "pending" : "failed",
        items: data.items,
        notes: data.orderNotes || null,
        created_at: createdAt,
      }),
    });

    if (!supabaseResponse.ok) {
      return NextResponse.json(
        { success: false, status: "error", message: "Failed to create order. Please try again.", code: "ORDER_CREATION_FAILED" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, status: "success", data: buildOrder(id, orderNumber, createdAt, data) });
  } catch {
    return NextResponse.json(
      { success: false, status: "error", message: "An unexpected error occurred.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
