"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import NextImage from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi } from "@/lib/api/admin";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().max(300).optional(),
  sku: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  brand_id: z.string().optional(),
  base_price: z.coerce.number().min(0, "Price must be 0 or more"),
  sale_price: z.coerce.number().optional(),
  cost_price: z.coerce.number().optional(),
  is_featured: z.coerce.number().default(0),
  is_digital: z.coerce.number().default(0),
  track_inventory: z.coerce.number().default(1),
  stock_quantity: z.coerce.number().default(0),
  low_stock_threshold: z.coerce.number().default(5),
  tags: z.string().optional(),
  skin_types: z.string().optional(),
  concerns: z.string().optional(),
  shade: z.string().optional(),
  undertone: z.string().optional(),
  finish: z.string().optional(),
  coverage: z.string().optional(),
  ingredients_inci: z.string().optional(),
  claims: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

type ProductFormData = z.input<typeof productSchema>;

interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: number;
}

export interface ProductFormProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  category_id: string;
  brand_id?: string;
  base_price: number;
  sale_price?: number;
  cost_price?: number;
  is_featured: number;
  is_digital: number;
  track_inventory: number;
  stock_quantity: number;
  low_stock_threshold: number;
  tags?: string;
  attributes?: Record<string, unknown>;
  skin_types?: string;
  concerns?: string;
  shade?: string;
  undertone?: string;
  finish?: string;
  coverage?: string;
  ingredients_inci?: string;
  claims?: string;
  meta_title?: string;
  meta_description?: string;
  images?: ProductImage[];
}

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductFormProduct | null;
  onSaved?: () => void;
}

