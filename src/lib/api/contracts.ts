import type { Product, CartItem } from "@/types/product";

export type ApiStatus = "success" | "error";
export type PaymentMethodCode = "khalti" | "esewa" | "cod" | "card";

export interface ApiMeta {
  requestId?: string;
  page?: number;
  perPage?: number;
  total?: number;
}

export interface ApiResponse<T> {
  status: ApiStatus;
  data: T;
  message?: string;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  authorized?: boolean;
  productCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentSlug?: string;
}

export interface Cart {
  id: string;
  customerId?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discountTotal: number;
  grandTotal: number;
  currency: "NPR";
}

export interface Wishlist {
  id: string;
  customerId: string;
  products: Product[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints?: number;
  defaultAddressId?: string;
}

export interface Address {
  id?: string;
  customerId?: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  city: string;
  ward: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface ProductBundleContract {
  id: string;
  slug: string;
  title: string;
  description: string;
  productIds: string[];
  bundlePrice: number;
  subtotal: number;
  savings: number;
  currency: "NPR";
  active: boolean;
}

export interface StockAlertPayload {
  productId: string;
  sku: string;
  contact: string;
  contactType: "email" | "phone";
  consent: boolean;
}

export interface PaymentMethod {
  code: PaymentMethodCode;
  label: string;
  enabled: boolean;
  requiresRedirect?: boolean;
  publicKeyEnv?: string;
}

export interface CheckoutPayload {
  customer: Pick<Customer, "name" | "email" | "phone">;
  shippingAddress: Address;
  billingAddress?: Address;
  items: CartItem[];
  paymentMethod: PaymentMethodCode;
  giftWrap?: boolean;
  orderNotes?: string;
  couponCode?: string;
  deliveryFee: number;
  subtotal: number;
  grandTotal: number;
  currency: "NPR";
}

export interface OrderLineItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selectedShade?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  shippingAddress: Address;
  items: OrderLineItem[];
  paymentMethod: PaymentMethodCode;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  currency: "NPR";
  createdAt: string;
}
