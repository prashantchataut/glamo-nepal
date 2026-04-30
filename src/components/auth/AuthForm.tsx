"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";

export type AuthMode = "login" | "register" | "forgot" | "reset";

const labels: Record<AuthMode, { eyebrow: string; title: string; description: string; button: string }> = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to GLAMO",
    description: "Access orders, saved addresses, wishlist and beauty rewards.",
    button: "Sign in",
  },
  register: {
    eyebrow: "Join GLAMO",
    title: "Create your beauty account",
    description: "Save favorites, keep delivery details ready and enjoy a smoother GLAMO shopping experience.",
    button: "Create account",
  },
  forgot: {
    eyebrow: "Account recovery",
    title: "Forgot your password?",
    description: "Enter your email and we will guide you through the password recovery flow.",
    button: "Send reset link",
  },
  reset: {
    eyebrow: "Secure reset",
    title: "Choose a new password",
    description: "Create a new password for your GLAMO account.",
    button: "Update password",
  },
};

function Field({
  label,
  type = "text",
  icon,
  placeholder,
  value,
  onChange,
  required = true,
}: {
  label: string;
  type?: string;
  icon: React.ReactNode;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-brand-textPrimary">
      {label}
      <span className="mt-2 flex items-center rounded-2xl border border-border bg-brand-bgLight px-4 transition focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20">
        <span className="text-brand-textMuted">{icon}</span>
        <input
          type={type}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-12 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-brand-textMuted/70"
        />
      </span>
    </label>
  );
}

function PasswordField({ label, value, onChange, minLength }: { label: string; value: string; onChange: (value: string) => void; minLength?: number }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block text-sm font-semibold text-brand-textPrimary">
      {label}
      <span className="mt-2 flex items-center rounded-2xl border border-border bg-brand-bgLight px-4 transition focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20">
        <LockKeyhole size={18} className="text-brand-textMuted" strokeWidth={1.6} />
        <input
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 flex-1 bg-transparent px-3 text-sm outline-none"
        />
        <button type="button" onClick={() => setVisible((current) => !current)} className="rounded-full p-1 text-brand-textMuted transition hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25" aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const copy = labels[mode];
  const [name, setName] = useState("GLAMO Customer");
  const [email, setEmail] = useState("customer@glamonepal.com");
  const [phone, setPhone] = useState(SITE_CONFIG.phone);
  const [password, setPassword] = useState("glamo-beauty-2026");
  const [confirmPassword, setConfirmPassword] = useState("glamo-beauty-2026");
  const [isSubmitting, setSubmitting] = useState(false);
  const isPasswordMismatch = mode === "reset" && confirmPassword.length > 0 && password !== confirmPassword;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPasswordMismatch) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      if (mode === "forgot") {
        toast.success("Password recovery request received.");
        return;
      }
      if (mode === "reset") {
        toast.success("Password updated. Please sign in again.");
        router.push("/login");
        return;
      }
      const normalizedEmail = email || "customer@glamonepal.com";
      const role = normalizedEmail.toLowerCase().includes("admin") ? "admin" : "customer";
      document.cookie = "glamo-auth-token=authenticated; path=/; max-age=604800; SameSite=Lax";
      document.cookie = `glamo-user-role=${role}; path=/; max-age=604800; SameSite=Lax`;
      login(normalizedEmail, role);
      toast.success(mode === "register" ? "Account created." : "Signed in successfully.");
      router.push(params.get("redirect") || (role === "admin" ? "/admin" : "/account"));
      router.refresh();
    }, 500);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm md:grid-cols-[0.9fr_1.1fr] md:p-8">
      <aside className="rounded-[1.6rem] bg-brand-bgDark p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">{copy.eyebrow}</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold md:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-sm leading-6 text-white/72">{copy.description}</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/75">
          <strong className="block text-white">Need help signing in?</strong>
          Contact GLAMO customer care at {SITE_CONFIG.phone}, or continue with your email to view your account area.
        </div>
      </aside>

      <form onSubmit={submit} className="space-y-4 p-2 md:p-4">
        {mode === "register" ? <Field label="Full name" icon={<UserRound size={18} />} value={name} onChange={setName} /> : null}
        {mode !== "reset" ? <Field label="Email address" type="email" icon={<Mail size={18} />} value={email} onChange={setEmail} /> : null}
        {mode === "register" ? <Field label="Nepal phone" type="tel" icon={<Phone size={18} />} value={phone} onChange={setPhone} placeholder="+977 98XXXXXXXX" /> : null}
        {mode === "login" || mode === "register" || mode === "reset" ? <PasswordField label={mode === "reset" ? "New password" : "Password"} value={password} onChange={setPassword} minLength={8} /> : null}
        {mode === "reset" ? (
          <div>
            <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} minLength={8} />
            {isPasswordMismatch ? <p className="mt-1 text-xs font-semibold text-red-600">Passwords do not match.</p> : null}
          </div>
        ) : null}
        <button type="submit" disabled={isSubmitting || isPasswordMismatch} className="w-full rounded-full bg-brand-primary px-6 py-3.5 font-semibold text-white transition hover:bg-brand-bgDark focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? "Please wait..." : copy.button}
        </button>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-brand-primary">
          <Link href="/login" className="hover:text-brand-bgDark">Login</Link>
          <Link href="/register" className="hover:text-brand-bgDark">Register</Link>
          <Link href="/forgot-password" className="hover:text-brand-bgDark">Forgot password?</Link>
        </div>
      </form>
    </div>
  );
}
