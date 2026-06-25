"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * Storefront rendering of admin-managed promotional banners.
 *
 * This is the storefront half of the admin "Banners" manager: it fetches the
 * active banners for the MID_PAGE position from the public endpoint
 * (GET /api/v1/banners?position=MID_PAGE) and renders them as promotional
 * cards. Previously the storefront never read banners at all, so an admin could
 * create banners and never see them appear anywhere - this closes that loop.
 *
 * It renders NOTHING when there are no active banners, so the curated static
 * sections above/below it are unaffected. Silent on any fetch error.
 */
interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
}

export function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
        const res = await fetch(`${base.replace(/\/$/, "")}/banners?position=MID_PAGE`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { success?: boolean; data?: Banner[] | null };
        if (cancelled) return;
        const data = Array.isArray(json?.data) ? json.data : [];
        setBanners(data);
      } catch {
        // Non-essential: never break the storefront over a banner fetch.
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (banners.length === 0) return null;

  // Map banner count to a static Tailwind grid-cols class (Tailwind purges
  // dynamic class names, so we can't template `grid-cols-${n}`).
  const gridClass = banners.length >= 3 ? "md:grid-cols-3" : banners.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <section className="bg-neutral-50 section-padding" aria-labelledby="admin-banners-heading">
      <div className="mx-auto max-w-7xl page-padding">
        <h2 id="admin-banners-heading" className="sr-only">Featured promotions</h2>
        <div className={`grid gap-4 ${gridClass}`}>
          {banners.slice(0, 3).map((banner) => {
            const card = (
              <>
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-950/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </div>
                <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                  <h3 className="font-display text-lg font-semibold leading-tight tracking-[-0.01em] text-neutral-900 transition-colors group-hover:text-primary sm:text-2xl">
                    {banner.title}
                  </h3>
                  {banner.subtitle ? (
                    <p className="mt-1.5 text-sm text-neutral-500 line-clamp-2">{banner.subtitle}</p>
                  ) : null}
                </div>
              </>
            );

            return banner.linkUrl ? (
              <Link
                key={banner.id}
                href={banner.linkUrl}
                className="group block overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/25"
              >
                {card}
              </Link>
            ) : (
              <div
                key={banner.id}
                className="group block overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/25"
              >
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
