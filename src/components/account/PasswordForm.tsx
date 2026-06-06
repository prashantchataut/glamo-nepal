"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFirebaseConfigured || !auth) {
      toast.error("Authentication is not available. Please try again later.");
      return;
    }

    if (!auth.currentUser) {
      toast.error("Please sign in to change your password.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr.code === "auth/wrong-password" || firebaseErr.code === "auth/invalid-credential") {
        toast.error("Current password is incorrect.");
      } else if (firebaseErr.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else if (firebaseErr.code === "auth/requires-recent-login") {
        toast.error("Please sign out and sign back in before changing your password.");
      } else {
        toast.error(firebaseErr.message || "Failed to change password.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <form onSubmit={submit} className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm md:p-8">
        <h1 className="font-display text-3xl font-semibold text-brand-textPrimary">Change password</h1>
        <p className="mt-2 text-sm leading-6 text-brand-textMuted">
          Update your password to keep your account secure. You&apos;ll need to enter your current password to confirm the change.
        </p>

        <div className="mt-6 grid gap-5">
          <label className="text-sm font-semibold text-brand-textPrimary">
            Current password
            <div className="relative mt-2">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
                required
                autoComplete="current-password"
                className="w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-brand-primary/25"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textMuted hover:text-brand-textPrimary"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="text-sm font-semibold text-brand-textPrimary">
            New password
            <div className="relative mt-2">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-brand-primary/25"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textMuted hover:text-brand-textPrimary"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="text-sm font-semibold text-brand-textPrimary">
            Confirm new password
            <div className="relative mt-2">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-brand-primary/25"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textMuted hover:text-brand-textPrimary"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-7 rounded-full bg-brand-primary px-8 py-3 font-semibold text-white transition hover:bg-brand-bgDark disabled:opacity-60"
        >
          {isSaving ? "Changing password..." : "Change password"}
        </button>
      </form>

      <aside className="rounded-[2rem] border border-border/70 bg-brand-bgDark p-6 text-white shadow-sm md:p-8">
        <ShieldCheck className="text-brand-gold" size={32} />
        <h2 className="mt-4 font-display text-3xl font-semibold">Security tips</h2>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75">
          <li>Use a strong password with at least 8 characters, including numbers and symbols.</li>
          <li>Never share your password or verification codes with anyone.</li>
          <li>If you suspect unauthorized access, change your password immediately.</li>
          <li>Contact GLAMO if you notice unusual activity on your account.</li>
        </ul>
      </aside>
    </div>
  );
}