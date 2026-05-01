export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  province: string;
  isDefault: boolean;
}

export const MOCK_ADDRESSES: Address[] = [
  { id: "1", label: "Home", name: "GLAMO Customer", phone: "+977 9818212188", address: "Naya Baneshwor, Mantra In & Out Square", city: "Kathmandu", district: "Kathmandu", province: "Bagmati", isDefault: true },
  { id: "2", label: "Office", name: "GLAMO Customer", phone: "+977 9818212188", address: "Pulchowk", city: "Lalitpur", district: "Lalitpur", province: "Bagmati", isDefault: false },
];

export const MOCK_USER = {
  name: "GLAMO Customer",
  email: "customer@glamonepal.com",
  phone: "+977 9818212188",
  avatar: "/images/hero-glow.svg",
  loyaltyPoints: 1280,
};
