import { Mail, Calendar, FileText, MessageSquare, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

const links = [
  { icon: Mail, color: "text-[var(--red)]", label: "Mail" },
  { icon: Calendar, color: "text-[var(--blue)]", label: "Calendrier" },
  { icon: FileText, color: "text-[var(--green)]", label: "Drive" },
  { icon: MessageSquare, color: "text-[var(--purple)]", label: "Chat" },
  { icon: Shield, color: "text-[var(--yellow)]", label: "QSE" },
];

export default function QuickLinks() {
  return (
    <Card>
      <div className="px-5 py-4">
        <div className="mb-3.5 text-sm font-medium text-[var(--heading)]">
          Quick Links
        </div>
        <div className="flex flex-wrap gap-2.5">
          {links.map((link) => (
            <button
              key={link.label}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] transition-colors hover:border-[var(--yellow-border)] hover:bg-[var(--yellow-surface)]"
              title={link.label}
            >
              <link.icon className={`h-5 w-5 ${link.color}`} />
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
