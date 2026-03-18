"use client";

import type { Rex } from "@/lib/types/database";
import type { CompanyLogos } from "@/actions/settings";
import { CompanyLogo } from "@/components/ui/company-logo";
import {
  RexFaitsBadge,
  RexCausesBadge,
  RexActionsBadge,
  RexVigilanceBadge,
} from "@/components/icons/rex-section-icons";
import { ArrowLeft, Download, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteRex } from "@/actions/qse";
import { toast } from "sonner";
import { useState } from "react";

const EVENT_TYPES = [
  { value: "sd", label: "SD", full: "Situation Dangereuse", color: "text-[#0B3655]", bg: "bg-[#F59E0B]/10" },
  { value: "presquaccident", label: "PRESQU'ACCIDENT", full: "Presqu'accident", color: "text-[#0B3655]", bg: "bg-[#F59E0B]/10" },
  { value: "accident", label: "ACCIDENT", full: "Accident", color: "text-white", bg: "bg-[#0B3655]" },
  { value: "hpe", label: "HPE", full: "High Potential Events", color: "text-[#0B3655]", bg: "bg-[#F59E0B]/10" },
];

const SECTIONS = [
  {
    key: "faits",
    photoKey: "faits_photo_url",
    borderColor: "border-[#C8A84E]",
    Badge: RexFaitsBadge,
  },
  {
    key: "causes",
    photoKey: "causes_photo_url",
    borderColor: "border-[#40884D]",
    Badge: RexCausesBadge,
  },
  {
    key: "actions_engagees",
    photoKey: "actions_photo_url",
    borderColor: "border-[#9A326D]",
    Badge: RexActionsBadge,
  },
  {
    key: "vigilance",
    photoKey: "vigilance_photo_url",
    borderColor: "border-[#0D7C38]",
    Badge: RexVigilanceBadge,
  },
] as const;

interface RexDetailProps {
  rex: Rex;
  onExportPdf?: () => void;
  onEdit?: () => void;
  companyLogo?: CompanyLogos | null;
}

export default function RexDetail({ rex, onExportPdf, onEdit, companyLogo }: RexDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const dateFormatted = rex.date_evenement
    ? new Date(rex.date_evenement).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  async function handleDelete() {
    if (!confirm("Supprimer cette fiche REX ?")) return;
    setDeleting(true);
    const result = await deleteRex(rex.id);
    if (result.success) {
      toast.success("Fiche REX supprimée");
      router.push("/qse/rex");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/qse/rex"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--heading)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux REX
        </Link>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </button>
          )}
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--navy)]/90"
            >
              <Download className="h-4 w-4" />
              Télécharger PDF
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Fiche REX Card */}
      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-white shadow-sm">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            {/* Left: Badge + Info */}
            <div className="flex items-start gap-4">
              {/* Badge FICHE REX */}
              <div className="flex flex-col items-center rounded-lg bg-[#F59E0B] px-3 py-2 text-white shadow-sm">
                <span className="text-[10px] font-bold">
                  Fiche REX
                </span>
                <span className="text-lg font-bold leading-tight">
                  {rex.rex_number || "—"}/{rex.rex_year || "—"}
                </span>
              </div>
              {/* Info */}
              <div>
                <h1 className="text-base font-bold text-[var(--heading)]">
                  <span className="text-[#F59E0B]">TITRE DE L&apos;ÉVÉNEMENT</span>
                  {" — "}
                  {rex.title}
                </h1>
                <div className="mt-1.5 space-y-0.5 text-sm text-[var(--text-secondary)]">
                  {rex.lieu && (
                    <p>
                      <span className="font-semibold text-[#F59E0B]">Lieu</span> : {rex.lieu}
                    </p>
                  )}
                  {dateFormatted && (
                    <p>
                      <span className="font-semibold text-[#F59E0B]">Date</span> : {dateFormatted}
                    </p>
                  )}
                  {rex.horaire && (
                    <p>
                      <span className="font-semibold text-[#F59E0B]">Horaire</span> : {rex.horaire}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Right: Logo */}
            <CompanyLogo logoUrl={companyLogo} variant="light" width={120} height={40} />
          </div>
        </div>

        {/* Yellow separator */}
        <div className="h-1 bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#0B3655]" />

        {/* Sections */}
        <div className="space-y-6 p-6">
          {SECTIONS.map(({ key, photoKey, borderColor, Badge }) => {
            const text = rex[key as keyof Rex] as string;
            const photo = rex[photoKey as keyof Rex] as string;

            if (!text && !photo) return null;

            return (
              <div key={key}>
                {/* Section header with badge */}
                <div className="mb-3">
                  <Badge />
                </div>

                {/* Content: 2/3 text + 1/3 photo */}
                <div className={`grid ${photo ? "grid-cols-3" : "grid-cols-1"} gap-4`}>
                  <div className={`${photo ? "col-span-2" : ""} rounded-lg border ${borderColor} bg-white p-4`}>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--heading)]">
                      {text}
                    </p>
                  </div>
                  {photo && (
                    <div className="flex items-start">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={key}
                        className="w-full rounded-[var(--radius)] border border-[var(--border-1)] object-cover shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-1)] bg-gray-50/50 p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Déjà arrivé */}
            <div>
              <h3 className="mb-2 text-[12px] font-bold text-[#0B3655]">
                Déjà arrivé ?
              </h3>
              {rex.deja_arrive && rex.deja_arrive.length > 0 ? (
                <ul className="space-y-1">
                  {rex.deja_arrive.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--heading)]">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F59E0B]" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-[var(--text-muted)]">Non renseigné</p>
              )}
            </div>

            {/* Type d'événement */}
            <div>
              <h3 className="mb-2 text-[12px] font-bold text-[#0B3655]">
                Type d&apos;événement
              </h3>
              <div className="space-y-1">
                {EVENT_TYPES.map((t) => (
                  <div
                    key={t.value}
                    className={`rounded px-2.5 py-1 text-sm font-medium ${
                      rex.type_evenement === t.value
                        ? `${t.bg} ${t.color} font-bold`
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {t.label}
                    {rex.type_evenement === t.value && (
                      <span className="ml-1 text-[11px] font-normal">({t.full})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
