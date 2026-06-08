"use client";

import { useCallback, useMemo, useState } from "react";
import NextImage from "next/image";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/admin/shared/StatusPill";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type AdminGalleryItem, type CreateGalleryItemInput, type UpdateGalleryItemInput } from "@/lib/api/admin";

type GalleryFormData = {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  sortOrder: number;
};

const defaultForm: GalleryFormData = {
  title: "",
  description: "",
  imageUrl: "",
  category: "",
  sortOrder: 0,
};

const CATEGORIES = ["instagram", "store", "products", "team"] as const;

export function GalleryView() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AdminGalleryItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<GalleryFormData>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");

  const { data: galleryData, isLoading, refetch } = useAdminData(() =>
    adminApi.listGallery(filterCategory ? { category: filterCategory } : undefined)
  );
  const galleryList = useMemo(() => {
    if (!galleryData) return [];
    const raw = (galleryData as unknown as Record<string, unknown>).data ?? galleryData;
    return Array.isArray(raw) ? (raw as AdminGalleryItem[]) : [];
  }, [galleryData]);

  const { mutate: createMut } = useAdminMutation((data: Record<string, unknown>) =>
    adminApi.createGalleryItem(data as unknown as CreateGalleryItemInput)
  );
  const { mutate: updateMut } = useAdminMutation(({ id, data }: { id: string; data: Record<string, unknown> }) =>
    adminApi.updateGalleryItem(id, data as unknown as UpdateGalleryItemInput)
  );
  const { mutate: deleteMut } = useAdminMutation((id: string) => adminApi.deleteGalleryItem(id));
  const { mutate: reorderMut } = useAdminMutation((items: Array<{ id: string; sortOrder: number }>) =>
    adminApi.reorderGallery(items)
  );

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setIsCreating(true);
    setFormData(defaultForm);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((item: AdminGalleryItem) => {
    setEditingItem(item);
    setIsCreating(false);
    setFormData({
      title: item.title ?? "",
      description: item.description ?? "",
      imageUrl: item.image_url ?? "",
      category: item.category ?? "",
      sortOrder: item.sort_order ?? 0,
    });
    setFormOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.imageUrl.trim() && isCreating) {
      toast.error("Image URL is required");
      return;
    }
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl.trim(),
        category: formData.category || undefined,
        sortOrder: formData.sortOrder,
      };
      if (isCreating) {
        await createMut(payload);
        toast.success("Gallery item created");
      } else if (editingItem) {
        await updateMut({ id: editingItem.id, data: payload });
        toast.success("Gallery item updated");
      }
      setFormOpen(false);
      refetch();
    } catch {
      toast.error(isCreating ? "Failed to create gallery item" : "Failed to update gallery item");
    } finally {
      setIsSaving(false);
    }
  }, [formData, isCreating, editingItem, createMut, updateMut, refetch]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteMut(deleteId);
      toast.success("Gallery item deleted");
      refetch();
    } catch {
      toast.error("Failed to delete gallery item");
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, deleteMut, refetch]);

  const handleMoveUp = useCallback(async (index: number) => {
    if (index <= 0) return;
    const reordered = [...galleryList];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    const items = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    try {
      await reorderMut(items);
      toast.success("Order updated");
      refetch();
    } catch {
      toast.error("Failed to reorder");
    }
  }, [galleryList, reorderMut, refetch]);

  const handleMoveDown = useCallback(async (index: number) => {
    if (index >= galleryList.length - 1) return;
    const reordered = [...galleryList];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    const items = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    try {
      await reorderMut(items);
      toast.success("Order updated");
      refetch();
    } catch {
      toast.error("Failed to reorder");
    }
  }, [galleryList, reorderMut, refetch]);

  return (
    <>
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Gallery manager</h2>
            <p className="mt-1 text-sm text-brand-textMuted">Manage gallery images and media.</p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-primary"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={openCreate}
              className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white"
            >
              <Plus size={15} /> Add image
            </button>
          </div>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-brand-bgLight" />
              ))}
            </div>
          ) : galleryList.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryList.map((item, index) => (
                <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-brand-border bg-brand-bgLight">
                  <div className="relative aspect-[4/3]">
                    <NextImage
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex w-full items-center justify-between p-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-brand-textPrimary transition hover:bg-white"
                            aria-label="Edit gallery item"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-admin-error transition hover:bg-white"
                            aria-label="Delete gallery item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-brand-textPrimary transition hover:bg-white disabled:opacity-40"
                            aria-label="Move up"
                          >
                            <GripVertical size={14} className="rotate-180" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === galleryList.length - 1}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-brand-textPrimary transition hover:bg-white disabled:opacity-40"
                            aria-label="Move down"
                          >
                            <GripVertical size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-brand-textPrimary">{item.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {item.category && (
                        <StatusPill variant="info">{item.category}</StatusPill>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Plus} title="No gallery items" description="Add your first gallery image." action={{ label: "Add image", onClick: openCreate }} />
          )}
        </div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="w-full max-w-lg rounded-[2rem] border border-brand-border bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold">{isCreating ? "Add gallery image" : "Edit gallery image"}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                Title
                <input
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Summer collection"
                />
              </label>
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                Description
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="mt-1 min-h-[80px] w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Optional description..."
                />
              </label>
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                Image URL
                <input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="https://..."
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Category
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                >
                  <option value="">None</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                Sort order
                <input
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                />
              </label>
            </div>
            {formData.imageUrl && (
              <div className="mt-3 relative h-40 w-full overflow-hidden rounded-xl">
                <NextImage src={formData.imageUrl} alt="Preview" fill className="object-cover" sizes="500px" unoptimized />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary transition hover:bg-brand-bgLight"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-press rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {isSaving ? "Saving..." : isCreating ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Delete gallery image"
        description="This action cannot be undone. The gallery image will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={false}
        onConfirm={handleDelete}
      />
    </>
  );
}