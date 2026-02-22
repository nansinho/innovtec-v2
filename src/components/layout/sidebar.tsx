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
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth";
import type { Profile } from "@/lib/types/database";

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  rh: "Ressources Humaines",
  responsable_qse: "Responsable QSE",
  chef_chantier: "Chef de chantier",
  technicien: "Technicien",
};

const mainNav = [
  { href: "/", label: "Tableau de bord", icon: LayoutGrid },
  { href: "/actualites", label: "Actualités", icon: BookOpen, badge: "3" },
];

const qseNav = [
  { href: "/qse/politique", label: "Politique QSE", icon: Shield },
  { href: "/qse/dangers", label: "Situations dangereuses", icon: AlertCircle },
  { href: "/qse/rex", label: "REX", icon: Eye },
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

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isActive: boolean;
}

function NavItem({ href, label, icon: Icon, badge, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[12.5px] transition-all",
        isActive
          ? "bg-[var(--yellow)] font-medium text-[var(--navy)]"
          : "text-white/50 hover:bg-white/5 hover:text-white/75"
      )}
    >
      <Icon
        className={cn("h-[17px] w-[17px] shrink-0", isActive ? "opacity-100" : "opacity-50")}
      />
      {label}
      {badge && (
        <span
          className={cn(
            "ml-auto rounded-full px-[7px] py-0.5 text-[8px] font-medium",
            isActive
              ? "bg-[var(--navy)]/20 text-[var(--navy)]"
              : "bg-[var(--yellow)]/20 text-[var(--yellow)]"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-2.5 pb-1.5 pt-4 text-[9px] font-medium uppercase tracking-[2px] text-white/20">
      {label}
    </div>
  );
}

interface SidebarProps {
  profile: Profile | null;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
    : "Utilisateur";

  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "?"
    : "?";

  const roleLabel = profile ? (roleLabels[profile.role] ?? profile.role) : "";

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-[100] hidden w-[var(--sidebar-width)] flex-col overflow-y-auto bg-[var(--navy)] text-white md:flex">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-[18px] py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--yellow)]">
          <Zap className="h-4 w-4 text-[var(--navy)]" />
        </div>
        <div className="text-sm font-semibold tracking-tight">
          INNOVTEC{" "}
          <span className="font-normal text-white/40">Réseaux</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-px px-2.5 py-3">
        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} isActive={pathname === item.href} />
        ))}

        <SectionLabel label="QSE" />
        {qseNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={pathname.startsWith(item.href)}
          />
        ))}

        <SectionLabel label="Équipe" />
        {equipeNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={pathname.startsWith(item.href)}
          />
        ))}

        <SectionLabel label="Ressources" />
        {ressourcesNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.06] px-3.5 py-2.5">
        <Link
          href="#"
          className="flex items-center gap-2.5 rounded-[var(--radius-xs)] px-2 py-2 text-[11.5px] text-white/30 transition-all hover:bg-white/[0.04] hover:text-white/55"
        >
          <HelpCircle className="h-[15px] w-[15px] opacity-35" />
          Support
        </Link>
        <Link
          href="/admin/settings"
          className="flex items-center gap-2.5 rounded-[var(--radius-xs)] px-2 py-2 text-[11.5px] text-white/30 transition-all hover:bg-white/[0.04] hover:text-white/55"
        >
          <Settings className="h-[15px] w-[15px] opacity-35" />
          Paramètres
        </Link>
      </div>

      {/* User */}
      <div className="flex items-center gap-2.5 border-t border-white/[0.06] px-3.5 py-3.5">
        <Link
          href="/profil"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-white/65 transition-colors hover:bg-white/20"
        >
          {initials}
        </Link>
        <div className="flex-1">
          <Link
            href="/profil"
            className="block text-[12.5px] font-medium text-white/80 transition-colors hover:text-white"
          >
            {displayName}
          </Link>
          <div className="text-[10.5px] text-white/30">{roleLabel}</div>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-white/20 hover:text-white/50">
            <LogOut className="h-[15px] w-[15px]" />
          </button>
        </form>
      </div>
    </aside>
  );
}
