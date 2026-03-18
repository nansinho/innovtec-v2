import Link from "next/link";
import {
  Shield,
  AlertCircle,
  ClipboardList,
  Eye,
  BookOpen,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { getAllQseContent, getDangerReports, getRexList } from "@/actions/qse";
import { getActionPlans } from "@/actions/action-plans";
import { getSseDashboards } from "@/actions/sse-dashboard";
import { getBonnesPratiques } from "@/actions/bonnes-pratiques";

export const dynamic = "force-dynamic";

const qseCards = [
  {
    href: "/qse/politique",
    label: "Politique QSE",
    description: "Consultez et gérez les politiques Qualité, Sécurité et Environnement.",
    icon: Shield,
    color: "var(--navy)",
    surface: "rgba(26, 45, 78, 0.06)",
    border: "rgba(26, 45, 78, 0.14)",
    countKey: "politique" as const,
  },
  {
    href: "/qse/signalements",
    label: "Signalements",
    description: "Signalez et suivez les situations dangereuses sur les chantiers.",
    icon: AlertCircle,
    color: "var(--navy)",
    surface: "rgba(26, 45, 78, 0.06)",
    border: "rgba(26, 45, 78, 0.14)",
    countKey: "dangers" as const,
  },
  {
    href: "/qse/plans",
    label: "Plans d'actions",
    description: "Suivez les plans d'actions correctives et préventives.",
    icon: ClipboardList,
    color: "var(--navy)",
    surface: "rgba(26, 45, 78, 0.06)",
    border: "rgba(26, 45, 78, 0.14)",
    countKey: "plans" as const,
  },
  {
    href: "/qse/rex",
    label: "Fiches REX",
    description: "Partagez et consultez les retours d'expérience des chantiers.",
    icon: Eye,
    color: "var(--navy)",
    surface: "rgba(26, 45, 78, 0.06)",
    border: "rgba(26, 45, 78, 0.14)",
    countKey: "rex" as const,
  },
  {
    href: "/qse/bonnes-pratiques",
    label: "Bonnes pratiques",
    description: "Documentez et partagez les bonnes pratiques QSE.",
    icon: BookOpen,
    color: "var(--navy)",
    surface: "rgba(26, 45, 78, 0.06)",
    border: "rgba(26, 45, 78, 0.14)",
    countKey: "bonnes_pratiques" as const,
  },
  {
    href: "/qse/tableau-sse",
    label: "Tableau de Bord SSE",
    description: "Visualisez les indicateurs Santé, Sécurité et Environnement.",
    icon: BarChart3,
    color: "var(--navy)",
    surface: "rgba(26, 45, 78, 0.06)",
    border: "rgba(26, 45, 78, 0.14)",
    countKey: "sse" as const,
  },
];

export default async function QseHubPage() {
  const [politiques, dangers, rexList, plans, sseDashboards, bonnesPratiques] = await Promise.all([
    getAllQseContent("politique"),
    getDangerReports(),
    getRexList(),
    getActionPlans(),
    getSseDashboards(),
    getBonnesPratiques(),
  ]);

  const counts: Record<string, number> = {
    politique: politiques.length,
    dangers: dangers.length,
    rex: rexList.length,
    plans: plans.length,
    bonnes_pratiques: bonnesPratiques.length,
    sse: sseDashboards.length,
  };

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-[var(--heading)]">
          Qualité, Sécurité &amp; Environnement
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Accédez à l&apos;ensemble des outils QSE d&apos;INNOVTEC Réseaux.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {qseCards.map((card) => {
          const Icon = card.icon;
          const count = card.countKey ? counts[card.countKey] ?? 0 : null;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex flex-col overflow-hidden rounded-[var(--radius)] border bg-[var(--card)] p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              style={{ borderColor: card.border }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                  style={{ background: card.surface }}
                >
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
                {count !== null ? (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ background: card.surface, color: card.color }}
                  >
                    {count}
                  </span>
                ) : null}
              </div>

              <h2 className="mt-4 text-[15px] font-semibold text-[var(--heading)]">
                {card.label}
              </h2>
              <p className="mt-1 flex-1 text-[13px] leading-relaxed text-[var(--text-muted)]">
                {card.description}
              </p>

              <div className="mt-4 flex items-center gap-1 text-[12px] font-medium transition-colors group-hover:text-[var(--heading)]" style={{ color: card.color }}>
                Accéder
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
