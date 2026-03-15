import { Archive, Upload, Download, Columns3 } from "lucide-react";
import type { ToolbarAction } from "@/components/ui/data-table";
import { toast } from "sonner";

export function getStandardToolbarActions(callbacks?: {
  onArchives?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onColumns?: () => void;
}): ToolbarAction[] {
  const noop = () => toast.info("Bientôt disponible");

  return [
    { label: "Archives", icon: Archive, onClick: callbacks?.onArchives ?? noop },
    { label: "Importer", icon: Upload, onClick: callbacks?.onImport ?? noop },
    { label: "Exporter", icon: Download, onClick: callbacks?.onExport ?? noop },
    { label: "Colonnes", icon: Columns3, onClick: callbacks?.onColumns ?? noop },
  ];
}
