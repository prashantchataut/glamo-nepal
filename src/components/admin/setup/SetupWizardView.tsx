"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ClipboardCheck, Image as ImageIcon, Package, Settings, Truck, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type SiteSetting } from "@/lib/api/admin";
import { useAdminData } from "@/lib/hooks/useAdminData";

const SETUP_FIELDS = [
  "site_name",
  "support_email",
  "support_phone",
  "support_whatsapp",
  "business_hours",
  "delivery_fees",
  "delivery_zones",
  "cod_enabled",
  "cod_fee",
  "free_shipping_threshold",
  "return_policy_summary",
  "shipping_policy_summary",
  "site_logo",
  "og_image",
] as const;

function valueToText(value: SiteSetting["value"]): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function Field({ label, help, value, onChange, multiline = false }: { label: string; help: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span className="font-label text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">{label}</span>
      <span className="block text-xs leading-5 text-brand-textMuted">{help}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full rounded-xl border border-brand-border px-4 py-3 font-mono text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" />
      )}
    </label>
  );
}

export function SetupWizardView() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { data: settings, isLoading, refetch } = useAdminData<SiteSetting[]>(() => adminApi.getAllSettings());
  const { data: products } = useAdminData(() => adminApi.listProducts({ limit: 100 }));
  const { data: banners } = useAdminData(() => adminApi.listAdminBanners());

  useEffect(() => {
    if (!settings) return;
    const next: Record<string, string> = {};
    for (const setting of settings) next[setting.key] = valueToText(setting.value);
    setValues(next);
  }, [settings]);

  const setupChecks = useMemo(() => {
    const productList = products?.products ?? [];
    const bannerList = (banners ?? []) as Array<{ isActive?: boolean; imageUrl?: string }>;
    const deliveryFeesOk = Boolean(values.delivery_fees && values.delivery_fees.trim().startsWith("{"));
    const deliveryZonesOk = Boolean(values.delivery_zones && values.delivery_zones.trim().startsWith("["));
    const supportOk = Boolean(values.support_phone || values.support_whatsapp || values.support_email);
    return [
      { label: "Store identity is filled", done: Boolean(values.site_name && values.site_logo), href: "/admin/settings" },
      { label: "Delivery and COD rules are configured", done: deliveryFeesOk && deliveryZonesOk && values.cod_enabled !== undefined, href: "/admin/delivery" },
      { label: "Support contacts and return policy are ready", done: supportOk && Boolean(values.return_policy_summary), href: "/admin/support" },
      { label: "At least one product exists", done: productList.length > 0, href: "/admin/products" },
      { label: "Homepage has an active banner", done: bannerList.some((b) => b.isActive && b.imageUrl), href: "/admin/content" },
    ];
  }, [banners, products, values]);

  const completed = setupChecks.filter((item) => item.done).length;
  const progress = Math.round((completed / setupChecks.length) * 100);

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function saveSetup() {
    const payload: Record<string, string> = {};
    for (const key of SETUP_FIELDS) {
      if (values[key] !== undefined) payload[key] = values[key];
    }
    setSaving(true);
    try {
      await adminApi.updateSettings(payload);
      toast.success("Setup saved");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save setup");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.38fr] lg:items-center">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Owner setup</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Make the store manageable without code.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">This wizard covers the settings a non-technical owner needs before taking real orders: identity, delivery, COD, support, homepage content and catalog readiness.</p>
          </div>
          <div className="rounded-[1.5rem] bg-brand-bgLight p-5">
            <div className="flex items-center justify-between text-sm font-semibold"><span>Setup progress</span><span>{progress}%</span></div>
            <div className="mt-3 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-brand-primary" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-xs text-brand-textMuted">{completed} of {setupChecks.length} essentials complete.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {setupChecks.map((item) => (
          <Link key={item.label} href={item.href} className="rounded-[1.5rem] border border-brand-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {item.done ? <CheckCircle2 className="text-admin-success" size={18} /> : <Circle className="text-brand-textMuted" size={18} />}
            <p className="mt-3 text-sm font-semibold text-brand-textPrimary">{item.label}</p>
            <p className="mt-1 text-xs text-brand-textMuted">{item.done ? "Ready" : "Needs attention"}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold">Guided setup fields</h3>
            <p className="mt-1 text-sm text-brand-textMuted">Plain-language defaults. Advanced settings remain available in Settings.</p>
          </div>
          <button onClick={saveSetup} disabled={saving || isLoading} className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            <ClipboardCheck size={16} /> {saving ? "Saving..." : "Save setup"}
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-brand-border p-4">
            <div className="mb-4 flex items-center gap-2"><Settings size={17} className="text-brand-primary" /><h4 className="font-display text-lg font-semibold">Store basics</h4></div>
            <div className="grid gap-4">
              <Field label="Store name" help="Shown in admin, metadata and customer messages." value={values.site_name ?? ""} onChange={(v) => update("site_name", v)} />
              <Field label="Logo URL" help="Paste a URL or upload from Settings → Site images." value={values.site_logo ?? ""} onChange={(v) => update("site_logo", v)} />
              <Field label="Default share image URL" help="Image used when a page is shared on WhatsApp, Facebook or search previews." value={values.og_image ?? ""} onChange={(v) => update("og_image", v)} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-brand-border p-4">
            <div className="mb-4 flex items-center gap-2"><Truck size={17} className="text-brand-primary" /><h4 className="font-display text-lg font-semibold">Delivery and COD</h4></div>
            <div className="grid gap-4">
              <Field label="Delivery fees JSON" help='Example: {"kathmandu_valley":100,"outside_valley":0,"free_above":2500}' value={values.delivery_fees ?? ""} onChange={(v) => update("delivery_fees", v)} multiline />
              <Field label="Delivery zones JSON" help='Example: [{"name":"Kathmandu Valley","fee":100,"cod":true,"estimate":"1-3 business days"}]' value={values.delivery_zones ?? ""} onChange={(v) => update("delivery_zones", v)} multiline />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="COD fee" help="Keep this simple; set 0 if there is no extra fee." value={values.cod_fee ?? "0"} onChange={(v) => update("cod_fee", v)} />
                <Field label="Free delivery above" help="Order total in NPR that unlocks free delivery." value={values.free_shipping_threshold ?? "0"} onChange={(v) => update("free_shipping_threshold", v)} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-brand-border p-4">
            <div className="mb-4 flex items-center gap-2"><Wand2 size={17} className="text-brand-primary" /><h4 className="font-display text-lg font-semibold">Support defaults</h4></div>
            <div className="grid gap-4">
              <Field label="Support email" help="Used by the support desk and customer-facing contact blocks." value={values.support_email ?? ""} onChange={(v) => update("support_email", v)} />
              <Field label="Support phone" help="Human-readable phone number for calls." value={values.support_phone ?? ""} onChange={(v) => update("support_phone", v)} />
              <Field label="WhatsApp number" help="Use international format without spaces for WhatsApp links." value={values.support_whatsapp ?? ""} onChange={(v) => update("support_whatsapp", v)} />
              <Field label="Return policy summary" help="Plain explanation staff can use when talking to customers." value={values.return_policy_summary ?? ""} onChange={(v) => update("return_policy_summary", v)} multiline />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-brand-border p-4">
            <div className="mb-4 flex items-center gap-2"><ImageIcon size={17} className="text-brand-primary" /><h4 className="font-display text-lg font-semibold">Next owner actions</h4></div>
            <div className="grid gap-3">
              <Link href="/admin/content" className="rounded-xl border border-brand-border p-4 text-sm font-semibold hover:bg-brand-bgLight">Open visual homepage editor</Link>
              <Link href="/admin/popups" className="rounded-xl border border-brand-border p-4 text-sm font-semibold hover:bg-brand-bgLight">Create a popup campaign</Link>
              <Link href="/admin/products" className="rounded-xl border border-brand-border p-4 text-sm font-semibold hover:bg-brand-bgLight">Fix product readiness</Link>
              <Link href="/admin/backups" className="rounded-xl border border-brand-border p-4 text-sm font-semibold hover:bg-brand-bgLight">Download backups</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
