"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPayment } from "@/lib/api/checkout";

export default function KhaltiCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");

  useEffect(() => {
    const pidx = searchParams.get("pidx");
    const orderId = searchParams.get("purchase_order_id");
    const statusParam = searchParams.get("status");

    if (!pidx || !orderId) {
      setStatus("failed");
      return;
    }

    if (statusParam === "Failed" || statusParam === "Cancelled") {
      setStatus("failed");
      return;
    }

    verifyPayment(orderId, "khalti", pidx)
      .then((result) => {
        if (result.data) {
          setStatus("success");
          setTimeout(() => router.push(`/order-confirmation/${orderId}`), 1500);
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bgLight">
      <div className="text-center">
        {status === "verifying" && (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-border border-t-brand-primary" />
            <p className="mt-4 text-sm text-brand-textMuted">Verifying your Khalti payment...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="mt-4 font-semibold text-brand-textPrimary">Payment successful!</p>
            <p className="mt-1 text-sm text-brand-textMuted">Redirecting to your order...</p>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <p className="mt-4 font-semibold text-brand-textPrimary">Payment failed</p>
            <p className="mt-1 text-sm text-brand-textMuted">Your order was created but payment could not be verified.</p>
            <button
              onClick={() => router.push("/account/orders")}
              className="mt-4 rounded-full bg-brand-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-primary-dark"
            >
              View your orders
            </button>
          </>
        )}
      </div>
    </div>
  );
}