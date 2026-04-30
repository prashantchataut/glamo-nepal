"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export function LogoutButton() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    document.cookie = "glamo-auth-token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "glamo-user-role=; path=/; max-age=0; SameSite=Lax";
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200 w-full text-left">
      <span className="text-base">🚪</span>
      Logout
    </button>
  );
}
