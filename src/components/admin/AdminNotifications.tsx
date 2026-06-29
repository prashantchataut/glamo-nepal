"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type AdminNotification } from "@/lib/api/admin";
import { toArray } from "@/lib/array-safe";
import { Bell, Check, CheckCheck } from "lucide-react";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr.replace(" ", "T")).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_ICONS: Record<string, string> = {
  INFO: "i",
  SUCCESS: "✓",
  WARNING: "!",
  ERROR: "✗",
  ORDER: "$",
  PROMO: "%",
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: result, isLoading: notifLoading } = useAdminData(() => adminApi.getNotifications({ limit: 20 }));
  const { mutate: markReadMutate } = useAdminMutation((vars: { id: string }) => adminApi.markNotificationRead(vars.id));
  const { mutate: markAllReadMutate } = useAdminMutation(() => adminApi.markAllNotificationsRead());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // DEFENSIVE: The backend returns a paginated response where `data` is the
  // array of notifications directly (not nested under `notifications`).
  // Use toArray() to handle both shapes and any malformed response.
  const notifications = toArray<AdminNotification>(result?.notifications ?? result);
  const unreadCount = Number(result?.unreadCount ?? 0);
  const isLoading = notifLoading;

  const handleMarkRead = async (id: string) => {
    await markReadMutate({ id });
  };

  const handleMarkAllRead = async () => {
    await markAllReadMutate(undefined as never);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-textMuted transition hover:text-brand-primary shadow-sm"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-admin-error px-1 text-xs font-bold text-neutral-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-[1.5rem] border border-brand-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline disabled:opacity-50"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-brand-bgLight" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-brand-textMuted">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-brand-border px-4 py-3 transition hover:bg-brand-bgLight/50 ${n.is_read ? "opacity-60" : ""}`}
                >
                  <span className="mt-0.5 text-base">{TYPE_ICONS[n.type] ?? "?"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="mt-0.5 text-xs text-brand-textMuted line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-xs text-brand-textMuted">{formatTimeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="mt-1 shrink-0 text-brand-textMuted hover:text-brand-primary"
                      aria-label="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
