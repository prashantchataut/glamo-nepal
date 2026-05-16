"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/config";
import { IMAGES } from "@/lib/image-library";
import { useAuthStore } from "@/store/useAuthStore";
import { setAuthCookies, clearAuthCookies, sanitizeRedirect } from "@/lib/auth-cookies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="w-full">
      <label htmlFor={id} className="type-label mb-2 block text-cream-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          minLength={minLength}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error?.message ? `${id}-error` : undefined}
          {...register}
          className="w-full rounded-none border border-cream-200 bg-cream-50 px-4 py-3 pr-10 font-sans text-body-md text-ink transition-colors duration-200 placeholder:text-cream-400 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-primary/15"
          autoComplete={label.includes("Confirm") ? "new-password" : "current-password"}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-cream-400 transition-colors hover:text-brand-rose"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error?.message && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-error">
          {error.message}
        </p>
      )}
    </div>
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

export function AuthForm({ mode, redirectTo = "/account" }: { mode: AuthMode; redirectTo?: string }) {
  const router = useRouter();
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
          router.push(sanitizeRedirect(redirectTo));
          router.refresh();
        }
      } else if (mode === "register") {
        const regData = data as RegisterFormData;
        await registerUser(regData.name, regData.email, regData.phone, regData.password);
        const user = useAuthStore.getState().user;
        if (user) {
          setAuthCookies(user.email, user.role);
          toast.success("Account created.");
          router.push(sanitizeRedirect(redirectTo));
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
    <div className="mx-auto grid max-w-6xl overflow-hidden rounded-none border border-cream-200 bg-cream-50 shadow-editorial md:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative min-h-[420px] bg-ink p-8 text-white md:p-10 lg:p-12">
        <Image src={IMAGES.auth.loginSplit} alt="Editorial beauty portrait for GLAMO account access" fill className="object-cover opacity-55" sizes="(max-width: 768px) 100vw, 45vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10" />
        <div className="relative z-10 flex h-full flex-col justify-end">
          <p className="type-label text-gold">{copy.eyebrow}</p>
          <h1 className="mt-4 font-display text-5xl font-light leading-tight md:text-6xl">{copy.title}</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/78">{copy.description}</p>
          <div className="mt-8 rounded-none border border-white/15 bg-ink/45 p-4 text-sm leading-6 text-white/75">
            <strong className="block text-white">Need help signing in?</strong>
            Contact GLAMO customer care at {SITE_CONFIG.phone}, or continue with your email to view your account area.
          </div>
        </div>
      </aside>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6 md:p-10 lg:p-12">
        {!isConfigured && (mode === "login" || mode === "register") && (
          <div className="rounded-none border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-cream-700">
            <strong>Coming soon:</strong> Authentication is not yet connected. Account features will be available once Supabase is configured.
          </div>
        )}
        {isConfigured && (mode === "login" || mode === "register") && (
          <div className="rounded-none border border-brand-rose/20 bg-brand-rose/5 px-4 py-3 text-sm text-brand-rose">
            <strong>Secure auth:</strong> Your credentials are handled by Supabase. We never store your password.
          </div>
        )}
        {authError && (
          <div className="rounded-none border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
            {authError}
          </div>
        )}

        {mode === "register" && (
          <Input label="Full name" type="text" placeholder="Your full name" {...register("name")} error={formErrors.name?.message} />
        )}
        {mode !== "reset" && (
          <Input label="Email address" type="email" placeholder="you@example.com" {...register("email")} error={formErrors.email?.message} />
        )}
        {mode === "register" && (
          <Input label="Nepal phone" type="tel" placeholder="+977 98XXXXXXXX" {...register("phone")} error={formErrors.phone?.message} />
        )}
        {(mode === "login" || mode === "register" || mode === "reset") && (
          <PasswordField
            label={mode === "reset" ? "New password" : "Password"}
            register={register("password")}
            error={formErrors.password}
            minLength={8}
            id="auth-password"
          />
        )}
        {mode === "reset" && (
          <PasswordField
            label="Confirm new password"
            register={register("confirmPassword")}
            error={formErrors.confirmPassword}
            minLength={8}
            id="auth-confirm-password"
          />
        )}

        <Button type="submit" disabled={isLoading || isPasswordMismatch} className="mt-2 w-full">
          {isLoading ? "Please wait..." : copy.button}
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm font-semibold text-brand-rose">
          {authLinks.filter((l) => l.show).map((l) => (
            <Link key={l.href} href={l.href} className="cursor-pointer hover:text-ink transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </form>
    </div>
  );
}