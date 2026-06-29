"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/admin/shared/StatusPill";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type AdminBlog } from "@/lib/api/admin";
import { BlogForm } from "@/components/admin/blog/BlogForm";

const PAGE_SIZE = 20;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BlogsView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editBlog, setEditBlog] = useState<AdminBlog | null>(null);

  const { data: blogsData, meta: blogsMeta, isLoading, refetch } = useAdminData(() =>
    adminApi.listBlogs({ page, limit: PAGE_SIZE })
  );

  const { mutate: deleteBlogMut } = useAdminMutation((id: string) =>
    adminApi.deleteBlog(id)
  );

  const blogs: AdminBlog[] = useMemo(() => {
    if (!blogsData) return [];
    const raw = (blogsData as unknown as Record<string, unknown>).posts ?? blogsData;
    return Array.isArray(raw) ? raw : [];
  }, [blogsData]);

  const total: number = blogsMeta?.total ?? ((blogsData as unknown as Record<string, unknown>)?.total as number ?? blogs.length);

  const totalPages = blogsMeta?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = useMemo(() => {
    if (!search) return blogs;
    const q = search.toLowerCase();
    return blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.category ?? "").toLowerCase().includes(q)
    );
  }, [blogs, search]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteBlogMut(deleteId);
      toast.success("Blog post deleted");
      refetch();
    } catch {
      toast.error("Failed to delete blog post");
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, deleteBlogMut, refetch]);

  const columns: Column<AdminBlog>[] = [
    {
      key: "title",
      header: "Title",
      render: (b) => (
        <div>
          <p className="font-semibold text-brand-textPrimary">{b.title}</p>
          {b.category && (
            <p className="mt-0.5 text-xs text-brand-textMuted">{b.category}</p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (b) => <span>{b.category || "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <StatusPill variant={b.is_published ? "success" : "neutral"}>
          {b.is_published ? "Published" : "Draft"}
        </StatusPill>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (b) => (
        <span className="text-sm text-brand-textMuted">
          {formatDate(b.published_at ?? b.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (b) => (
        <div className="flex gap-1">
          <button
            aria-label="Edit blog"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-bgLight"
            onClick={() => {
              setEditBlog(b);
              setFormOpen(true);
            }}
          >
            <Pencil size={15} />
          </button>
          <button
            aria-label="Delete blog"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-admin-error hover:bg-admin-error-light"
            onClick={() => setDeleteId(b.id)}
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
            <h2 className="font-display text-2xl font-semibold">Blog management</h2>
            <p className="mt-1 text-sm text-brand-textMuted">
              Create, edit, and publish blog posts.
            </p>
          </div>
          <button
            onClick={() => {
              setEditBlog(null);
              setFormOpen(true);
            }}
            className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-neutral-50"
          >
            <Plus size={15} /> New post
          </button>
        </div>

        <div className="mt-4">
          <SearchInput
            value={search}
            onSearch={setSearch}
            placeholder="Search by title or category"
          />
        </div>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(b) => b.id}
            caption="Blog posts"
            isLoading={isLoading}
            emptyMessage="No blog posts found."
            minRowWidth="700px"
          />
        </div>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
              pageSize={PAGE_SIZE}
            />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete blog post"
        description="This action cannot be undone. The blog post will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={false}
        onConfirm={handleDelete}
      />

      <BlogForm
        open={formOpen}
        onOpenChange={setFormOpen}
        blog={editBlog}
        onSaved={refetch}
      />
    </>
  );
}