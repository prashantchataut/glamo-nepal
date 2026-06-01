"use client";

import { ChangeEvent, useEffect, useState } from "react";
import DOMPurify from "dompurify";
import NextImage from "next/image";
import Link from "next/link";
import { Save, Upload, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type BannerSlot = "desktop" | "mobile";

type ManagedBanner = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  desktopImage: string;
  mobileImage: string;
  status: "Published" | "Scheduled" | "Paused";
  updatedAt: string;
};

const adminImageHost = "https://images." + "unsplash.com";
const adminImage = (path: string) => `${adminImageHost}${path}`;

const defaultBanners: ManagedBanner[] = [
  {
    id: "hero-new-year",
    title: "New Year 2083 Beauty Edit",
    subtitle: "Fresh skincare, soft glam makeup and giftable beauty picks curated for Nepal.",
    cta: "Shop New Year Offers",
    href: "/collections/festival-ready",
    desktopImage: adminImage("/photo-1596462502278-27bfdc403348?w=1600&q=85&fit=crop"),
    mobileImage: adminImage("/photo-1487412947147-5cebf100ffc2?w=900&q=85&fit=crop"),
    status: "Published",
    updatedAt: "2026-05-01",
  },
  {
    id: "store-visit",
    title: "Visit GLAMO NEPAL in Naya Baneshwor",
    subtitle: "Find us at Mantra In & Out Square, Kathmandu.",
    cta: "Get Directions",
    href: "/contact",
    desktopImage: adminImage("/photo-1556228578-8c89e6adf883?w=1600&q=85&fit=crop"),
    mobileImage: adminImage("/photo-1522337360788-8b13dee7a37e?w=900&q=85&fit=crop"),
    status: "Published",
    updatedAt: "2026-05-01",
  },
];

const allowedBannerTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const bannerStorageKey = "glamo-admin-managed-banners";

