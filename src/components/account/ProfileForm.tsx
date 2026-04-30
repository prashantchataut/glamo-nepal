"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MOCK_USER } from "@/lib/mock/users";

export function ProfileForm() {
  const [name, setName] = useState(MOCK_USER.name);
  const [phone, setPhone] = useState(MOCK_USER.phone);
  const [birthday, setBirthday] = useState("1998-01-01");
  const [skinType, setSkinType] = useState("Combination");
  const [isSaving, setSaving] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      toast.success("Mock profile saved. Connect customer API before production.");
    }, 500);
  };

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10 font-serif text-2xl font-semibold text-brand-primary">
          {name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
        </div>
        <div>
          <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Profile details</h2>
          <p className="mt-1 text-sm text-brand-textMuted">Keep customer profile fields ready for backend customer APIs.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="text-sm font-semibold text-brand-textPrimary">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/25" /></label>
        <label className="text-sm font-semibold text-brand-textPrimary">Email<input value={MOCK_USER.email} readOnly className="mt-2 w-full cursor-not-allowed rounded-2xl border border-border bg-brand-bgLight px-4 py-3 text-brand-textMuted outline-none" /></label>
        <label className="text-sm font-semibold text-brand-textPrimary">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/25" /></label>
        <label className="text-sm font-semibold text-brand-textPrimary">Birthday<input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/25" /></label>
        <label className="text-sm font-semibold text-brand-textPrimary md:col-span-2">Beauty profile<select value={skinType} onChange={(event) => setSkinType(event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/25"><option>Oily</option><option>Dry</option><option>Combination</option><option>Sensitive</option><option>Acne-Prone</option></select></label>
      </div>
      <button disabled={isSaving} className="mt-7 rounded-full bg-brand-primary px-8 py-3 font-semibold text-white transition hover:bg-brand-bgDark disabled:opacity-60">
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
