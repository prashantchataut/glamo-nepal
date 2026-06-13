import type { Address, Customer, Order, Wishlist } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";

export interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

export interface CreateAddressPayload {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  city: string;
  ward: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>;

export const customerApi = {
  me: () => apiRequest<Customer>("/auth/me"),
  orders: () => apiRequest<Order[]>("/orders"),
  addresses: () => apiRequest<Address[]>("/account/addresses"),
  wishlist: () => apiRequest<Wishlist>("/wishlist"),
  updateProfile: (data: ProfileUpdatePayload) =>
    apiRequest<Customer>("/account/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  createAddress: (data: CreateAddressPayload) =>
    apiRequest<Address>("/account/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAddress: (id: string, data: UpdateAddressPayload) =>
    apiRequest<Address>(`/account/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteAddress: (id: string) =>
    apiRequest<{ message: string }>(`/account/addresses/${id}`, {
      method: "DELETE",
    }),
  setDefaultAddress: (id: string) =>
    apiRequest<Address>(`/account/addresses/${id}/default`, {
      method: "PATCH",
    }),
};
