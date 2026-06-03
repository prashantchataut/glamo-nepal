import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("CUSTOMER"), v.literal("STAFF"), v.literal("ADMIN"), v.literal("SUPER_ADMIN")),
    isActive: v.boolean(),
  })
    .index("userId", ["userId"]),

  addresses: defineTable({
    userId: v.id("users"),
    label: v.optional(v.string()),
    fullName: v.string(),
    phone: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    district: v.optional(v.string()),
    province: v.optional(v.string()),
    ward: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.string(),
    isDefault: v.boolean(),
  })
    .index("userId", ["userId"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.number(),
    isActive: v.boolean(),
  })
    .index("slug", ["slug"])
    .index("parentId", ["parentId"]),

  brands: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("slug", ["slug"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    sku: v.optional(v.string()),
    categoryId: v.id("categories"),
    brandId: v.optional(v.id("brands")),
    basePrice: v.number(),
    salePrice: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    currency: v.string(),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    isDigital: v.boolean(),
    trackInventory: v.boolean(),
    stockQuantity: v.number(),
    lowStockThreshold: v.number(),
    weight: v.optional(v.number()),
    dimensions: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })
    .index("slug", ["slug"])
    .index("categoryId", ["categoryId"])
    .index("brandId", ["brandId"])
    .index("isActive", ["isActive"])
    .index("isFeatured", ["isFeatured"]),

  productVariants: defineTable({
    productId: v.id("products"),
    name: v.string(),
    sku: v.optional(v.string()),
    price: v.number(),
    salePrice: v.optional(v.number()),
    stockQuantity: v.number(),
    attributes: v.optional(v.object({
      color: v.optional(v.string()),
      size: v.optional(v.string()),
      material: v.optional(v.string()),
      weight: v.optional(v.string()),
    })),
    isActive: v.boolean(),
  })
    .index("productId", ["productId"]),

  productImages: defineTable({
    productId: v.id("products"),
    url: v.string(),
    publicId: v.optional(v.string()),
    altText: v.optional(v.string()),
    sortOrder: v.number(),
    isPrimary: v.boolean(),
  })
    .index("productId", ["productId"]),

  orders: defineTable({
    orderNumber: v.string(),
    userId: v.id("users"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("PROCESSING"),
      v.literal("SHIPPED"),
      v.literal("DELIVERED"),
      v.literal("CANCELLED"),
      v.literal("REFUNDED"),
    ),
    paymentStatus: v.union(
      v.literal("PENDING"),
      v.literal("PAID"),
      v.literal("FAILED"),
      v.literal("REFUNDED"),
    ),
    paymentMethod: v.union(
      v.literal("CASH_ON_DELIVERY"),
      v.literal("KHALTI"),
      v.literal("ESEWA"),
      v.literal("BANK_TRANSFER"),
    ),
    paymentId: v.optional(v.string()),
    subtotal: v.number(),
    shippingCharge: v.number(),
    discountAmount: v.number(),
    totalAmount: v.number(),
    couponId: v.optional(v.id("coupons")),
shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      district: v.optional(v.string()),
      province: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      country: v.optional(v.string()),
      label: v.optional(v.string()),
      isDefault: v.optional(v.boolean()),
    }),
    billingAddress: v.optional(v.object({
      fullName: v.string(),
      phone: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      district: v.optional(v.string()),
      province: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      country: v.optional(v.string()),
      label: v.optional(v.string()),
      isDefault: v.optional(v.boolean()),
    })),
    notes: v.optional(v.string()),
    cancelledAt: v.optional(v.number()),
    cancelReason: v.optional(v.string()),
  })
    .index("orderNumber", ["orderNumber"])
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("paymentStatus", ["paymentStatus"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    productName: v.string(),
    variantName: v.optional(v.string()),
    sku: v.optional(v.string()),
    quantity: v.number(),
    unitPrice: v.number(),
    totalPrice: v.number(),
    imageUrl: v.optional(v.string()),
  })
    .index("orderId", ["orderId"])
    .index("productId", ["productId"]),

  orderStatusHistories: defineTable({
    orderId: v.id("orders"),
    status: v.string(),
    comment: v.optional(v.string()),
    changedBy: v.optional(v.id("users")),
  })
    .index("orderId", ["orderId"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    quantity: v.number(),
  })
    .index("userId", ["userId"]),

  wishlistItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
  })
    .index("userId", ["userId"]),

  coupons: defineTable({
    code: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("PERCENTAGE"), v.literal("FIXED")),
    value: v.number(),
    minOrderAmount: v.optional(v.number()),
    maxDiscount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    usageCount: v.number(),
    perUserLimit: v.optional(v.number()),
    startsAt: v.number(),
    expiresAt: v.number(),
    isActive: v.boolean(),
  })
    .index("code", ["code"]),

  banners: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    imageUrl: v.string(),
    linkUrl: v.optional(v.string()),
    position: v.union(v.literal("HERO"), v.literal("MID_PAGE"), v.literal("SIDEBAR"), v.literal("POPUP")),
    sortOrder: v.number(),
    isActive: v.boolean(),
    startsAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  })
    .index("position", ["position"])
    .index("isActive", ["isActive"]),

  reviews: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    rating: v.number(),
    title: v.optional(v.string()),
    comment: v.optional(v.string()),
    isApproved: v.boolean(),
  })
    .index("productId", ["productId"])
    .index("userId", ["userId"]),

  blogPosts: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(),
    coverImageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    viewCount: v.number(),
    readTimeMinutes: v.optional(v.number()),
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    authorId: v.optional(v.id("users")),
  })
    .index("slug", ["slug"])
    .index("isPublished", ["isPublished"]),

  inventoryLogs: defineTable({
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    changeType: v.string(),
    quantity: v.number(),
    previousStock: v.number(),
    newStock: v.number(),
    reason: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
  })
    .index("productId", ["productId"]),

  notifications: defineTable({
    userId: v.optional(v.id("users")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.object({
      url: v.optional(v.string()),
      orderId: v.optional(v.id("orders")),
      productId: v.optional(v.id("products")),
      message: v.optional(v.string()),
    })),
    isRead: v.boolean(),
  })
    .index("userId", ["userId"]),

  siteSettings: defineTable({
    key: v.string(),
    value: v.union(v.string(), v.number(), v.boolean()),
    groupName: v.string(),
  })
    .index("key", ["key"])
    .index("groupName", ["groupName"]),

  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    action: v.string(),
    entity: v.string(),
    entityId: v.optional(v.string()),
    changes: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("entity", ["entity", "entityId"])
    .index("userId", ["userId"]),

  contactSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
  }),

  newsletterSubscribers: defineTable({
    email: v.string(),
    isActive: v.boolean(),
    unsubscribeToken: v.string(),
  })
    .index("email", ["email"]),

  passwordResetTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  })
    .index("token", ["token"])
    .index("userId", ["userId"]),
});