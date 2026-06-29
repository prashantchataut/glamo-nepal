"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type AdminBlog, type CreateBlogInput, type UpdateBlogInput } from "@/lib/api/admin";

interface BlogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blog: AdminBlog | null;
  onSaved: () => void;
}

interface BlogFormData {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  tags: string;
  is_published: boolean;
}

const defaultFormData: BlogFormData = {
  title: "",
  category: "",
  excerpt: "",
  content: "",
  tags: "",
  is_published: false,
};

export function BlogForm({ open, onOpenChange, blog, onSaved }: BlogFormProps) {
  const isEditing = !!blog;

  const [formData, setFormData] = useState<BlogFormData>(() =>
    blog
      ? {
          title: blog.title,
          category: blog.category ?? "",
          excerpt: blog.excerpt ?? "",
          content: blog.content ?? "",
          tags: blog.tags?.join(", ") ?? "",
          is_published: blog.is_published,
        }
      : defaultFormData
  );
  const [isSaving, setIsSaving] = useState(false);

  const { mutate: createBlogMut } = useAdminMutation((data: CreateBlogInput) =>
    adminApi.createBlog(data)
  );
  const { mutate: updateBlogMut } = useAdminMutation(
    ({ id, data }: { id: string; data: UpdateBlogInput }) =>
      adminApi.updateBlog(id, data)
  );

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsSaving(true);
    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (isEditing && blog) {
        const updateData: UpdateBlogInput = {
          title: formData.title.trim(),
          excerpt: formData.excerpt.trim() || undefined,
          content: formData.content.trim() || undefined,
          category: formData.category.trim() || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          isPublished: formData.is_published,
        };
        await updateBlogMut({ id: blog.id, data: updateData });
        toast.success("Blog post updated");
      } else {
        const createData: CreateBlogInput = {
          title: formData.title.trim(),
          excerpt: formData.excerpt.trim() || undefined,
          content: formData.content.trim(),
          category: formData.category.trim() || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
        };
        await createBlogMut(createData);
        toast.success("Blog post created");
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Failed to save blog post");
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditing, blog, createBlogMut, updateBlogMut, onOpenChange, onSaved]);

  const inputClass =
    "w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit blog post" : "New blog post"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 grid gap-4">
          <label className="space-y-2 text-sm font-medium">
            Title
            <input
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Blog post title"
              className={inputClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Category
              <input
                value={formData.category}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, category: e.target.value }))
                }
                placeholder="e.g. Skincare Tips"
                className={inputClass}
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Tags
              <input
                value={formData.tags}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, tags: e.target.value }))
                }
                placeholder="Comma-separated tags"
                className={inputClass}
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium">
            Excerpt
            <textarea
              value={formData.excerpt}
              onChange={(e) =>
                setFormData((p) => ({ ...p, excerpt: e.target.value }))
              }
              placeholder="A short summary of the post"
              rows={3}
              className={inputClass}
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            Content
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((p) => ({ ...p, content: e.target.value }))
              }
              placeholder="Write your blog post content here..."
              rows={10}
              className={inputClass}
            />
          </label>

          {isEditing && (
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    is_published: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-brand-border accent-brand-primary"
              />
              Published
            </label>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary transition hover:bg-brand-bgLight"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-press rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : isEditing ? "Update post" : "Create post"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}