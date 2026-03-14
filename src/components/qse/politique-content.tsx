"use client";

import { useState, useTransition } from "react";
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
  ArrowLeft,
  Eye,
  Upload,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import FileUploadAi from "@/components/ai/file-upload-ai";
import {
  saveQseContent,
  createQseContent,
  deleteQseContent,
  getQseFileDownloadUrl,
} from "@/actions/qse";
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
    gradient: "from-amber-500/10 to-yellow-500/5",
  },
  {
    key: "sante",
    label: "Sante",
    match: ["sant"],
    icon: HeartPulse,
    color: "var(--green)",
    surface: "var(--green-surface)",
    border: "rgba(22, 163, 74, 0.16)",
    gradient: "from-green-500/10 to-emerald-500/5",
  },
  {
    key: "securite",
    label: "Securite",
    match: ["s\u00e9curit", "securit"],
    icon: ShieldCheck,
    color: "var(--blue)",
    surface: "var(--blue-surface)",
    border: "rgba(37, 99, 235, 0.16)",
    gradient: "from-blue-500/10 to-indigo-500/5",
  },
  {
    key: "environnement",
    label: "Environnement",
    match: ["environnement"],
    icon: Leaf,
    color: "var(--navy)",
    surface: "rgba(26, 45, 78, 0.06)",
    border: "rgba(26, 45, 78, 0.16)",
    gradient: "from-slate-500/10 to-gray-500/5",
  },
] as const;

