"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi } from "@/lib/api/admin";
import { Bell, Check, CheckCheck, ShoppingCart, AlertTriangle, UserPlus, Info, Megaphone, PartyPopper, type LucideIcon } from "lucide-react";

// Notification row as returned by the Hono/SQLite backend
// (admin.service.ts → getNotifications). Column names follow the DB schema,
// NOT the legacy Convex `_id`/`_creationTime`/`isRead` shape this component
// used before — that mismatch is why notifications always looked empty/broken.
interface NotificationRow {
  id: string;
  user_id?: string | null;
  type: string; // INFO | SUCCESS | WARNING | ERROR | ORDER | PROMO
  title: string;
  message: string;
  data?: string | null;
  is_read: number; // SQLite boolean (0/1)
  created_at: string; // ISO datetime string
}

function parseTimestamp(value: unknown): number {
  if (!value) return Date.now();
  const ms = new Date(String(value)).getTime();
  return Number.isFinite(ms) ? ms : Date.now();
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Map the DB `type` enum to an icon + accent color. Replaces the old
// TYPE_ICONS record that held literal "??" strings (the symbols the client
// saw in the bell dropdown).
const TYPE_META: Record<string, { icon: LucideIcon; color: string }> = {
  ORDER: { icon: ShoppingCart, color: "text-blue-600" },
  SUCCESS: { icon: PartyPopper, color: "text-emerald-600" },
  WARNING: { icon: AlertTriangle, color: "text-amber-600" },
  ERROR: { icon: AlertTriangle, color: "text-red-600" },
  INFO: { icon: Info, color: "text-neutral-500" },
  PROMO: { icon: Megaphone, color: "text-fuchsia-600" },
  // Friendly alias for "new customer" notifications we emit locally.
  USER: { icon: UserPlus, color: "text-indigo-600" },
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: result, isLoading } = useAdminData(() => adminApi.getNotifications({ limit: 20 }));
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

  const notifications = ((result?.notifications ?? []) as unknown as NotificationRow[]);
  const unreadCount = result?.unreadCount ?? 0;

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
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-admin-error px-1 text-[10px] font-bold text-white">
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
                <Bell size={20} className="mx-auto mb-2 opacity-40" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = Number(n.is_read) === 1;
                const meta = TYPE_META[String(n.type ?? "").toUpperCase()] ?? TYPE_META.INFO;
                const Icon = meta.icon;
                const ts = parseTimestamp(n.created_at);
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 border-b border-brand-border px-4 py-3 transition hover:bg-brand-bgLight/50 ${isRead ? "opacity-60" : ""}`}
                  >
                    <span className={`mt-0.5 ${meta.color}`} aria-hidden="true">
                      <Icon size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-xs text-brand-textMuted line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-brand-textMuted">{formatTimeAgo(ts)}</p>
                    </div>
                    {!isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="mt-1 shrink-0 text-brand-textMuted hover:text-brand-primary"
                        aria-label="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
