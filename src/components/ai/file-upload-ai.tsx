"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Image, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import AiAnalysisProgress from "./ai-analysis-progress";

interface FileUploadAiProps {
  onAnalysisComplete: (result: unknown, fileUrl?: string, extractedImages?: { section: string; url: string }[]) => void;
  type: string;
  acceptTypes?: string;
  label?: string;
}

export default function FileUploadAi({
  onAnalysisComplete,
  type,
  acceptTypes = ".pdf,.png,.jpg,.jpeg,.webp",
  label = "Importer un document",
}: FileUploadAiProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const analysisResultRef = useRef<{ result: unknown; fileUrl?: string; extractedImages?: { section: string; url: string }[] } | null>(null);

  const handleFile = useCallback((f: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (f.size > maxSize) {
      setError("Le fichier est trop volumineux (max 10 Mo)");
      return;
    }

    const validTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];
    if (!validTypes.includes(f.type)) {
      setError("Format non supporté. Utilisez PDF, PNG, JPG ou WebP");
      return;
    }

    setFile(f);
    setError("");
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function handleAnalyze() {
    if (!file) return;

    setLoading(true);
    setAnalysisComplete(false);
    setError("");
    analysisResultRef.current = null;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const promptByType: Record<string, string> = {
        politique: "Analyse ce document de politique QSE et extrais toutes les sections avec leur contenu.",
        rex: "Analyse cette fiche REX (Retour d'Expérience) et extrais toutes les informations structurées : faits, causes, actions engagées, vigilance, type d'événement, etc.",
        bonne_pratique: "Analyse ce document de bonne pratique et extrais toutes les informations : titre, description, pilier QSE, catégorie, difficulté, priorité, impacts (coûts, environnemental, sécurité), chantier.",
      };
      formData.append("prompt", promptByType[type] || "Analyse ce document et extrais les informations pertinentes.");

      const res = await fetch("/api/ai/analyze-file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'analyse");
        setLoading(false);
        return;
      }

      // Store result and trigger completion animation
      analysisResultRef.current = { result: data.result, fileUrl: data.fileUrl, extractedImages: data.extractedImages };
      setAnalysisComplete(true);
    } catch {
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  }

  function handleAllStepsDone() {
    const stored = analysisResultRef.current;
    setLoading(false);
    setAnalysisComplete(false);
    if (stored) {
      onAnalysisComplete(stored.result, stored.fileUrl, stored.extractedImages);
      analysisResultRef.current = null;
    }
  }

  const isImage = file?.type.startsWith("image/");

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !loading && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center gap-3 rounded-[var(--radius)] border-2 border-dashed p-8 text-center transition-all",
          loading
            ? "pointer-events-none border-[var(--border-1)] opacity-50"
            : "cursor-pointer",
          !loading && isDragging
            ? "border-[var(--yellow)] bg-[var(--yellow-surface)]"
            : !loading && file
              ? "border-[var(--green)]/30 bg-[var(--green-surface)]"
              : !loading
                ? "border-[var(--border-1)] bg-[var(--hover)] hover:border-[var(--yellow)]/50 hover:bg-[var(--yellow-surface)]"
                : ""
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {file ? (
          <>
            {isImage ? (
              <Image className="h-8 w-8 text-[var(--green)]" />
            ) : (
              <FileText className="h-8 w-8 text-[var(--green)]" />
            )}
            <div>
              <p className="text-sm font-medium text-[var(--heading)]">
                {file.name}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {(file.size / 1024).toFixed(0)} Ko —{" "}
                {isImage ? "Image" : "PDF"}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="rounded-full bg-gray-200 p-1 text-gray-500 hover:bg-gray-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-[var(--text-muted)]" />
            <div>
              <p className="text-sm font-medium text-[var(--heading)]">
                {label}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Glissez-déposez un PDF ou une image, ou cliquez pour parcourir
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-red-500">{error}</p>
      )}

      {/* Analyze button */}
      {file && !loading && (
        <button
          onClick={handleAnalyze}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--navy)] py-2 text-sm font-medium text-white transition-all hover:bg-[var(--navy)]/90 active:scale-[0.97]"
        >
          <Sparkles className="h-4 w-4" />
          Analyser avec l&apos;IA
        </button>
      )}

      {/* Step-by-step progress */}
      {loading && (
        <AiAnalysisProgress
          isActive={loading}
          isComplete={analysisComplete}
          onAllStepsDone={handleAllStepsDone}
        />
      )}
    </div>
  );
}
