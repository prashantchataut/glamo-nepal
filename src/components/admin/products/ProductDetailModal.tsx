"use client";

import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminApi } from "@/lib/api/admin";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { formatNPR } from "@/lib/utils";
import { StatusPill, stockStatusToVariant } from "@/components/admin/shared/StatusPill";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { Package, Tag, DollarSign, BarChart3, Image as ImageIcon, Upload, X, Plus, Trash2, Pencil } from "lucide-react";
import NextImage from "next/image";
import { toast } from "sonner";
import { useAdminMutation } from "@/lib/hooks/useAdminData";

function getStockStatus(quantity: number, threshold: number): string {
  if (quantity <= 0) return "out of stock";
  if (quantity <= threshold) return "low stock";
  if (quantity <= threshold * 1.5) return "watch";
  return "healthy";
}

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
}

export function ProductDetailModal({ open, onOpenChange, productId }: ProductDetailModalProps) {
  const { data: product, isLoading, error, refetch } = useAdminData(
    useCallback(
      () => adminApi.getProduct(productId!),
      [productId],
    ),
    { enabled: !!productId && open },
  );

  const [uploading, setUploading] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<{ id: string; name: string; price: number; salePrice: string; stockQuantity: string } | null>(null);
  const [addingVariant, setAddingVariant] = useState(false);
  const [newVariant, setNewVariant] = useState({ name: "", price: "", stockQuantity: "0" });

  const deleteVariantMutation = useAdminMutation(
    useCallback(
      (params: { productId: string; variantId: string }) => adminApi.deleteVariant(params.productId, params.variantId),
      [],
    ),
  );

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !productId) return;
    setUploading(true);
    try {
      await adminApi.uploadProductImage(productId, file);
      toast.success("Image uploaded");
      refetch();
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [productId, refetch]);

  const handleImageDelete = useCallback(async () => {
    if (!deleteImageId || !productId) return;
    try {
      await adminApi.deleteProductImage(productId, deleteImageId);
      toast.success("Image removed");
      setDeleteImageId(null);
      refetch();
    } catch {
      toast.error("Failed to remove image");
    }
  }, [deleteImageId, productId, refetch]);

  const handleAddVariant = useCallback(async () => {
    if (!productId || !newVariant.name || !newVariant.price) return;
    try {
      await adminApi.addVariant(productId, {
        name: newVariant.name,
        price: Number(newVariant.price),
        stockQuantity: Number(newVariant.stockQuantity) || 0,
      });
      toast.success("Variant added");
      setAddingVariant(false);
      setNewVariant({ name: "", price: "", stockQuantity: "0" });
      refetch();
    } catch {
      toast.error("Failed to add variant");
    }
  }, [productId, newVariant, refetch]);

  const handleUpdateVariant = useCallback(async () => {
    if (!productId || !editingVariant) return;
    try {
      await adminApi.updateVariant(productId, editingVariant.id, {
        name: editingVariant.name,
        price: Number(editingVariant.price),
        salePrice: editingVariant.salePrice ? Number(editingVariant.salePrice) : null,
        stockQuantity: Number(editingVariant.stockQuantity),
      });
      toast.success("Variant updated");
      setEditingVariant(null);
      refetch();
    } catch {
      toast.error("Failed to update variant");
    }
  }, [productId, editingVariant, refetch]);

  const handleDeleteVariant = useCallback(async () => {
    if (!deleteVariantId || !productId) return;
    try {
      await deleteVariantMutation.mutate({ productId, variantId: deleteVariantId });
      toast.success("Variant deleted");
      setDeleteVariantId(null);
      refetch();
    } catch {
      toast.error("Failed to delete variant");
    }
  }, [deleteVariantId, productId, deleteVariantMutation, refetch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package size={18} />
            {product ? product.name : "Product details"}
          </DialogTitle>
          <DialogDescription>
            {product ? `SKU: ${product.sku || "N/A"}` : "Loading product details..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-brand-bgLight" />
            ))}
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <p className="text-sm text-admin-error">{error}</p>
            <button onClick={refetch} className="mt-2 text-sm font-medium text-brand-primary hover:underline">
              Try again
            </button>
          </div>
        )}

        {product && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill variant={product.is_active ? "success" : "neutral"}>
                {product.is_active ? "Active" : "Inactive"}
              </StatusPill>
              {product.is_featured === 1 && (
                <StatusPill variant="info">Featured</StatusPill>
              )}
              <StatusPill variant={stockStatusToVariant(getStockStatus(product.stock_quantity, product.low_stock_threshold))}>
                {getStockStatus(product.stock_quantity, product.low_stock_threshold)}
              </StatusPill>
            </div>

            {product.images && product.images.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ImageIcon size={14} /> Images ({product.images.length})
                </h3>
                <div className="mt-2 flex flex-wrap gap-3">
                  {product.images.map((img) => (
                    <div key={img.id} className="group relative h-24 w-24">
                      <NextImage
                        src={img.url}
                        alt={img.alt_text || product.name}
                        width={96}
                        height={96}
                        className={`h-24 w-24 rounded-xl object-cover ${img.is_primary ? "ring-2 ring-brand-primary" : ""}`}
                        unoptimized
                      />
                      <button
                        onClick={() => setDeleteImageId(img.id)}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-admin-error text-white opacity-0 transition group-hover:opacity-100"
                        aria-label="Delete image"
                      >
                        <X size={12} />
                      </button>
                      {img.is_primary === 1 && (
                        <span className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-brand-primary/80 text-center text-[9px] font-bold uppercase text-white">Primary</span>
                      )}
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-brand-border transition hover:border-brand-primary hover:bg-brand-primary/5">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    {uploading ? (
                      <span className="text-xs text-brand-textMuted">Uploading...</span>
                    ) : (
                      <Upload size={20} className="text-brand-textMuted" />
                    )}
                  </label>
                </div>
              </div>
            )}

            {(!product.images || product.images.length === 0) && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ImageIcon size={14} /> Images
                </h3>
                <label className="mt-2 flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-brand-border transition hover:border-brand-primary hover:bg-brand-primary/5">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading ? (
                    <span className="text-xs text-brand-textMuted">Uploading...</span>
                  ) : (
                    <Upload size={20} className="text-brand-textMuted" />
                  )}
                </label>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-brand-border p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-brand-textMuted">
                  <DollarSign size={14} /> Pricing
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-textMuted">Base price</span>
                    <span className="font-semibold">{formatNPR(product.base_price)}</span>
                  </div>
                  {product.sale_price != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-textMuted">Sale price</span>
                      <span className="font-semibold text-admin-success">{formatNPR(product.sale_price)}</span>
                    </div>
                  )}
                  {product.cost_price != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-textMuted">Cost price</span>
                      <span>{formatNPR(product.cost_price)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-brand-border p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-brand-textMuted">
                  <BarChart3 size={14} /> Inventory
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-textMuted">Stock</span>
                    <span className="font-semibold">{product.stock_quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-textMuted">Low stock threshold</span>
                    <span>{product.low_stock_threshold}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-textMuted">Track inventory</span>
                    <span>{product.track_inventory ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-textMuted">Digital</span>
                    <span>{product.is_digital ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-brand-border p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-brand-textMuted">
                <Tag size={14} /> Details
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-textMuted">Category</span>
                  <span>{product.category?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-textMuted">Brand</span>
                  <span>{product.brand?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-textMuted">Slug</span>
                  <span className="font-mono text-xs">{product.slug}</span>
                </div>
                {product.tags && (
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-textMuted">Tags</span>
                    <span>{product.tags}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-brand-textMuted">Created</span>
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {product.description && (
              <div className="rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-semibold">Description</h3>
                <p className="mt-2 text-sm text-brand-textMuted whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold">Variants ({product.variants.length})</h3>
                <div className="mt-2 space-y-2">
                  {product.variants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-xl border border-brand-border p-3">
                      <div>
                        <p className="text-sm font-medium">{v.name}</p>
                        {v.sku && <p className="text-xs text-brand-textMuted">SKU: {v.sku}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatNPR(v.price)}</p>
                        {v.sale_price != null && <p className="text-xs text-admin-success">{formatNPR(v.sale_price)}</p>}
                        <p className="text-xs text-brand-textMuted">Stock: {v.stock_quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.meta_title && (
              <div className="rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-semibold">SEO</h3>
                <div className="mt-2 space-y-1 text-sm">
                  {product.meta_title && (
                    <div className="flex justify-between">
                      <span className="text-brand-textMuted">Meta title</span>
                      <span className="max-w-[300px] truncate">{product.meta_title}</span>
                    </div>
                  )}
                  {product.meta_description && (
                    <p className="text-brand-textMuted">{product.meta_description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>

      <ConfirmDialog
        open={deleteImageId !== null}
        onOpenChange={(v) => { if (!v) setDeleteImageId(null); }}
        title="Delete image"
        description="Are you sure you want to remove this image? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleImageDelete}
      />
    </Dialog>
  );
}