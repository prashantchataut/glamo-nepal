"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Mail, MessageCircle, Phone, RotateCcw, ShoppingBag, UserRound } from "lucide-react";
import { adminApi, type SiteSetting } from "@/lib/api/admin";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { formatNPR } from "@/lib/utils";

type Template = { title: string; text: string };

function settingText(settings: SiteSetting[] | null, key: string): string {
  const value = settings?.find((s) => s.key === key)?.value;
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return JSON.stringify(value);
}

function templates(settings: SiteSetting[] | null): Template[] {
  const raw = settings?.find((s) => s.key === "support_response_templates")?.value;
  if (Array.isArray(raw)) return raw.filter(Boolean).map((item) => ({ title: String((item as Record<string, unknown>).title ?? "Template"), text: String((item as Record<string, unknown>).text ?? "") }));
  return [];
}

export function SupportDeskView() {
  const { data: settings } = useAdminData<SiteSetting[]>(() => adminApi.getAllSettings());
  const { data: orders, isLoading: ordersLoading } = useAdminData(() => adminApi.listOrders({ limit: 8 }));
  const { data: customers } = useAdminData(() => adminApi.listUsers({ role: "CUSTOMER", limit: 8 }));
  const { data: returns } = useAdminData(() => adminApi.listReturns({ limit: 8 }));

  const supportEmail = settingText(settings, "support_email") || "support@glamonepal.com";
  const supportPhone = settingText(settings, "support_phone");
  const whatsapp = settingText(settings, "support_whatsapp").replace(/[^0-9]/g, "");
  const savedTemplates = templates(settings);
  const returnList = Array.isArray(returns) ? returns : [];
  const customerList = customers?.users ?? [];
  const orderList = orders?.orders ?? [];

  const pendingReturns = useMemo(() => returnList.filter((item) => !["CLOSED", "REJECTED", "REFUNDED", "EXCHANGED"].includes(item.status)), [returnList]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Customer support desk</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Help customers without hunting through the admin.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">Recent orders, returns, customers and saved reply templates in one place. This is practical support, not a ticketing gimmick.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={`mailto:${supportEmail}`} className="btn-press inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-bold text-brand-primary"><Mail size={15} /> Email</a>
          {supportPhone ? <a href={`tel:${supportPhone}`} className="btn-press inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-bold text-brand-primary"><Phone size={15} /> Call</a> : null}
          {whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white"><MessageCircle size={15} /> WhatsApp</a> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-brand-border bg-white p-5 shadow-sm"><ShoppingBag className="text-brand-primary" size={18} /><p className="mt-3 text-2xl font-semibold">{orderList.length}</p><p className="text-sm text-brand-textMuted">recent orders visible</p></div>
        <div className="rounded-[1.5rem] border border-brand-border bg-white p-5 shadow-sm"><RotateCcw className="text-brand-primary" size={18} /><p className="mt-3 text-2xl font-semibold">{pendingReturns.length}</p><p className="text-sm text-brand-textMuted">returns still open</p></div>
        <div className="rounded-[1.5rem] border border-brand-border bg-white p-5 shadow-sm"><UserRound className="text-brand-primary" size={18} /><p className="mt-3 text-2xl font-semibold">{customerList.length}</p><p className="text-sm text-brand-textMuted">recent customer profiles</p></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><h3 className="font-display text-xl font-semibold">Recent orders to help with</h3><Link href="/admin/orders" className="text-sm font-bold text-brand-primary">View all</Link></div>
          <div className="mt-4 overflow-x-auto">
            {ordersLoading ? <div className="h-40 animate-pulse rounded-xl bg-brand-bgLight" /> : (
              <table className="w-full min-w-[680px] text-sm">
                <thead><tr className="border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted"><th className="px-3 py-3">Order</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Help</th></tr></thead>
                <tbody>{orderList.map((order) => (<tr key={order.id} className="border-b border-brand-border"><td className="px-3 py-3 font-mono text-xs font-semibold">{order.order_number}</td><td className="px-3 py-3">{order.customer ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim() || order.customer.email : "Customer"}</td><td className="px-3 py-3">{order.status}</td><td className="px-3 py-3 font-semibold">{formatNPR(order.total_amount)}</td><td className="px-3 py-3"><Link href={`/admin/orders?search=${encodeURIComponent(order.order_number)}`} className="rounded-full bg-brand-primary px-3 py-2 text-xs font-bold text-white">Open</Link></td></tr>))}</tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3"><h3 className="font-display text-xl font-semibold">Open returns</h3><Link href="/admin/returns" className="text-sm font-bold text-brand-primary">View returns</Link></div>
            <div className="mt-4 space-y-3">
              {pendingReturns.length > 0 ? pendingReturns.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-brand-border p-3"><p className="text-sm font-semibold">{item.orderNumber}</p><p className="mt-1 text-xs text-brand-textMuted">{item.reason} · {item.hygieneStatus}</p></div>
              )) : <p className="text-sm text-brand-textMuted">No open returns.</p>}
            </div>
          </div>

          <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3"><h3 className="font-display text-xl font-semibold">Saved replies</h3><Link href="/admin/settings" className="text-sm font-bold text-brand-primary">Edit</Link></div>
            <div className="mt-4 space-y-3">
              {savedTemplates.length > 0 ? savedTemplates.map((template) => (
                <button key={template.title} type="button" onClick={() => navigator.clipboard?.writeText(template.text)} className="w-full rounded-xl border border-brand-border p-3 text-left transition hover:bg-brand-bgLight"><p className="text-sm font-semibold">{template.title}</p><p className="mt-1 text-xs leading-5 text-brand-textMuted">{template.text}</p><p className="mt-2 text-xs font-bold text-brand-primary">Click to copy</p></button>
              )) : <p className="text-sm text-brand-textMuted">No templates yet. Add them in Settings.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
