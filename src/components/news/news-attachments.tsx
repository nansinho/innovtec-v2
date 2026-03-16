"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Image as ImageIcon,
  File,
  Upload,
  X,
  Download,
  Loader2,
} from "lucide-react";
import type { NewsAttachment } from "@/lib/types/database";

interface AttachmentUploadProps {
  attachments: NewsAttachment[];
  onAdd: (attachment: {
    file_name: string;
    file_url: string;
    file_size: number;
    file_type: string;
  }) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
}

const fileIcons: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "image/jpeg": ImageIcon,
  "image/png": ImageIcon,
  "image/webp": ImageIcon,
  "application/msword": File,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    File,
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileExtension(type: string): string {
  const map: Record<string, string> = {
    "application/pdf": "PDF",
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
  };
  return map[type] || "Fichier";
}

export default function NewsAttachmentsManager({
  attachments,
  onAdd,
  onRemove,
  readOnly = false,
}: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(
    async (files: FileList) => {
      setUploading(true);
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "news-attachments");

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.url) {
            onAdd({
              file_name: file.name,
              file_url: data.url,
              file_size: file.size,
              file_type: file.type,
            });
          }
        } catch {
          // Upload failed
        }
      }
      setUploading(false);
    },
    [onAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload]
  );

  return (
    <div>
      {/* Upload zone */}
      {!readOnly && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 transition-colors ${
            dragOver
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 hover:border-gray-100 hover:bg-gray-50"
          }`}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept =
              ".pdf,.jpg,.jpeg,.png,.docx,.doc,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) handleUpload(files);
            };
            input.click();
          }}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          ) : (
            <Upload className="h-6 w-6 text-gray-400" />
          )}
          <p className="text-[12px] text-gray-500">
            {uploading
              ? "Téléchargement en cours..."
              : "Glissez vos fichiers ici ou cliquez pour parcourir"}
          </p>
          <p className="text-[10px] text-gray-400">
            PDF, JPG, PNG, DOCX — Max 10 Mo
          </p>
        </div>
      )}

      {/* Files list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => {
            const Icon = fileIcons[att.file_type] || File;
            return (
              <div
                key={att.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white">
                  <Icon className="h-4.5 w-4.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-gray-900">
                    {att.file_name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {getFileExtension(att.file_type)}
                    {att.file_size ? ` • ${formatFileSize(att.file_size)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-blue-600"
                    title="Télécharger"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => onRemove(att.id)}
                      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Supprimer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Read-only display for detail page
export function NewsAttachmentsDisplay({
  attachments,
}: {
  attachments: NewsAttachment[];
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-3.5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <FileText className="h-4 w-4" />
          Pièces jointes ({attachments.length})
        </h3>
      </div>
      <div className="divide-y divide-gray-200">
        {attachments.map((att) => {
          const Icon = fileIcons[att.file_type] || File;
          return (
            <a
              key={att.id}
              href={att.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-50">
                <Icon className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[12.5px] font-medium text-gray-900">
                  {att.file_name}
                </p>
                <p className="text-[10px] text-gray-400">
                  {getFileExtension(att.file_type)}
                  {att.file_size ? ` • ${formatFileSize(att.file_size)}` : ""}
                </p>
              </div>
              <Download className="h-4 w-4 shrink-0 text-gray-400" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
