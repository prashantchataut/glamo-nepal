export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  CUSTOMER: 0,
  STAFF: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export interface Profile {
  id: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  phone: string;
  address_1: string;
  address_2: string | null;
  city: string;
  district: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  sku: string | null;
  category_id: string;
  brand_id: string | null;
  base_price: number;
  sale_price: number | null;
  cost_price: number | null;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  is_digital: boolean;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  weight: number | null;
  dimensions: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  attributes: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  public_id: string | null;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductTag {
  id: string;
  product_id: string;
  tag: string;
  created_at: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  variant_id: string | null;
  change_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number | null;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'KHALTI' | 'ESEWA' | 'BANK_TRANSFER';
export type PaymentProvider = 'KHALTI' | 'ESEWA' | 'COD';
export type PaymentTransactionStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
export type BannerPosition = 'HERO' | 'MID_PAGE' | 'SIDEBAR' | 'POPUP';
export type PopupTriggerType = 'ON_LOAD' | 'EXIT_INTENT' | 'SCROLL_50' | 'TIME_DELAY';
export type GalleryCategory = 'instagram' | 'store' | 'products' | 'team';
export type CouponType = 'PERCENTAGE' | 'FIXED';
export type EventType = 'product_view' | 'add_to_cart' | 'wishlist_toggle' | 'purchase_success' | 'page_view' | 'search' | 'share';

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_id: string | null;
  subtotal: number;
  shipping_charge: number;
  discount_amount: number;
  total_amount: number;
  coupon_id: string | null;
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown> | null;
  notes: string | null;
  idempotency_key: string | null;
  shipping_phone: string | null;
  billing_phone: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  comment: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  provider_transaction_id: string | null;
  idempotency_key: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  provider_payload: Record<string, unknown> | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductReviewsMedia {
  id: string;
  review_id: string;
  url: string;
  public_id: string | null;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: BannerPosition;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Popup {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  trigger_type: PopupTriggerType;
  delay_ms: number;
  cookie_days: number | null;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  view_count: number;
  read_time_minutes: number | null;
  is_published: boolean;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: GalleryCategory | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  unsubscribe_token: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  group_name: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LowStockAlert {
  id: string;
  product_id: string;
  variant_id: string | null;
  email: string;
  phone: string | null;
  notified_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Event {
  id: number;
  user_id: string | null;
  session_id: string;
  event_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserProductAffinity {
  id: string;
  user_id: string | null;
  session_id: string;
  product_id: string;
  score: number;
  last_viewed_at: string | null;
  updated_at: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedResponse<T> {
  success: true;
  message: string;
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination: null;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
}

export interface EdgeFunctionEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  FRONTEND_URL?: string;
  KHALTI_SECRET_KEY?: string;
  ESEWA_SECRET_KEY?: string;
  ESEWA_MERCHANT_CODE?: string;
}

export type AppEnv = {
  Bindings: EdgeFunctionEnv;
  Variables: {
    user: AuthenticatedUser;
    validatedBody: unknown;
    validatedQuery: unknown;
    validatedParams: unknown;
  };
};