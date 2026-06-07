import { apiRequest } from "@/lib/api/client";

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  today: {
    orders: number;
    revenue: number;
    newUsers: number;
  };
  thisMonth: {
    orders: number;
    revenue: number;
  };
  allTime: {
    orders: number;
    revenue: number;
    customers: number;
    activeProducts: number;
  };
  orderStatusBreakdown: Record<string, number>;
  revenueLast30Days: Record<string, { revenue: number; orders: number }>;
  inventoryAlerts: {
    lowStock: number;
    outOfStock: number;
    lowStockProducts: Array<{
      id: string;
      name: string;
      sku: string;
      stock_quantity: number;
      low_stock_threshold: number;
    }>;
    outOfStockProducts: Array<{
      id: string;
      name: string;
      sku: string;
      stock_quantity: number;
    }>;
  };
  recentActivity: {
    orders: Array<{
      id: string;
      order_number: string;
      total_amount: number;
      status: string;
      payment_method?: string;
      payment_status?: string;
      created_at: string;
      user_id: string;
      customerName?: string;
    }>;
    users: Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      role: string;
      created_at: string;
    }>;
  };
  topPerformers: {
    products: Array<{ id: string; name: string; totalSold: number }>;
    categories: Record<string, number>;
  };
}

// ── Products ───────────────────────────────────────────────────────────────

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  category_id: string;
  brand_id?: string;
  base_price: number;
  sale_price?: number;
  cost_price?: number;
  currency: string;
  is_active: number;
  is_featured: number;
  is_digital: number;
  track_inventory: number;
  stock_quantity: number;
  low_stock_threshold: number;
  weight?: number;
  dimensions?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string };
  images?: Array<{
    id: string;
    url: string;
    alt_text?: string;
    sort_order: number;
    is_primary: number;
  }>;
  variants?: Array<{
    id: string;
    name: string;
    sku?: string;
    price: number;
    sale_price?: number;
    stock_quantity: number;
    attributes?: string;
    is_active: number;
  }>;
}

export interface AdminProductList {
  products: AdminProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  category_id: string;
  brand_id?: string;
  base_price: number;
  sale_price?: number;
  cost_price?: number;
  is_featured?: number;
  is_digital?: number;
  track_inventory?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  tags?: string;
  meta_title?: string;
  meta_description?: string;
}

export type UpdateProductInput = Partial<CreateProductInput>;

// ── Orders ─────────────────────────────────────────────────────────────────

