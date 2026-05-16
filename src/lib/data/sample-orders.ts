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

export const SAMPLE_ORDER_HISTORY: Order[] = [
  { id: "1", orderNumber: "GLM-2026-000047", date: "2026-04-19", status: "Delivered", items: [{ name: "Himalayan Vitamin C Glow Serum", brand: "Kathmandu Glow", image: "/images/products/p001.svg", price: 1850, quantity: 1 }, { name: "Daily Dew Gel Moisturizer", brand: "GLAMO Edit", image: "/images/products/p002.svg", price: 1450, quantity: 1 }], total: 3300, shippingAddress: "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal", paymentMethod: "Khalti" },
  { id: "2", orderNumber: "GLM-2026-000039", date: "2026-04-12", status: "Shipped", items: [{ name: "Invisible City SPF 50 PA++++", brand: "Solar Care", image: "/images/products/p003.svg", price: 1650, quantity: 2 }], total: 3300, shippingAddress: "Patan, Lalitpur, Nepal", paymentMethod: "eSewa" },
  { id: "3", orderNumber: "GLM-2026-000025", date: "2026-03-28", status: "Processing", items: [{ name: "Velvet Matte Lip Cream", brand: "Luxe Aura", image: "/images/blog-skincare.svg", price: 950, quantity: 1 }], total: 950, shippingAddress: "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal", paymentMethod: "Cash on Delivery" },
];