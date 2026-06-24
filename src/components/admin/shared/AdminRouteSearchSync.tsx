"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminStore } from "@/store/useAdminStore";

type Target = "products" | "orders" | "customers";

export function AdminRouteSearchSync({ target }: { target: Target }) {
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
