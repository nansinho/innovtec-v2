import { Mail, Calendar, FileText, MessageSquare, Shield, Monitor } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

const links = [
  { icon: Mail, color: "text-red-500 bg-red-50", label: "Mail" },
  { icon: Calendar, color: "text-blue-500 bg-blue-50", label: "Calendrier" },
  { icon: FileText, color: "text-emerald-500 bg-emerald-50", label: "Drive" },
  { icon: MessageSquare, color: "text-purple-500 bg-purple-50", label: "Chat" },
  { icon: Monitor, color: "text-zinc-600 bg-zinc-100", label: "Bureau" },
  { icon: Shield, color: "text-amber-500 bg-amber-50", label: "QSE" },
];

export default function QuickLinks() {
  return (
    <Card>
      <CardHeader title="Quick Links" />
      <div className="grid grid-cols-3 gap-2 p-4">
        {links.map((link) => (
          <button
            key={link.label}
            className="flex flex-col items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border-1)] bg-white py-3 transition-colors hover:border-amber-200 hover:bg-amber-50/50"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius)] ${link.color}`}>
              <link.icon className="h-4 w-4" />
            </div>
            <span className="text-xs text-[var(--text-secondary)]">{link.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
