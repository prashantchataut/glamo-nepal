"use client";

import { ShieldCheck, Smartphone } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function PasswordForm() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <div className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm md:p-8">
        <h1 className="font-display text-3xl font-semibold text-brand-textPrimary">Account security</h1>
        <p className="mt-2 text-sm leading-6 text-brand-textMuted">
          Your account uses phone-number verification. There is no password to change — you sign in with a code sent to your phone.
        </p>
        <div className="mt-7 rounded-[1.5rem] border border-brand-primary/20 bg-brand-primary/5 p-5">
          <div className="flex items-start gap-4">
            <Smartphone className="mt-0.5 shrink-0 text-brand-primary" size={24} />
            <div>
              <p className="font-semibold text-brand-textPrimary">Verified phone number</p>
              <p className="mt-1 text-sm text-brand-textMuted">{user?.phone || "Not available"}</p>
              <p className="mt-3 text-xs text-brand-textMuted">
                To change your phone number, please contact GLAMO customer care.
              </p>
            </div>
          </div>
        </div>
      </div>
      <aside className="rounded-[2rem] border border-border/70 bg-brand-bgDark p-6 text-white shadow-sm md:p-8">
        <ShieldCheck className="text-brand-gold" size={32} />
        <h2 className="mt-4 font-display text-3xl font-semibold">Security tips</h2>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75">
          <li>Your account is secured by phone verification — no password to remember or forget.</li>
          <li>Each sign-in sends a fresh verification code to your phone.</li>
          <li>Never share verification codes with anyone.</li>
          <li>Contact GLAMO if you notice unusual activity on your account.</li>
        </ul>
      </aside>
    </div>
  );
}