"use client";

import NextImage from "next/image";
import Link from "next/link";
import { Eye, Image as ImageIcon, MousePointerClick, Package, PauseCircle, PlayCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminGalleryItem } from "@/lib/api/admin";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { toArray } from "@/lib/safe-array";

export function HomepageEditorView() {
  const { data: banners, refetch: refetchBanners } = useAdminData(() => adminApi.listAdminBanners());
  const { data: popups, refetch: refetchPopups } = useAdminData(() => adminApi.listPopups());
  const { data: gallery } = useAdminData(() => adminApi.listGallery());
  const { data: products, refetch: refetchProducts } = useAdminData(() => adminApi.listProducts({ limit: 12 }));
  const { mutate: updateBanner } = useAdminMutation(({ id, active }: { id: string; active: boolean }) => adminApi.updateBanner(id, { isActive: active }));
  const { mutate: updatePopup } = useAdminMutation(({ id, active }: { id: string; active: boolean }) => adminApi.updatePopup(id, { isActive: active }));
  const { mutate: toggleFeatured } = useAdminMutation((id: string) => adminApi.toggleProductFeatured(id));

  const bannerList = toArray<{ id: string; title: string; subtitle?: string; imageUrl: string; isActive: boolean; linkUrl?: string }>(banners);
  const hero = bannerList.find((b) => b.isActive && b.imageUrl) ?? bannerList[0];
  const popupList = toArray<{ id: string; title: string; trigger_type?: string; is_active?: boolean }>(popups);
  const galleryList = toArray<AdminGalleryItem>(gallery).slice(0, 4);
  const productList = toArray<NonNullable<typeof products>["products"][number]>(products?.products);

  async function toggleBanner(id: string, active: boolean) {
    const result = await updateBanner({ id, active });
    if (result) {
      toast.success(active ? "Banner published" : "Banner paused");
      refetchBanners();
    }
  }

  async function togglePopup(id: string, active: boolean) {
    const result = await updatePopup({ id, active });
    if (result) {
      toast.success(active ? "Popup activated" : "Popup paused");
      refetchPopups();
    }
  }

  async function toggleProduct(id: string) {
    const result = await toggleFeatured(id);
    if (result) {
      toast.success("Featured product updated");
      refetchProducts();
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-textPrimary">Visual homepage editor</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Control the storefront’s first impression.</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-brand-textMuted">Owners can publish or pause banners, popups, gallery visuals and featured products without touching code.</p>
          </div>
          <Link href="/" className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-bold text-neutral-50"><Eye size={15} /> Preview storefront</Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.78fr]">
        <div className="overflow-hidden rounded-[1.5rem] border border-brand-border bg-white shadow-sm">
          <div className="border-b border-brand-border p-4"><h3 className="font-display text-xl font-semibold">Desktop preview</h3></div>
          <div className="p-5">
            <div className="overflow-hidden rounded-[1.5rem] bg-brand-bgDark text-neutral-50">
              <div className="grid min-h-[280px] md:grid-cols-[1.05fr_0.95fr]">
                <div className="flex flex-col justify-center p-8">
                  <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-neutral-50/75">Homepage hero</span>
                  <h4 className="mt-4 font-display text-3xl font-semibold">{hero?.title ?? "No active banner"}</h4>
                  <p className="mt-3 text-sm leading-6 text-neutral-50/70">{hero?.subtitle ?? "Create or publish a banner to fill this space."}</p>
                  {hero?.linkUrl ? <span className="mt-5 w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-primary">Banner button</span> : null}
                </div>
                <div className="relative min-h-[240px] bg-white/10">
                  {hero?.imageUrl ? <NextImage src={hero.imageUrl} alt={hero.title} fill className="object-cover" sizes="50vw" unoptimized /> : <div className="flex h-full items-center justify-center text-neutral-50/50"><ImageIcon size={40} /></div>}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {galleryList.map((item) => (<div key={item.id} className="relative aspect-square overflow-hidden rounded-xl bg-brand-bgLight">{item.image_url ? <NextImage src={item.image_url} alt={item.title} fill className="object-cover" sizes="180px" unoptimized /> : null}</div>))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-brand-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h3 className="font-display text-xl font-semibold">Banners</h3><Link href="/admin/content" className="text-sm font-bold text-brand-primary">Manage</Link></div>
            <div className="mt-4 space-y-3">
              {bannerList.slice(0, 5).map((banner) => (
                <div key={banner.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-border p-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{banner.title}</p><p className="text-xs text-brand-textMuted">{banner.isActive ? "Published" : "Paused"}</p></div>
                  <button onClick={() => toggleBanner(banner.id, !banner.isActive)} className="rounded-full border border-brand-border p-2 text-brand-primary">{banner.isActive ? <PauseCircle size={16} /> : <PlayCircle size={16} />}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-brand-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h3 className="font-display text-xl font-semibold">Popups</h3><Link href="/admin/popups" className="text-sm font-bold text-brand-primary">Open</Link></div>
            <div className="mt-4 space-y-3">
              {popupList.slice(0, 4).map((popup) => (
                <div key={popup.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-border p-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{popup.title}</p><p className="text-xs text-brand-textMuted">{popup.trigger_type?.replace("_", " ")}</p></div>
                  <button onClick={() => togglePopup(popup.id, !popup.is_active)} className="rounded-full border border-brand-border p-2 text-brand-primary">{popup.is_active ? <PauseCircle size={16} /> : <PlayCircle size={16} />}</button>
                </div>
              ))}
              {popupList.length === 0 ? <Link href="/admin/popups" className="flex items-center gap-2 rounded-xl border border-dashed border-brand-border p-4 text-sm font-semibold text-brand-primary"><MousePointerClick size={15} /> Create first popup</Link> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-brand-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3"><h3 className="font-display text-xl font-semibold">Featured products</h3><Link href="/admin/products" className="text-sm font-bold text-brand-primary">Edit products</Link></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {productList.map((product) => (
            <button key={product.id} onClick={() => toggleProduct(product.id)} className="rounded-[1.5rem] border border-brand-border p-4 text-left transition hover:bg-brand-bgLight">
              <Package className="text-brand-primary" size={16} />
              <p className="mt-3 line-clamp-2 text-sm font-semibold">{product.name}</p>
              <p className="mt-1 text-xs text-brand-textMuted">{product.is_featured ? "Featured on storefront" : "Not featured"}</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-bgLight px-3 py-1 text-xs font-bold text-brand-primary"><Star size={12} /> Toggle featured</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
