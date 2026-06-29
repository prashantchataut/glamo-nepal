"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/admin/shared/StatusPill";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type AdminPopup } from "@/lib/api/admin";

type PopupFormData = {
  title: string;
  content: string;
  imageUrl: string;
  linkUrl: string;
  triggerType: string;
  delayMs: number;
  cookieDays: number;
  startsAt: string;
  expiresAt: string;
};

const defaultForm: PopupFormData = {
  title: "",
  content: "",
  imageUrl: "",
  linkUrl: "",
  triggerType: "ON_LOAD",
  delayMs: 0,
  cookieDays: 0,
  startsAt: "",
  expiresAt: "",
};

export function PopupsView() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPopup, setEditingPopup] = useState<AdminPopup | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<PopupFormData>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: popups,
    isLoading,
    refetch,
  } = useAdminData(() => adminApi.listPopups());
  const popupList = useMemo(() => {
    if (!popups) return [];
    const raw = (popups as unknown as Record<string, unknown>).data ?? popups;
    return Array.isArray(raw) ? raw : [];
  }, [popups]);

  const { mutate: createPopupMut } = useAdminMutation(
    (data: Record<string, unknown>) =>
      adminApi.createPopup(
        data as unknown as Parameters<typeof adminApi.createPopup>[0],
      ),
  );
  const { mutate: updatePopupMut } = useAdminMutation(
    ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updatePopup(
        id,
        data as Parameters<typeof adminApi.updatePopup>[1],
      ),
  );
  const { mutate: deletePopupMut } = useAdminMutation((id: string) =>
    adminApi.deletePopup(id),
  );

  const openCreate = useCallback(() => {
    setEditingPopup(null);
    setIsCreating(true);
    setFormData(defaultForm);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((popup: AdminPopup) => {
    setEditingPopup(popup);
    setIsCreating(false);
    setFormData({
      title: popup.title ?? "",
      content: popup.content ?? "",
      imageUrl: popup.image_url ?? "",
      linkUrl: popup.link_url ?? "",
      triggerType: popup.trigger_type ?? "ON_LOAD",
      delayMs: popup.delay_ms ?? 0,
      cookieDays: popup.cookie_days ?? 0,
      startsAt: popup.starts_at ? popup.starts_at.slice(0, 16) : "",
      expiresAt: popup.expires_at ? popup.expires_at.slice(0, 16) : "",
    });
    setFormOpen(true);
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const result = await adminApi.uploadSettingImage(file);
      const url =
        "data" in result ? result.data.url : (result as { url: string }).url;
      setFormData((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        imageUrl: formData.imageUrl.trim() || undefined,
        linkUrl: formData.linkUrl.trim() || undefined,
        triggerType: formData.triggerType,
        delayMs: formData.delayMs,
        cookieDays: formData.cookieDays || undefined,
        startsAt: formData.startsAt || undefined,
        expiresAt: formData.expiresAt || undefined,
      };
      if (isCreating) {
        await createPopupMut(payload);
        toast.success("Popup created");
      } else if (editingPopup) {
        await updatePopupMut({ id: editingPopup.id, data: payload });
        toast.success("Popup updated");
      }
      setFormOpen(false);
      refetch();
    } catch {
      toast.error(
        isCreating ? "Failed to create popup" : "Failed to update popup",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    formData,
    isCreating,
    editingPopup,
    createPopupMut,
    updatePopupMut,
    refetch,
  ]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deletePopupMut(deleteId);
      toast.success("Popup deleted");
      refetch();
    } catch {
      toast.error("Failed to delete popup");
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, deletePopupMut, refetch]);

  const handleToggleActive = useCallback(
    async (popup: AdminPopup) => {
      try {
        await updatePopupMut({
          id: popup.id,
          data: { is_active: popup.is_active ? 0 : 1 },
        });
        toast.success(
          popup.is_active ? "Popup deactivated" : "Popup activated",
        );
        refetch();
      } catch {
        toast.error("Failed to toggle popup status");
      }
    },
    [updatePopupMut, refetch],
  );

  const columns: Column<AdminPopup>[] = [
    {
      key: "title",
      header: "Title",
      render: (p) => (
        <div>
          <p className="font-semibold text-brand-textPrimary">{p.title}</p>
          <p className="mt-0.5 max-w-xs truncate text-xs text-brand-textMuted">
            {p.content}
          </p>
        </div>
      ),
    },
    {
      key: "triggerType",
      header: "Trigger",
      render: (p) => (
        <span className="text-sm">
          {p.trigger_type?.replace("_", " ") ?? "ON LOAD"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <button
          onClick={() => handleToggleActive(p)}
          className="cursor-pointer"
        >
          <StatusPill variant={p.is_active ? "success" : "neutral"}>
            {p.is_active ? "Active" : "Inactive"}
          </StatusPill>
        </button>
      ),
    },
    {
      key: "schedule",
      header: "Schedule",
      render: (p) => {
        if (!p.starts_at && !p.expires_at)
          return <span className="text-sm text-brand-textMuted">Always</span>;
        return (
          <div className="text-sm">
            {p.starts_at && (
              <div>{new Date(p.starts_at).toLocaleDateString()}</div>
            )}
            {p.expires_at && (
              <div className="text-brand-textMuted">
                until {new Date(p.expires_at).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex gap-1">
          <button
            aria-label="Edit popup"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-bgLight"
            onClick={() => openEdit(p)}
          >
            <Pencil size={15} />
          </button>
          <button
            aria-label="Delete popup"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-admin-error hover:bg-admin-error-light"
            onClick={() => setDeleteId(p.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <section className="rounded-[1.5rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Popup manager
            </h2>
            <p className="mt-1 text-sm text-brand-textMuted">
              Manage promotional popups and overlays.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-neutral-50"
          >
            <Plus size={15} /> New popup
          </button>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <DataTable
              columns={columns}
              data={[]}
              keyExtractor={(p) => p.id}
              isLoading
              emptyMessage=""
            />
          ) : popupList.length > 0 ? (
            <DataTable
              columns={columns}
              data={popupList}
              keyExtractor={(p) => p.id}
              caption="Popups"
              minRowWidth="700px"
            />
          ) : (
            <EmptyState
              icon={Plus}
              title="No popups yet"
              description="Create your first popup."
              action={{ label: "Create popup", onClick: openCreate }}
            />
          )}
        </div>
      </section>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[1.5rem] border border-brand-border bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold">
              {isCreating ? "Create popup" : "Edit popup"}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                Title
                <input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Summer Sale 50% Off"
                />
              </label>
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                Content
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, content: e.target.value }))
                  }
                  className="mt-1 min-h-[100px] w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Popup body text or HTML..."
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Image URL or upload
                <input
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, imageUrl: e.target.value }))
                  }
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="https://..."
                />
                <label className="btn-press inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-brand-border px-3 py-2 text-xs font-medium text-brand-textPrimary transition hover:bg-brand-bgLight">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="sr-only"
                    disabled={isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleImageUpload(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  <Upload size={13} />{" "}
                  {isUploading ? "Uploading..." : "Upload image"}
                </label>
              </label>
              <label className="space-y-2 text-sm font-medium">
                Link URL
                <input
                  value={formData.linkUrl}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, linkUrl: e.target.value }))
                  }
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="https://..."
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Trigger type
                <select
                  value={formData.triggerType}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, triggerType: e.target.value }))
                  }
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                >
                  <option value="ON_LOAD">On page load</option>
                  <option value="EXIT_INTENT">Exit intent</option>
                  <option value="SCROLL_50">Scroll 50%</option>
                  <option value="TIME_DELAY">Time delay</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                Delay (ms)
                <input
                  type="number"
                  min={0}
                  value={formData.delayMs}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      delayMs: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Cookie days
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={formData.cookieDays}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      cookieDays: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="0 = session only"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Starts at
                <input
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, startsAt: e.target.value }))
                  }
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Expires at
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, expiresAt: e.target.value }))
                  }
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                />
              </label>
            </div>
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
                className="btn-press rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : isCreating ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete popup"
        description="This action cannot be undone. The popup will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={false}
        onConfirm={handleDelete}
      />
    </>
  );
}
