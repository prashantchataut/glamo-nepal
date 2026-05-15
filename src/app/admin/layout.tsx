import type { ReactNode } from "react";

export const metadata = {
  title: "Admin — GLAMO NEPAL",
  description: "Protected administration workspace.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bgLight">
      {children}
    </div>
  );
}