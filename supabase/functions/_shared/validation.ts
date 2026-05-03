import { z } from 'https://esm.sh/zod@3';
import type { Context, Next } from 'https://esm.sh/hono@4';
import type { AppEnv } from './types.ts';

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
});

export const productFilterSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  tags: z.string().optional(),
  inStock: z.string().optional().transform((v) => v === 'true' || v === '1'),
  featured: z.string().optional().transform((v) => v === 'true' || v === '1'),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'best-seller', 'most-reviewed', 'rating']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
});

const tagsTransform = z.union([
  z.array(z.string()),
  z.string().transform((v: string) => v.split(',').map((t: string) => t.trim()).filter(Boolean)),
]);

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().optional(),
  categoryId: z.string().min(1),
  brandId: z.string().optional(),
  basePrice: z.number().positive(),
  salePrice: z.number().positive().optional(),
  costPrice: z.number().nonnegative().optional(),
  currency: z.string().default('NPR'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  stockQuantity: z.number().int().default(0),
  lowStockThreshold: z.number().int().default(5),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  tags: tagsTransform.optional().default([]),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  brandId: z.string().nullable().optional(),
  basePrice: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  costPrice: z.number().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isDigital: z.boolean().optional(),
  trackInventory: z.boolean().optional(),
  stockQuantity: z.number().int().optional(),
  lowStockThreshold: z.number().int().optional(),
  weight: z.number().positive().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  metaTitle: z.string().max(255).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  tags: tagsTransform.optional(),
});

const attributesTransform = z.union([
  z.record(z.string(), z.string()),
  z.string().transform((v: string) => JSON.parse(v)),
]);

export const variantSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().optional(),
  price: z.number().positive(),
  salePrice: z.number().positive().optional(),
  stockQuantity: z.number().int().default(0),
  attributes: attributesTransform.optional().default({}),
});

export const updateVariantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  stockQuantity: z.number().int().optional(),
  attributes: attributesTransform.optional(),
  isActive: z.boolean().optional(),
});

export const stockAdjustSchema = z.object({
  change: z.number().int(),
  reason: z.string().max(500).optional(),
});

export const categoryFilterSchema = z.object({
  parentId: z.string().uuid().optional().nullable(),
  isActive: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const brandFilterSchema = z.object({
  isActive: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  description: z.string().optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
  website: z.string().url('Invalid URL').optional(),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name cannot be empty').optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
  website: z.string().url('Invalid URL').nullable().optional(),
});

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export const addToWishlistSchema = z.object({
  productId: z.string().uuid(),
});

const addressSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  address1: z.string().min(1).max(200).optional(),
  addressLine1: z.string().min(1).max(200).optional(),
  address2: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  ward: z.string().max(20).optional(),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().default('Nepal'),
  landmark: z.string().max(120).optional(),
}).refine((value) => Boolean(value.address1 || value.addressLine1), 'Address line is required');

const customerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20),
});

const orderItemSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(99),
  selectedShade: z.string().max(80).optional(),
  product: z.object({
    id: z.string().optional(),
    sku: z.string().optional(),
    slug: z.string().optional(),
    name: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    image: z.string().optional(),
    price: z.coerce.number().nonnegative().optional(),
    originalPrice: z.coerce.number().nonnegative().optional(),
  }).passthrough().optional(),
}).refine((value) => Boolean(value.productId || value.product?.id || value.product?.sku || value.product?.slug), 'Product identifier is required');

export const createOrderSchema = z.object({
  customer: customerSchema.optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'KHALTI', 'ESEWA', 'BANK_TRANSFER', 'COD', 'khalti', 'esewa', 'card', 'cards', 'Cash on Delivery', 'Khalti', 'eSewa', 'Cards']),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  orderNotes: z.string().max(500).optional(),
  giftWrap: z.boolean().optional(),
  deliveryFee: z.coerce.number().nonnegative().optional(),
  subtotal: z.coerce.number().nonnegative().optional(),
  grandTotal: z.coerce.number().nonnegative().optional(),
  currency: z.literal('NPR').optional(),
  items: z.array(orderItemSchema).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  comment: z.string().max(500).optional(),
});

export const orderFilterSchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  paymentMethod: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string(),
  expiresAt: z.string(),
});

export const updateCouponSchema = z.object({
  code: z.string().min(3).max(50).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.number().positive().optional(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string(),
  cartTotal: z.number().nonnegative(),
});

export const couponFilterSchema = z.object({
  isActive: z.string().optional().transform((v) => v === 'true'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export const reviewFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  isApproved: z.string().optional().transform((v) => v === 'true'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.enum(['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP']).default('HERO'),
  sortOrder: z.number().int().default(0),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const updateBannerSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(300).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  position: z.enum(['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP']).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  })),
});

export const bannerFilterSchema = z.object({
  position: z.enum(['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(500),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  category: z.string().max(100).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  tags: z.union([
    z.array(z.string()),
    z.string().transform((v) => v.split(',').map((t) => t.trim()).filter(Boolean)),
  ]).optional(),
});

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  category: z.string().max(100).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  tags: z.union([
    z.array(z.string()),
    z.string().transform((v) => v.split(',').map((t) => t.trim()).filter(Boolean)),
  ]).optional(),
  isPublished: z.boolean().optional(),
});

export const blogFilterSchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const salesReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN']),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const auditLogFilterSchema = z.object({
  entity: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const notificationFilterSchema = z.object({
  isRead: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.any(),
  })),
});

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().default('Nepal'),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  address1: z.string().min(1).max(200).optional(),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const trackEventSchema = z.object({
  eventType: z.enum(['product_view', 'add_to_cart', 'wishlist_toggle', 'purchase_success', 'page_view', 'search', 'share']),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const trackEventsBatchSchema = z.object({
  events: z.array(trackEventSchema).min(1).max(100),
});

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (c: Context<AppEnv>, next: Next) => {
    const body = await c.req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return c.json(
        validationErrorBody(result.error),
        { status: 400 }
      );
    }
    c.set('validatedBody', result.data);
    await next();
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (c: Context<AppEnv>, next: Next) => {
    const query = c.req.query();
    const result = schema.safeParse(query);
    if (!result.success) {
      return c.json(
        validationErrorBody(result.error),
        { status: 400 }
      );
    }
    c.set('validatedQuery', result.data);
    await next();
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return async (c: Context<AppEnv>, next: Next) => {
    const params = c.req.param();
    const result = schema.safeParse(params);
    if (!result.success) {
      return c.json(
        validationErrorBody(result.error),
        { status: 400 }
      );
    }
    c.set('validatedParams', result.data);
    await next();
  };
}

function validationErrorBody(error: z.ZodError): { success: false; message: string; errors: string[] } {
  const formattedErrors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
  };
}