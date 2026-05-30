"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export function ProfileForm() {
  const user = useAuthStore((state) => state.user);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user?.name, user?.email]);

  const initials = (name || user?.phone || "Glamo customer").split(/\s+|@/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { updateProfile } = useAuthStore.getState();
      await updateProfile({ name, email });
      const error = useAuthStore.getState().error;
      if (error) toast.error(error);
      else toast.success("Profile saved.");
    } finally {
      setSaving(false);
    }
  };

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

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="text-sm font-semibold text-brand-textPrimary">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/25" /></label>
        <label className="text-sm font-semibold text-brand-textPrimary">Email (optional)<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/25" /></label>
        <label className="text-sm font-semibold text-brand-textPrimary">Phone<input value={user?.phone || ""} readOnly placeholder="+977 98XXXXXXXX" className="mt-2 w-full cursor-not-allowed rounded-2xl border border-border bg-brand-bgLight px-4 py-3 text-brand-textMuted outline-none" /></label>
      </div>
      <button disabled={isSaving} className="mt-7 rounded-full bg-brand-primary px-8 py-3 font-semibold text-white transition hover:bg-brand-bgDark disabled:opacity-60">
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}