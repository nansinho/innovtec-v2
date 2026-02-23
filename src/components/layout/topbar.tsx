"use client";

import { useState } from "react";
import { Bell, MessageSquare, Settings } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Profile } from "@/lib/types/database";
import NotificationSidebar from "@/components/notifications/notification-sidebar";
import SearchBar from "@/components/search/search-bar";

interface TopbarProps {
  profile: Profile | null;
  unreadCount?: number;
}

export default function Topbar({ profile, unreadCount = 0 }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);

  const today = new Date();
  const dateStr = format(today, "EEEE d MMMM, yyyy", { locale: fr });
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
    : "Utilisateur";

  return (
    <div className="px-7 pt-6">
      {/* Top row */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-xs text-[var(--text-secondary)]">
            {dateFormatted}
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-[var(--heading)]">
            Bonjour, <span>{displayName}</span> !
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--card)] text-[var(--text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--hover)] hover:text-[var(--heading)] hover:shadow-sm"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--yellow)] text-[8px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </button>
          <button className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--card)] text-[var(--text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--hover)] hover:text-[var(--heading)] hover:shadow-sm">
            <MessageSquare className="h-[18px] w-[18px]" />
          </button>
          <button className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--card)] text-[var(--text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--hover)] hover:text-[var(--heading)] hover:shadow-sm">
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <SearchBar />

      {/* Notification sidebar */}
      <NotificationSidebar
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}
