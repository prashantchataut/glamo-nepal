"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { customerApi } from "@/lib/api/customer";
import { GlamoApiError } from "@/lib/api/client";
import { getUserMessage } from "@/lib/api/error-handler";

export function ProfileForm() {
  const user = useAuthStore((state) => state.user);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [isFetching, setFetching] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user?.name, user?.email]);

  const fetchProfile = useCallback(async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    setFetching(true);
    setLoadError(null);
    try {
      const response = await customerApi.me();
      const profile = response.data;
      const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
      useAuthStore.getState().setUser({
        id: profile.id,
        name: fullName || profile.name || currentUser.name,
        email: profile.email || undefined,
        phone: profile.phone || currentUser.phone,
        role: "customer",
      });
    } catch (err) {
      if (err instanceof GlamoApiError && (err.code === "NETWORK_ERROR" || err.code === "API_BASE_URL_MISSING")) {
        return;
      }
      setLoadError(getUserMessage(err));
    } finally {
      setFetching(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setInitialLoading(false);
      return;
    }
    void fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = (name || user?.phone || "Glamo customer")
    .split(/\s+|@/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await useAuthStore.getState().updateProfile({ name, email });
      toast.success("Profile saved.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading && isFetching) {
    return (
      <div className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-center">
          <div className="h-20 w-20 animate-pulse rounded-full bg-brand-bgLight" />
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded-2xl bg-brand-bgLight" />
            <div className="h-4 w-64 animate-pulse rounded-2xl bg-brand-bgLight" />
          </div>
        </div>
        <div className="mt-6 space-y-5">
          <div className="h-12 animate-pulse rounded-2xl bg-brand-bgLight" />
          <div className="h-12 animate-pulse rounded-2xl bg-brand-bgLight" />
          <div className="h-12 animate-pulse rounded-2xl bg-brand-bgLight" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10 font-display text-2xl font-semibold text-brand-primary">
          {initials}
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold text-brand-textPrimary">Profile details</h2>
          <p className="mt-1 text-sm text-brand-textMuted">Keep your contact details up to date.</p>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-error/30 bg-error/5 px-4 py-3">
          <p className="text-sm text-error">Could not load your profile.</p>
          <button
            type="button"
            onClick={() => void fetchProfile()}
            className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-error underline-offset-4 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="text-sm font-semibold text-brand-textPrimary">
          Full name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSaving || isFetching}
            className="mt-2 w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <label className="text-sm font-semibold text-brand-textPrimary">
          Email (optional)
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            disabled={isSaving || isFetching}
            className="mt-2 w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <label className="text-sm font-semibold text-brand-textPrimary">
          Phone
          <input
            value={user?.phone || ""}
            readOnly
            placeholder="+977 98XXXXXXXX"
            className="mt-2 w-full cursor-not-allowed rounded-2xl border border-border bg-brand-bgLight px-4 py-3 text-brand-textMuted outline-none"
          />
        </label>
      </div>
      <button
        disabled={isSaving || isFetching}
        className="mt-7 rounded-full bg-brand-primary px-8 py-3 font-semibold text-white transition hover:bg-brand-bgDark disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}