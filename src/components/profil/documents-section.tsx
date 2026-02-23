"use client";

import { FileText, Download } from "lucide-react";
import type { Document } from "@/lib/types/database";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DocumentsSection({
  documents,
}: {
  documents: Document[];
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
          <FileText className="h-[18px] w-[18px] text-orange-500" />
        </div>
        <h2 className="text-sm font-semibold text-[var(--heading)]">
          Mes documents
        </h2>
      </div>

      {documents.length === 0 ? (
        <p className="py-4 text-center text-xs text-[var(--text-secondary)]">
          Aucun document synchronisé.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] p-4 shadow-xs transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--hover)] text-[10px] font-semibold uppercase text-[var(--text-secondary)]">
                  {doc.file_type}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--heading)]">
                    {doc.name}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {formatFileSize(doc.file_size)} —{" "}
                    {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>
              <Download className="h-4 w-4 text-[var(--text-muted)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
