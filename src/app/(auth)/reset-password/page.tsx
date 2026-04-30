"use client";

import { useState } from "react";
import { Leaf, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return { level: 0, color: "bg-border" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, color: "bg-red-500" };
    if (score <= 2) return { level: 2, color: "bg-yellow-500" };
    return { level: 3, color: "bg-emerald-500" };
  };
  const { level, color } = getStrength();
  return (
    <div className="flex gap-1 mt-1.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${level >= i ? color : "bg-border"}`} />
      ))}
    </div>
  );
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setIsSuccess(true); }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-brand-bgLight flex items-center justify-center relative overflow-hidden px-4">
        <div className="blob-1" /><div className="blob-2" />
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white rounded-3xl shadow-xl border border-border/30 p-8 md:p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="font-serif text-3xl font-semibold text-brand-textPrimary mb-2">Password Reset!</h1>
            <p className="text-brand-textMuted text-sm mb-8">Your password has been successfully reset. You can now sign in with your new password.</p>
            <Link href="/login" className="inline-flex items-center justify-center w-full py-3.5 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-bgDark transition-all duration-300 shadow-lg shadow-brand-primary/20">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bgLight flex items-center justify-center relative overflow-hidden px-4">
      <div className="blob-1" /><div className="blob-2" />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-border/30 p-8 md:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-1 mb-6">
              <div className="flex items-center gap-1.5"><Leaf className="text-brand-primary w-7 h-7" strokeWidth={1.5} /><span className="font-serif text-2xl font-semibold tracking-[0.08em] text-brand-textPrimary">GLAMO</span></div>
              <span className="text-[8px] tracking-[0.35em] font-medium text-brand-textMuted uppercase -mt-0.5 ml-8">Nepal</span>
            </Link>
            <h1 className="font-serif text-3xl font-semibold text-brand-textPrimary">Reset Password</h1>
            <p className="text-brand-textMuted text-sm mt-2">Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-brand-textPrimary mb-1.5">New Password</label>
              <div className="relative">
                <input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 8 characters" minLength={8} className="w-full px-4 py-3 rounded-xl border border-border bg-white text-brand-textPrimary placeholder:text-brand-textMuted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-textMuted hover:text-brand-primary transition-colors" aria-label={showPassword ? "Hide" : "Show"}>
                  {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Confirm Password</label>
              <input id="confirm-new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter new password" className="w-full px-4 py-3 rounded-xl border border-border bg-white text-brand-textPrimary placeholder:text-brand-textMuted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all" />
              {confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
            </div>
            <button type="submit" disabled={isLoading || (confirmPassword.length > 0 && password !== confirmPassword)} className="w-full py-3.5 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-bgDark transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20">
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}