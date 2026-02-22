"use client";

import { Bell, MessageSquare, Settings, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Profile } from "@/lib/types/database";

interface TopbarProps {
  profile: Profile | null;
}

export default function Topbar({ profile }: TopbarProps) {
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
          <button className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--card)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--heading)]">
            <Bell className="h-[18px] w-[18px]" />
            <div className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full border-2 border-[var(--bg)] bg-[var(--yellow)]" />
          </button>
          <button className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--card)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--heading)]">
            <MessageSquare className="h-[18px] w-[18px]" />
          </button>
          <button className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--border-1)] bg-[var(--card)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--heading)]">
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-4 py-2.5 transition-all focus-within:border-[var(--yellow)] focus-within:shadow-[0_0_0_3px_var(--yellow-surface)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <input
          placeholder="Rechercher des fichiers, actualités, documents..."
          className="w-full bg-transparent text-[13px] text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)]"
        />
        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--yellow)] transition-colors hover:bg-[var(--yellow-hover)]">
          <Search className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
