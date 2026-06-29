"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type SiteSetting } from "@/lib/api/admin";
import { RefreshCw, Save, ShieldAlert, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import NextImage from "next/image";

const GROUP_ORDER = [
  "general",
  "media",
  "discovery",
  "shipping",
  "payment",
  "inventory",
  "reviews",
  "operations",
  "support",
  "content",
  "social",
] as const;
const GROUP_LABELS: Record<string, string> = {
  general: "General",
  media: "Site images",
  discovery: "SEO, GEO, AIO, AEO & LLMO",
  payment: "Payment",
  shipping: "Delivery",
  inventory: "Inventory",
  reviews: "Reviews",
  operations: "Operations",
  support: "Support",
  content: "Homepage content",
  social: "Social",
};

const IMAGE_KEYS = new Set(["site_logo", "site_favicon", "og_image", "logo"]);

function settingToText(value: SiteSetting["value"]): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value, null, 2);
}

const MULTILINE_KEYS = new Set([
  "delivery_fees",
  "announcement_texts",
  "contact_info",
  "seo_description",
  "ai_store_summary",
  "llms_txt",
  "robots_extra",
  "nepali_delivery_notice",
  "delivery_zones",
  "support_response_templates",
  "return_policy_summary",
  "shipping_policy_summary",
]);
const BOOLEAN_KEYS = new Set([
  "maintenance_mode",
  "review_auto_approve",
  "store_pickup_enabled",
  "cod_enabled",
]);

const HELP_TEXT: Record<string, string> = {
  site_logo: "Used for header branding and structured data where supported.",
  site_favicon: "Browser tab icon. Upload a square PNG/SVG/ICO.",
  og_image:
    "Default share image for Facebook, WhatsApp, Google and AI answer previews.",
  seo_title: "Default homepage/search result title.",
  seo_description:
    "Default search and answer-engine summary. Keep it plain and specific to Nepal.",
  meta_keywords:
    "Optional internal keywords for Nepal beauty searches and merchandising.",
  ai_store_summary: "Plain summary used for answer engines and AI crawlers.",
  llms_txt: "Public /llms.txt content for LLM-friendly site context.",
  delivery_fees: 'JSON. Example: {"kathmandu_valley":100,"free_above":2500}',
  cod_fee:
    "Cash on Delivery fee in NPR. Keep simple; checkout also survives older DBs without cod_fee.",
};

