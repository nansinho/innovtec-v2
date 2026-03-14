"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Award,
  HeartPulse,
  ShieldCheck,
  Leaf,
  FileText,
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import FileUploadAi from "@/components/ai/file-upload-ai";
import { saveQseContent, createQseContent } from "@/actions/qse";
import type { QseContent, QseContentSection } from "@/lib/types/database";

// ==========================================
// PILLAR CONFIG
// ==========================================

const PILLARS = [
  {
    key: "qualite",
    label: "Qualite",
    match: ["qualit"],
    icon: Award,
    color: "var(--yellow)",
    surface: "var(--yellow-surface)",
    border: "var(--yellow-border)",
  },
  {
    key: "sante",
    label: "Sante",
    match: ["sant"],
    icon: HeartPulse,
    color: "var(--green)",
    surface: "var(--green-surface)",
    border: "rgba(22, 163, 74, 0.16)",
  },
  {
    key: "securite",
    label: "Securite",
    match: ["s\u00e9curit", "securit"],
    icon: ShieldCheck,
    color: "var(--blue)",
    surface: "var(--blue-surface)",
    border: "rgba(37, 99, 235, 0.16)",
  },
  {
    key: "environnement",
    label: "Environnement",
    match: ["environnement"],
    icon: Leaf,
    color: "var(--navy)",
    surface: "rgba(26, 45, 78, 0.06)",
    border: "rgba(26, 45, 78, 0.16)",
  },
] as const;

interface Pillar {
  key: string;
  label: string;
  icon: typeof Award;
  color: string;
  surface: string;
  border: string;
  engagements: string[];
  objectifs: string[];
}

