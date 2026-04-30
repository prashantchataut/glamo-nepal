import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Admin Dashboard Mock",
  description: "Frontend-only GLAMO NEPAL admin shell for inventory, orders, campaign and audit status previews.",
  path: "/admin",
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
