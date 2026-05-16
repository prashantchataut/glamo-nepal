import { AuthForm } from "@/components/auth/AuthForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Login",
  description: "Sign in to your GLAMO NEPAL account to view orders, wishlist, saved addresses and loyalty points.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { redirect?: string };
}) {
  const redirectTo = searchParams?.redirect || "/account";

  return (
    <main className="bg-cream-100 py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <AuthForm mode="login" redirectTo={redirectTo} />
      </div>
    </main>
  );
}
