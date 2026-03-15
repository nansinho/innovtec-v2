import { Mail, Calendar, FileText, MessageSquare, Shield, Monitor } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const links = [
  { icon: Mail, color: "text-red-600", bg: "bg-red-500/10", hoverBg: "hover:bg-red-500/15", label: "Mail" },
  { icon: Calendar, color: "text-blue-600", bg: "bg-blue-500/10", hoverBg: "hover:bg-blue-500/15", label: "Calendrier" },
  { icon: FileText, color: "text-emerald-600", bg: "bg-emerald-500/10", hoverBg: "hover:bg-emerald-500/15", label: "Drive" },
  { icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-500/10", hoverBg: "hover:bg-purple-500/15", label: "Chat" },
  { icon: Monitor, color: "text-zinc-600", bg: "bg-zinc-500/10", hoverBg: "hover:bg-zinc-500/15", label: "Bureau" },
  { icon: Shield, color: "text-amber-600", bg: "bg-amber-500/10", hoverBg: "hover:bg-amber-500/15", label: "QSE" },
];

export default function QuickLinks() {
  return (
    <Card>
      <CardHeader title="Accès rapides" />
      <div className="grid grid-cols-3 gap-2 p-3">
        {links.map((link) => (
          <button
            key={link.label}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl py-3.5 transition-all duration-200 hover:shadow-sm active:scale-[0.97]",
              link.bg,
              link.hoverBg
            )}
          >
            <link.icon className={cn("h-5 w-5", link.color)} />
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{link.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