function csv(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function attrString(
  attributes: Record<string, unknown> | undefined,
  key: string,
): string {
  const value = attributes?.[key];
  if (Array.isArray(value)) return value.map(String).join(", ").trim();
  return typeof value === "string" ? value : "";
}

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormModalProps) {
  const isEditing = !!product;

  const { data: categories } = useAdminData(() => adminApi.listCategories());
  const { data: brands } = useAdminData(() => adminApi.listBrands());
  const { mutate: createMutation } = useAdminMutation(
    (payload: Record<string, unknown>) =>
      adminApi.createProduct(payload as never),
  );
  const { mutate: updateMutation } = useAdminMutation(
    ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateProduct(id, data as never),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          short_description: product.short_description ?? "",
          sku: product.sku ?? "",
          category_id: product.category_id,
          brand_id: product.brand_id ?? "",
          base_price: product.base_price,
          sale_price: product.sale_price ?? undefined,
          cost_price: product.cost_price ?? undefined,
          is_featured: product.is_featured,
          is_digital: product.is_digital,
          track_inventory: product.track_inventory,
          stock_quantity: product.stock_quantity,
          low_stock_threshold: product.low_stock_threshold,
          tags: product.tags ?? "",
          skin_types: attrString(product.attributes, "skinTypes"),
          concerns: attrString(product.attributes, "concerns"),
          shade: attrString(product.attributes, "shade"),
          undertone: attrString(product.attributes, "undertone"),
          finish: attrString(product.attributes, "finish"),
          coverage: attrString(product.attributes, "coverage"),
          ingredients_inci: attrString(product.attributes, "ingredientsInci"),
          claims: attrString(product.attributes, "claims"),
          meta_title: product.meta_title ?? "",
          meta_description: product.meta_description ?? "",
        }
      : {
          is_featured: 0,
          is_digital: 0,
          track_inventory: 1,
          stock_quantity: 0,
          low_stock_threshold: 5,
        },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        short_description: product.short_description ?? "",
        sku: product.sku ?? "",
        category_id: product.category_id,
        brand_id: product.brand_id ?? "",
        base_price: product.base_price,
        sale_price: product.sale_price ?? undefined,
        cost_price: product.cost_price ?? undefined,
        is_featured: product.is_featured,
        is_digital: product.is_digital,
        track_inventory: product.track_inventory,
        stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
        tags: product.tags ?? "",
        skin_types: attrString(product.attributes, "skinTypes"),
        concerns: attrString(product.attributes, "concerns"),
        shade: attrString(product.attributes, "shade"),
        undertone: attrString(product.attributes, "undertone"),
        finish: attrString(product.attributes, "finish"),
        coverage: attrString(product.attributes, "coverage"),
        ingredients_inci: attrString(product.attributes, "ingredientsInci"),
        claims: attrString(product.attributes, "claims"),
        meta_title: product.meta_title ?? "",
        meta_description: product.meta_description ?? "",
      });
    } else {
      reset({
        is_featured: 0,
        is_digital: 0,
        track_inventory: 1,
        stock_quantity: 0,
        low_stock_threshold: 5,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: ProductFormData) => {
    const slugValue =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const beautyAttributes = {
      skinTypes: csv(data.skin_types),
      concerns: csv(data.concerns),
      shade: data.shade?.trim() || undefined,
      undertone: data.undertone?.trim() || undefined,
      finish: data.finish?.trim() || undefined,
      coverage: data.coverage?.trim() || undefined,
      ingredientsInci: data.ingredients_inci?.trim() || undefined,
      claims: csv(data.claims),
    };
    const attributes = Object.fromEntries(
      Object.entries(beautyAttributes).filter(([, value]) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value),
      ),
    );

    const payload = {
      name: data.name,
      slug: slugValue,
      description: data.description || undefined,
      shortDescription: data.short_description || undefined,
      sku: data.sku || undefined,
      categoryId: data.category_id,
      brandId: data.brand_id || undefined,
      basePrice: Number(data.base_price) || 0,
      salePrice: data.sale_price ? Number(data.sale_price) : undefined,
      costPrice: data.cost_price ? Number(data.cost_price) : undefined,
      isFeatured: Boolean(data.is_featured),
      isDigital: Boolean(data.is_digital),
      trackInventory: Boolean(data.track_inventory),
      stockQuantity: Number(data.stock_quantity) || 0,
      lowStockThreshold: Number(data.low_stock_threshold) || 5,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : undefined,
      attributes,
      metaTitle: data.meta_title || undefined,
      metaDescription: data.meta_description || undefined,
    };
    setIsSubmitting(true);
    try {
      if (isEditing && product) {
        await updateMutation({
          id: product.id,
          data: payload as Record<string, unknown>,
        });
        toast.success("Product updated successfully");
      } else {
        await createMutation(payload);
        toast.success("Product created successfully");
      }
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product?.images) setImages(product.images);
  }, [product?.images]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!product) {
      toast.info("Save the product first, then add images.");
      return;
    }
    setUploading(true);
    try {
      const result = await adminApi.uploadProductImage(product.id, file);
      const uploadedData = "data" in result ? result.data : result;
      const uploadedImages = Array.isArray(uploadedData)
        ? uploadedData
        : "image" in (uploadedData as Record<string, unknown>)
          ? [(uploadedData as unknown as { image: ProductImage }).image]
          : [];
      const normalized = uploadedImages.map((img) => ({
        id: img.id,
        url: img.url,
        alt_text: img.alt_text,
        sort_order:
          img.sort_order ??
          (img as ProductImage & { sortOrder?: number }).sortOrder ??
          0,
        is_primary:
          img.is_primary ??
          ((img as ProductImage & { isPrimary?: boolean }).isPrimary ? 1 : 0),
      }));
      setImages(normalized.length > 0 ? normalized : (prev) => prev);
      toast.success("Image uploaded");
      onSaved?.();
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleImageDelete = async (imageId: string) => {
    if (!product) return;
    try {
      await adminApi.deleteProductImage(product.id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const categoryList = categories ?? [];
  const brandList = brands ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit product" : "Add product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update product details below."
              : "Fill in the details to create a new product."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Name *
              <input
                {...register("name")}
                className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                placeholder="Product name"
              />
              {errors.name && (
                <p className="text-xs text-admin-error">
                  {errors.name.message}
                </p>
              )}
            </label>

            <label className="space-y-2 text-sm font-medium">
              SKU
              <input
                {...register("sku")}
                className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                placeholder="SKU-001"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium">
            Description
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              placeholder="Full product description"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Category *
              <select
                {...register("category_id")}
                className="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              >
                <option value="">Select category</option>
                {categoryList.map((cat: Record<string, unknown>) => (
                  <option key={String(cat.id)} value={String(cat.id)}>
                    {String(cat.name)}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-xs text-admin-error">
                  {errors.category_id.message}
                </p>
              )}
            </label>

            <label className="space-y-2 text-sm font-medium">
              Brand
              <select
                {...register("brand_id")}
                className="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              >
                <option value="">Select brand</option>
                {brandList.map((brand: Record<string, unknown>) => (
                  <option key={String(brand.id)} value={String(brand.id)}>
                    {String(brand.name)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              Base price (NPR) *
              <input
                {...register("base_price")}
                type="number"
                className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                placeholder="0"
              />
              {errors.base_price && (
                <p className="text-xs text-admin-error">
                  {errors.base_price.message}
                </p>
              )}
            </label>

            <label className="space-y-2 text-sm font-medium">
              Sale price
              <input
                {...register("sale_price")}
                type="number"
                className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                placeholder="Optional"
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Cost price
              <input
                {...register("cost_price")}
                type="number"
                className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              Stock quantity
              <input
                {...register("stock_quantity")}
                type="number"
                className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Low stock threshold
              <input
                {...register("low_stock_threshold")}
                type="number"
                className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Tags
              <input
                {...register("tags")}
                className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                placeholder="skincare, organic"
              />
            </label>
          </div>

          <section className="rounded-2xl border border-brand-border bg-white p-4">
            <div>
              <h3 className="font-display text-base font-semibold">
                Beauty details
              </h3>
              <p className="mt-1 text-xs leading-5 text-brand-textMuted">
                Add shopper-facing details in plain language. Examples help
                search and filters: oily skin, dark spots, warm beige, matte,
                niacinamide.
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Skin types
                <input
                  {...register("skin_types")}
                  className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Dry, oily, sensitive"
                />
                <span className="text-xs text-brand-textMuted">
                  Use commas for multiple skin types.
                </span>
              </label>
              <label className="space-y-2 text-sm font-medium">
                Skin or hair concerns
                <input
                  {...register("concerns")}
                  className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Acne, dark spots, frizz"
                />
                <span className="text-xs text-brand-textMuted">
                  Example: dark spots, redness, dullness.
                </span>
              </label>
              <label className="space-y-2 text-sm font-medium">
                Shade
                <input
                  {...register("shade")}
                  className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Warm Beige 240"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Undertone
                <input
                  {...register("undertone")}
                  className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Warm, cool, neutral, olive"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Finish
                <input
                  {...register("finish")}
                  className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Matte, dewy, glossy"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Coverage
                <input
                  {...register("coverage")}
                  className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Sheer, medium, full"
                />
              </label>
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                Ingredients / INCI
                <textarea
                  {...register("ingredients_inci")}
                  rows={3}
                  className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Aqua, Glycerin, Niacinamide..."
                />
                <span className="text-xs text-brand-textMuted">
                  Plain-language validation: missing ingredients can block trust
                  and allergy filtering.
                </span>
              </label>
              <label className="space-y-2 text-sm font-medium sm:col-span-2">
                Claims
                <input
                  {...register("claims")}
                  className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  placeholder="Vegan, cruelty-free, SPF 50, dermatologist-tested"
                />
                <span className="text-xs text-brand-textMuted">
                  Only add claims the business can support with evidence.
                </span>
              </label>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                {...register("is_featured")}
                type="checkbox"
                value="1"
                defaultChecked={product?.is_featured === 1}
                className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
              />
              Featured product
            </label>

            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                {...register("track_inventory")}
                type="checkbox"
                value="1"
                defaultChecked={product?.track_inventory !== 0}
                className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
              />
              Track inventory
            </label>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Images</p>
              <div className="flex flex-wrap gap-3">
                {images.map((img) => (
                  <div key={img.id} className="group relative h-20 w-20">
                    <NextImage
                      src={img.url}
                      alt={img.alt_text ?? "Product"}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-xl object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => handleImageDelete(img.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-admin-error text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X size={12} />
                    </button>
                    {img.is_primary === 1 && (
                      <span className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-brand-primary/80 text-center text-[9px] font-bold uppercase text-white">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-brand-border transition hover:border-brand-primary hover:bg-brand-primary/5">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading ? (
                    <span className="text-xs text-brand-textMuted">
                      Uploading...
                    </span>
                  ) : (
                    <Upload size={20} className="text-brand-textMuted" />
                  )}
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-brand-border px-6 py-2 text-sm font-medium text-brand-textPrimary hover:bg-brand-bgLight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-press rounded-full bg-brand-primary px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Update product"
                  : "Create product"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