export interface AdminOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_id?: string;
  subtotal: number;
  shipping_charge: number;
  discount_amount: number;
  total_amount: number;
  coupon_id?: string;
  shipping_address: string;
  billing_address?: string;
  notes?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
  items?: Array<{
    id: string;
    product_id: string;
    variant_id?: string;
    product_name: string;
    variant_name?: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    image_url?: string;
  }>;
  status_history?: Array<{
    id: string;
    status: string;
    comment?: string;
    changed_by?: string;
    created_at: string;
  }>;
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export interface AdminOrderList {
  orders: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Inventory ───────────────────────────────────────────────────────────────

export interface StockReport {
  products: Array<{
    id: string;
    name: string;
    sku?: string;
    stock_quantity: number;
    low_stock_threshold: number;
    is_active: number;
    category?: { id: string; name: string };
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  summary?: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
}

export interface LowStockAlerts {
  products: Array<{
    id: string;
    name: string;
    sku?: string | null;
    stock_quantity: number;
    low_stock_threshold: number;
  }>;
  variants?: Array<{
    id: string;
    productId: string;
    name: string;
    productName: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }>;
  totalAlerts: number;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  variant_id?: string;
  change_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  performed_by?: string;
  created_at: string;
}

// ── Banners ────────────────────────────────────────────────────────────────

export interface AdminBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  position: string;
  sort_order: number;
  is_active: number;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerInput {
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  position?: string;
  sort_order?: number;
  is_active?: number;
  starts_at?: string;
  expires_at?: string;
}

export type UpdateBannerInput = Partial<CreateBannerInput>;

// ── Customers / Users ──────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  role: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  orderCount?: number;
}

export interface AdminUserList {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserDetail extends AdminUser {
  recentOrders: Array<{
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    payment_status: string;
    created_at: string;
  }>;
  totalSpent: number;
}

// ── Notifications ───────────────────────────────────────────────────────────

export interface AdminNotification {
  id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  data?: string;
  is_read: number;
  created_at: string;
}

// ── Audit Logs ─────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  changes?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ── Sales Report ───────────────────────────────────────────────────────────

export interface SalesReport {
  startDate: string;
  endDate: string;
  groupBy: string;
  totalRevenue: number;
  totalOrders: number;
  revenueByPeriod: Record<string, { revenue: number; orders: number }>;
  paymentMethodBreakdown: Record<string, { revenue: number; orders: number }>;
  categoryBreakdown: Record<string, { revenue: number; orders: number }>;
}

// ── Settings ───────────────────────────────────────────────────────────────

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  group: string;
}

// ── Blogs ───────────────────────────────────────────────────────────────────

export interface AdminBlog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string;
  category?: string;
  tags?: string[];
  is_published: boolean;
  view_count: number;
  read_time_minutes: number;
  published_at?: string;
  author_id?: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogInput {
  title: string;
  excerpt?: string;
  content: string;
  category?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[] | string;
}

export interface UpdateBlogInput {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[] | string;
  isPublished?: boolean;
}

// ── Coupons ────────────────────────────────────────────────────────────────

export interface AdminCoupon {
  id: string;
  code: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt: string;
  expiresAt: string;
}

export interface UpdateCouponInput {
  code?: string;
  description?: string;
  type?: "PERCENTAGE" | "FIXED";
  value?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

// ── API Functions ───────────────────────────────────────────────────────────

export const adminApi = {
  // Dashboard
  dashboardStats: () =>
    apiRequest<DashboardStats>("/admin/dashboard"),

  // Products
  listProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    is_active?: boolean;
    is_featured?: boolean;
  }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<AdminProductList>(`/products${query}`);
  },

  getProduct: (id: string) =>
    apiRequest<AdminProduct>(`/products/${id}`),

  createProduct: (data: CreateProductInput) =>
    apiRequest<AdminProduct>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: UpdateProductInput) =>
    apiRequest<AdminProduct>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    apiRequest<{ message: string }>(`/products/${id}`, { method: "DELETE" }),

  toggleProductVisibility: (id: string) =>
    apiRequest<AdminProduct>(`/products/${id}/toggle-hidden`, { method: "PATCH" }),

  toggleProductFeatured: (id: string) =>
    apiRequest<AdminProduct>(`/products/${id}/toggle-featured`, { method: "PATCH" }),

  uploadProductImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiRequest<{ message: string; image: { id: string; url: string } }>(
      `/products/${id}/images`,
      { method: "POST", body: formData, headers: {} }
    );
  },

  deleteProductImage: (id: string, imageId: string) =>
    apiRequest<{ message: string }>(`/products/${id}/images/${imageId}`, { method: "DELETE" }),

  adjustStock: (productId: string, change: number, reason?: string, variantId?: string) => {
    const path = variantId
      ? `/products/${productId}/variants/${variantId}/stock`
      : `/products/${productId}/stock`;
    return apiRequest<{ message: string }>(path, {
      method: "PATCH",
      body: JSON.stringify({ change, reason }),
    });
  },

  // Product Variants
  addVariant: (productId: string, data: { name: string; sku?: string; price: number; salePrice?: number; stockQuantity?: number; attributes?: Record<string, string> }) =>
    apiRequest<{ id: string; name: string; sku?: string; price: number; sale_price?: number; stock_quantity: number; attributes?: string; is_active: number }>(`/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateVariant: (productId: string, variantId: string, data: { name?: string; sku?: string; price?: number; salePrice?: number | null; stockQuantity?: number; attributes?: Record<string, string>; isActive?: boolean }) =>
    apiRequest<{ id: string; name: string; sku?: string; price: number; sale_price?: number; stock_quantity: number; attributes?: string; is_active: number }>(`/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteVariant: (productId: string, variantId: string) =>
    apiRequest<{ message: string }>(`/products/${productId}/variants/${variantId}`, { method: "DELETE" }),

  // Orders
  listOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    payment_status?: string;
    search?: string;
  }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<AdminOrderList>(`/orders${query}`);
  },

  getOrder: (id: string) =>
    apiRequest<AdminOrder>(`/orders/${id}`),

  updateOrderStatus: (id: string, status: string) =>
    apiRequest<AdminOrder>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  cancelOrder: (id: string, reason?: string) =>
    apiRequest<AdminOrder>(`/orders/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // Inventory
  getStockReport: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    lowStockOnly?: boolean;
  }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<StockReport>(`/inventory/report${query}`);
  },

  getLowStockAlerts: () =>
    apiRequest<LowStockAlerts>("/inventory/low-stock"),

  getInventoryLogs: (params?: {
    page?: number;
    limit?: number;
    productId?: string;
  }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<{ logs: InventoryLog[]; total: number; page: number; limit: number; totalPages: number }>(`/inventory/logs${query}`);
  },

  // Banners
  listBanners: (params?: { position?: string; is_active?: boolean }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<Array<AdminBanner>>(`/banners${query}`);
  },

  listAdminBanners: (params?: { page?: number; limit?: number }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<Array<AdminBanner>>(`/banners/admin${query}`);
  },

  createBanner: (data: CreateBannerInput) =>
    apiRequest<AdminBanner>("/banners", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBanner: (id: string, data: UpdateBannerInput) =>
    apiRequest<AdminBanner>(`/banners/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteBanner: (id: string) =>
    apiRequest<{ message: string }>(`/banners/${id}`, { method: "DELETE" }),

  reorderBanners: (orders: Array<{ id: string; sort_order: number }>) =>
    apiRequest<{ message: string }>("/banners/reorder", {
      method: "PATCH",
      body: JSON.stringify({ orders }),
    }),

  uploadBannerImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiRequest<{ url: string; publicId: string }>("/banners/upload", {
      method: "POST",
      body: formData,
    });
  },

  // Customers / Users
  listUsers: (params?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<AdminUserList>(`/admin/users${query}`);
  },

  getUser: (id: string) =>
    apiRequest<AdminUserDetail>(`/admin/users/${id}`),

  updateUserRole: (id: string, role: string) =>
    apiRequest<{ message: string }>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  updateUserStatus: (id: string, isActive: boolean) =>
    apiRequest<{ message: string }>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),

  // Notifications
  getNotifications: (params?: {
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<{ notifications: AdminNotification[]; unreadCount: number; total: number; page: number; limit: number; totalPages: number }>(`/admin/notifications${query}`);
  },

  markNotificationRead: (id: string) =>
    apiRequest<{ message: string }>(`/admin/notifications/${id}/read`, { method: "PATCH" }),

  markAllNotificationsRead: () =>
    apiRequest<{ message: string }>("/admin/notifications/read-all", { method: "PATCH" }),

  // Audit Logs
  getAuditLogs: (params?: {
    entity?: string;
    entityId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<{ logs: AuditLog[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/audit-logs${query}`);
  },

  // Sales Report
  getSalesReport: (startDate: string, endDate: string, groupBy: "day" | "week" | "month" = "day") =>
    apiRequest<SalesReport>(`/admin/sales-report?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`),

  // Settings
  getPublicSettings: () =>
    apiRequest<SiteSetting[]>("/settings/public"),

  getAllSettings: () =>
    apiRequest<SiteSetting[]>("/settings"),

  updateSettings: (data: Record<string, string>) =>
    apiRequest<SiteSetting[]>("/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  uploadSettingImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiRequest<{ url: string; publicId: string }>("/banners/upload", {
      method: "POST",
      body: formData,
    });
  },

  bulkUpdateProductStatus: (ids: string[], isActive: boolean) =>
    apiRequest<{ message: string }>("/admin/products/bulk-status", {
      method: "PATCH",
      body: JSON.stringify({ productIds: ids, isActive }),
    }),

  bulkDeleteProducts: (ids: string[]) =>
    apiRequest<{ message: string }>("/admin/products/bulk", {
      method: "DELETE",
      body: JSON.stringify({ productIds: ids }),
    }),

  exportProducts: (params?: { search?: string; status?: string; format?: string }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<Blob>(`/admin/products/export${query}`, {
      headers: { Accept: "text/csv" },
    });
  },

  // Categories (for product forms)
  listCategories: () =>
    apiRequest<Array<{ id: string; name: string; slug: string; parentId?: string }>>("/categories"),

  // Brands (for product forms)
  listBrands: () =>
    apiRequest<Array<{ id: string; name: string; slug: string }>>("/brands"),

  // ── Blogs ─────────────────────────────────────────────────────────────────

  listBlogs: (params?: { page?: number; limit?: number; category?: string }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<{ posts: AdminBlog[]; total: number; page: number; limit: number; totalPages: number }>(`/blogs${query}`);
  },

  getBlog: (slug: string) =>
    apiRequest<AdminBlog>(`/blogs/${slug}`),

  createBlog: (data: CreateBlogInput) =>
    apiRequest<AdminBlog>("/blogs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBlog: (id: string, data: UpdateBlogInput) =>
    apiRequest<AdminBlog>(`/blogs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  publishBlog: (id: string) =>
    apiRequest<AdminBlog>(`/blogs/${id}/publish`, { method: "PATCH" }),

  unpublishBlog: (id: string) =>
    apiRequest<AdminBlog>(`/blogs/${id}/unpublish`, { method: "PATCH" }),

  deleteBlog: (id: string) =>
    apiRequest<{ message: string }>(`/blogs/${id}`, { method: "DELETE" }),

  getBlogCategories: () =>
    apiRequest<string[]>("/blogs/categories"),

  // ── Coupons ───────────────────────────────────────────────────────────────

  listCoupons: (params?: { page?: number; limit?: number; isActive?: boolean }) => {
    const query = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v !== undefined && v !== null) acc[k] = String(v);
            return acc;
          }, {})
        ).toString()
      : "";
    return apiRequest<{ coupons: AdminCoupon[]; total: number; page: number; limit: number; totalPages: number }>(`/coupons${query}`);
  },

  getCoupon: (id: string) =>
    apiRequest<AdminCoupon>(`/coupons/${id}`),

  createCoupon: (data: CreateCouponInput) =>
    apiRequest<AdminCoupon>("/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCoupon: (id: string, data: UpdateCouponInput) =>
    apiRequest<AdminCoupon>(`/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCoupon: (id: string) =>
    apiRequest<{ message: string }>(`/coupons/${id}`, { method: "DELETE" }),
};
