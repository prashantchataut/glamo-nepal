"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type SiteSetting } from "@/lib/api/admin";
import { RefreshCw, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";


const GROUP_ORDER = ["general", "payment", "shipping", "social"] as const;
const GROUP_LABELS: Record<string, string> = {
  general: "General",
  payment: "Payment",
  shipping: "Shipping",
  social: "Social",
};

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-brand-textMuted">{message}</p>
      <button onClick={onRetry} className="btn-press mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white">
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

export function SettingsView() {
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, error, isLoading, isError, refetch } = useAdminData<SiteSetting[]>(
    useCallback(() => adminApi.getAllSettings(), [])
  );

  const saveMutation = useAdminMutation<SiteSetting[], Record<string, string>>(
    useCallback((data: Record<string, string>) => adminApi.updateSettings(data), [])
  );

  const grouped = useMemo(() => {
    if (!settings) return {};
    const groups: Record<string, SiteSetting[]> = {};
    for (const setting of settings) {
      const group = setting.group || "general";
      if (!groups[group]) groups[group] = [];
      groups[group].push(setting);
    }
    return groups;
  }, [settings]);

  useEffect(() => {
    if (settings) {
      const initial: Record<string, string> = {};
      for (const s of settings) {
        initial[s.key] = s.value;
      }
      setEditedValues(initial);
      setHasChanges(false);
    }
  }, [settings]);

  function handleChange(key: string, value: string) {
    setEditedValues((prev) => {
      const next = { ...prev, [key]: value };
      setHasChanges(Object.entries(next).some(([k, v]) => {
        const orig = settings?.find((s) => s.key === k)?.value ?? "";
        return v !== orig;
      }));
      return next;
    });
  }

  async function handleSave() {
    if (!settings) return;
    const changes: Record<string, string> = {};
    for (const s of settings) {
      if (editedValues[s.key] !== undefined && editedValues[s.key] !== s.value) {
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

  const isReadOnly = false;

  if (isError && !settings) {
    return (
      <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
        <ErrorState message={error || "Failed to load settings"} onRetry={refetch} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Store settings</h2>
          <p className="mt-0.5 text-sm text-brand-textMuted">Manage business configuration for GLAMO NEPAL.</p>
        </div>
        {!isReadOnly && hasChanges && (
          <button
            onClick={handleSave}
            disabled={saveMutation.isLoading}
            className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            <Save size={15} /> {saveMutation.isLoading ? "Saving…" : "Save changes"}
          </button>
        )}
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
                  <div key={si} className="h-20 animate-pulse rounded-xl bg-brand-bgLight" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-8">
          {GROUP_ORDER.map((groupKey) => {
            const groupItems = grouped[groupKey];
            if (!groupItems || groupItems.length === 0) return null;
            return (
              <div key={groupKey}>
                <h3 className="font-display text-lg font-semibold text-brand-textPrimary">
                  {GROUP_LABELS[groupKey] || groupKey}
                </h3>
                <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {groupItems.map((setting) => (
                    <label key={setting.id} className="space-y-2 text-sm font-medium">
                      <span className="font-label text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">
                        {setting.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      {isReadOnly ? (
                        <div className="rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm text-brand-textPrimary">
                          {setting.value || "—"}
                        </div>
                      ) : (
                        <input
                          value={editedValues[setting.key] ?? setting.value}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                          className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {Object.entries(grouped)
            .filter(([key]) => !GROUP_ORDER.includes(key as typeof GROUP_ORDER[number]))
            .map(([groupKey, items]) => (
              <div key={groupKey}>
                <h3 className="font-display text-lg font-semibold text-brand-textPrimary">
                  {GROUP_LABELS[groupKey] || groupKey.replace(/\b\w/g, (c) => c.toUpperCase())}
                </h3>
                <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {items.map((setting) => (
                    <label key={setting.id} className="space-y-2 text-sm font-medium">
                      <span className="font-label text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">
                        {setting.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      {isReadOnly ? (
                        <div className="rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm text-brand-textPrimary">
                          {setting.value || "—"}
                        </div>
                      ) : (
                        <input
                          value={editedValues[setting.key] ?? setting.value}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                          className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}