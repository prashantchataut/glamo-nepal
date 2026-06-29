"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type SiteSetting } from "@/lib/api/admin";
import { useAdminData } from "@/lib/hooks/useAdminData";

function text(value: SiteSetting["value"]): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function Field({ label, help, value, onChange, multiline = false, type = "text" }: { label: string; help: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string }) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span className="text-xs font-semibold text-brand-textMuted text-brand-textMuted">{label}</span>
      <span className="block text-xs leading-5 text-brand-textMuted">{help}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} className="w-full rounded-xl border border-brand-border px-4 py-3 font-mono text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" />
      )}
    </label>
  );
}

export function DeliveryManagerView() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { data: settings, isLoading, refetch } = useAdminData<SiteSetting[]>(() => adminApi.getAllSettings());

  useEffect(() => {
    if (!settings) return;
    const next: Record<string, string> = {};
    for (const setting of settings) next[setting.key] = text(setting.value);
    setValues(next);
  }, [settings]);

  const checks = useMemo(() => {
    const feesValid = values.delivery_fees?.trim().startsWith("{");
    const zonesValid = values.delivery_zones?.trim().startsWith("[");
    const noticeValid = Boolean(values.nepali_delivery_notice?.trim() || values.shipping_policy_summary?.trim());
    return [
      { label: "Delivery fees are configured", done: Boolean(feesValid) },
      { label: "Delivery zones are configured", done: Boolean(zonesValid) },
      { label: "Customer delivery notice is written", done: noticeValid },
      { label: "COD status is explicit", done: values.cod_enabled === "true" || values.cod_enabled === "false" },
    ];
  }, [values]);

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    const keys = ["cod_enabled", "cod_fee", "free_shipping_threshold", "delivery_fees", "delivery_zones", "store_pickup_enabled", "nepali_delivery_notice", "shipping_policy_summary"];
    const payload: Record<string, string> = {};
    for (const key of keys) payload[key] = values[key] ?? "";
    setSaving(true);
    try {
      await adminApi.updateSettings(payload);
      toast.success("Delivery settings saved");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save delivery settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-textPrimary">Delivery manager</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Control where orders can be delivered.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">Keep COD and delivery simple. These settings are stored centrally and can be used by checkout, customer support and staff scripts.</p>
          </div>
          <button onClick={save} disabled={saving || isLoading} className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-neutral-50 disabled:opacity-50">
            <ClipboardCheck size={16} /> {saving ? "Saving..." : "Save delivery rules"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {checks.map((check) => (
          <div key={check.label} className="rounded-[1.5rem] border border-brand-border bg-white p-4 shadow-sm">
            <CheckCircle2 size={18} className={check.done ? "text-admin-success" : "text-brand-textMuted"} />
            <p className="mt-3 text-sm font-semibold">{check.label}</p>
            <p className="mt-1 text-xs text-brand-textMuted">{check.done ? "Ready" : "Needs setup"}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.5rem] border border-brand-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2"><Truck size={18} className="text-brand-primary" /><h3 className="font-display text-xl font-semibold">Fees and COD</h3></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span className="text-xs font-semibold text-brand-textMuted text-brand-textMuted">Cash on Delivery</span>
              <span className="block text-xs leading-5 text-brand-textMuted">Turn off only if checkout should stop offering COD.</span>
              <select value={values.cod_enabled === "false" ? "false" : "true"} onChange={(e) => update("cod_enabled", e.target.value)} className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10">
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span className="text-xs font-semibold text-brand-textMuted text-brand-textMuted">Store pickup</span>
              <span className="block text-xs leading-5 text-brand-textMuted">Use only if customers can pick up locally.</span>
              <select value={values.store_pickup_enabled === "true" ? "true" : "false"} onChange={(e) => update("store_pickup_enabled", e.target.value)} className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10">
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </select>
            </label>
            <Field label="COD fee" help="Informational only - the actual COD fee is now 3% of the cart subtotal, applied globally at checkout." value={values.cod_fee ?? "0"} onChange={(v) => update("cod_fee", v)} type="number" />
            <Field label="Free delivery above" help="Order total in NPR that unlocks free delivery." value={values.free_shipping_threshold ?? "0"} onChange={(v) => update("free_shipping_threshold", v)} type="number" />
            <div className="sm:col-span-2">
              <Field label="Delivery fees JSON" help='Example: {"kathmandu_valley":100,"outside_valley":0,"free_above":2500}' value={values.delivery_fees ?? ""} onChange={(v) => update("delivery_fees", v)} multiline />
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-brand-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2"><MapPin size={18} className="text-brand-primary" /><h3 className="font-display text-xl font-semibold">Delivery zones</h3></div>
          <div className="mt-5 grid gap-4">
            <Field label="Zone list JSON" help='Example: [{"name":"Kathmandu Valley","fee":100,"cod":true,"estimate":"1-3 business days"}]' value={values.delivery_zones ?? ""} onChange={(v) => update("delivery_zones", v)} multiline />
            <Field label="Customer notice" help="Plain message staff and customers can understand." value={values.nepali_delivery_notice ?? ""} onChange={(v) => update("nepali_delivery_notice", v)} multiline />
            <Field label="Shipping policy summary" help="Short policy shown in setup/support contexts." value={values.shipping_policy_summary ?? ""} onChange={(v) => update("shipping_policy_summary", v)} multiline />
            <Link href="/checkout" className="btn-press inline-flex justify-center rounded-full border border-brand-border px-4 py-3 text-sm font-bold text-brand-primary hover:bg-brand-bgLight">Test checkout as a customer</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
