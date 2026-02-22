"use client";

import { useState, useTransition } from "react";
import { Edit3, Save, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import FileUploadAi from "@/components/ai/file-upload-ai";
import { saveQseContent } from "@/actions/qse";
import type { QseContent, QseContentSection } from "@/lib/types/database";

interface PolitiqueContentProps {
  content: QseContent | null;
  canEdit: boolean;
}

export default function PolitiqueContent({ content, canEdit }: PolitiqueContentProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(content?.title ?? "Politique Qualité, Sécurité et Environnement");
  const [sections, setSections] = useState<QseContentSection[]>(
    content?.sections ?? []
  );
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(sections.map((_, i) => i))
  );
  const [isPending, startTransition] = useTransition();
  const [showUpload, setShowUpload] = useState(false);

  function handleAiResult(result: unknown) {
    const data = result as { title?: string; sections?: QseContentSection[] };
    if (data.title) setTitle(data.title);
    if (data.sections && Array.isArray(data.sections)) {
      setSections(data.sections);
      setExpandedSections(new Set(data.sections.map((_: QseContentSection, i: number) => i)));
    }
    setEditing(true);
    setShowUpload(false);
  }

  function addSection() {
    const idx = sections.length;
    setSections([...sections, { title: "", content: "" }]);
    setExpandedSections((prev) => new Set([...prev, idx]));
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function updateSection(index: number, field: keyof QseContentSection, value: string) {
    setSections(
      sections.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function toggleSection(index: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveQseContent("politique", title, sections);
      if (result.success) {
        setEditing(false);
      }
    });
  }

  const isEmpty = sections.length === 0;

  return (
    <div>
      {/* Actions bar */}
      {canEdit && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--yellow)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]"
              >
                <Edit3 className="h-4 w-4" />
                Modifier manuellement
              </button>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-purple-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Importer un PDF / Image (IA)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setTitle(content?.title ?? "Politique Qualité, Sécurité et Environnement");
                  setSections(content?.sections ?? []);
                }}
                className="rounded-[var(--radius-sm)] border border-[var(--border-1)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-gray-50"
              >
                Annuler
              </button>
            </>
          )}
        </div>
      )}

      {/* File upload zone */}
      {showUpload && (
        <div className="mb-6 rounded-[var(--radius)] border border-purple-200 bg-purple-50/30 p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--heading)]">
            Import IA — Analysez un PDF ou une image
          </h3>
          <p className="mb-4 text-[12px] text-[var(--text-secondary)]">
            L&apos;IA va analyser votre document et générer automatiquement le contenu structuré de la politique QSE.
          </p>
          <FileUploadAi
            onAnalysisComplete={handleAiResult}
            type="politique"
            label="Importer votre politique QSE (PDF ou image)"
          />
        </div>
      )}

      {/* Content display/edit */}
      {editing ? (
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              Titre du document
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm font-semibold text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
            />
          </div>

          {/* Sections */}
          {sections.map((section, index) => (
            <div
              key={index}
              className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-white p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--navy)] text-[9px] font-bold text-white">
                  {index + 1}
                </span>
                <input
                  value={section.title}
                  onChange={(e) => updateSection(index, "title", e.target.value)}
                  placeholder="Titre de la section"
                  className="flex-1 border-b border-[var(--border-1)] pb-1 text-sm font-semibold text-[var(--heading)] outline-none focus:border-[var(--yellow)]"
                />
                <button
                  onClick={() => removeSection(index)}
                  className="rounded p-1 text-red-400 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={section.content}
                onChange={(e) => updateSection(index, "content", e.target.value)}
                placeholder="Contenu de la section..."
                rows={4}
                className="w-full resize-none rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-[12.5px] text-[var(--text)] outline-none focus:border-[var(--yellow)]"
              />
            </div>
          ))}

          <button
            onClick={addSection}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--border-1)] py-3 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
          >
            <Plus className="h-4 w-4" />
            Ajouter une section
          </button>
        </div>
      ) : isEmpty ? (
        <div className="rounded-[var(--radius)] border border-[var(--border-1)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Aucun contenu de politique QSE n&apos;a été défini.
          </p>
          {canEdit && (
            <p className="mt-1 text-[12px] text-[var(--text-muted)]">
              Utilisez les boutons ci-dessus pour ajouter du contenu manuellement ou via l&apos;IA.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Title */}
          <h2 className="mb-4 text-lg font-bold text-[var(--heading)]">{title}</h2>

          {/* Sections */}
          {sections.map((section, index) => (
            <div
              key={index}
              className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-white overflow-hidden"
            >
              <button
                onClick={() => toggleSection(index)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-gray-50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-[9px] font-bold text-white">
                  {index + 1}
                </span>
                <span className="flex-1 text-[13px] font-semibold text-[var(--heading)]">
                  {section.title}
                </span>
                {expandedSections.has(index) ? (
                  <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                )}
              </button>
              {expandedSections.has(index) && (
                <div className="border-t border-[var(--border-1)] px-5 py-4">
                  <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--text)]">
                    {section.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
