"use client";

import { useCallback, useMemo, useState } from "react";
import NextImage from "next/image";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type AdminTeamMember, type CreateTeamMemberInput, type UpdateTeamMemberInput } from "@/lib/api/admin";

type TeamFormData = {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  sortOrder: number;
};

const defaultForm: TeamFormData = {
  name: "",
  role: "",
  bio: "",
  imageUrl: "",
  sortOrder: 0,
};

export function TeamView() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<AdminTeamMember | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<TeamFormData>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  const { data: teamData, isLoading, refetch } = useAdminData(() => adminApi.listTeam());
  const teamList = useMemo(() => {
    if (!teamData) return [];
    const raw = (teamData as unknown as Record<string, unknown>).data ?? teamData;
    return Array.isArray(raw) ? (raw as AdminTeamMember[]) : [];
  }, [teamData]);

  const { mutate: createMut } = useAdminMutation((data: Record<string, unknown>) =>
    adminApi.createTeamMember(data as unknown as CreateTeamMemberInput)
  );
  const { mutate: updateMut } = useAdminMutation(({ id, data }: { id: string; data: Record<string, unknown> }) =>
    adminApi.updateTeamMember(id, data as unknown as UpdateTeamMemberInput)
  );
  const { mutate: deleteMut } = useAdminMutation((id: string) => adminApi.deleteTeamMember(id));

  const openCreate = useCallback(() => {
    setEditingMember(null);
    setIsCreating(true);
    setFormData(defaultForm);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((member: AdminTeamMember) => {
    setEditingMember(member);
    setIsCreating(false);
    setFormData({
      name: member.name ?? "",
      role: member.role ?? "",
      bio: member.bio ?? "",
      imageUrl: member.image_url ?? "",
      sortOrder: member.sort_order ?? 0,
    });
    setFormOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.role.trim()) {
      toast.error("Role is required");
      return;
    }
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        bio: formData.bio.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        sortOrder: formData.sortOrder,
      };
      if (isCreating) {
        await createMut(payload);
        toast.success("Team member added");
      } else if (editingMember) {
        await updateMut({ id: editingMember.id, data: payload });
        toast.success("Team member updated");
      }
      setFormOpen(false);
      refetch();
    } catch {
      toast.error(isCreating ? "Failed to add team member" : "Failed to update team member");
    } finally {
      setIsSaving(false);
    }
  }, [formData, isCreating, editingMember, createMut, updateMut, refetch]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteMut(deleteId);
      toast.success("Team member removed");
      refetch();
    } catch {
      toast.error("Failed to remove team member");
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, deleteMut, refetch]);

  const handleMoveUp = useCallback(async (index: number) => {
    if (index <= 0 || !teamList[index]) return;
    const member = teamList[index];
    const newOrder = teamList[index - 1].sort_order;
    try {
      await updateMut({ id: member.id, data: { sortOrder: newOrder } });
      toast.success("Order updated");
      refetch();
    } catch {
      toast.error("Failed to reorder");
    }
  }, [teamList, updateMut, refetch]);

  const handleMoveDown = useCallback(async (index: number) => {
    if (index >= teamList.length - 1 || !teamList[index]) return;
    const member = teamList[index];
    const newOrder = teamList[index + 1].sort_order;
    try {
      await updateMut({ id: member.id, data: { sortOrder: newOrder } });
      toast.success("Order updated");
      refetch();
    } catch {
      toast.error("Failed to reorder");
    }
  }, [teamList, updateMut, refetch]);

  return (
    <>
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Team members</h2>
            <p className="mt-1 text-sm text-brand-textMuted">Manage your team roster and display order.</p>
          </div>
          <button
            onClick={openCreate}
            className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={15} /> Add member
          </button>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl bg-brand-bgLight p-4">
                  <div className="h-12 w-12 animate-pulse rounded-full bg-brand-border/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-brand-border/50" />
                    <div className="h-3 w-24 animate-pulse rounded bg-brand-border/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : teamList.length > 0 ? (
            <div className="space-y-2">
              {teamList.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 rounded-xl border border-brand-border p-4 transition hover:bg-brand-bgLight/60"
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-brand-bgLight">
                    {member.image_url ? (
                      <NextImage src={member.image_url} alt={member.name} fill className="object-cover" sizes="48px" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-textMuted">
                        <UserRound size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-textPrimary">{member.name}</p>
                    <p className="text-sm text-brand-textMuted">{member.role}</p>
                    {member.bio && <p className="mt-1 line-clamp-2 text-xs text-brand-textMuted">{member.bio}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-textMuted transition hover:bg-brand-bgLight disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === teamList.length - 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-textMuted transition hover:bg-brand-bgLight disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(member)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-bgLight"
                      aria-label="Edit team member"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(member.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-admin-error hover:bg-admin-error-light"
                      aria-label="Delete team member"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Plus} title="No team members" description="Add your first team member." action={{ label: "Add member", onClick: openCreate }} />
          )}
        </div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="w-full max-w-lg rounded-[2rem] border border-brand-border bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold">{isCreating ? "Add team member" : "Edit team member"}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Name
                <input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Jane Doe"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Role
                <input
                  value={formData.role}
                  onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Creative Director"
                />
              </label>
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                Bio
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                  className="mt-1 min-h-[80px] w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Short bio..."
                />
              </label>
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                Photo URL
                <input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
                  className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="https://..."
                />
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
              <div className="mt-3 flex justify-center">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-brand-bgLight">
                  <NextImage src={formData.imageUrl} alt="Preview" fill className="object-cover" sizes="80px" unoptimized />
                </div>
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
        title="Remove team member"
        description="This action cannot be undone. The team member will be permanently removed."
        confirmLabel="Remove"
        variant="destructive"
        isLoading={false}
        onConfirm={handleDelete}
      />
    </>
  );
}