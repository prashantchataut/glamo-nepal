/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useMemo, useState } from "react";
import NextImage from "next/image";
import {
  Download,
  Eye,
  Pencil,
  Plus,
  Trash2,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { formatNPR } from "@/lib/utils";
import { StatusPill, stockStatusToVariant } from "@/components/admin/shared/StatusPill";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import {
  useProducts,
  useDeleteProduct,
  useToggleProductVisibility,
} from "@/lib/hooks/useConvexQueries";
import { useAdminStore } from "@/store/useAdminStore";
import { ProductFormModal } from "@/components/admin/products/ProductForm";
import { ProductDetailModal } from "@/components/admin/products/ProductDetailModal";
import type { Id } from "convex/_generated/dataModel";

const PAGE_SIZE = 20;

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  base_price: number;
  sale_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  brand: { name: string } | null;
  category: { name: string } | null;
  images: { url: string; is_primary: boolean }[];
}

export function ProductsView() {
  const { productSearch, setProductSearch } = useAdminStore();
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const productsData = useProducts({
    page,
    limit: PAGE_SIZE,
    search: productSearch || undefined,
  });

  const deleteProduct = useDeleteProduct();
  const toggleVisibility = useToggleProductVisibility();

  const products: ProductRow[] = useMemo(() => {
    if (!productsData) return [];
    if (Array.isArray(productsData)) return productsData as ProductRow[];
    return ((productsData as Record<string, unknown>).products ?? []) as ProductRow[];
  }, [productsData]);

  const total = useMemo(() => {
    if (!productsData) return 0;
    if (Array.isArray(productsData)) return productsData.length;
    return (productsData as Record<string, unknown>).total as number ?? 0;
  }, [productsData]);

  const totalPages = useMemo(() => {
    if (!productsData) return 1;
    if (Array.isArray(productsData)) return Math.max(1, Math.ceil(productsData.length / PAGE_SIZE));
    return (productsData as Record<string, unknown>).totalPages as number ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
  }, [productsData, total]);

  const isLoading = productsData === undefined;
  const error = productsData === null ? "Failed to load products" : null;

  const handleSearch = useCallback(
    (query: string) => {
      setProductSearch(query);
      setPage(1);
    },
    [setProductSearch],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteProduct({ id: deleteId as Id<"products"> });
      toast.success("Product deleted");
      setDeleteId(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
    }
  }, [deleteId, deleteProduct]);

  const handleBulkStatus = useCallback(async (isActive: boolean) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => toggleVisibility({ id: id as Id<"products"> })));
      toast.success(`${ids.length} product${ids.length > 1 ? "s" : ""} ${isActive ? "activated" : "deactivated"}`);
      setSelectedIds(new Set());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }, [selectedIds, toggleVisibility]);

  const handleExport = useCallback(() => {
    if (!products.length) return;
    const rows = [
      ["sku", "name", "brand", "category", "price_npr", "stock", "status"],
      ...products.map((p) => [
        p.sku ?? "",
        p.name,
        p.brand?.name ?? "",
        p.category?.name ?? "",
        String(p.base_price),
        String(p.stock_quantity),
        p.is_active ? "active" : "inactive",
      ]),
    ].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "glamo-products-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [products]);

  const columns: Column<ProductRow>[] = [
    {
      key: "product",
      header: "Product",
      render: (product) => (
        <div className="flex items-center gap-4">
          {product.images?.find((img) => img.is_primary)?.url ? (
            <NextImage
              src={product.images.find((img) => img.is_primary)?.url ?? ""}
              alt={product.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl bg-brand-bgLight object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-bgLight text-xs font-semibold text-brand-textMuted">
              {product.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-brand-textPrimary">{product.name}</p>
            <p className="text-xs text-brand-textMuted">{product.brand?.name ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      render: (product) => <span className="font-mono text-xs">{product.sku ?? "—"}</span>,
    },
    {
      key: "category",
      header: "Category",
      render: (product) => <span className="capitalize">{product.category?.name ?? "—"}</span>,
    },
    {
      key: "price",
      header: "Price",
      render: (product) => (
        <div>
          <span className="font-semibold">{formatNPR(product.base_price)}</span>
          {product.sale_price && product.sale_price < product.base_price && (
            <span className="ml-2 text-xs text-brand-textMuted line-through">{formatNPR(product.base_price)}</span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (product) => <span>{product.stock_quantity} pcs</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (product) => {
        const status = product.stock_quantity <= 0 ? "Out" : product.stock_quantity <= product.low_stock_threshold ? "Low" : "Active";
        return <StatusPill variant={stockStatusToVariant(status)}>{status}</StatusPill>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (product) => (
        <div className="flex gap-1">
          <button
            aria-label="View product"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-bgLight"
            onClick={() => setDetailId(product.id)}
          >
            <Eye size={15} />
          </button>
          <button
            aria-label="Edit product"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-bgLight"
            onClick={() => { setEditProduct(product); setFormOpen(true); }}
          >
            <Pencil size={15} />
          </button>
          <button
            aria-label="Delete product"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-admin-error hover:bg-admin-error-light"
            onClick={() => setDeleteId(product.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Product management</h2>
          <p className="mt-1 text-sm text-brand-textMuted">Browse, search and manage your product catalog.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            disabled={!products.length}
            className="btn-press inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary disabled:opacity-50"
          >
            <Download size={15} /> Export
          </button>
          <button
            onClick={() => { setEditProduct(null); setFormOpen(true); }}
            className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={15} /> Add product
          </button>
        </div>
      </div>

      <div className="mt-4">
        <SearchInput
          value={productSearch}
          onSearch={handleSearch}
          placeholder="Search by SKU, brand or product"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-full bg-brand-primary/10 px-4 py-2">
          <span className="text-sm font-medium text-brand-textPrimary">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => handleBulkStatus(true)}
            className="btn-press inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
          >
            <CheckSquare size={12} />
            Activate
          </button>
          <button
            onClick={() => handleBulkStatus(false)}
            className="btn-press inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-textPrimary transition hover:bg-brand-bgLight"
          >
            <Square size={12} />
            Deactivate
          </button>
          <button
            onClick={() => setBulkDeleteOpen(true)}
            className="btn-press inline-flex items-center gap-1.5 rounded-full bg-admin-error px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
          >
            <Trash2 size={12} />
            Delete
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="flex h-7 w-7 items-center justify-center rounded-full text-brand-textMuted transition hover:bg-brand-bgLight"
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={products}
          keyExtractor={(p) => p.id}
          caption="Product catalog"
          isLoading={isLoading}
          emptyMessage={error ? `Error: ${error}` : "No products found."}
          minRowWidth="900px"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(p) => setDetailId(p.id)}
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

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Delete product"
        description="This action cannot be undone. The product will be permanently removed from your catalog."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={false}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => { if (!open) setBulkDeleteOpen(false); }}
        title={`Delete ${selectedIds.size} product${selectedIds.size > 1 ? "s" : ""}`}
        description={`This action cannot be undone. ${selectedIds.size} product${selectedIds.size > 1 ? "s will be" : " will be"} permanently removed from your catalog.`}
        confirmLabel="Delete all"
        variant="destructive"
        isLoading={false}
        onConfirm={async () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); }}
      />

      <ProductFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editProduct as any}
        onSaved={() => {}}
      />

      <ProductDetailModal
        open={detailId !== null}
        onOpenChange={(open) => { if (!open) setDetailId(null); }}
        productId={detailId}
      />
    </section>
  );
}