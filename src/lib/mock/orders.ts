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

export const MOCK_ORDERS: Order[] = [
  { id: "1", orderNumber: "GLM-2026-000047", date: "2026-04-19", status: "Delivered", items: [{ name: "Himalayan Vitamin C Glow Serum", brand: "Kathmandu Glow", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80", price: 1850, quantity: 1 }, { name: "Daily Dew Gel Moisturizer", brand: "GLAMO Edit", image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80", price: 1450, quantity: 1 }], total: 3300, shippingAddress: "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal", paymentMethod: "Khalti" },
  { id: "2", orderNumber: "GLM-2026-000039", date: "2026-04-12", status: "Shipped", items: [{ name: "Invisible City SPF 50 PA++++", brand: "Solar Care", image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80", price: 1650, quantity: 2 }], total: 3300, shippingAddress: "Patan, Lalitpur, Nepal", paymentMethod: "eSewa" },
  { id: "3", orderNumber: "GLM-2026-000025", date: "2026-03-28", status: "Processing", items: [{ name: "Velvet Matte Lip Cream", brand: "Luxe Aura", image: "https://images.unsplash.com/photo-1586495777744-4e6232bf2f71?w=800&q=80", price: 950, quantity: 1 }], total: 950, shippingAddress: "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal", paymentMethod: "Cash on Delivery" },
];