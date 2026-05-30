# Critical Fixes & Form Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix real bugs (blog routing, contact form, API config), add shared validation infrastructure (Zod + react-hook-form), add form feedback, ARIA labels, and loading states.

**Architecture:** Create Zod validation schemas in `src/lib/validations/`, integrate react-hook-form + zod resolver into contact and checkout forms, create a Supabase contact form API route, fix the blog route conflict, configure `.env`, add ARIA labels to icon buttons, and add loading states to add-to-cart and page transitions.

**Tech Stack:** Next.js 14 (App Router), Zod 4, react-hook-form 7, @hookform/resolvers 5, Supabase (via REST API), Zustand, Tailwind CSS, Sonner (toasts)

---

## File Structure

### New Files
- `.env` — environment variables with Supabase URL
- `src/lib/validations/contact.ts` — Zod schema for contact form
- `src/lib/validations/checkout.ts` — Zod schema for checkout form
- `src/lib/validations/auth.ts` — Zod schemas for auth forms
- `src/app/api/contact/route.ts` — Supabase contact form API route
- `src/app/shop/loading.tsx` — shop page skeleton
- `src/app/product/[slug]/loading.tsx` — product detail skeleton
- `src/app/checkout/loading.tsx` — checkout skeleton
- `src/app/blog/loading.tsx` — blog skeleton
- `src/app/contact/loading.tsx` — contact skeleton

### Modified Files
- `src/app/blog/page.tsx` — rewrite as blog listing page
- `src/app/contact/page.tsx` — simplify to render ContactClient
- `src/app/contact/ContactClient.tsx` — rewrite with react-hook-form + zod + real submission
- `src/components/checkout/CheckoutPageClient.tsx` — refactor with react-hook-form + zod
- `src/components/auth/AuthForm.tsx` — add zod validation
- `src/components/product/ProductBundleCard.tsx` — add aria-label
- `src/app/product/[slug]/ProductDetailClient.tsx` — add aria-labels to buttons
- `src/lib/api/client.ts` — improve error handling for missing API URL

---

### Task 1: Configure Environment Variables

**Files:**
- Create: `.env`

- [ ] **Step 1: Create `.env` file**

Create `.env` at project root with the Supabase URL and required config:

```
NEXT_PUBLIC_SITE_URL=https://glamonepal.com
NEXT_PUBLIC_API_BASE_URL=https://omvrdlnxqifuxthgkluq.supabase.co
NEXT_PUBLIC_KHALTI_PUBLIC_KEY=pk_test_replace_me
NEXT_PUBLIC_ESEWA_MERCHANT_ID=replace_me
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/glamonepal
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/glamo_nepal/
ADMIN_EMAIL=admin@glamonepal.com
ADMIN_PASSWORD=ChangeMe@123
ADMIN_SESSION_SECRET=glamo_session_secret_dev_2026_change_in_prod_32ch
AUTH_SECRET=glamo_auth_secret_dev_2026_change_in_prod_32ch
NEXT_PUBLIC_SUPABASE_URL=https://omvrdlnxqifuxthgkluq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7B5zX2VXq7DkYbmiABAc0A_ptyUUC6_
```

- [ ] **Step 2: Verify `.env` is in `.gitignore`**

Run: `grep -q ".env" .gitignore && echo "OK" || echo "MISSING"`
Expected: `OK` (`.env` should already be gitignored)

- [ ] **Step 3: Commit**

```bash
git add .env
git commit -m "chore: add .env with Supabase configuration"
```

---

### Task 2: Improve API Client Error Handling

**Files:**
- Modify: `src/lib/api/client.ts`

- [ ] **Step 1: Update `apiRequest` to handle missing URL gracefully**

In `src/lib/api/client.ts`, replace the `API_BASE_URL` missing check with a more graceful fallback that logs a warning in development but still throws for checkout:

