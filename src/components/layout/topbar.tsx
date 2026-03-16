"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, MessageSquare, Settings, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/actions/auth";
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
  signalements: "Signalements",
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

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
    : "Utilisateur";

  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments
    .filter((seg) => !uuidRegex.test(seg))
    .map((seg, i, arr) => ({
      label: breadcrumbLabels[seg] ?? seg,
      href: "/" + segments.slice(0, segments.indexOf(seg) + 1).join("/"),
      isLast: i === arr.length - 1,
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

          {/* Separator + User profile */}
          <div className="h-6 w-px bg-[var(--border-1)]" />
          <Link
            href="/profil"
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-black/[0.04]"
          >
            {profile?.avatar_url ? (
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--navy)]/10 text-[11px] font-medium text-[var(--navy)]">
                {initials}
              </div>
            )}
            <span className="hidden text-sm font-medium text-[var(--heading)] sm:inline">
              {displayName}
            </span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:bg-black/[0.04] hover:text-[var(--heading)]"
              aria-label="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
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
