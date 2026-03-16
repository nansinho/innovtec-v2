import { Mail, Calendar, FileText, MessageSquare, Shield, Monitor } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

const links = [
  { icon: Mail, label: "Mail" },
  { icon: Calendar, label: "Calendrier" },
  { icon: FileText, label: "Drive" },
  { icon: MessageSquare, label: "Chat" },
  { icon: Monitor, label: "Bureau" },
  { icon: Shield, label: "QSE" },
];

export default function QuickLinks() {
  return (
    <Card>
      <CardHeader title="Accès rapides" />
      <div className="grid grid-cols-3 gap-2 p-3">
        {links.map((link) => (
          <button
            key={link.label}
            className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 py-3.5 transition-all duration-200 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            <link.icon className="h-5 w-5 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">{link.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
