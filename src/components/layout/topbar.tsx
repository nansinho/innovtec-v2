"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, MessageSquare, Settings, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/lib/types/database";
import NotificationSidebar from "@/components/notifications/notification-sidebar";
import SearchBar from "@/components/search/search-bar";

/* Breadcrumb label mapping */
const breadcrumbLabels: Record<string, string> = {
  "": "Tableau de bord",
  actualites: "Actualités",
  qse: "QSE",
  politique: "Politique QSE",
  dangers: "Situations dangereuses",
  rex: "REX",
  plans: "Plans d'actions",
  "bonnes-pratiques": "Bonnes pratiques",
  "tableau-sse": "Tableau de Bord SSE",
  equipe: "Équipe",
  trombinoscope: "Trombinoscope",
  planning: "Planning",
  formations: "Formations",
  documents: "Documents",
  galerie: "Galerie",
  admin: "Administration",
  users: "Utilisateurs",
  news: "Actualités",
  settings: "Paramètres",
  profil: "Profil",
};

interface TopbarProps {
  profile: Profile | null;
  unreadCount?: number;
}

export default function Topbar({ profile, unreadCount = 0 }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((seg, i) => ({
    label: breadcrumbLabels[seg] ?? seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <>
      <div className="sticky top-0 z-50 flex h-[56px] items-center gap-4 border-b border-[var(--border-1)] bg-white/80 px-6 backdrop-blur-xl">
        {/* Breadcrumb */}
        <nav className="hidden items-center gap-1 text-sm sm:flex" aria-label="Fil d'Ariane">
          <Link
            href="/"
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--heading)]"
          >
            Accueil
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              {crumb.isLast ? (
                <span className="font-medium text-[var(--heading)]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-[var(--text-muted)] transition-colors hover:text-[var(--heading)]"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Search - centered */}
        <div className="mx-auto w-full max-w-lg">
          <SearchBar />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:bg-black/[0.04] hover:text-[var(--heading)]"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--yellow)] text-[8px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:bg-black/[0.04] hover:text-[var(--heading)]"
            aria-label="Messages"
          >
            <MessageSquare className="h-[18px] w-[18px]" />
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:bg-black/[0.04] hover:text-[var(--heading)]"
            aria-label="Paramètres"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Notification sidebar */}
      <NotificationSidebar
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </>
  );
}