```typescript
import type { ApiErrorResponse, ApiResponse } from "@/lib/api/contracts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export class GlamoApiError extends Error {
  code?: string;
  fieldErrors?: Record<string, string[]>;
  status?: number;

  constructor(error: ApiErrorResponse, status?: number) {
    super(error.message);
    this.name = "GlamoApiError";
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  if (!API_BASE_URL) {
    throw new GlamoApiError({
      status: "error",
      code: "API_BASE_URL_MISSING",
      message: "NEXT_PUBLIC_API_BASE_URL is not configured. Set it in .env to enable server-side operations.",
    });
  }

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch (networkError) {
    throw new GlamoApiError({
      status: "error",
      code: "NETWORK_ERROR",
      message: networkError instanceof Error ? networkError.message : "Network request failed. Please check your connection.",
    });
  }

  const rawPayload = await response.json().catch(() => null);
  const payload = normalizeApiPayload<T>(rawPayload);

  if (!response.ok || payload.status === "error") {
    throw new GlamoApiError(payload as ApiErrorResponse, response.status);
  }

  return payload as ApiResponse<T>;
}

function normalizeApiPayload<T>(payload: unknown): ApiResponse<T> | ApiErrorResponse {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (record.status === "success" || record.status === "error") {
      return payload as ApiResponse<T> | ApiErrorResponse;
    }

    if (record.success === true) {
      return {
        status: "success",
        data: record.data as T,
        message: typeof record.message === "string" ? record.message : undefined,
        meta: record.pagination && typeof record.pagination === "object" ? (record.pagination as ApiResponse<T>["meta"]) : undefined,
      };
    }

    if (record.success === false) {
      return {
        status: "error",
        message: typeof record.message === "string" ? record.message : "Request failed",
        code: typeof record.code === "string" ? record.code : undefined,
      };
    }
  }

  return {
    status: "error",
    message: "The GLAMO service returned an unexpected response.",
    code: "UNEXPECTED_API_RESPONSE",
  };
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/lib/api/client.ts 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/client.ts
git commit -m "fix: improve API client error handling with network errors and status codes"
```

---

### Task 3: Create Zod Validation Schemas

**Files:**
- Create: `src/lib/validations/contact.ts`
- Create: `src/lib/validations/checkout.ts`
- Create: `src/lib/validations/auth.ts`

- [ ] **Step 1: Create `src/lib/validations/contact.ts`**

```typescript
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.union([
    z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number (e.g. 9818212188)"),
    z.literal(""),
  ], { errorMap: () => ({ message: "Enter a valid Nepal mobile number (e.g. 9818212188)" }) }),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
```

- [ ] **Step 2: Create `src/lib/validations/checkout.ts`**

```typescript
import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.union([
    z.string().email("Enter a valid email address"),
    z.literal(""),
  ], { errorMap: () => ({ message: "Enter a valid email address" }) }),
  phone: z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number (e.g. 9818212188)"),
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  city: z.string().min(1, "City is required"),
  ward: z.string().min(1, "Ward is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  giftWrap: z.boolean().optional().default(false),
  notes: z.string().optional().default(""),
  payment: z.enum(["Cash on Delivery", "Khalti", "eSewa", "Cards"]),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
```

- [ ] **Step 3: Create `src/lib/validations/auth.ts`**

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.union([
    z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number"),
    z.literal(""),
  ], { errorMap: () => ({ message: "Enter a valid Nepal mobile number" }) }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
```

- [ ] **Step 4: Verify schemas compile**

Run: `npx tsc --noEmit src/lib/validations/contact.ts src/lib/validations/checkout.ts src/lib/validations/auth.ts 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/
git commit -m "feat: add Zod validation schemas for contact, checkout, and auth forms"
```

---

### Task 4: Create Contact Form API Route

**Files:**
- Create: `src/app/api/contact/route.ts`

- [ ] **Step 1: Create the contact API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return NextResponse.json(
        { status: "error", message: "Validation failed", code: "VALIDATION_ERROR", fieldErrors },
        { status: 400 },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { status: "error", message: "Contact form is not configured. Please try again later.", code: "SERVICE_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || null,
        subject: result.data.subject,
        message: result.data.message,
        created_at: new Date().toISOString(),
      }),
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error("Supabase contact insert failed:", supabaseResponse.status, errorText);
      return NextResponse.json(
        { status: "error", message: "Failed to submit contact form. Please try again.", code: "UPSTREAM_ERROR" },
        { status: 502 },
      );
    }

    return NextResponse.json({ status: "success", message: "Message sent successfully! We will get back to you soon." });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { status: "error", message: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify the route compiles**

Run: `npx tsc --noEmit src/app/api/contact/route.ts 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/contact/route.ts
git commit -m "feat: add contact form API route with Supabase integration"
```

---

### Task 5: Fix Blog Route Conflict

**Files:**
- Modify: `src/app/blog/page.tsx` — rewrite as blog listing page
- `src/app/blog/[slug]/page.tsx` — unchanged (already works correctly)

- [ ] **Step 1: Rewrite `src/app/blog/page.tsx` as a blog listing page**

Replace the entire file with:

```tsx
import Image from "next/image";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/data/blog";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Blog — GLAMO NEPAL",
  description: "Beauty tips, skincare routines and Nepal beauty advice from GLAMO NEPAL.",
  path: "/blog",
});

