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
  const [phone, setPhone] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [isFetching, setFetching] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setInitialLoading(false);
  }, [user?.name, user?.phone]);

  const fetchProfile = useCallback(async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    setFetching(true);
    setLoadError(null);
    try {
      const response = await customerApi.me();
      const profile = response.data;
      const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
      const resolvedName = fullName || profile.name || currentUser.name;
      setPhone(profile.phone || currentUser.phone || "");
      useAuthStore.getState().setUser({
        id: profile.id,
        name: resolvedName,
        email: profile.email || currentUser.email,
        phone: profile.phone || currentUser.phone,
        role: "customer",
      });
    } catch (err) {
      if (err instanceof GlamoApiError && (err.code === "NETWORK_ERROR" || err.code === "API_BASE_URL_MISSING")) {
        setLoadError(null);
        setInitialLoading(false);
        setFetching(false);
        return;
      }
      setLoadError(getUserMessage(err));
    } finally {
      setFetching(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!useAuthStore.getState().user) {
      setInitialLoading(false);
      return;
    }
    void fetchProfile();
  }, [fetchProfile]);

  const initials = (name || user?.name || "GC")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const nameParts = (name || "").trim().split(/\s+/);
      const payload: { firstName?: string; lastName?: string; phone?: string | null } = {};
      if (nameParts.length > 0) payload.firstName = nameParts[0];
      if (nameParts.length > 1) payload.lastName = nameParts.slice(1).join(" ");
      if (phone !== (user?.phone || "")) payload.phone = phone || null;

      const response = await customerApi.updateProfile(payload);
      const updated = response.data;

      useAuthStore.getState().setUser({
        id: user!.id,
        name: [updated.firstName, updated.lastName].filter(Boolean).join(" ") || name || user!.name,
        email: updated.email || user!.email,
        phone: updated.phone ?? phone,
        role: "customer",
      });

      toast.success("Profile saved.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 animate-pulse rounded-full bg-neutral-50" />
          <div className="space-y-3">
            <div className="h-6 w-40 animate-pulse rounded-xl bg-neutral-50" />
            <div className="h-4 w-56 animate-pulse rounded-xl bg-neutral-50" />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="h-14 animate-pulse rounded-2xl bg-neutral-50" />
          <div className="h-14 animate-pulse rounded-2xl bg-neutral-50" />
          <div className="h-14 animate-pulse rounded-2xl bg-neutral-50" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 font-display text-2xl font-semibold text-primary ring-1 ring-primary/10">
          {initials}
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">Profile details</h2>
          <p className="mt-1 text-sm text-neutral-500">Keep your name and phone number up to date.</p>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error/5 px-5 py-4">
          <p className="text-sm text-error">{loadError}</p>
          <button
            type="button"
            onClick={() => void fetchProfile()}
            className="shrink-0 rounded-full border border-error/25 px-4 py-1.5 text-sm font-semibold text-error transition-colors hover:bg-error/10"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="profile-name" className="block text-sm font-semibold text-neutral-500">
            Full name
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving || isFetching}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-[15px] text-neutral-900 outline-none transition-all duration-200 placeholder:text-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-email" className="block text-sm font-semibold text-neutral-500">
            Email
          </label>
          <input
            id="profile-email"
            value={user?.email || ""}
            readOnly
            className="w-full cursor-not-allowed rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3.5 text-[15px] text-neutral-500 outline-none"
            placeholder="you@example.com"
          />
          <p className="text-xs text-neutral-400">Email is linked to your account and cannot be changed here.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-phone" className="block text-sm font-semibold text-neutral-500">
            Phone
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSaving || isFetching}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-[15px] text-neutral-900 outline-none transition-all duration-200 placeholder:text-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="+977 98XXXXXXXX"
          />
        </div>
      </div>
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isSaving || isFetching}
          className="rounded-full bg-neutral-950 px-8 py-3 text-sm font-semibold text-neutral-50 transition-all duration-200 hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}
