import { Mail, Calendar, FileText, MessageSquare, Shield, Monitor } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const links = [
  { icon: Mail, color: "text-red-500", label: "Mail" },
  { icon: Calendar, color: "text-blue-500", label: "Calendrier" },
  { icon: FileText, color: "text-emerald-500", label: "Drive" },
  { icon: MessageSquare, color: "text-purple-500", label: "Chat" },
  { icon: Monitor, color: "text-zinc-500", label: "Bureau" },
  { icon: Shield, color: "text-amber-500", label: "QSE" },
];

export default function QuickLinks() {
  return (
    <Card>
      <CardHeader title="Accès rapides" />
      <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
        {links.map((link) => (
          <button
            key={link.label}
            className="flex flex-col items-center gap-1.5 rounded-lg py-3 transition-colors duration-150 hover:bg-zinc-100 active:scale-[0.97]"
          >
            <link.icon className={cn("h-[18px] w-[18px]", link.color)} strokeWidth={1.6} />
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{link.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
