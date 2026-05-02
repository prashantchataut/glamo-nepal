"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginFormData,
  type RegisterFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";

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

type FormData = LoginFormData | RegisterFormData | ForgotPasswordFormData | ResetPasswordFormData;

function Field({
  label,
  type = "text",
  icon,
  placeholder,
  register,
  error,
}: {
  label: string;
  type?: string;
  icon: React.ReactNode;
  placeholder?: string;
  register: ReturnType<typeof useForm<FormData>>["register"] extends (name: infer N, ...args: infer A) => infer R
    ? (name: N, ...args: A) => R
    : never;
  error?: { message?: string };
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="block text-sm font-semibold text-brand-textPrimary">
      {label}
      <span className="mt-2 flex items-center rounded-2xl border border-border bg-brand-bgLight px-4 transition focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20">
        <span className="text-brand-textMuted">{icon}</span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          aria-invalid={error ? !!error.message : undefined}
          aria-describedby={error?.message ? `${id}-error` : undefined}
          {...register}
          className="min-h-12 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-brand-textMuted/70"
        />
      </span>
      {error?.message && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-semibold text-red-600">
          {error.message}
        </p>
      )}
    </label>
  );
}

function PasswordField({
  label,
  register,
  error,
  minLength,
}: {
  label: string;
  register: ReturnType<typeof useForm<FormData>>["register"] extends (name: infer N, ...args: infer A) => infer R
    ? (name: N, ...args: A) => R
    : never;
  error?: { message?: string };
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="block text-sm font-semibold text-brand-textPrimary">
      {label}
      <span className="mt-2 flex items-center rounded-2xl border border-border bg-brand-bgLight px-4 transition focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20">
        <LockKeyhole size={18} className="text-brand-textMuted" strokeWidth={1.6} />
        <input
          id={id}
          type={visible ? "text" : "password"}
          minLength={minLength}
          aria-invalid={error ? !!error.message : undefined}
          aria-describedby={error?.message ? `${id}-error` : undefined}
          {...register}
          className="min-h-12 flex-1 bg-transparent px-3 text-sm outline-none"
        />
        <button type="button" onClick={() => setVisible((current) => !current)} className="rounded-full p-1 text-brand-textMuted transition hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25" aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {error?.message && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-semibold text-red-600">
          {error.message}
        </p>
      )}
    </label>
  );
}

function getSchema(mode: AuthMode) {
  switch (mode) {
    case "login":
      return loginSchema;
    case "register":
      return registerSchema;
    case "forgot":
      return forgotPasswordSchema;
    case "reset":
      return resetPasswordSchema;
  }
}

function getDefaultValues(mode: AuthMode) {
  switch (mode) {
    case "login":
      return { email: "customer@glamonepal.com", password: "glamo-beauty-2026" };
    case "register":
      return { name: "GLAMO Customer", email: "customer@glamonepal.com", phone: SITE_CONFIG.phone, password: "glamo-beauty-2026" };
    case "forgot":
      return { email: "customer@glamonepal.com" };
    case "reset":
      return { password: "glamo-beauty-2026", confirmPassword: "glamo-beauty-2026" };
  }
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const copy = labels[mode];
  const [isSubmitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getSchema(mode)),
    defaultValues: getDefaultValues(mode) as Partial<FormData>,
  });

  const onSubmit = (data: FormData) => {
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
      const normalizedEmail = (data as LoginFormData).email || "customer@glamonepal.com";
      const role = normalizedEmail.toLowerCase().includes("admin") ? "admin" : "customer";
      document.cookie = "glamo-auth-token=authenticated; path=/; max-age=604800; SameSite=Lax";
      document.cookie = `glamo-user-role=${role}; path=/; max-age=604800; SameSite=Lax`;
      login(normalizedEmail, role);
      toast.success(mode === "register" ? "Account created." : "Signed in successfully.");
      router.push(params.get("redirect") || (role === "admin" ? "/admin" : "/account"));
      router.refresh();
    }, 500);
  };

  const isPasswordMismatch = mode === "reset" && !!(errors as Record<string, { message?: string }>).confirmPassword?.message;

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-2 md:p-4">
        {mode === "register" ? (
          <Field label="Full name" icon={<UserRound size={18} />} register={register("name" as keyof FormData)} error={errors["name" as keyof FormData] as { message?: string } | undefined} />
        ) : null}
        {mode !== "reset" ? (
          <Field label="Email address" type="email" icon={<Mail size={18} />} register={register("email" as keyof FormData)} error={errors["email" as keyof FormData] as { message?: string } | undefined} />
        ) : null}
        {mode === "register" ? (
          <Field label="Nepal phone" type="tel" icon={<Phone size={18} />} register={register("phone" as keyof FormData)} error={errors["phone" as keyof FormData] as { message?: string } | undefined} placeholder="+977 98XXXXXXXX" />
        ) : null}
        {mode === "login" || mode === "register" || mode === "reset" ? (
          <PasswordField label={mode === "reset" ? "New password" : "Password"} register={register("password" as keyof FormData)} error={errors["password" as keyof FormData] as { message?: string } | undefined} minLength={8} />
        ) : null}
        {mode === "reset" ? (
          <div>
            <PasswordField label="Confirm new password" register={register("confirmPassword" as keyof FormData)} error={errors["confirmPassword" as keyof FormData] as { message?: string } | undefined} minLength={8} />
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