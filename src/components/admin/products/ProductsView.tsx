"use client";

import { useMemo, useState } from "react";
import NextImage from "next/image";
import {
  Download,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { PRODUCTS } from "@/lib/data/products";
import { INVENTORY_SNAPSHOT } from "@/lib/data/inventory";
import { formatNPR } from "@/lib/utils";
import { StatusPill, stockStatusToVariant } from "@/components/admin/shared/StatusPill";
import { ComingSoonTooltip } from "@/components/ui/ComingSoonTooltip";

function exportProductsCsv() {
  const rows = [
    ["sku", "name", "brand", "category", "price_npr", "stock", "status"],
    ...PRODUCTS.map((product) => [
      product.sku,
      product.name,
      product.brand,
      product.category,
      String(product.price),
      String(product.stockCount),
      product.inStock ? "active" : "out_of_stock",
    ]),
  ]
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","));
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "glamo-products-export.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ProductsView() {
  const [productQuery, setProductQuery] = useState("");
  const productSearch = productQuery.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!productSearch) return PRODUCTS;
    return PRODUCTS.filter((product) =>
      [product.name, product.brand, product.category, product.subCategory, product.sku]
        .join(" ")
        .toLowerCase()
        .includes(productSearch),
    );
  }, [productSearch]);

  return (
    <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Product management</h2>
          <p className="mt-1 text-sm text-brand-textMuted">
            Search, review and prepare SKUs for catalog APIs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ComingSoonTooltip>
            <button
              disabled
              className="btn-press inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Filter size={15} /> Filter
            </button>
          </ComingSoonTooltip>
          <button
            onClick={exportProductsCsv}
            className="btn-press inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary"
          >
            <Download size={15} /> Export
          </button>
          <ComingSoonTooltip>
            <button
              disabled
              className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={15} /> Add product
            </button>
          </ComingSoonTooltip>
        </div>
      </div>
      <div className="relative mt-4 max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-textMuted" size={16} />
        <input
          aria-label="Search products by SKU, brand or name"
          value={productQuery}
          onChange={(event) => setProductQuery(event.target.value)}
          className="w-full rounded-xl border border-brand-border bg-brand-bgLight py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          placeholder="Search by SKU, brand or product"
        />
      </div>
      <div className="mt-4 overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[900px] text-sm">
          <caption className="sr-only">Product catalog</caption>
          <thead>
            <tr className="font-label border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted">
              <th scope="col" className="px-4 py-3">Product</th>
              <th scope="col" className="px-4 py-3">SKU</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Price</th>
              <th scope="col" className="px-4 py-3">Stock</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const inventory = INVENTORY_SNAPSHOT.find(
                (item) => item.productId === product.id,
              );
              const status =
                product.stockCount <= 0
                  ? "Out"
                  : product.stockCount <= (inventory?.reorderPoint || 10)
                    ? "Low"
                    : "Active";
              return (
                <tr key={product.id} className="border-b border-brand-border/70 last:border-0">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      <NextImage
                        src={product.image}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-xl bg-brand-bgLight object-cover"
                      />
                      <div>
                        <p className="font-semibold text-brand-textPrimary">{product.name}</p>
                        <p className="text-xs text-brand-textMuted">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">{product.sku}</td>
                  <td className="px-4 py-4 capitalize">{product.category}</td>
                  <td className="px-4 py-4 font-semibold">{formatNPR(product.price)}</td>
                  <td className="px-4 py-4">{product.stockCount} pcs</td>
                  <td className="px-4 py-4">
                    <StatusPill variant={stockStatusToVariant(status)}>{status}</StatusPill>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      <ComingSoonTooltip>
                        <button
                          disabled
                          aria-label="View product"
                          className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-bgLight disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Eye size={15} />
                        </button>
                      </ComingSoonTooltip>
                      <ComingSoonTooltip>
                        <button
                          disabled
                          aria-label="Edit product"
                          className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-bgLight disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Pencil size={15} />
                        </button>
                      </ComingSoonTooltip>
                      <ComingSoonTooltip>
                        <button
                          disabled
                          aria-label="Delete product"
                          className="flex h-11 w-11 items-center justify-center rounded-lg text-admin-error hover:bg-admin-error-light disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={15} />
                        </button>
                      </ComingSoonTooltip>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}