function parsePillars(sections: QseContentSection[]): {
  pillars: Pillar[];
  intro: string;
} {
  let intro = "";
  const pillarMap: Record<string, { engagements: string[]; objectifs: string[] }> = {};

  for (const p of PILLARS) {
    pillarMap[p.key] = { engagements: [], objectifs: [] };
  }

  for (const section of sections) {
    const titleLower = section.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (
      titleLower.includes("presentation") ||
      titleLower.includes("generale") ||
      titleLower.includes("introduction")
    ) {
      intro = section.content;
      continue;
    }

    let matched = false;
    for (const p of PILLARS) {
      const sectionTitleNorm = section.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (p.match.some((m) => sectionTitleNorm.includes(m.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) {
        const isObjectif = titleLower.includes("objectif");
        const lines = section.content
          .split("\n")
          .map((l) => l.replace(/^[\s\u2022\u2023\u25E6\u2043\u2219*\-]+/, "").trim())
          .filter((l) => l.length > 0);

        if (isObjectif) {
          pillarMap[p.key].objectifs.push(...lines);
        } else {
          pillarMap[p.key].engagements.push(...lines);
        }
        matched = true;
        break;
      }
    }

    if (!matched && !intro) {
      intro = section.content;
    }
  }

  const pillars: Pillar[] = PILLARS.map((p) => ({
    key: p.key,
    label: p.label,
    icon: p.icon,
    color: p.color,
    surface: p.surface,
    border: p.border,
    engagements: pillarMap[p.key].engagements,
    objectifs: pillarMap[p.key].objectifs,
  })).filter((p) => p.engagements.length > 0 || p.objectifs.length > 0);

  return { pillars, intro };
}

// ==========================================
// PILLAR CARD COMPONENT
// ==========================================

function PillarCard({ pillar }: { pillar: Pillar }) {
  const Icon = pillar.icon;

  return (
    <div
      className="overflow-hidden rounded-[var(--radius)] border bg-[var(--card)] shadow-sm"
      style={{ borderColor: pillar.border }}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
          style={{ background: pillar.surface }}
        >
          <Icon className="h-5 w-5" style={{ color: pillar.color }} />
        </div>
        <h3 className="text-[15px] font-bold uppercase tracking-wide text-[var(--heading)]">
          {pillar.label}
        </h3>
      </div>

      {pillar.engagements.length > 0 && (
        <div className="border-t border-[var(--border-1)] px-5 py-4">
          <div className="mb-2.5 flex items-center gap-2">
            <div
              className="h-1 w-5 rounded-full"
              style={{ background: pillar.color }}
            />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Nos engagements
            </span>
          </div>
          <ul className="space-y-2">
            {pillar.engagements.map((item, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-[var(--text)]">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: pillar.color }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pillar.objectifs.length > 0 && (
        <div className="mx-4 mb-4 rounded-[var(--radius-sm)] bg-[var(--navy)] px-4 py-3.5">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1 w-5 rounded-full bg-[var(--yellow)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
              Nos objectifs
            </span>
          </div>
          <ul className="space-y-1.5">
            {pillar.objectifs.map((item, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-white/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--yellow)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

interface PolitiqueContentProps {
  content: QseContent | null;
  allContent: QseContent[];
  canEdit: boolean;
}

export default function PolitiqueContent({
  content,
  allContent,
  canEdit,
}: PolitiqueContentProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState(
    content?.title ?? "Politique Qualite, Securite et Environnement"
  );
  const [sections, setSections] = useState<QseContentSection[]>(
    content?.sections ?? []
  );
  const [isPending, startTransition] = useTransition();
  const [showUpload, setShowUpload] = useState(false);
  const [expandedEdit, setExpandedEdit] = useState<Set<number>>(
    new Set(sections.map((_, i) => i))
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();
  const detailRef = useRef<HTMLDivElement>(null);

  const selected = allContent.find((c) => c.id === selectedId) ?? null;
  const { pillars, intro } = selected
    ? parsePillars(selected.sections)
    : { pillars: [], intro: "" };

  function handleAiResult(result: unknown) {
    const data = result as { title?: string; sections?: QseContentSection[] };
    if (data.title) setTitle(data.title);
    if (data.sections && Array.isArray(data.sections)) {
      setSections(data.sections);
      setExpandedEdit(
        new Set(data.sections.map((_: QseContentSection, i: number) => i))
      );
    }
    setEditing(true);
    setShowUpload(false);
  }

  function addSection() {
    const idx = sections.length;
    setSections([...sections, { title: "", content: "" }]);
    setExpandedEdit((prev) => new Set([...prev, idx]));
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function updateSection(
    index: number,
    field: keyof QseContentSection,
    value: string
  ) {
    setSections(
      sections.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function toggleEditSection(index: number) {
    setExpandedEdit((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      let result;
      if (editingId) {
        // Update existing
        result = await saveQseContent("politique", title, sections, undefined, editingId);
      } else {
        // Create new
        result = await createQseContent("politique", title, sections);
      }
      if (result.success) {
        setEditing(false);
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function startEditing(doc: QseContent) {
    setTitle(doc.title);
    setSections(doc.sections);
    setExpandedEdit(new Set(doc.sections.map((_, i) => i)));
    setEditingId(doc.id);
    setEditing(true);
    setSelectedId(null);
  }

  function startNew() {
    setTitle("Politique Qualite, Securite et Environnement");
    setSections([]);
    setExpandedEdit(new Set());
    setEditingId(null);
    setEditing(true);
    setSelectedId(null);
  }

  const handleDownloadImage = useCallback(async () => {
    if (!detailRef.current) return;
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(detailRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      const year = selected ? new Date(selected.updated_at).getFullYear() : new Date().getFullYear();
      link.download = `politique-qse-${year}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Silently fail
    } finally {
      setIsDownloading(false);
    }
  }, [selected]);

  // ==========================================
  // EDIT MODE
  // ==========================================
  if (editing) {
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-3 py-1.5 text-sm font-medium text-white shadow-xs transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-sm disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setEditingId(null);
              setShowUpload(false);
            }}
            className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--hover)] active:scale-[0.97]"
          >
            Annuler
          </button>
          {!showUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--navy)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--navy)] shadow-xs transition-all duration-200 hover:bg-[var(--navy)] hover:text-white hover:shadow-sm active:scale-[0.97]"
            >
              <Sparkles className="h-4 w-4 text-[var(--yellow)]" />
              Importer un PDF / Image (IA)
            </button>
          )}
        </div>

        {showUpload && (
          <div className="mb-6 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--hover)] p-5 shadow-xs">
            <h3 className="mb-3 text-sm font-semibold text-[var(--heading)]">
              Import IA — Analysez un PDF ou une image
            </h3>
            <p className="mb-4 text-[12px] text-[var(--text-secondary)]">
              L&apos;IA va analyser votre document et generer automatiquement le
              contenu structure de la politique QSE.
            </p>
            <FileUploadAi
              onAnalysisComplete={handleAiResult}
              type="politique"
              label="Importer votre politique QSE (PDF ou image)"
            />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Titre du document
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-sm font-semibold text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
            />
          </div>

          {sections.map((section, index) => (
            <div
              key={index}
              className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] shadow-xs"
            >
              <button
                onClick={() => toggleEditSection(index)}
                className="flex w-full items-center gap-2 px-5 py-3.5 text-left"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--navy)] text-[9px] font-bold text-white">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-[var(--heading)]">
                  {section.title || "Section sans titre"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(index);
                  }}
                  className="rounded-[var(--radius-xs)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--red-surface)] hover:text-[var(--red)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {expandedEdit.has(index) ? (
                  <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                )}
              </button>
              {expandedEdit.has(index) && (
                <div className="space-y-3 border-t border-[var(--border-1)] px-5 py-4">
                  <input
                    value={section.title}
                    onChange={(e) =>
                      updateSection(index, "title", e.target.value)
                    }
                    placeholder="Titre de la section (ex: QUALITE - Nos engagements)"
                    className="w-full border-b border-[var(--border-1)] pb-1 text-sm font-semibold text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)]"
                  />
                  <textarea
                    value={section.content}
                    onChange={(e) =>
                      updateSection(index, "content", e.target.value)
                    }
                    placeholder="Contenu de la section..."
                    rows={4}
                    className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2.5 text-[12.5px] text-[var(--text)] outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                  />
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addSection}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--border-1)] py-3.5 text-sm text-[var(--text-muted)] transition-all duration-200 hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
          >
            <Plus className="h-4 w-4" />
            Ajouter une section
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // DETAIL VIEW
  // ==========================================
  if (selectedId && selected) {
    const year = new Date(selected.updated_at).getFullYear();
    const hasFile = selected.source_file_url && selected.source_file_url.length > 0;

    return (
      <div>
        {/* Back button */}
        <button
          onClick={() => setSelectedId(null)}
          className="mb-4 flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--heading)]"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Retour a la liste
        </button>

        {/* Admin actions */}
        {canEdit && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => startEditing(selected)}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-3 py-1.5 text-sm font-medium text-white shadow-xs transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-sm active:scale-[0.97]"
            >
              <Edit3 className="h-4 w-4" />
              Modifier
            </button>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--navy)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--navy)] shadow-xs transition-all duration-200 hover:bg-[var(--navy)] hover:text-white hover:shadow-sm active:scale-[0.97]"
            >
              <Sparkles className="h-4 w-4 text-[var(--yellow)]" />
              Reimporter un PDF (IA)
            </button>
          </div>
        )}

        {showUpload && (
          <div className="mb-6 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--hover)] p-5 shadow-xs">
            <FileUploadAi
              onAnalysisComplete={(result) => {
                handleAiResult(result);
                setEditingId(selected.id);
              }}
              type="politique"
              label="Importer votre politique QSE (PDF ou image)"
            />
          </div>
        )}

        {/* Downloadable content */}
        <div ref={detailRef}>
          {/* Hero Banner */}
          <div className="mb-6 overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-[var(--navy)] to-[#2a4a7a] px-8 py-8 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <span className="mb-3 inline-block rounded-full bg-[var(--yellow)]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--yellow)]">
                  Politique QSE {year}
                </span>
                <h2 className="mt-2 text-[22px] font-bold leading-tight text-white">
                  {selected.title}
                </h2>
                <div className="mt-2 flex items-center gap-2 text-[12px] text-white/50">
                  <Calendar className="h-3.5 w-3.5" />
                  Mise a jour le {formatDate(selected.updated_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Introduction */}
          {intro && (
            <div className="mb-6 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] px-6 py-5 shadow-sm">
              <p className="text-[13px] leading-relaxed text-[var(--text)]">
                {intro}
              </p>
            </div>
          )}

          {/* Pillars Grid */}
          {pillars.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {pillars.map((pillar) => (
                <PillarCard key={pillar.key} pillar={pillar} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {selected.sections.map((section, index) => (
                <div
                  key={index}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] p-5 shadow-xs"
                >
                  <h3 className="mb-2 text-[13px] font-semibold text-[var(--heading)]">
                    {section.title}
                  </h3>
                  <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--text)]">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Signature line */}
          <div className="mt-8 border-t border-[var(--border-1)] pt-4 text-center text-[11px] text-[var(--text-muted)]">
            Document mis a jour le {formatDate(selected.updated_at, "d MMMM yyyy")}
          </div>
        </div>

        {/* Download buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white shadow-xs transition-all duration-200 hover:bg-[var(--navy)]/90 hover:shadow-sm disabled:opacity-50"
          >
            <ImageIcon className="h-4 w-4" />
            {isDownloading ? "Generation en cours..." : "Telecharger l'image"}
          </button>
          {hasFile && (
            <a
              href={selected.source_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--heading)] shadow-xs transition-all hover:bg-[var(--hover)]"
            >
              <Download className="h-4 w-4" />
              Telecharger le PDF source
            </a>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // LIST VIEW (always shown by default)
  // ==========================================
  return (
    <div>
      {canEdit && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button
            onClick={startNew}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-3 py-1.5 text-sm font-medium text-white shadow-xs transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-sm active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle politique QSE
          </button>
          <button
            onClick={() => {
              setShowUpload(!showUpload);
              setEditingId(null);
            }}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--navy)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--navy)] shadow-xs transition-all duration-200 hover:bg-[var(--navy)] hover:text-white hover:shadow-sm active:scale-[0.97]"
          >
            <Sparkles className="h-4 w-4 text-[var(--yellow)]" />
            Importer un PDF / Image (IA)
          </button>
        </div>
      )}

      {showUpload && (
        <div className="mb-6 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--hover)] p-5 shadow-xs">
          <h3 className="mb-3 text-sm font-semibold text-[var(--heading)]">
            Import IA — Analysez un PDF ou une image
          </h3>
          <p className="mb-4 text-[12px] text-[var(--text-secondary)]">
            L&apos;IA va analyser votre document et generer automatiquement le
            contenu structure de la politique QSE.
          </p>
          <FileUploadAi
            onAnalysisComplete={handleAiResult}
            type="politique"
            label="Importer votre politique QSE (PDF ou image)"
          />
        </div>
      )}

      {allContent.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--navy)]/10">
            <FileText className="h-8 w-8 text-[var(--navy)]" />
          </div>
          <p className="text-sm font-medium text-[var(--heading)]">
            Aucune politique QSE definie
          </p>
          {canEdit && (
            <p className="mt-1 text-[12px] text-[var(--text-muted)]">
              Utilisez les boutons ci-dessus pour creer une nouvelle politique ou importer un PDF.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {allContent.map((doc) => {
            const year = new Date(doc.updated_at).getFullYear();
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedId(doc.id)}
                className="group flex w-full items-center gap-4 rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] px-5 py-4 text-left shadow-xs transition-all duration-200 hover:shadow-sm hover:border-[var(--yellow)]/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--navy)]">
                  <FileText className="h-5 w-5 text-[var(--yellow)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--heading)] truncate">
                    {doc.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <Calendar className="h-3 w-3" />
                    Mise a jour le {formatDate(doc.updated_at)}
                  </div>
                </div>
                <span className="rounded-full bg-[var(--yellow)] px-3 py-1 text-[11px] font-bold text-white">
                  {year}
                </span>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
