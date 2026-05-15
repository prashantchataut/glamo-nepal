import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import { InstagramIcon, FacebookIcon } from "@/components/ui/illustrations/SocialIcons";

const shopLinks = [
  { label: "All Products", href: "/shop" },
  { label: "New Arrivals", href: "/collections/new-arrivals" },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  { label: "Brands", href: "/brands" },
  { label: "Gift Sets", href: "/collections/gift-sets" },
];

const helpLinks = [
  { label: "FAQ", href: "/faq" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Returns", href: "/returns" },
  { label: "Track Order", href: "/account/orders" },
  { label: "Contact Us", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 md:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div>
            <Link href="/" className="inline-block">
              <span className="font-display text-2xl font-light tracking-[0.15em] text-neutral-50">
                GLAMO
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-neutral-300 max-w-xs">
              Premium beauty, thoughtfully curated for Nepal. Authentic skincare, makeup, and personal care from the world&apos;s best brands.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href={SITE_CONFIG.social.instagram}
                aria-label={`Instagram ${SITE_CONFIG.instagramHandle}`}
                className="text-neutral-300 transition-colors duration-150 hover:text-secondary"
              >
                <InstagramIcon size={20} />
              </a>
              <a
                href={SITE_CONFIG.social.facebook}
                aria-label="Facebook"
                className="text-neutral-300 transition-colors duration-150 hover:text-secondary"
              >
                <FacebookIcon size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div>
            <h3 className="type-label mb-5 text-neutral-300">Shop</h3>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-300 transition-colors duration-150 hover:text-secondary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Help */}
          <div>
            <h3 className="type-label mb-5 text-neutral-300">Help</h3>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-300 transition-colors duration-150 hover:text-secondary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="type-label mb-5 text-neutral-300">Stay Connected</h3>
            <p className="text-sm text-neutral-300 mb-4">
              Be the first to know about new arrivals, exclusive offers, and beauty tips.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = (
                  form.elements.namedItem("email") as HTMLInputElement
                )?.value;
                if (email) {
                  fetch("/api/newsletter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  }).catch(() => {});
                }
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="email"
                name="email"
                placeholder="Your email address"
                required
                className="flex-1 border-b border-neutral-600 bg-transparent py-2 text-sm text-white placeholder:text-neutral-500 focus:border-secondary focus:outline-none"
              />
              <button
                type="submit"
                className="bg-secondary px-6 py-2 text-[12px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-secondary-light hover:text-neutral-900"
              >
                Subscribe
              </button>
            </form>
            <div className="mt-8 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-neutral-500" />
                <span>{SITE_CONFIG.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-neutral-500" />
                <a
                  href={SITE_CONFIG.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-secondary"
                >
                  {SITE_CONFIG.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-neutral-500" />
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="transition-colors hover:text-secondary"
                >
                  {SITE_CONFIG.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-neutral-700 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} {SITE_CONFIG.fullTitle}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {SITE_CONFIG.paymentMethods.map((method) => (
              <span
                key={method}
                className="text-[10px] tracking-[0.08em] uppercase text-neutral-500"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}