interface Pillar {
  key: string;
  label: string;
  icon: typeof Award;
  color: string;
  surface: string;
  border: string;
  gradient: string;
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
    gradient: p.gradient,
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
      className={cn(
        "group/pillar overflow-hidden rounded-[var(--radius)] border bg-[var(--card)] shadow-sm",
        "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      )}
      style={{ borderColor: pillar.border }}
    >
      {/* Header with gradient accent */}
      <div className={cn("relative flex items-center gap-3 px-5 py-4 bg-gradient-to-r", pillar.gradient)}>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover/pillar:scale-110"
          style={{ background: pillar.surface }}
        >
          <Icon className="h-5 w-5" style={{ color: pillar.color }} />
        </div>
        <h3 className="text-[15px] font-bold uppercase tracking-wide text-[var(--heading)]">
          {pillar.label}
        </h3>
        {/* Decorative accent bar */}
        <div
          className="absolute bottom-0 left-5 right-5 h-[2px] rounded-full opacity-30"
          style={{ background: pillar.color }}
        />
      </div>

      {/* Engagements */}
      {pillar.engagements.length > 0 && (
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-1 w-6 rounded-full"
              style={{ background: pillar.color }}
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              Nos engagements
            </span>
          </div>
          <ul className="space-y-2.5">
            {pillar.engagements.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-[var(--text)]">
                <span
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-200"
                  style={{ background: pillar.color }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Objectifs */}
      {pillar.objectifs.length > 0 && (
        <div className="mx-4 mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--navy)] to-[#1e3a5f] px-4 py-4 shadow-inner">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[var(--yellow)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">
              Nos objectifs
            </span>
          </div>
          <ul className="space-y-2">
            {pillar.objectifs.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-white/90">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--yellow)]" />
                <span>{item}</span>
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
  fileUrls?: Record<string, string>;
}

export default function PolitiqueContent({
  content,
  allContent,
  canEdit,
  fileUrls = {},
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
  const [sourceFileUrl, setSourceFileUrl] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showUpload, setShowUpload] = useState(false);
  const [expandedEdit, setExpandedEdit] = useState<Set<number>>(
    new Set(sections.map((_, i) => i))
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();

  const selected = allContent.find((c) => c.id === selectedId) ?? null;
  const { pillars, intro } = selected
    ? parsePillars(selected.sections)
    : { pillars: [], intro: "" };

  function getDocYear(doc: QseContent): number {
    return doc.year ?? new Date(doc.updated_at).getFullYear();
  }

  function handleAiResult(result: unknown, fileUrl?: string) {
    const data = result as { title?: string; year?: number; sections?: QseContentSection[] };
    if (data.title) setTitle(data.title);
    if (data.year) setYear(data.year);
    if (data.sections && Array.isArray(data.sections)) {
      setSections(data.sections);
      setExpandedEdit(
        new Set(data.sections.map((_: QseContentSection, i: number) => i))
      );
    }
    if (fileUrl) setSourceFileUrl(fileUrl);
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

  function updateSection(index: number, field: keyof QseContentSection, value: string) {
    setSections(sections.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
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
        result = await saveQseContent("politique", title, sections, sourceFileUrl || undefined, editingId, year);
      } else {
        result = await createQseContent("politique", title, sections, sourceFileUrl || undefined, year);
      }
      if (result.success) {
        setEditing(false);
        setEditingId(null);
        setSourceFileUrl("");
        setYear(null);
        router.refresh();
      }
    });
  }

  function startEditing(doc: QseContent) {
    setTitle(doc.title);
    setSections(doc.sections);
    setExpandedEdit(new Set(doc.sections.map((_, i) => i)));
    setEditingId(doc.id);
    setYear(doc.year ?? null);
    setSourceFileUrl(doc.source_file_url ?? "");
    setEditing(true);
    setSelectedId(null);
  }

  function startNew() {
    setTitle("Politique Qualite, Securite et Environnement");
    setSections([]);
    setExpandedEdit(new Set());
    setEditingId(null);
    setYear(new Date().getFullYear());
    setSourceFileUrl("");
    setEditing(true);
    setSelectedId(null);
  }

  function handleDelete(id: string, docTitle: string) {
    if (!window.confirm(`Supprimer la politique "${docTitle}" ? Cette action est irreversible.`)) return;
    startTransition(async () => {
      const result = await deleteQseContent(id);
      if (result.success) {
        if (selectedId === id) setSelectedId(null);
        router.refresh();
      }
    });
  }

  async function handleDownloadFile(filePath: string) {
    setIsDownloading(true);
    try {
      const { url, error } = await getQseFileDownloadUrl(filePath);
      if (url) window.open(url, "_blank");
      else if (error) console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  }

  // ==========================================
  // EDIT MODE
  // ==========================================
  if (editing) {
    return (
      <div className="space-y-5">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--yellow)] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-md active:scale-[0.97] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            onClick={() => { setEditing(false); setEditingId(null); setShowUpload(false); }}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-1)] bg-[var(--card)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--hover)] hover:shadow-sm active:scale-[0.97]"
          >
            Annuler
          </button>
          {!showUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--navy)]/20 bg-[var(--navy)]/5 px-4 py-2 text-[13px] font-medium text-[var(--navy)] transition-all duration-200 hover:bg-[var(--navy)] hover:text-white hover:shadow-sm active:scale-[0.97]"
            >
              <Sparkles className="h-4 w-4 text-[var(--yellow)]" />
              Importer un PDF / Image (IA)
            </button>
          )}
        </div>

        {/* Upload zone */}
        {showUpload && (
          <div className="rounded-2xl border border-[var(--border-1)] bg-gradient-to-b from-[var(--card)] to-[var(--hover)] p-6 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <Upload className="h-4 w-4 text-[var(--yellow)]" />
              <h3 className="text-sm font-semibold text-[var(--heading)]">Import IA</h3>
            </div>
            <p className="mb-4 text-[12px] text-[var(--text-muted)]">
              L&apos;IA va analyser votre document et generer automatiquement le contenu structure.
            </p>
            <FileUploadAi onAnalysisComplete={handleAiResult} type="politique" label="Importer votre politique QSE (PDF ou image)" />
          </div>
        )}

        {/* Form */}
        <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--card)] shadow-sm">
          {/* Year + Title header */}
          <div className="flex gap-4 border-b border-[var(--border-1)] p-5">
            <div className="w-28 shrink-0">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Annee</label>
              <input
                type="number"
                min={2000}
                max={2100}
                value={year ?? new Date().getFullYear()}
                onChange={(e) => setYear(parseInt(e.target.value) || null)}
                className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2 text-sm font-semibold text-[var(--heading)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Titre du document</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2 text-sm font-semibold text-[var(--heading)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
              />
            </div>
          </div>

          {/* Sections */}
          <div className="divide-y divide-[var(--border-1)]">
            {sections.map((section, index) => (
              <div key={index}>
                <button
                  onClick={() => toggleEditSection(index)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--hover)]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--navy)] text-[10px] font-bold text-white shadow-sm">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-[13px] font-semibold text-[var(--heading)]">
                    {section.title || "Section sans titre"}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSection(index); }}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-all hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {expandedEdit.has(index) ? (
                    <ChevronDown className="h-4 w-4 text-[var(--text-muted)] transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)] transition-transform" />
                  )}
                </button>
                {expandedEdit.has(index) && (
                  <div className="space-y-3 bg-[var(--bg)] px-5 py-4">
                    <input
                      value={section.title}
                      onChange={(e) => updateSection(index, "title", e.target.value)}
                      placeholder="Titre de la section (ex: QUALITE - Nos engagements)"
                      className="w-full rounded-lg border border-[var(--border-1)] bg-[var(--card)] px-3 py-2 text-sm font-semibold text-[var(--heading)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                    />
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(index, "content", e.target.value)}
                      placeholder="Contenu de la section..."
                      rows={4}
                      className="w-full resize-none rounded-lg border border-[var(--border-1)] bg-[var(--card)] px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--text)] outline-none transition-all focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add section button */}
          <div className="p-4">
            <button
              onClick={addSection}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-1)] py-3 text-[13px] font-medium text-[var(--text-muted)] transition-all duration-200 hover:border-[var(--yellow)] hover:bg-[var(--yellow-surface)] hover:text-[var(--yellow)]"
            >
              <Plus className="h-4 w-4" />
              Ajouter une section
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // DETAIL VIEW
  // ==========================================
  if (selectedId && selected) {
    const docYear = getDocYear(selected);
    const hasFile = selected.source_file_url && selected.source_file_url.length > 0;
    const imageUrl = fileUrls[selected.id] || null;

    return (
      <div className="space-y-5">
        {/* Navigation + actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--hover)] hover:text-[var(--heading)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEditing(selected)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--yellow)] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-md active:scale-[0.97]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Modifier
              </button>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--navy)]/20 bg-[var(--navy)]/5 px-3.5 py-1.5 text-[13px] font-medium text-[var(--navy)] transition-all duration-200 hover:bg-[var(--navy)] hover:text-white active:scale-[0.97]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Reimporter
              </button>
              <button
                onClick={() => handleDelete(selected.id, selected.title)}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3.5 py-1.5 text-[13px] font-medium text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.97] disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>
          )}
        </div>

        {showUpload && (
          <div className="rounded-2xl border border-[var(--border-1)] bg-gradient-to-b from-[var(--card)] to-[var(--hover)] p-6 shadow-sm">
            <FileUploadAi
              onAnalysisComplete={(result, fileUrl) => { handleAiResult(result, fileUrl); setEditingId(selected.id); }}
              type="politique"
              label="Importer votre politique QSE (PDF ou image)"
            />
          </div>
        )}

        {/* Content: image or structured view */}
        {imageUrl ? (
          <div className="space-y-4">
            {/* Original imported image */}
            <div className="overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--card)] shadow-lg transition-shadow duration-300 hover:shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={selected.title} className="w-full h-auto" />
            </div>

            {/* Actions below image */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleDownloadFile(selected.source_file_url)}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--navy)] to-[#2a4a7a] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? "Chargement..." : "Telecharger le document"}
              </button>
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <Calendar className="h-3 w-3" />
                Mis a jour le {formatDate(selected.updated_at, "d MMMM yyyy")}
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--navy)] via-[#1e3a5f] to-[#2a4a7a] px-8 py-10 shadow-lg">
              {/* Decorative circles */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
              <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-[var(--yellow)]/10" />

              <div className="relative">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--yellow)]/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--yellow)] backdrop-blur-sm">
                  <Award className="h-3 w-3" />
                  Politique QSE {docYear}
                </span>
                <h2 className="mt-3 text-2xl font-bold leading-tight text-white">
                  {selected.title}
                </h2>
                <div className="mt-3 flex items-center gap-2 text-[12px] text-white/40">
                  <Calendar className="h-3.5 w-3.5" />
                  Mise a jour le {formatDate(selected.updated_at, "d MMMM yyyy")}
                </div>
              </div>
            </div>

