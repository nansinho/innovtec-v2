"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Image, X, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadAiProps {
  onAnalysisComplete: (result: unknown) => void;
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
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append(
        "prompt",
        type === "politique"
          ? "Analyse ce document de politique QSE et extrais toutes les sections avec leur contenu."
          : "Analyse ce document et extrais les informations pertinentes."
      );

      const res = await fetch("/api/ai/analyze-file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'analyse");
        return;
      }

      onAnalysisComplete(data.result);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
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
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius)] border-2 border-dashed p-8 text-center transition-all",
          isDragging
            ? "border-purple-400 bg-purple-50"
            : file
              ? "border-green-300 bg-green-50"
              : "border-[var(--border-1)] bg-gray-50/50 hover:border-purple-300 hover:bg-purple-50/30"
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
              <Image className="h-8 w-8 text-green-500" />
            ) : (
              <FileText className="h-8 w-8 text-green-500" />
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
      {file && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-medium text-white transition-all hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Analyse en cours..." : "Analyser avec l'IA"}
        </button>
      )}
    </div>
  );
}
