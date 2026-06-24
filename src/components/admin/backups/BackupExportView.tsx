"use client";

import { useState } from "react";
import { Download, FileArchive, Images, Package, ShieldCheck, ShoppingBag, Users } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminExportKind } from "@/lib/api/admin";

const exports: Array<{ kind: AdminExportKind; title: string; description: string; icon: typeof Package; filename: string }> = [
  { kind: "products", title: "Products", description: "Catalog, prices, stock and product status.", icon: Package, filename: "glamo-products.csv" },
  { kind: "orders", title: "Orders", description: "Order numbers, customer contact, payment status and totals.", icon: ShoppingBag, filename: "glamo-orders.csv" },
  { kind: "customers", title: "Customers", description: "Customer contacts, order count and paid total for service use.", icon: Users, filename: "glamo-customers.csv" },
  { kind: "media", title: "Media list", description: "Banner, popup, gallery and site image URLs.", icon: Images, filename: "glamo-media.csv" },
  { kind: "activity", title: "Activity history", description: "Staff/admin changes for tracing mistakes.", icon: ShieldCheck, filename: "glamo-activity.csv" },
];

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function BackupExportView() {
  const [loadingKind, setLoadingKind] = useState<AdminExportKind | null>(null);

  async function download(kind: AdminExportKind, filename: string) {
    setLoadingKind(kind);
    try {
      const blob = await adminApi.downloadExport(kind);
      saveBlob(blob, filename);
      toast.success("Export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setLoadingKind(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Backup and export center</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Download the business data owners actually need.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">Exports are CSV files for spreadsheets. Use them before large edits, stock counts, accountant handoff, support investigation or emergency recovery.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exports.map((item) => {
          const Icon = item.icon;
          const loading = loadingKind === item.kind;
          return (
            <div key={item.kind} className="rounded-[1.5rem] border border-brand-border bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-brand-primary-light p-2 text-brand-primary"><Icon size={18} /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-brand-textMuted">{item.description}</p>
                  <button onClick={() => download(item.kind, item.filename)} disabled={loadingKind !== null} className="btn-press mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                    <Download size={14} /> {loading ? "Preparing..." : "Download CSV"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
        <div className="flex gap-3">
          <FileArchive className="mt-0.5 text-brand-primary" size={18} />
          <div>
            <h3 className="font-display text-lg font-semibold">Operational safety note</h3>
            <p className="mt-1 text-sm leading-6 text-brand-textMuted">These exports do not delete or change anything. Customer exports should be handled carefully and shared only with trusted staff or accountants.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
