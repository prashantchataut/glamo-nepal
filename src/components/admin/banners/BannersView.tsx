"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { Save, Upload, Smartphone, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type CreateBannerInput, type UpdateBannerInput } from "@/lib/api/admin";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { toast } from "sonner";

type BannerSlot = "desktop" | "mobile";
type BannerItem = { id: string; title: string; subtitle?: string; linkUrl?: string; isActive: boolean; position: string; imageUrl: string };

function BannerPreview({ banner }: { banner: BannerItem }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-brand-bgDark text-white shadow-lg">
      <div className="grid min-h-[180px] md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-5 md:p-6">
          <span className={cn(
            "font-label w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
            banner.isActive ? "bg-white/20 text-white/90" : "bg-white/10 text-white/60"
          )}>
            {banner.isActive ? "Published" : "Paused"}
          </span>
          <h3 className="mt-3 font-display text-2xl font-semibold leading-tight md:text-3xl">{banner.title}</h3>
          {banner.subtitle && <p className="mt-2 text-sm leading-6 text-white/70">{banner.subtitle}</p>}
          {banner.linkUrl && (
            <Link href={banner.linkUrl} className="mt-4 w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-primary">
              View
            </Link>
          )}
        </div>
        <div className="relative min-h-[180px] bg-white/10">
          <NextImage src={banner.imageUrl} alt={banner.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" unoptimized />
        </div>
      </div>
    </div>
  );
}

interface BannerFormData {
  title: string;
  subtitle: string;
  link_url: string;
  is_active: boolean;
  position: string;
  image_url: string;
}

const defaultFormData: BannerFormData = {
  title: "",
  subtitle: "",
  link_url: "",
  is_active: true,
  position: "hero",
  image_url: "",
};

