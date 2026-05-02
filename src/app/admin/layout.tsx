import type { ReactNode } from "react";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

export default function AdminLayout({ children: ReactNode }) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