export default function BlogListingPage() {
  return (
    <main className="bg-brand-bgLight py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Beauty Journal</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-brand-textPrimary md:text-6xl">
            Glow Tips & <span className="italic text-brand-primary">Beauty Secrets</span>
          </h1>
          <p className="mt-4 text-lg leading-8 text-brand-textMuted">
            Expert advice, tutorials, and deep-dives into the ingredients that transform your skin.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-[2rem] border border-border/30 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-4 left-4">
                  <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary shadow-sm soft-overlay-sm">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <h2 className="font-serif text-xl font-semibold text-brand-textPrimary leading-tight group-hover:text-brand-primary transition-colors duration-300 line-clamp-2">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-brand-textMuted line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-brand-textMuted">
                  <span>{post.author.name}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the page compiles**

Run: `npx tsc --noEmit src/app/blog/page.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/blog/page.tsx
git commit -m "fix: replace blog post page with blog listing page to resolve route conflict"
```

---

### Task 6: Rewrite Contact Form with Validation

**Files:**
- Modify: `src/app/contact/page.tsx` — simplify to render ContactClient
- Modify: `src/app/contact/ContactClient.tsx` — rewrite with react-hook-form + zod + real submission + ARIA

- [ ] **Step 1: Simplify `src/app/contact/page.tsx`**

Replace the entire file with:

```tsx
import { Suspense } from "react";
import { createMetadata } from "@/lib/seo";
import ContactClient from "./ContactClient";

export const metadata = createMetadata({
  title: "Contact GLAMO NEPAL",
  description: "Contact GLAMO NEPAL by phone, WhatsApp, Instagram or visit Naya Baneshwor, Mantra In & Out Square, Kathmandu.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight" />}>
      <ContactClient />
    </Suspense>
  );
}
```

- [ ] **Step 2: Rewrite `src/app/contact/ContactClient.tsx` with react-hook-form + zod + real submission**

Replace the entire file with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Phone, Mail, Clock, Loader2 } from "lucide-react";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/constants";
import { contactSchema, type ContactFormData } from "@/lib/validations/contact";

export default function ContactClient() {
  const [isSending, setIsSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  async function onSubmit(data: ContactFormData) {
    setIsSending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.status === "success") {
        toast.success("Message sent! We will get back to you within 24 hours.");
        reset();
      } else {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            toast.error(`${field}: ${(messages as string[])[0]}`);
          }
        } else {
          toast.error(result.message || "Something went wrong. Please try again.");
        }
      }
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <div className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_50%,#F7F1EA_100%)] py-14 md:py-20">
        <div className="container mx-auto px-4 text-center md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Customer care</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-brand-textPrimary md:text-6xl">Get in <span className="italic text-brand-primary">Touch</span></h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-brand-textMuted">Questions, feedback, WhatsApp support or store visit details — we would love to help.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Name</label>
                  <input id="contact-name" {...register("name")} aria-invalid={errors.name ? "true" : undefined} aria-describedby={errors.name ? "contact-name-error" : undefined} className={`w-full px-4 py-3 rounded-xl border bg-white text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all ${errors.name ? "border-red-500" : "border-border"}`} />
                  {errors.name && <p id="contact-name-error" role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Email</label>
                  <input id="contact-email" type="email" {...register("email")} aria-invalid={errors.email ? "true" : undefined} aria-describedby={errors.email ? "contact-email-error" : undefined} className={`w-full px-4 py-3 rounded-xl border bg-white text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all ${errors.email ? "border-red-500" : "border-border"}`} />
                  {errors.email && <p id="contact-email-error" role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Phone <span className="text-brand-textMuted font-normal">(optional)</span></label>
                  <input id="contact-phone" type="tel" {...register("phone")} aria-invalid={errors.phone ? "true" : undefined} aria-describedby={errors.phone ? "contact-phone-error" : undefined} placeholder="+977 98XXXXXXXX" className={`w-full px-4 py-3 rounded-xl border bg-white text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all ${errors.phone ? "border-red-500" : "border-border"}`} />
                  {errors.phone && <p id="contact-phone-error" role="alert" className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Subject</label>
                  <select id="contact-subject" {...register("subject")} aria-invalid={errors.subject ? "true" : undefined} aria-describedby={errors.subject ? "contact-subject-error" : undefined} className={`w-full px-4 py-3 rounded-xl border bg-white text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all ${errors.subject ? "border-red-500" : "border-border"}`}>
                    <option value="">Select a subject</option>
                    <option value="order">Order Inquiry</option>
                    <option value="product">Product Question</option>
                    <option value="return">Returns & Refunds</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.subject && <p id="contact-subject-error" role="alert" className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Message</label>
                <textarea id="contact-message" rows={5} {...register("message")} aria-invalid={errors.message ? "true" : undefined} aria-describedby={errors.message ? "contact-message-error" : undefined} className={`w-full px-4 py-3 rounded-xl border bg-white text-brand-textPrimary placeholder:text-brand-textMuted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all resize-none ${errors.message ? "border-red-500" : "border-border"}`} placeholder="Tell us how we can help..." />
                {errors.message && <p id="contact-message-error" role="alert" className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
              </div>
              <button type="submit" disabled={isSending} className="w-full py-3.5 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-bgDark transition-all duration-300 disabled:opacity-60 shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2">
                {isSending && <Loader2 size={18} className="animate-spin" />}
                {isSending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary mb-6">Store Information</h2>
            <div className="bg-white rounded-2xl border border-border/30 p-6 md:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0"><MapPin size={18} className="text-brand-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="font-semibold text-brand-textPrimary text-sm">Address</p>
                  <p className="text-sm text-brand-textMuted mt-0.5" dangerouslySetInnerHTML={{ __html: SITE_CONFIG.address.replace(/,/g, ",<br />") }} />
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0"><Phone size={18} className="text-brand-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="font-semibold text-brand-textPrimary text-sm">Phone</p>
                  <a href={SITE_CONFIG.whatsapp} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-textMuted hover:text-brand-primary transition-colors">{SITE_CONFIG.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0"><Mail size={18} className="text-brand-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="font-semibold text-brand-textPrimary text-sm">Email</p>
                  <a href={`mailto:${SITE_CONFIG.email}`} className="text-sm text-brand-textMuted hover:text-brand-primary transition-colors">{SITE_CONFIG.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0"><Clock size={18} className="text-brand-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="font-semibold text-brand-textPrimary text-sm">Hours</p>
                  <p className="text-sm text-brand-textMuted">Sun–Fri: 10AM–7PM</p>
                  <p className="text-sm text-brand-textMuted">Sat: 10AM–5PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                {[
                  { icon: <FaInstagram size={18} />, href: SITE_CONFIG.social.instagram },
                  { icon: <FaFacebook size={18} />, href: SITE_CONFIG.social.facebook },
                ].map((s, i) => (
                  <a key={i} href={s.href} className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300">{s.icon}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify both files compile**

Run: `npx tsc --noEmit src/app/contact/page.tsx src/app/contact/ContactClient.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/contact/page.tsx src/app/contact/ContactClient.tsx
git commit -m "fix: rewrite contact form with react-hook-form, zod validation, real submission, and ARIA"
```

---

### Task 7: Refactor Checkout Form with Validation

**Files:**
- Modify: `src/components/checkout/CheckoutPageClient.tsx`

- [ ] **Step 1: Refactor CheckoutPageClient with react-hook-form + zod**

This is a large file. The key changes are:
1. Import `useForm` and `zodResolver`
2. Import `checkoutSchema` and `CheckoutFormData`
3. Replace `useState<CheckoutFormState>` with `useForm<CheckoutFormData>`
4. Replace `updateForm` with `setValue` from react-hook-form
5. Replace `canSubmit` with `formState.isValid`
6. Add validation error display on each field using `errors` from formState
7. Add `aria-invalid` and `aria-describedby` to fields with errors
8. Add `role="alert"` to error messages
9. Keep the existing UI structure and styling

The imports section becomes:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Gift, LockKeyhole, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { CodAvailabilityChecker } from "@/components/checkout/CodAvailabilityChecker";
import { createCheckoutOrder } from "@/lib/api/checkout";
import type { PaymentMethodCode } from "@/lib/api/contracts";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validations/checkout";
import { useCartStore } from "@/store/useCartStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { calculateDeliveryFee, getDeliveryRule, getDistrictsForProvince, getFreeDeliveryProgress, PROVINCES } from "@/lib/delivery";
import { formatNpr } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
```

Replace the state and form logic:

```tsx
export function CheckoutPageClient() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { status, placeOrder } = useCheckoutStore();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      province: "Bagmati",
      district: "Kathmandu",
      city: "Kathmandu",
      ward: "",
      address: "",
      giftWrap: false,
      notes: "",
      payment: "Cash on Delivery",
    },
  });

  const form = watch();
  const subtotal = getSubtotal();
  const deliveryRule = getDeliveryRule(form.district, form.province);
  const deliveryFee = calculateDeliveryFee(subtotal, form.district, form.province);
  const freeDelivery = getFreeDeliveryProgress(subtotal, form.district, form.province);
  const giftWrapFee = form.giftWrap ? 100 : 0;
  const total = subtotal + deliveryFee + giftWrapFee;
  const districtOptions = useMemo(() => getDistrictsForProvince(form.province), [form.province]);
  const canSubmit = isValid && items.length > 0 && (form.payment !== "Cash on Delivery" || deliveryRule.codAvailable);
```

Replace `updateProvince`:

```tsx
  function updateProvince(province: string) {
    const districts = getDistrictsForProvince(province);
    setValue("province", province);
    setValue("district", districts[0] || "Other");
    setValue("city", province === "Bagmati" ? "Kathmandu" : "");
  }
```

Replace `submit` function to use `handleSubmit`:

```tsx
  async function onSubmit(data: CheckoutFormData) {
    if (!canSubmit) {
      toast.error("Please complete required checkout details");
      return;
    }
    let orderNumber = `GLM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const shippingAddress = `${data.address}, Ward ${data.ward}, ${data.city}, ${data.district}, ${data.province}, Nepal`;
    trackEvent("order_placed", {
      value: total,
      method: data.payment,
      district: data.district,
      province: data.province,
      deliveryFee,
      giftWrap: data.giftWrap,
    });

    try {
      const apiOrder = await createCheckoutOrder({
        customer: { name: data.name, email: data.email || `${data.phone.replace(/\D/g, "")}@guest.glamonepal.local`, phone: data.phone },
        shippingAddress: {
          fullName: data.name,
          phone: data.phone,
          province: data.province,
          district: data.district,
          city: data.city,
          ward: data.ward,
          addressLine1: data.address,
        },
        items,
        paymentMethod: paymentCodeMap[data.payment] || "cod",
        giftWrap: data.giftWrap,
        orderNotes: data.notes,
        deliveryFee,
        subtotal,
        grandTotal: total,
        currency: "NPR",
      });
      orderNumber = apiOrder.data?.orderNumber || orderNumber;
    } catch {
      toast.error("Order saved locally. GLAMO will reconcile it from your order details.");
    }

    await placeOrder({
      orderNumber,
      total,
      paymentMethod: data.payment,
      shippingAddress,
      customerName: data.name,
      customerPhone: data.phone,
      items: items.map((item) => ({
        name: item.product.name,
        brand: item.product.brand,
        image: item.product.image,
        price: item.product.price,
        quantity: item.quantity,
        selectedShade: item.selectedShade,
      })),
    });
    clearCart();
    router.push("/checkout/success");
  }
```

In the form JSX, change `<form onSubmit={submit}` to `<form onSubmit={handleSubmit(onSubmit)}`.

For each form field, add error display. For example, the name field becomes:

```tsx
<Field label="Full name" error={errors.name?.message} {...register("name")} autoComplete="name" />
```

The `Field` component needs to be updated to accept `error` and spread register props:

```tsx
function Field({
  label,
  type = "text",
  placeholder,
  error,
  autoComplete,
  required = true,
  ...registerProps
}: {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `checkout-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label htmlFor={id} className="space-y-2 text-sm font-semibold text-brand-textPrimary">
      {label}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-2xl border bg-brand-bgLight px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30 ${error ? "border-red-500" : "border-brand-border"}`}
        {...registerProps}
      />
      {error ? <p id={`${id}-error`} role="alert" className="text-xs text-red-600">{error}</p> : null}
    </label>
  );
}
```

For the province and district selects, use `register` and `setValue`:

```tsx
<select {...register("province")} onChange={(e) => updateProvince(e.target.value)} className="w-full rounded-2xl border border-brand-border bg-brand-bgLight px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30">
  {PROVINCES.map((province) => <option key={province}>{province}</option>)}
</select>
```

Similarly for district, gift wrap checkbox, notes textarea, and payment radio buttons — all use `register` or `setValue`.

- [ ] **Step 2: Verify checkout compiles**

Run: `npx tsc --noEmit src/components/checkout/CheckoutPageClient.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/checkout/CheckoutPageClient.tsx
git commit -m "feat: refactor checkout form with react-hook-form, zod validation, and ARIA"
```

---

### Task 8: Add Validation to Auth Forms

**Files:**
- Modify: `src/components/auth/AuthForm.tsx`

- [ ] **Step 1: Add Zod validation to AuthForm**

Key changes:
1. Import `useForm` and `zodResolver`
2. Import auth schemas
3. Replace `useState` for each field with `useForm` based on mode
4. Add inline error display under each field
5. Add `aria-invalid` and `aria-describedby` to fields with errors
6. Keep the existing UI structure and mock auth behavior

The form initialization varies by mode:
- `login`: `loginSchema`
- `register`: `registerSchema`
- `forgot`: `forgotPasswordSchema`
- `reset`: `resetPasswordSchema`

For each field, add error display:
```tsx
{errors.email && <p id="auth-email-error" role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
```

The submit handler validates with the schema and then proceeds with the existing mock auth logic.

- [ ] **Step 2: Verify auth form compiles**

Run: `npx tsc --noEmit src/components/auth/AuthForm.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/AuthForm.tsx
git commit -m "feat: add zod validation and ARIA to auth forms"
```

---

### Task 9: Add ARIA Labels to Icon Buttons

**Files:**
- Modify: `src/components/product/ProductBundleCard.tsx` — add aria-label to "Add routine" button
- Modify: `src/app/product/[slug]/ProductDetailClient.tsx` — add aria-labels to buttons

- [ ] **Step 1: Add aria-label to ProductBundleCard button**

Find the "Add routine" button and add `aria-label="Add routine to cart"`.

- [ ] **Step 2: Add aria-labels to ProductDetailClient buttons**

Find these buttons and add aria-labels:
- "Add to cart" button: `aria-label="Add to cart"`
- "Share" button: `aria-label="Share product"`
- Sticky mobile "Add" button: `aria-label="Add to cart"`
- "Copy SKU" button: `aria-label="Copy SKU {sku}"`
- "Open size guide" button: `aria-label="Open size guide"`

- [ ] **Step 3: Verify files compile**

Run: `npx tsc --noEmit src/components/product/ProductBundleCard.tsx src/app/product/\\[slug\\]/ProductDetailClient.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/product/ProductBundleCard.tsx "src/app/product/[slug]/ProductDetailClient.tsx"
git commit -m "a11y: add aria-labels to icon-only buttons on product pages"
```

---

### Task 10: Add Loading States (Page Skeletons + Cart Button)

**Files:**
- Create: `src/app/shop/loading.tsx`
- Create: `src/app/product/[slug]/loading.tsx`
- Create: `src/app/checkout/loading.tsx`
- Create: `src/app/blog/loading.tsx`
- Create: `src/app/contact/loading.tsx`

- [ ] **Step 1: Create `src/app/shop/loading.tsx`**

```tsx
export default function ShopLoading() {
  return (
    <main className="bg-brand-bgLight py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-brand-bgLight" />
        <div className="mt-4 h-12 w-80 animate-pulse rounded bg-brand-bgLight" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-brand-border bg-white p-4">
              <div className="aspect-square animate-pulse rounded-xl bg-brand-bgLight" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-brand-bgLight" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-brand-bgLight" />
              <div className="mt-2 h-5 w-1/3 animate-pulse rounded bg-brand-bgLight" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create `src/app/product/[slug]/loading.tsx`**

```tsx
export default function ProductLoading() {
  return (
    <main className="bg-brand-bgLight">
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-[2rem] bg-brand-bgLight" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-brand-bgLight" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-brand-bgLight" />
            <div className="h-6 w-1/4 animate-pulse rounded bg-brand-bgLight" />
            <div className="h-20 w-full animate-pulse rounded bg-brand-bgLight" />
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create `src/app/checkout/loading.tsx`**

```tsx
export default function CheckoutLoading() {
  return (
    <main className="bg-brand-bgLight py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="h-40 animate-pulse rounded-[2rem] bg-brand-bgLight" />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="h-60 animate-pulse rounded-[2rem] bg-brand-bgLight" />
            <div className="h-40 animate-pulse rounded-[2rem] bg-brand-bgLight" />
          </div>
          <div className="h-80 animate-pulse rounded-[2rem] bg-brand-bgLight" />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Create `src/app/blog/loading.tsx`**

```tsx
export default function BlogLoading() {
  return (
    <main className="bg-brand-bgLight py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="h-4 w-32 animate-pulse rounded bg-brand-bgLight mx-auto" />
          <div className="mt-3 h-12 w-96 animate-pulse rounded bg-brand-bgLight mx-auto" />
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[2rem] border border-border/30 bg-white overflow-hidden">
              <div className="aspect-[3/2] animate-pulse bg-brand-bgLight" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-20 animate-pulse rounded bg-brand-bgLight" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-brand-bgLight" />
                <div className="h-3 w-full animate-pulse rounded bg-brand-bgLight" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Create `src/app/contact/loading.tsx`**

```tsx
export default function ContactLoading() {
  return (
    <main className="min-h-screen bg-brand-bgLight">
      <div className="h-48 animate-pulse bg-brand-bgLight" />
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div className="h-8 w-48 animate-pulse rounded bg-brand-bgLight" />
            <div className="h-12 animate-pulse rounded-xl bg-brand-bgLight" />
            <div className="h-12 animate-pulse rounded-xl bg-brand-bgLight" />
            <div className="h-32 animate-pulse rounded-xl bg-brand-bgLight" />
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-brand-bgLight" />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/shop/loading.tsx "src/app/product/[slug]/loading.tsx" src/app/checkout/loading.tsx src/app/blog/loading.tsx src/app/contact/loading.tsx
git commit -m "feat: add loading skeletons for shop, product, checkout, blog, and contact pages"
```

---

### Task 11: Final Verification

- [ ] **Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit 2>&1 | head -50`
Expected: No errors

- [ ] **Step 2: Run ESLint**

Run: `npx next lint 2>&1 | head -50`
Expected: No new errors

- [ ] **Step 3: Run dev server and verify key pages**

Run: `npm run dev`
Then manually verify:
- `/` loads homepage (no redirect to /terms)
- `/blog` shows blog listing (not a single post)
- `/blog/kathmandu-skincare-routine` shows a blog post
- `/contact` shows form with validation
- `/checkout` loads without server error
- Submit contact form with empty fields — validation errors appear
- Submit contact form with valid data — success toast appears

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues found during verification"
```