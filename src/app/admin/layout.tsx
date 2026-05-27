import type { ReactNode } from "react";

export const metadata = {
  title: "Dashboard — GLAMO NEPAL",
  description: "Workspace.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bgLight">
      {children}
    </div>
  );
}