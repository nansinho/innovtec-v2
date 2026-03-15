"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  LayoutGrid,
  BookOpen,
  Shield,
  AlertCircle,
  Eye,
  Users,
  Calendar,
  GraduationCap,
  FileText,
  Image,
  HelpCircle,
  Settings,
  Newspaper,
  UserCog,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";
import { useState, useEffect } from "react";

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  rh: "Ressources Humaines",
  responsable_qse: "Responsable QSE",
  chef_chantier: "Chef de chantier",
  technicien: "Technicien",
  collaborateur: "Collaborateur",
};

const mainNav = [
  { href: "/", label: "Tableau de bord", icon: LayoutGrid },
  { href: "/actualites", label: "Actualités", icon: BookOpen },
];

const qseNav = [
  { href: "/qse", label: "Vue d'ensemble", icon: LayoutGrid, exact: true },
  { href: "/qse/politique", label: "Politique QSE", icon: Shield },
  { href: "/qse/signalements", label: "Signalements", icon: AlertCircle },
  { href: "/qse/plans", label: "Plans d'actions", icon: ClipboardList },
  { href: "/qse/rex", label: "REX", icon: Eye },
  { href: "/qse/bonnes-pratiques", label: "Bonnes pratiques", icon: BookOpen },
  { href: "/qse/tableau-sse", label: "Tableau de Bord SSE", icon: BarChart3 },
];

const equipeNav = [
  { href: "/equipe/trombinoscope", label: "Trombinoscope", icon: Users },
  { href: "/equipe/planning", label: "Planning", icon: Calendar },
  { href: "/formations", label: "Formations", icon: GraduationCap },
];

const ressourcesNav = [
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/galerie", label: "Galerie", icon: Image },
];

const adminNav = [
  { href: "/admin/users", label: "Utilisateurs", icon: UserCog },
  { href: "/admin/logs", label: "Journal d'activité", icon: ClipboardList },
  { href: "/admin/news", label: "Actualités", icon: Newspaper },
  { href: "/admin/tableau-sse", label: "Tableau SSE", icon: BarChart3 },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isActive: boolean;
  collapsed: boolean;
}

function NavItem({ href, label, icon: Icon, badge, isActive, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all duration-200",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-white/15 font-medium text-white shadow-sm backdrop-blur-sm"
          : "text-white/55 hover:bg-white/[0.08] hover:text-white/90"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
          isActive ? "text-[var(--yellow)]" : "text-white/50 group-hover:text-white/80"
        )}
      />
      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {badge && (
            <span
              className={cn(
                "ml-auto rounded-full px-[7px] py-0.5 text-[9px] font-semibold",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-[var(--yellow)]/20 text-[var(--yellow)]"
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <div className="my-2 border-t border-white/[0.06]" />;
  }
  return (
    <div className="px-3 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-[1.5px] text-white/25">
      {label}
    </div>
  );
}

interface SidebarProps {
  profile: Profile | null;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Update CSS variable when collapsed state changes
  useEffect(() => {
    const width = collapsed ? "72px" : "260px";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [collapsed]);

  const isAdmin = profile && ["admin", "rh"].includes(profile.role);

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-0 z-[100] hidden flex-col bg-[#0F2035]/95 text-white backdrop-blur-2xl transition-all duration-300 ease-out md:flex",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[var(--yellow)] to-[var(--yellow-hover)] shadow-sm shadow-amber-600/20">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="text-sm font-semibold tracking-tight">
            INNOVTEC{" "}
            <span className="font-normal text-white/40">Réseaux</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3">
        {mainNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            isActive={
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            }
          />
        ))}

        <SectionLabel label="QSE" collapsed={collapsed} />
        {qseNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            isActive={
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
            }
          />
        ))}

        <SectionLabel label="Équipe" collapsed={collapsed} />
        {equipeNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            isActive={pathname.startsWith(item.href)}
          />
        ))}

        <SectionLabel label="Ressources" collapsed={collapsed} />
        {ressourcesNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            isActive={pathname.startsWith(item.href)}
          />
        ))}

        {isAdmin && (
          <>
            <SectionLabel label="Administration" collapsed={collapsed} />
            {adminNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                collapsed={collapsed}
                isActive={pathname.startsWith(item.href)}
              />
            ))}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/[0.06] px-2.5 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2 text-[11px] text-white/30 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/55"
          aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>

      {/* Support */}
      <div className="border-t border-white/[0.06] px-2.5 py-1.5">
        <Link
          href="#"
          title={collapsed ? "Support" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-white/30 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/55",
            collapsed && "justify-center px-0"
          )}
        >
          <HelpCircle className="h-4 w-4 shrink-0 opacity-50" />
          {!collapsed && "Support"}
        </Link>
      </div>

    </aside>
  );
}
