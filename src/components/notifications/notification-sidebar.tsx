"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Bell,
  Newspaper,
  Calendar,
  Cake,
  MessageSquare,
  Briefcase,
  AlertTriangle,
  GraduationCap,
  Settings,
  ClipboardList,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/actions/notifications";
import { useNotifications } from "@/components/notifications/notification-provider";
import type { NotificationType } from "@/lib/types/database";

const typeConfig: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  news: { icon: Newspaper, color: "text-blue-600", bg: "bg-blue-50" },
  event: { icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
  birthday: { icon: Cake, color: "text-pink-600", bg: "bg-pink-50" },
  comment: { icon: MessageSquare, color: "text-green-600", bg: "bg-green-50" },
  conge: { icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50" },
  danger: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  action_plan: { icon: ClipboardList, color: "text-cyan-600", bg: "bg-cyan-50" },
  formation: { icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
  system: { icon: Settings, color: "text-gray-600", bg: "bg-gray-50" },
};

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSidebar({
  isOpen,
  onClose,
}: NotificationSidebarProps) {
  const {
    notifications,
    unreadCount,
    refreshNotifications,
    markAsReadLocal,
    markAllAsReadLocal,
    deleteLocal,
  } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

  function handleMarkAsRead(id: string) {
    startTransition(async () => {
      markAsReadLocal(id);
      await markAsRead(id);
    });
  }

  function handleMarkAllAsRead() {
    startTransition(async () => {
      markAllAsReadLocal();
      await markAllAsRead();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      deleteLocal(id);
      await deleteNotification(id);
    });
  }

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 z-[201] flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-gray-900" />
            <h2 className="text-base font-semibold text-gray-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter tabs + Mark all */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-2.5">
          <div className="flex gap-1">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === "all"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === "unread"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Non lues ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="flex items-center gap-1 text-[11px] text-orange-600 transition-colors hover:text-orange-700"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tout lire
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="mb-3 h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-500">
                {filter === "unread"
                  ? "Aucune notification non lue"
                  : "Aucune notification"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filtered.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.system;
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative flex gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50/80",
                      !notification.is_read && "bg-orange-50"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        config.bg
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-[12.5px] leading-tight",
                            !notification.is_read
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-900"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-600" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="mt-0.5 text-[11.5px] leading-snug text-gray-500 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-gray-400">
                        {formatRelative(notification.created_at)}
                      </p>
                    </div>

                    {/* Actions (on hover) */}
                    <div className="absolute right-3 top-3 hidden items-center gap-0.5 group-hover:flex">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900"
                          title="Marquer comme lu"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Clickable link overlay */}
                    {notification.link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notification.is_read) {
                            handleMarkAsRead(notification.id);
                          }
                          onClose();
                          router.push(notification.link);
                        }}
                        className="absolute inset-0 z-10 cursor-pointer"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