export function BannersView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData);
  const [uploadError, setUploadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BannerItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: banners, isLoading, isError, refetch } = useAdminData(() => adminApi.listAdminBanners());
  const bannerList = useMemo(() => (banners ?? []) as unknown as BannerItem[], [banners]);
  const selectedBanner = bannerList.find((b) => b.id === selectedId);

  const { mutate: createBannerMut } = useAdminMutation((data: CreateBannerInput) => adminApi.createBanner(data));
  const { mutate: updateBannerMut } = useAdminMutation(({ id, data }: { id: string; data: UpdateBannerInput }) => adminApi.updateBanner(id, data));
  const { mutate: deleteBannerMut } = useAdminMutation((id: string) => adminApi.deleteBanner(id));

  useEffect(() => {
    if (banners && banners.length > 0 && !selectedId && !isCreating) {
      setSelectedId(banners[0].id);
    }
  }, [banners, selectedId, isCreating]);

  useEffect(() => {
    if (selectedId && bannerList.length > 0) {
      const banner = bannerList.find((b) => b.id === selectedId);
      if (banner) {
        setFormData({
          title: banner.title,
          subtitle: banner.subtitle ?? "",
          link_url: banner.linkUrl ?? "",
          is_active: !!banner.isActive,
          position: banner.position,
          image_url: banner.imageUrl,
        });
      }
    }
  }, [selectedId, bannerList]);

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.image_url) {
      toast.error("Please upload a banner image first");
      return;
    }
    setIsSaving(true);
    try {
      const payload: CreateBannerInput = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim() || undefined,
        image_url: formData.image_url,
        link_url: formData.link_url.trim() || undefined,
        position: formData.position.toUpperCase(),
        sort_order: 0,
        is_active: formData.is_active ? 1 : 0,
      };
      if (isCreating) {
        await createBannerMut(payload);
        toast.success("Banner created");
      } else if (selectedId) {
        await updateBannerMut({ id: selectedId, data: payload as UpdateBannerInput });
        toast.success("Banner updated");
      }
      refetch();
    } catch {
      toast.error("Failed to save banner");
    } finally {
      setIsSaving(false);
    }
  }, [formData, isCreating, selectedId, createBannerMut, updateBannerMut, refetch]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteBannerMut(deleteTarget.id);
      toast.success("Banner deleted");
      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
      }
      refetch();
    } catch {
      toast.error("Failed to delete banner");
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteBannerMut, selectedId, refetch]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBannerUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>, _slot: BannerSlot) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError("");
    try {
      const result = await adminApi.uploadBannerImage(file);
      const imageUrl = 'data' in result ? result.data.url : (result as { url: string }).url;
      setFormData((prev) => ({ ...prev, image_url: imageUrl }));
      toast.success("Image uploaded");
    } catch {
      setUploadError("Failed to upload image. Please try again.");
      toast.error("Image upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }, []);

  if (isError && !banners) {
    return (
      <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-brand-textMuted">Failed to load banners</p>
        </div>
      </div>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.76fr]">
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">Banner manager</h2>
              <p className="mt-0.5 text-sm text-brand-textMuted">Manage homepage and campaign banners.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setIsCreating(true); setSelectedId(null); setFormData(defaultFormData); }}
                className="btn-press inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-3 text-sm font-medium text-brand-textPrimary transition hover:bg-brand-bgLight"
              >
                <Plus size={15} /> New banner
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                <Save size={15} /> {isSaving ? "Saving…" : "Save banner"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-brand-bgLight" />
              ))}
            </div>
          ) : bannerList.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {bannerList.map((banner) => (
                <button
                  key={banner.id}
                  onClick={() => { setSelectedId(banner.id); setIsCreating(false); }}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    selectedId === banner.id && !isCreating ? "border-brand-primary bg-brand-primary-light" : "border-brand-border bg-white hover:bg-brand-bgLight"
                  )}
                >
                  <p className="font-semibold">{banner.title}</p>
                  <p className="mt-0.5 text-[11px] text-brand-textMuted">
                    {banner.isActive ? "Published" : "Paused"}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={Plus} title="No banners yet" description="Create your first banner." action={{ label: "Create banner", onClick: () => { setIsCreating(true); setFormData(defaultFormData); } }} />
          )}
        </div>

        {selectedBanner && !isCreating && <BannerPreview banner={selectedBanner} />}

        {(isCreating || selectedBanner) && (
          <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
            <h3 className="font-display text-xl font-semibold">{isCreating ? "Create new banner" : "Edit banner"}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Title
                <input
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                CTA link
                <input
                  value={formData.link_url}
                  onChange={(e) => setFormData((p) => ({ ...p, link_url: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                />
              </label>
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                Subtitle
                <textarea
                  value={formData.subtitle}
                  onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
                  className="mt-1 min-h-[80px] w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Position
                <select
                  value={formData.position}
                  onChange={(e) => setFormData((p) => ({ ...p, position: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                >
                  <option value="hero">Hero</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="promo">Promo</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                Status
                <select
                  value={formData.is_active ? "active" : "paused"}
                  onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.value === "active" }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                >
                  <option value="active">Published</option>
                  <option value="paused">Paused</option>
                </select>
              </label>
            </div>

            {formData.image_url && (
                <div className="mt-3 relative h-32 w-full overflow-hidden rounded-xl">
                  <NextImage src={formData.image_url} alt="Banner preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" unoptimized />
                </div>
              )}
              {!isCreating && selectedBanner && (
              <button
                onClick={() => setDeleteTarget(selectedBanner)}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-admin-error/30 px-4 py-2 text-sm font-medium text-admin-error transition hover:bg-admin-error-light"
              >
                <Trash2 size={14} /> Delete banner
              </button>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
          <Upload className="text-brand-primary" size={20} />
          <h3 className="mt-2 font-display text-xl font-semibold">Upload assets</h3>
          <p className="mt-2 text-sm leading-6 text-brand-textMuted">Desktop: 16:7 ratio (1920 x 840). Mobile: 4:5 ratio (1080 x 1350). PNG, JPG, WebP, SVG under 3 MB.</p>
          <div className="mt-4 space-y-3">
            <label className={cn(
              "block rounded-xl border border-dashed border-brand-primary/40 bg-brand-primary-light p-4 text-sm font-medium text-brand-primary",
              isUploading ? "pointer-events-none opacity-50" : "cursor-pointer"
            )}>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => handleBannerUpload(e, "desktop")} className="hidden" disabled={isUploading} />
              {isUploading ? "Uploading..." : "Upload desktop banner"}
            </label>
            <label className={cn(
              "block rounded-xl border border-dashed border-brand-primary/40 bg-brand-primary-light p-4 text-sm font-medium text-brand-primary",
              isUploading ? "pointer-events-none opacity-50" : "cursor-pointer"
            )}>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => handleBannerUpload(e, "mobile")} className="hidden" disabled={isUploading} />
              {isUploading ? "Uploading..." : "Upload mobile banner"}
            </label>
          </div>
          {uploadError && <p className="mt-4 rounded-xl bg-admin-error-light p-3 text-sm font-medium text-admin-error">{uploadError}</p>}
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete banner"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isSaving}
        onConfirm={handleDelete}
      />
    </section>
  );
}