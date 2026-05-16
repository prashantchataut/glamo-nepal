export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface CustomerAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  city: string;
  ward: string;
  addressLine1: string;
  isDefault: boolean;
}

export const EMPTY_CUSTOMER_PROFILE: CustomerProfile = {
  id: "",
  name: "",
  email: "",
  phone: "",
};

export const SAMPLE_ADDRESSES: CustomerAddress[] = [];
export const SAMPLE_USER = EMPTY_CUSTOMER_PROFILE;
