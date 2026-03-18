"use client";

import { useState, useTransition } from "react";
import { Check, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PERMISSION_LABELS, ALL_PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { updateJobTitlePermissions, type JobTitlePermissions } from "@/actions/permissions";
import { cn } from "@/lib/utils";

interface PermissionsMatrixProps {
  initialData: JobTitlePermissions[];
}

export default function PermissionsMatrix({ initialData }: PermissionsMatrixProps) {
  const [data, setData] = useState<JobTitlePermissions[]>(initialData);
  const [modified, setModified] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function togglePermission(jobTitleId: string, permission: PermissionKey) {
    setData((prev) =>
      prev.map((jt) => {
        if (jt.job_title_id !== jobTitleId) return jt;
        const has = jt.permissions.includes(permission);
        return {
          ...jt,
          permissions: has
            ? jt.permissions.filter((p) => p !== permission)
            : [...jt.permissions, permission],
        };
      })
    );
    setModified((prev) => new Set(prev).add(jobTitleId));
  }

  function handleSave() {
    startTransition(async () => {
      const toSave = data.filter((jt) => modified.has(jt.job_title_id));
      let errors = 0;

      for (const jt of toSave) {
        const result = await updateJobTitlePermissions(
          jt.job_title_id,
          jt.permissions as PermissionKey[]
        );
        if (!result.success) {
          toast.error(`Erreur pour ${jt.job_title_label}: ${result.error}`);
          errors++;
        }
      }

      if (errors === 0) {
        toast.success(`Permissions mises à jour pour ${toSave.length} poste(s)`);
        setModified(new Set());
      }
    });
  }

  return (
    <div>
      {/* Header bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Cochez les permissions à attribuer à chaque poste. Les administrateurs ont toujours toutes les permissions.
        </p>
        {modified.size > 0 && (
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Enregistrement…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-3.5 w-3.5" />
                Enregistrer ({modified.size})
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-1)] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-1)] bg-[var(--hover)]">
              <th className="sticky left-0 z-10 bg-[var(--hover)] px-4 py-3 text-xs font-semibold text-[var(--text-muted)]">
                Poste
              </th>
              {ALL_PERMISSIONS.map((perm) => (
                <th
                  key={perm}
                  className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  <div className="min-w-[80px]">
                    {PERMISSION_LABELS[perm]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((jt, index) => {
              const isModified = modified.has(jt.job_title_id);
              return (
                <tr
                  key={jt.job_title_id}
                  className={cn(
                    "border-b border-[var(--border-1)] transition-colors",
                    isModified && "bg-amber-50/50",
                    index % 2 === 0 ? "bg-white" : "bg-[var(--hover)]/30"
                  )}
                >
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      <span className="text-[13px] font-medium text-[var(--heading)] whitespace-nowrap">
                        {jt.job_title_label}
                      </span>
                      {isModified && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600">
                          modifié
                        </span>
                      )}
                    </div>
                  </td>
                  {ALL_PERMISSIONS.map((perm) => {
                    const checked = jt.permissions.includes(perm);
                    return (
                      <td key={perm} className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => togglePermission(jt.job_title_id, perm)}
                          className={cn(
                            "mx-auto flex h-6 w-6 items-center justify-center rounded-md border transition-all duration-150",
                            checked
                              ? "border-[var(--yellow)] bg-[var(--yellow)] text-white shadow-sm"
                              : "border-[var(--border-1)] bg-white text-transparent hover:border-[var(--yellow)]/50 hover:bg-[var(--yellow-surface)]"
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="mt-8 text-center text-sm text-[var(--text-muted)]">
          Aucun poste défini. Créez des postes dans la gestion des utilisateurs pour configurer les permissions.
        </div>
      )}
    </div>
  );
}
