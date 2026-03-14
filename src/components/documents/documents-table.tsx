"use client";

import {
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  Download,
  Share2,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { DataTable, type ColumnDef, type FilterDef } from "@/components/ui/data-table";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DocItem {
  id: string;
  name: string;
  category: string;
  file_url: string;
  file_size?: number;
  created_at: string;
  uploaded_by_profile?: { first_name: string; last_name: string } | null;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return { icon: FileImage, color: "text-purple-500 bg-purple-50" };
  if (["xls", "xlsx", "csv"].includes(ext))
    return { icon: FileSpreadsheet, color: "text-emerald-500 bg-emerald-50" };
  if (["pdf"].includes(ext))
    return { icon: File, color: "text-red-500 bg-red-50" };
  return { icon: FileText, color: "text-blue-500 bg-blue-50" };
}

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
}

interface DocumentsTableProps {
  documents: DocItem[];
}

export default function DocumentsTable({ documents }: DocumentsTableProps) {
  const categories = [...new Set(documents.map((d) => d.category).filter(Boolean))].sort();

  const columns: ColumnDef<DocItem>[] = [
    {
      key: "icon",
      header: "",
      width: "45px",
      render: (doc) => {
        const { icon: Icon, color } = getFileIcon(doc.name);
        return (
          <div className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius)] ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        );
      },
    },
    {
      key: "name",
      header: "Nom",
      sortable: true,
      render: (doc) => (
        <span className="font-medium text-[var(--heading)]">{doc.name}</span>
      ),
    },
    {
      key: "category",
      header: "Dossier",
      sortable: true,
      render: (doc) => (
        <span className="text-[var(--text-secondary)]">
          {doc.category || "Général"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Modifié le",
      sortable: true,
      width: "140px",
      accessor: (doc) => doc.created_at,
      render: (doc) => (
        <span className="text-[var(--text-muted)]">
          {formatDistanceToNow(new Date(doc.created_at), {
            addSuffix: true,
            locale: fr,
          })}
        </span>
      ),
    },
    {
      key: "file_size",
      header: "Taille",
      width: "90px",
      render: (doc) => (
        <span className="text-[var(--text-muted)]">
          {formatSize(doc.file_size)}
        </span>
      ),
    },
    {
      key: "uploaded_by",
      header: "Partagé par",
      render: (doc) => {
        const profile = doc.uploaded_by_profile;
        return (
          <span className="text-[var(--text-secondary)]">
            {profile ? `${profile.first_name} ${profile.last_name}` : "—"}
          </span>
        );
      },
    },
  ];

  const filters: FilterDef[] = categories.length > 0
    ? [{
        key: "category",
        label: "Dossier",
        type: "select" as const,
        placeholder: "Tous les dossiers",
        options: categories.map((c) => ({ label: c, value: c })),
      }]
    : [];

  return (
    <DataTable
      data={documents}
      columns={columns}
      keyField="id"
      searchable
      searchPlaceholder="Rechercher un document..."
      filters={filters}
      selectable
      batchActions={[
        { label: "Supprimer", onClick: () => {}, variant: "danger" },
      ]}
      emptyState={{
        icon: FolderOpen,
        title: "Aucun document",
        description: "Aucun document n'a été partagé pour le moment.",
      }}
      actions={(doc) => [
        {
          label: "Télécharger",
          icon: Download,
          onClick: () => {
            if (doc.file_url) window.open(doc.file_url, "_blank");
          },
        },
        {
          label: "Partager",
          icon: Share2,
          onClick: () => {},
        },
        {
          label: "Supprimer",
          icon: Trash2,
          onClick: () => {},
          variant: "danger" as const,
        },
      ]}
    />
  );
}
