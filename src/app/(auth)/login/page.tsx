"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Leaf } from "lucide-react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email || "customer@glamonepal.com");
      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
      document.cookie = `auth-token=glamo_mock_session; path=/; max-age=${maxAge}; SameSite=Lax`;
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/account";
      router.push(redirect);
      router.refresh();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-brand-bgLight flex items-center justify-center relative overflow-hidden px-4">
      <div className="blob-1" />
      <div className="blob-2" />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-border/30 p-8 md:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-1 mb-6">
              <div className="flex items-center gap-1.5">
                <Leaf className="text-brand-primary w-7 h-7" strokeWidth={1.5} />
                <span className="font-serif text-2xl font-semibold tracking-[0.08em] text-brand-textPrimary">GLAMO</span>
              </div>
              <span className="text-[8px] tracking-[0.35em] font-medium text-brand-textMuted uppercase -mt-0.5 ml-8">Nepal</span>
            </Link>
            <h1 className="font-serif text-3xl font-semibold text-brand-textPrimary">Welcome Back</h1>
            <p className="text-brand-textMuted text-sm mt-2">Sign in to your GLAMO account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border border-border bg-white text-brand-textPrimary placeholder:text-brand-textMuted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" minLength={8} className="w-full px-4 py-3 rounded-xl border border-border bg-white text-brand-textPrimary placeholder:text-brand-textMuted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-textMuted hover:text-brand-primary transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-border text-brand-primary focus:ring-brand-primary/30" />
                <span className="text-sm text-brand-textMuted">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-brand-primary hover:text-brand-bgDark transition-colors font-medium">Forgot Password?</Link>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-bgDark transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20">
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-brand-textMuted tracking-wider">or continue with</span></div>
          </div>

          <button className="w-full py-3.5 border-2 border-border rounded-full font-semibold text-brand-textPrimary hover:border-brand-primary/30 hover:bg-brand-bgLight transition-all duration-300 flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-brand-textMuted mt-6">
            New to GLAMO? <Link href="/register" className="text-brand-primary font-semibold hover:text-brand-bgDark transition-colors">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}