            {/* Introduction */}
            {intro && (
              <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--card)] px-6 py-5 shadow-sm">
                <p className="text-[13px] leading-[1.7] text-[var(--text)]">
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
                    className="rounded-2xl border border-[var(--border-1)] bg-[var(--card)] p-5 shadow-xs transition-shadow hover:shadow-sm"
                  >
                    <h3 className="mb-2 text-[13px] font-semibold text-[var(--heading)]">{section.title}</h3>
                    <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--text)]">{section.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-[var(--border-1)] pt-4 text-center text-[11px] text-[var(--text-muted)]">
              Document mis a jour le {formatDate(selected.updated_at, "d MMMM yyyy")}
            </div>
          </>
        )}
      </div>
    );
  }

  // ==========================================
  // LIST VIEW
  // ==========================================
  return (
    <div className="space-y-5">
      {/* Actions */}
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--yellow)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[var(--yellow-hover)] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle politique QSE
          </button>
          <button
            onClick={() => { setShowUpload(!showUpload); setEditingId(null); }}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--navy)]/20 bg-[var(--navy)]/5 px-4 py-2.5 text-[13px] font-medium text-[var(--navy)] transition-all duration-200 hover:bg-[var(--navy)] hover:text-white hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <Sparkles className="h-4 w-4 text-[var(--yellow)]" />
            Importer un PDF / Image (IA)
          </button>
        </div>
      )}

      {showUpload && (
        <div className="rounded-2xl border border-[var(--border-1)] bg-gradient-to-b from-[var(--card)] to-[var(--hover)] p-6 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--yellow)]" />
            <h3 className="text-sm font-semibold text-[var(--heading)]">Import IA</h3>
          </div>
          <p className="mb-4 text-[12px] text-[var(--text-muted)]">
            L&apos;IA va analyser votre document et generer automatiquement le contenu structure.
          </p>
          <FileUploadAi onAnalysisComplete={handleAiResult} type="politique" label="Importer votre politique QSE (PDF ou image)" />
        </div>
      )}

      {/* Counter */}
      {allContent.length > 0 && (
        <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
          <FileText className="h-3.5 w-3.5" />
          <span>{allContent.length} politique{allContent.length > 1 ? "s" : ""} QSE</span>
        </div>
      )}

      {/* Empty state */}
      {allContent.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] py-16 text-center shadow-sm">
          <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--border-1)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Aucune politique QSE
          </p>
          {canEdit && (
            <p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed text-[var(--text-muted)]">
              Creez une nouvelle politique ou importez un PDF/image pour commencer.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allContent.map((doc) => {
            const docYear = getDocYear(doc);
            const hasThumb = !!fileUrls[doc.id];
            const docPillars = parsePillars(doc.sections).pillars;

            return (
              <button
                key={doc.id}
                onClick={() => setSelectedId(doc.id)}
                className="group relative flex flex-col items-center overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] px-4 pb-5 pt-6 text-center shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-[var(--yellow)]/40 hover:shadow-md"
              >
                {/* Year badge - top right */}
                <div className="absolute right-2.5 top-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--yellow)] to-[#ffb840] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {docYear}
                  </span>
                </div>

                {/* Admin actions - top left, visible on hover */}
                {canEdit && (
                  <div className="absolute left-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span
                      onClick={(e) => { e.stopPropagation(); startEditing(doc); }}
                      className="rounded-full bg-[var(--hover)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--yellow-surface)] hover:text-[var(--yellow)]"
                    >
                      <Edit3 className="h-3 w-3" />
                    </span>
                    <span
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.title); }}
                      className="rounded-full bg-[var(--hover)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </span>
                  </div>
                )}

                {/* Visual focal point: thumbnail or icon */}
                {hasThumb ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-[var(--border-1)] shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fileUrls[doc.id]} alt={doc.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--navy)] to-[#2a4a7a] shadow-sm">
                    <Award className="h-8 w-8 text-[var(--yellow)]" />
                  </div>
                )}

                {/* Title */}
                <p className="mt-3.5 text-[13px] font-semibold leading-tight text-[var(--heading)] line-clamp-2">
                  {doc.title}
                </p>

                {/* Date */}
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <Calendar className="h-3 w-3" />
                  {formatDate(doc.updated_at)}
                </p>

                {/* Pillar mini-badges */}
                {docPillars.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {docPillars.map((p) => {
                      const Icon = p.icon;
                      return (
                        <span
                          key={p.key}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
                          style={{ background: p.surface, color: p.color }}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {p.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* "View" hint on hover */}
                <div className="mt-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="rounded-full bg-[var(--hover)] px-3 py-1 text-[10px] font-medium text-[var(--text-secondary)] transition-colors group-hover:bg-[var(--yellow-surface)] group-hover:text-[var(--yellow)]">
                    <Eye className="mr-1 inline h-3 w-3" />
                    Voir le detail
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
