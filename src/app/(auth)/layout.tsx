import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Access | GLAMO NEPAL",
  description: "Sign in, register or reset your GLAMO NEPAL account access.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
