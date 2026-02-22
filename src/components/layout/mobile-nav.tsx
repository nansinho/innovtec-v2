"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  BookOpen,
  Calendar,
  FileText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/actualites", label: "Actus", icon: BookOpen },
  { href: "/equipe/planning", label: "Planning", icon: Calendar },
  { href: "/documents", label: "Docs", icon: FileText },
  { href: "/equipe/trombinoscope", label: "Équipe", icon: Users },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[200] flex h-14 items-center justify-around border-t border-[var(--border-1)] bg-white/90 backdrop-blur-xl md:hidden">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[9px]",
              isActive ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"
            )}
          >
            <item.icon className="h-[19px] w-[19px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
