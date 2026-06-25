"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminStore } from "@/store/useAdminStore";

type Target = "products" | "orders" | "customers";

// Outer wrapper: useSearchParams() in Next.js 16 emits hydration warnings and
// forces the route into dynamic rendering unless the call lives inside a
// <Suspense> boundary. We render a lightweight inline placeholder while the
// search params hydrate, which is invisible because the page tree renders
// identical content on both sides.
export function AdminRouteSearchSync({ target }: { target: Target }) {
  return (
    <Suspense fallback={null}>
      <AdminRouteSearchSyncInner target={target} />
    </Suspense>
  );
}

function AdminRouteSearchSyncInner({ target }: { target: Target }) {
  const searchParams = useSearchParams();
  const { setGlobalSearch, setProductSearch, setOrderSearch, setCustomerSearch } = useAdminStore();

  useEffect(() => {
    const search = searchParams.get("search")?.trim() ?? "";
    if (!search) return;

    setGlobalSearch(search);
    if (target === "products") setProductSearch(search);
    if (target === "orders") setOrderSearch(search);
    if (target === "customers") setCustomerSearch(search);
  }, [searchParams, target, setGlobalSearch, setProductSearch, setOrderSearch, setCustomerSearch]);

  return null;
}
