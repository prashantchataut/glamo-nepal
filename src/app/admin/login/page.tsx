import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Admin Login",
  description: "Protected GLAMO NEPAL administration login for store operations.",
  path: "/admin/login",
  noIndex: true,
});

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight p-8 text-brand-textMuted">Loading admin login...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
