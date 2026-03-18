"use client";

import { useMemo } from "react";
import {
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Share2,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { DataTable, type ColumnDef, type FilterDef } from "@/components/ui/data-table";
import { getStandardToolbarActions } from "@/lib/table-toolbar-actions";
import { createReferenceMap } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { deleteDocument, batchDeleteDocuments, type UnifiedDocument } from "@/actions/documents";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type DocItem = UnifiedDocument;

function getFileIcon(name: string, category?: string) {
  if (category === "rex") {
    return { icon: FileText, color: "text-[#0B3655] bg-[#0B3655]/10" };
  }
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return { icon: FileImage, color: "text-purple-500 bg-purple-50" };
  if (["xls", "xlsx", "csv"].includes(ext))
    return { icon: FileSpreadsheet, color: "text-emerald-500 bg-emerald-50" };
  if (["pdf"].includes(ext))
    return { icon: File, color: "text-[#0B3655] bg-[#0B3655]/10" };
  return { icon: FileText, color: "text-[#0B3655] bg-[#0B3655]/10" };
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
  const router = useRouter();
  const refMap = useMemo(() => createReferenceMap(documents, "DOC"), [documents]);
  const categories = [...new Set(documents.map((d) => d.category).filter(Boolean))].sort();

  async function handleDelete(doc: DocItem) {
    if (!confirm(`Supprimer "${doc.name}" ?`)) return;
    const result = await deleteDocument(doc.id);
    if (result.success) {
      toast.success("Document supprimé");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  }

  async function handleBatchDelete(ids: string[]) {
    if (!confirm(`Supprimer ${ids.length} document(s) ?`)) return;
    const result = await batchDeleteDocuments(ids);
    if (result.success) {
      toast.success(`${ids.length} document(s) supprimé(s)`);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  }

  const columns: ColumnDef<DocItem>[] = [
    {
      key: "index",
      header: "ID",
      width: "120px",
      render: (item) => <span className="text-[var(--text-muted)]">{refMap.get(item.id)}</span>,
    },
    {
      key: "icon",
      header: "",
      width: "45px",
      render: (doc) => {
        const { icon: Icon, color } = getFileIcon(doc.name, doc.category);
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
      title="Documents"
      description="Tous les documents de l'entreprise : plans, rapports, procédures..."
      toolbarActions={getStandardToolbarActions()}
      searchable
      searchPlaceholder="Rechercher un document..."
      filters={filters}
      selectable
      batchActions={[
        {
          label: "Supprimer",
          onClick: (selectedIds) => handleBatchDelete(selectedIds as string[]),
          variant: "danger",
        },
      ]}
      emptyState={{
        icon: FolderOpen,
        title: "Aucun document",
        description: "Aucun document n'a été partagé pour le moment.",
      }}
      onRowClick={(doc) => {
        if (doc.category === "rex" && doc.internal_link) {
          router.push(doc.internal_link);
        } else if (doc.file_url?.startsWith("/")) {
          router.push(doc.file_url);
        }
      }}
      actions={(doc) => {
        const isRex = !!doc.internal_link;
        return [
        {
          label: isRex ? "Ouvrir le REX" : "Télécharger",
          icon: isRex ? ExternalLink : Download,
          onClick: () => {
            if (isRex) {
              router.push(doc.internal_link!);
            } else if (doc.file_url) {
              window.open(doc.file_url, "_blank");
            }
          },
        },
        {
          label: "Partager",
          icon: Share2,
          onClick: () => {
            navigator.clipboard.writeText(window.location.origin + "/documents");
            toast.success("Lien copié");
          },
        },
        ...(!isRex ? [{
          label: "Supprimer",
          icon: Trash2,
          onClick: () => handleDelete(doc),
          variant: "danger" as const,
        }] : []),
      ];
      }}
    />
  );
}
