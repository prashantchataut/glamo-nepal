"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export function useDashboardStats() {
  return useQuery(api.admin.getDashboardStats);
}

export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: Id<"categories">;
  brandId?: Id<"brands">;
  isActive?: boolean;
  isFeatured?: boolean;
}) {
  return useQuery(api.products.list, params ?? {});
}

export function useProduct(id: Id<"products">) {
  return useQuery(api.products.get, { id });
}

export function useProductBySlug(slug: string) {
  return useQuery(api.products.getBySlug, { slug });
}

export function useOrders(params?: {
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery(api.orders.listOrders, params ?? {});
}

export function useOrder(id: Id<"orders">) {
  return useQuery(api.orders.getOrder, { id });
}

export function useMyOrders() {
  return useQuery(api.orders.getMyOrders);
}

export function useCategories() {
  return useQuery(api.catalog.getCategories);
}

export function useBrands() {
  return useQuery(api.catalog.getBrands);
}

export function useBanners(position?: string) {
  return useQuery(api.catalog.getBanners, position ? { position } : {});
}

export function useCart() {
  return useQuery(api.catalog.getCart);
}

export function useWishlist() {
  return useQuery(api.catalog.getWishlist);
}

export function useAddresses() {
  return useQuery(api.catalog.getAddresses);
}

export function useMyProfile() {
  return useQuery(api.users.getMe);
}

export function useUserRole() {
  return useQuery(api.users.getUserRole);
}

export function useInventoryReport(params?: {
  page?: number;
  limit?: number;
  search?: string;
  lowStockOnly?: boolean;
}) {
  return useQuery(api.catalog.getInventoryReport, params ?? {});
}

export function useLowStockAlerts() {
  return useQuery(api.catalog.getLowStockAlerts);
}

export function useNotifications(params?: {
  isRead?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery(api.admin.getNotifications, params ?? {});
}

export function useAuditLogs(params?: {
  entity?: string;
  entityId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery(api.admin.getAuditLogs, params ?? {});
}

export function useSalesReport(startDate: string, endDate: string, groupBy?: "day" | "week" | "month") {
  return useQuery(api.admin.getSalesReport, { startDate, endDate, groupBy: groupBy ?? "day" });
}

export function useUsers(params?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery(api.admin.listUsers, params ?? {});
}

export function useInventoryLogs(params?: {
  page?: number;
  limit?: number;
  productId?: Id<"products">;
}) {
  return useQuery(api.catalog.getInventoryLogs, params ?? {});
}

export function useCreateProduct() {
  return useMutation(api.products.create);
}
export function useUpdateProduct() {
  return useMutation(api.products.update);
}
export function useDeleteProduct() {
  return useMutation(api.products.remove);
}
export function useToggleProductVisibility() {
  return useMutation(api.products.toggleVisibility);
}
export function useToggleProductFeatured() {
  return useMutation(api.products.toggleFeatured);
}
export function useAdjustStock() {
  return useMutation(api.products.adjustStock);
}
export function useUpdateOrderStatus() {
  return useMutation(api.orders.updateOrderStatus);
}
export function useCancelOrder() {
  return useMutation(api.orders.cancelOrder);
}
export function useCancelMyOrder() {
  return useMutation(api.orders.cancelMyOrder);
}
export function useCreateOrder() {
  return useMutation(api.orders.createOrder);
}
export function useUpdateUserRole() {
  return useMutation(api.admin.updateUserRole);
}
export function useUpdateUserStatus() {
  return useMutation(api.admin.updateUserStatus);
}
export function useMarkNotificationRead() {
  return useMutation(api.admin.markNotificationRead);
}
export function useMarkAllNotificationsRead() {
  return useMutation(api.admin.markAllNotificationsRead);
}
export function useAddToCart() {
  return useMutation(api.catalog.addToCart);
}
export function useUpdateCartItem() {
  return useMutation(api.catalog.updateCartItem);
}
export function useRemoveFromCart() {
  return useMutation(api.catalog.removeFromCart);
}
export function useClearCart() {
  return useMutation(api.catalog.clearCart);
}
export function useAddToWishlist() {
  return useMutation(api.catalog.addToWishlist);
}
export function useRemoveFromWishlist() {
  return useMutation(api.catalog.removeFromWishlist);
}
export function useAddAddress() {
  return useMutation(api.catalog.addAddress);
}
export function useUpdateProfile() {
  return useMutation(api.users.updateProfile);
}
export function useSubmitContact() {
  return useMutation(api.catalog.submitContact);
}
export function useSubscribeNewsletter() {
  return useMutation(api.catalog.subscribeNewsletter);
}
export function useCreateAuditLog() {
  return useMutation(api.admin.createAuditLog);
}