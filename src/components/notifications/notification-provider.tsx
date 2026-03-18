"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types/database";
import { getMyNotifications } from "@/actions/notifications";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsReadLocal: (id: string) => void;
  markAllAsReadLocal: () => void;
  deleteLocal: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  refreshNotifications: async () => {},
  markAsReadLocal: () => {},
  markAllAsReadLocal: () => {},
  deleteLocal: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export default function NotificationProvider({
  userId,
  initialCount,
  children,
}: {
  userId: string;
  initialCount: number;
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [loaded, setLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const refreshNotifications = useCallback(async () => {
    const data = await getMyNotifications();
    setNotifications(data);
    setUnreadCount(data.filter((n) => !n.is_read).length);
    setLoaded(true);
  }, []);

  const markAsReadLocal = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsReadLocal = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const deleteLocal = useCallback((id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Son de notification
          try {
            if (!audioRef.current) {
              audioRef.current = new Audio("data:audio/wav;base64,UklGRl9vT19teleWQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + "tvT19" + "AAAA=");
            }
          } catch {
            // ignore audio errors
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setNotifications((prev) => {
            const target = prev.find((n) => n.id === deletedId);
            if (target && !target.is_read) {
              setUnreadCount((c) => Math.max(0, c - 1));
            }
            return prev.filter((n) => n.id !== deletedId);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          // Recalculate unread count
          setNotifications((prev) => {
            setUnreadCount(prev.filter((n) => !n.is_read).length);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: loaded ? notifications : [],
        unreadCount,
        refreshNotifications,
        markAsReadLocal,
        markAllAsReadLocal,
        deleteLocal,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
