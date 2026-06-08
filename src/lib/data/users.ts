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
