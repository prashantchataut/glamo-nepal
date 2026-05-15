"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { useMemo, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function PasswordInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block text-sm font-semibold text-brand-textPrimary">
      {label}
      <span className="mt-2 flex items-center rounded-2xl border border-border bg-brand-bgLight px-4 transition focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20">
        <input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} required minLength={8} className="min-h-12 flex-1 bg-transparent pr-3 outline-none" />
        <button type="button" onClick={() => setVisible((current) => !current)} className="rounded-full p-1 text-brand-textMuted hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25" aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setSaving] = useState(false);

  const score = useMemo(() => {
    let value = 0;
    if (newPassword.length >= 8) value += 1;
    if (/[A-Z]/.test(newPassword)) value += 1;
    if (/[0-9]/.test(newPassword)) value += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) value += 1;
    return value;
  }, [newPassword]);
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mismatch) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    }, 600);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <form onSubmit={submit} className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm md:p-8">
        <h1 className="font-display text-3xl font-semibold text-brand-textPrimary">Change password</h1>
        <p className="mt-2 text-sm leading-6 text-brand-textMuted">Choose a strong password and keep your account details secure.</p>
        <div className="mt-7 space-y-5">
          <PasswordInput label="Current password" value={currentPassword} onChange={setCurrentPassword} />
          <div>
            <PasswordInput label="New password" value={newPassword} onChange={setNewPassword} />
            <div className="mt-2 grid grid-cols-4 gap-1" aria-label="Password strength">
              {[1, 2, 3, 4].map((item) => <span key={item} className={cn("h-1.5 rounded-full", score >= item ? "bg-brand-primary" : "bg-border")} />)}
            </div>
          </div>
          <div>
            <PasswordInput label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} />
            {mismatch ? <p className="mt-1 text-xs font-semibold text-red-600">Passwords do not match.</p> : null}
          </div>
        </div>
        <button disabled={isSaving || mismatch} className="mt-7 rounded-full bg-brand-primary px-8 py-3 font-semibold text-white transition hover:bg-brand-bgDark disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? "Updating..." : "Update password"}
        </button>
      </form>
      <aside className="rounded-[2rem] border border-border/70 bg-brand-bgDark p-6 text-white shadow-sm md:p-8">
        <ShieldCheck className="text-brand-gold" size={32} />
        <h2 className="mt-4 font-display text-3xl font-semibold">Password tips</h2>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75">
          <li>Use a unique password for your GLAMO account.</li>
          <li>Include uppercase letters, numbers and symbols.</li>
          <li>Avoid reusing passwords from other websites.</li>
          <li>Contact GLAMO if you notice unusual activity.</li>
        </ul>
      </aside>
    </div>
  );
}