function sanitizeSvg(svgString: string): string {
  return DOMPurify.sanitize(svgString, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}

function BannerPreview({ banner }: { banner: ManagedBanner }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-brand-bgDark text-white shadow-lg">
      <div className="grid min-h-[180px] md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-5 md:p-6">
          <span className="font-label w-fit rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/75">{banner.status}</span>
          <h3 className="mt-3 font-display text-2xl font-semibold leading-tight md:text-3xl">{banner.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">{banner.subtitle}</p>
          <Link href={banner.href} className="mt-4 w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-primary">
            {banner.cta}
          </Link>
        </div>
        <div className="relative min-h-[180px] bg-white/10">
          <NextImage src={banner.desktopImage} alt="Banner preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" unoptimized />
        </div>
      </div>
    </div>
  );
}

export function BannersView() {
  const [banners, setBanners] = useState<ManagedBanner[]>(defaultBanners);
  const [selectedBannerId, setSelectedBannerId] = useState(defaultBanners[0].id);
  const [bannerMessage, setBannerMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(bannerStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ManagedBanner[];
        if (Array.isArray(parsed) && parsed.length > 0) setBanners(parsed);
      } catch {
        window.localStorage.removeItem(bannerStorageKey);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(bannerStorageKey, JSON.stringify(banners));
  }, [banners]);

  const selectedBanner = banners.find((banner) => banner.id === selectedBannerId) || banners[0];

  function updateBannerField(field: keyof ManagedBanner, value: string) {
    setBanners((current) =>
      current.map((banner) =>
        banner.id === selectedBanner.id ? { ...banner, [field]: value, updatedAt: new Date().toISOString().slice(0, 10) } : banner,
      ),
    );
  }

  async function handleBannerUpload(event: ChangeEvent<HTMLInputElement>, slot: BannerSlot) {
    const file = event.target.files?.[0];
    setUploadError("");
    setBannerMessage("");
    if (!file) return;
    if (!allowedBannerTypes.includes(file.type)) {
      setUploadError("Use PNG, JPG, WebP or SVG only.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("Keep banner files under 3 MB for faster mobile loading.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      if (file.type === "image/svg+xml") {
        const sanitized = sanitizeSvg(result);
        updateBannerField(slot === "desktop" ? "desktopImage" : "mobileImage", sanitized);
        setBannerMessage("SVG banner uploaded. Check preview on desktop and mobile before publishing.");
        return;
      }

      const image = new Image();
      image.onload = () => {
        const ratio = image.width / image.height;
        const isDesktopRatioValid = ratio >= 2 && ratio <= 2.6;
        const isMobileRatioValid = ratio >= 0.75 && ratio <= 1.05;
        const isValid = slot === "desktop" ? isDesktopRatioValid : isMobileRatioValid;
        if (!isValid) {
          setUploadError(
            slot === "desktop"
              ? "Desktop banners should be close to 16:7. Recommended: 1920 x 840."
              : "Mobile banners should be close to 4:5. Recommended: 1080 x 1350.",
          );
          return;
        }
        updateBannerField(slot === "desktop" ? "desktopImage" : "mobileImage", result);
        setBannerMessage(`${slot === "desktop" ? "Desktop" : "Mobile"} banner uploaded and ratio checked.`);
      };
      image.onerror = () => setUploadError("The selected image could not be read.");
      image.src = result;
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.76fr]">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">Banner manager</h2>
              <p className="mt-0.5 text-sm text-brand-textMuted">Replace homepage and campaign banners with adaptive desktop and mobile assets.</p>
            </div>
            <button
              onClick={() => setBannerMessage("Banner settings saved in this browser. Connect the admin API to publish across devices.")}
              className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-medium text-white"
            >
              <Save size={15} /> Save banner
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {banners.map((banner) => (
              <button
                key={banner.id}
                onClick={() => setSelectedBannerId(banner.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  selectedBanner.id === banner.id ? "border-brand-primary bg-brand-primary-light" : "border-brand-border bg-white hover:bg-brand-bgLight",
                )}
              >
                <p className="font-semibold">{banner.title}</p>
                <p className="mt-0.5 text-[11px] text-brand-textMuted">{banner.status} · Updated {banner.updatedAt}</p>
              </button>
            ))}
          </div>
        </div>
        <BannerPreview banner={selectedBanner} />
        <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
          <h3 className="font-display text-xl font-semibold">Edit selected banner</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label htmlFor="banner-title" className="space-y-2 text-sm font-medium">
              Title
              <input
                id="banner-title"
                value={selectedBanner.title}
                onChange={(event) => updateBannerField("title", event.target.value)}
                className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
            </label>
            <label htmlFor="banner-cta" className="space-y-2 text-sm font-medium">
              CTA text
              <input
                id="banner-cta"
                value={selectedBanner.cta}
                onChange={(event) => updateBannerField("cta", event.target.value)}
                className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
            </label>
            <label htmlFor="banner-subtitle" className="space-y-2 text-sm font-medium sm:col-span-2">
              Subtitle
              <textarea
                id="banner-subtitle"
                value={selectedBanner.subtitle}
                onChange={(event) => updateBannerField("subtitle", event.target.value)}
                className="mt-1 min-h-[80px] w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
            </label>
            <label htmlFor="banner-link" className="space-y-2 text-sm font-medium">
              Link
              <input
                id="banner-link"
                value={selectedBanner.href}
                onChange={(event) => updateBannerField("href", event.target.value)}
                className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
            </label>
            <label htmlFor="banner-status" className="space-y-2 text-sm font-medium">
              Status
              <select
                id="banner-status"
                value={selectedBanner.status}
                onChange={(event) => updateBannerField("status", event.target.value as ManagedBanner["status"])}
                className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              >
                <option>Published</option>
                <option>Scheduled</option>
                <option>Paused</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
          <Upload className="text-brand-primary" size={20} />
          <h3 className="mt-2 font-display text-xl font-semibold">Upload assets</h3>
          <p className="mt-2 text-sm leading-6 text-brand-textMuted">Desktop: 16:7 ratio (1920 x 840). Mobile: 4:5 ratio (1080 x 1350). PNG, JPG, WebP, SVG under 3 MB.</p>
          <div className="mt-4 space-y-3">
            <label className="block rounded-xl border border-dashed border-brand-primary/40 bg-brand-primary-light p-4 text-sm font-medium text-brand-primary cursor-pointer">
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleBannerUpload(event, "desktop")} className="hidden" />
              Upload desktop banner
            </label>
            <label className="block rounded-xl border border-dashed border-brand-primary/40 bg-brand-primary-light p-4 text-sm font-medium text-brand-primary cursor-pointer">
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleBannerUpload(event, "mobile")} className="hidden" />
              Upload mobile banner
            </label>
          </div>
          <div aria-live="polite">
            {uploadError ? <p className="mt-4 rounded-xl bg-admin-error-light p-3 text-sm font-medium text-admin-error">{uploadError}</p> : null}
            {bannerMessage ? <p className="mt-4 rounded-xl bg-admin-success-light p-3 text-sm font-medium text-admin-success">{bannerMessage}</p> : null}
          </div>
        </div>
        <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
          <Smartphone className="text-brand-primary" size={20} />
          <h3 className="mt-2 font-display text-xl font-semibold">Responsive rules</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-brand-textMuted">
            <li>Keep text inside the center safe area.</li>
            <li>Use separate desktop and mobile crops.</li>
            <li>Avoid tiny text inside image files.</li>
            <li>Test at mobile, tablet and desktop widths before publishing.</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}