function isImageKey(key: string): boolean {
  return (
    IMAGE_KEYS.has(key) ||
    key.includes("logo") ||
    key.includes("favicon") ||
    key.includes("og_image") ||
    key.includes("icon")
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-brand-textMuted">{message}</p>
      <button
        onClick={onRetry}
        className="btn-press mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-neutral-50"
      >
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

function SettingsField({
  setting,
  value,
  onChange,
  onImageUpload,
  uploading,
  isReadOnly,
}: {
  setting: SiteSetting;
  value: string;
  onChange: (key: string, value: string) => void;
  onImageUpload: (key: string, file: File) => void;
  uploading: boolean;
  isReadOnly: boolean;
}) {
  const isImage = isImageKey(setting.key);
  const label = setting.key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const help = HELP_TEXT[setting.key];
  const isBoolean = BOOLEAN_KEYS.has(setting.key);
  const isMultiline = MULTILINE_KEYS.has(setting.key);

  if (isImage) {
    return (
      <label className="space-y-2 text-sm font-medium">
        <span className="text-xs font-semibold text-brand-textMuted text-brand-textMuted">
          {label}
        </span>
        {help && (
          <span className="block text-xs leading-5 text-brand-textMuted">
            {help}
          </span>
        )}
        {isReadOnly ? (
          <div className="rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm text-brand-textPrimary">
            {value || "-"}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {value && (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-brand-border bg-brand-bgLight">
                <NextImage
                  src={value}
                  alt={label}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2">
              <input
                value={value}
                onChange={(e) => onChange(setting.key, e.target.value)}
                placeholder="Image URL or upload"
                className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
              <div className="flex items-center gap-2">
                <label className="btn-press inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-textPrimary transition hover:bg-brand-bgLight">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImageUpload(setting.key, file);
                    }}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Upload size={12} />
                  )}
                  Upload
                </label>
                {value && (
                  <button
                    onClick={() => onChange(setting.key, "")}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-admin-error transition hover:bg-admin-error-light"
                  >
                    <X size={12} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </label>
    );
  }

  return (
    <label className="space-y-2 text-sm font-medium">
      <span className="text-xs font-semibold text-brand-textMuted text-brand-textMuted">
        {label}
      </span>
      {help && (
        <span className="block text-xs leading-5 text-brand-textMuted">
          {help}
        </span>
      )}
      {isReadOnly ? (
        <div className="rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm text-brand-textPrimary">
          {value || "-"}
        </div>
      ) : isBoolean ? (
        <select
          value={value === "true" ? "true" : "false"}
          onChange={(e) => onChange(setting.key, e.target.value)}
          className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      ) : isMultiline ? (
        <textarea
          value={value}
          rows={setting.key === "llms_txt" ? 8 : 4}
          onChange={(e) => onChange(setting.key, e.target.value)}
          className="w-full rounded-xl border border-brand-border px-4 py-3 font-mono text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(setting.key, e.target.value)}
          className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
        />
      )}
    </label>
  );
}

export function SettingsView() {
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const {
    data: settings,
    error,
    isLoading,
    isError,
    refetch,
  } = useAdminData<SiteSetting[]>(
    useCallback(() => adminApi.getAllSettings(), []),
  );

  const saveMutation = useAdminMutation<{ message: string }, Record<string, string>>(
    useCallback(
      (data: Record<string, string>) => adminApi.updateSettings(data),
      [],
    ),
  );

  const grouped = useMemo(() => {
    if (!settings) return {};
    const groups: Record<string, SiteSetting[]> = {};
    for (const setting of settings) {
      const group = setting.group || setting.groupName || "general";
      if (!groups[group]) groups[group] = [];
      groups[group].push(setting);
    }
    return groups;
  }, [settings]);

  useEffect(() => {
    if (settings) {
      const initial: Record<string, string> = {};
      for (const s of settings) {
        initial[s.key] = settingToText(s.value);
      }
      setEditedValues(initial);
      setHasChanges(false);
    }
  }, [settings]);

  function handleChange(key: string, value: string) {
    setEditedValues((prev) => {
      const next = { ...prev, [key]: value };
      setHasChanges(
        Object.entries(next).some(([k, v]) => {
          const orig = settings?.find((s) => s.key === k)?.value;
          return v !== settingToText(orig ?? "");
        }),
      );
      return next;
    });
  }

  async function handleSave() {
    if (!settings) return;
    const changes: Record<string, string> = {};
    for (const s of settings) {
      if (
        editedValues[s.key] !== undefined &&
        editedValues[s.key] !== settingToText(s.value)
      ) {
        changes[s.key] = editedValues[s.key];
      }
    }
    if (Object.keys(changes).length === 0) {
      toast.info("No changes to save.");
      return;
    }
    const result = await saveMutation.mutate(changes);
    if (result) {
      toast.success("Settings saved successfully.");
      setHasChanges(false);
      refetch();
    } else {
      toast.error(saveMutation.error || "Failed to save settings.");
    }
  }

  async function handleImageUpload(key: string, file: File) {
    setUploadingKey(key);
    try {
      const result = await adminApi.uploadSettingImage(file);
      handleChange(key, result.data.url);
      toast.success("Image uploaded. Save to apply.");
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setUploadingKey(null);
    }
  }

  const isReadOnly = false;

  if (isError && !settings) {
    return (
      <section className="rounded-[1.5rem] border border-brand-border bg-white p-5 shadow-sm">
        <ErrorState
          message={error || "Failed to load settings"}
          onRetry={refetch}
        />
      </section>
    );
  }

  const orderedGroups = GROUP_ORDER.filter((g) => grouped[g]?.length);
  const otherGroups = Object.entries(grouped).filter(
    ([key]) => !GROUP_ORDER.includes(key as (typeof GROUP_ORDER)[number]),
  );

  return (
    <section className="rounded-[1.5rem] border border-brand-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            Store settings
          </h2>
          <p className="mt-0.5 text-sm text-brand-textMuted">
            Manage business configuration for GLAMO NEPAL. Edit any field and Save to apply across the storefront, checkout, admin and emails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`hidden text-xs font-semibold sm:inline ${
              hasChanges ? "text-amber-700" : "text-brand-textMuted"
            }`}
            aria-live="polite"
          >
            {hasChanges ? "Unsaved changes" : "All changes saved"}
          </span>
          <button
            onClick={handleSave}
            disabled={saveMutation.isLoading || !hasChanges}
            className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-medium text-neutral-50 transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={15} />{" "}
            {saveMutation.isLoading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-brand-border bg-brand-bgLight p-4 text-xs leading-5 text-brand-textMuted sm:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-brand-textPrimary">
            {Object.values(grouped).reduce((acc, items) => acc + items.length, 0)} settings
          </p>
          <p className="mt-1">
            Across {Object.keys(grouped).length} categories: branding, SEO, delivery, payment, inventory, reviews, support and more.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-textPrimary">
            Where changes apply
          </p>
          <p className="mt-1">
            Header, footer, checkout, payment gateway config, customer support replies, AI/LLM snippets and the audit log.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-textPrimary">
            Saving
          </p>
          <p className="mt-1">
            Edits stay local until you click <strong>Save changes</strong>. The status above the button reflects the dirty state in real time.
          </p>
        </div>
      </div>

      {isReadOnly && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-admin-info-light p-3 text-sm text-admin-info">
          <ShieldAlert size={16} />
          You have view-only access. Only Super Admins can modify settings.
        </div>
      )}

      {isLoading ? (
        <div className="mt-5 space-y-6">
          {Array.from({ length: 3 }).map((_, gi) => (
            <div key={gi}>
              <div className="h-5 w-24 animate-pulse rounded bg-brand-border/50" />
              <div className="mt-3 grid gap-3 grid-cols-2">
                {Array.from({ length: 4 }).map((_, si) => (
                  <div
                    key={si}
                    className="h-20 animate-pulse rounded-xl bg-brand-bgLight"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-8">
          {orderedGroups.map((groupKey) => {
            const groupItems = grouped[groupKey];
            return (
              <div key={groupKey}>
                <h3 className="font-display text-lg font-semibold text-brand-textPrimary">
                  {GROUP_LABELS[groupKey] || groupKey}
                </h3>
                <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {groupItems.map((setting) => (
                    <SettingsField
                      key={setting.id}
                      setting={setting}
                      value={
                        editedValues[setting.key] ??
                        settingToText(setting.value)
                      }
                      onChange={handleChange}
                      onImageUpload={handleImageUpload}
                      uploading={uploadingKey === setting.key}
                      isReadOnly={isReadOnly}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {otherGroups.map(([groupKey, items]) => (
            <div key={groupKey}>
              <h3 className="font-display text-lg font-semibold text-brand-textPrimary">
                {GROUP_LABELS[groupKey] ||
                  groupKey.replace(/\b\w/g, (c) => c.toUpperCase())}
              </h3>
              <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
                {items.map((setting) => (
                  <SettingsField
                    key={setting.id}
                    setting={setting}
                    value={
                      editedValues[setting.key] ?? settingToText(setting.value)
                    }
                    onChange={handleChange}
                    onImageUpload={handleImageUpload}
                    uploading={uploadingKey === setting.key}
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
