"use client";

import Image from "next/image";
import { FileText, Download, X, Image as ImageIcon, File } from "lucide-react";
import type { InternalMessage } from "@/lib/types/database";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function isImageType(type: string | null | undefined): boolean {
  return !!type && type.startsWith("image/");
}

function getFileIcon(type: string | null | undefined) {
  if (isImageType(type)) return ImageIcon;
  return FileText;
}

// ─── Inline preview inside message bubble ────────────────────────────

interface FilePreviewInlineProps {
  message: InternalMessage;
  isMine: boolean;
}

export function FilePreviewInline({ message, isMine }: FilePreviewInlineProps) {
  if (!message.file_url) return null;

  if (isImageType(message.file_type)) {
    return (
      <a
        href={message.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative mb-1 block overflow-hidden rounded-lg"
      >
        <Image
          src={message.file_url}
          alt={message.file_name || "Image"}
          width={260}
          height={200}
          className="max-w-[260px] rounded-lg object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          style={{ height: "auto" }}
          unoptimized
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 transition-colors duration-200 group-hover:bg-black/10">
          <span className="text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Ouvrir
          </span>
        </div>
      </a>
    );
  }

  // Document / PDF / Other
  const Icon = getFileIcon(message.file_type);
  return (
    <a
      href={message.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mb-1 flex items-center gap-2.5 rounded-lg p-2.5 transition-colors ${
        isMine
          ? "bg-white/15 hover:bg-white/25"
          : "bg-gray-200/60 hover:bg-gray-200"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isMine ? "bg-white/20" : "bg-white"
        }`}
      >
        <Icon className={`h-4.5 w-4.5 ${isMine ? "text-white" : "text-[var(--navy)]"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xs font-medium ${
            isMine ? "text-white" : "text-[var(--heading)]"
          }`}
        >
          {message.file_name || "Fichier"}
        </p>
        {message.file_size && (
          <p
            className={`text-[10px] ${
              isMine ? "text-white/60" : "text-[var(--text-muted)]"
            }`}
          >
            {formatFileSize(message.file_size)}
          </p>
        )}
      </div>
      <Download
        className={`h-4 w-4 shrink-0 ${
          isMine ? "text-white/70" : "text-[var(--text-muted)]"
        }`}
      />
    </a>
  );
}

// ─── Upload preview above input ──────────────────────────────────────

interface StagedFile {
  file: File;
  url: string;
  name: string;
  type: string;
  size: number;
}

interface FileUploadPreviewProps {
  stagedFile: StagedFile;
  onRemove: () => void;
}

export function FileUploadPreview({ stagedFile, onRemove }: FileUploadPreviewProps) {
  const Icon = getFileIcon(stagedFile.type);

  return (
    <div className="mx-4 mb-2 flex items-center gap-2.5 rounded-xl border border-[var(--border-1)] bg-gray-50 px-3 py-2.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
      {isImageType(stagedFile.type) ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={stagedFile.url}
            alt={stagedFile.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--navy)]/10">
          <Icon className="h-5 w-5 text-[var(--navy)]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-[var(--heading)]">
          {stagedFile.name}
        </p>
        <p className="text-[10px] text-[var(--text-muted)]">
          {formatFileSize(stagedFile.size)}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-gray-200 hover:text-[var(--heading)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Upload loading indicator ────────────────────────────────────────

export function FileUploadLoading() {
  return (
    <div className="mx-4 mb-2 flex items-center gap-2.5 rounded-xl border border-[var(--border-1)] bg-gray-50 px-3 py-2.5 animate-in fade-in duration-150">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--yellow)]/10">
        <File className="h-5 w-5 animate-pulse text-[var(--yellow)]" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-[var(--heading)]">
          Envoi en cours...
        </p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full animate-pulse rounded-full bg-[var(--yellow)]" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Helper to get conversation preview text ─────────────────────────

export function getMessagePreview(
  msg: InternalMessage,
  isMine: boolean
): string {
  const prefix = isMine ? "Vous : " : "";

  if (msg.file_url && !msg.content) {
    if (isImageType(msg.file_type)) return `${prefix}📷 Photo`;
    return `${prefix}📎 ${msg.file_name || "Fichier"}`;
  }

  if (msg.file_url && msg.content) {
    return `${prefix}📎 ${msg.content}`;
  }

  return `${prefix}${msg.content}`;
}
