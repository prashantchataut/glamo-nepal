"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/config";
import { useAuthStore } from "@/store/useAuthStore";
import { setAuthCookies, clearAuthCookies, sanitizeRedirect } from "@/lib/auth-cookies";
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
  register: Record<string, unknown>;
  error?: { message?: string };
}) {
  const id = `auth-field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label className="block text-sm font-semibold text-brand-textPrimary" htmlFor={id}>
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
  id,
}: {
  label: string;
  register: Record<string, unknown>;
  error?: { message?: string };
  minLength?: number;
  id: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block text-sm font-semibold text-brand-textPrimary" htmlFor={id}>
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
          autoComplete={label.includes("Confirm") ? "new-password" : "current-password"}
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
    case "login": return loginSchema;
    case "register": return registerSchema;
    case "forgot": return forgotPasswordSchema;
    case "reset": return resetPasswordSchema;
  }
}

function getDefaultValues(mode: AuthMode) {
  switch (mode) {
    case "login": return { email: "", password: "" };
    case "register": return { name: "", email: "", phone: "", password: "" };
    case "forgot": return { email: "" };
    case "reset": return { password: "", confirmPassword: "" };
  }
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { login, register: registerUser, forgotPassword, resetPassword, isLoading, error: authError, isConfigured, clearError } = useAuthStore();
  const copy = labels[mode];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getSchema(mode)),
    defaultValues: getDefaultValues(mode) as Partial<FormData>,
  });

  const onSubmit = async (data: FormData) => {
    clearError();

    try {
      if (mode === "login") {
        const loginData = data as LoginFormData;
        await login(loginData.email, loginData.password);
        const user = useAuthStore.getState().user;
        if (user) {
          setAuthCookies(user.email, user.role);
          toast.success("Signed in successfully.");
          const redirect = sanitizeRedirect(params.get("redirect"));
          router.push(redirect);
          router.refresh();
        }
      } else if (mode === "register") {
        const regData = data as RegisterFormData;
        await registerUser(regData.name, regData.email, regData.phone, regData.password);
        const user = useAuthStore.getState().user;
        if (user) {
          setAuthCookies(user.email, user.role);
          toast.success("Account created.");
          const redirect = sanitizeRedirect(params.get("redirect"));
          router.push(redirect);
          router.refresh();
        }
      } else if (mode === "forgot") {
        const forgotData = data as ForgotPasswordFormData;
        await forgotPassword(forgotData.email);
        const currentError = useAuthStore.getState().error;
        if (!currentError) {
          toast.success("If an account exists for that email, a password reset link has been sent.");
        }
      } else if (mode === "reset") {
        const resetData = data as ResetPasswordFormData;
        await resetPassword(resetData.password);
        const currentError = useAuthStore.getState().error;
        if (!currentError) {
          toast.success("Password updated. Please sign in again.");
          clearAuthCookies();
          router.push("/login");
        }
      }
    } catch {
      // Errors are handled in the store
    }
  };

  const formErrors = errors as Record<string, { message?: string }>;
  const isPasswordMismatch = mode === "reset" && !!formErrors.confirmPassword;

  const authLinks: { label: string; href: string; show: boolean }[] = [
    { label: "Login", href: "/login", show: mode !== "login" },
    { label: "Register", href: "/register", show: mode !== "register" },
    { label: "Forgot password?", href: "/forgot-password", show: mode === "login" },
  ];

  return (
    <div className="mx-auto grid max-w-5xl gap-0 overflow-hidden rounded-[2rem] border border-border/70 bg-white shadow-sm md:gap-8 md:p-0 md:grid-cols-[0.9fr_1.1fr]">
      <aside className="rounded-b-[2rem] md:rounded-b-none md:rounded-l-[2rem] md:rounded-r-none rounded-t-[2rem] bg-brand-bgDark p-6 text-white md:p-7">
        <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">{copy.eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-semibold md:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-sm leading-6 text-white/70">{copy.description}</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/75">
          <strong className="block text-white">Need help signing in?</strong>
          Contact GLAMO customer care at {SITE_CONFIG.phone}, or continue with your email to view your account area.
        </div>
      </aside>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5 md:p-4">
        {!isConfigured && (mode === "login" || mode === "register") && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Coming soon:</strong> Authentication is not yet connected. Account features will be available once Supabase is configured.
          </div>
        )}
        {isConfigured && (mode === "login" || mode === "register") && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <strong>Secure auth:</strong> Your credentials are handled by Supabase. We never store your password.
          </div>
        )}
        {authError && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {authError}
          </div>
        )}
        {mode === "register" ? (
          <Field label="Full name" icon={<UserRound size={18} />} register={register("name")} error={formErrors.name} placeholder="Your full name" />
        ) : null}
        {mode !== "reset" ? (
          <Field label="Email address" type="email" icon={<Mail size={18} />} register={register("email")} error={formErrors.email} placeholder="you@example.com" />
        ) : null}
        {mode === "register" ? (
          <Field label="Nepal phone" type="tel" icon={<Phone size={18} />} register={register("phone")} error={formErrors.phone} placeholder="+977 98XXXXXXXX" />
        ) : null}
        {mode === "login" || mode === "register" || mode === "reset" ? (
          <PasswordField label={mode === "reset" ? "New password" : "Password"} register={register("password")} error={formErrors.password} minLength={8} id="auth-password" />
        ) : null}
        {mode === "reset" ? (
          <div>
            <PasswordField label="Confirm new password" register={register("confirmPassword")} error={formErrors.confirmPassword} minLength={8} id="auth-confirm-password" />
          </div>
        ) : null}
        <button type="submit" disabled={isLoading || isPasswordMismatch} className="w-full rounded-full bg-brand-primary px-6 py-3.5 font-semibold text-white transition hover:bg-brand-bgDark focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:cursor-not-allowed disabled:opacity-60">
          {isLoading ? "Please wait..." : copy.button}
        </button>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-brand-primary">
          {authLinks.filter((l) => l.show).map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-bgDark">{l.label}</Link>
          ))}
        </div>
      </form>
    </div>
  );
}