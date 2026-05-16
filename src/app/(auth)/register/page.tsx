import { AuthForm } from "@/components/auth/AuthForm";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Register",
  description: "Create a GLAMO NEPAL customer account for orders, wishlist, addresses and beauty rewards.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage({
  searchParams,
}: {
  searchParams?: { redirect?: string };
}) {
  const redirectTo = searchParams?.redirect || "/account";

  return (
    <main className="bg-cream-100 py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <AuthForm mode="register" redirectTo={redirectTo} />
      </div>
    </main>
  );
}
