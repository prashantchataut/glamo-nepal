export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  items: { name: string; brand: string; image: string; price: number; quantity: number }[];
  total: number;
  shippingAddress: string;
  paymentMethod: string;
}
