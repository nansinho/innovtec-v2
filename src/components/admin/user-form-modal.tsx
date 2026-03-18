"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createUser, updateUser } from "@/actions/users";
import { addJobTitle, deleteJobTitle, type JobTitle } from "@/actions/job-titles";
import { addDepartment, deleteDepartment, type Department } from "@/actions/departments";
import { addTeam, deleteTeam, type Team } from "@/actions/teams";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Profile, UserRole, TeamWithMembers } from "@/lib/types/database";
import { Button } from "@/components/ui/button";

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "collaborateur", label: "Collaborateur" },
  { value: "admin", label: "Admin" },
];

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: Profile | null;
  jobTitles?: JobTitle[];
  departments?: Department[];
  teams?: Team[];
  teamsWithMembers?: TeamWithMembers[];
  allUsers?: Profile[];
  currentUserRole?: string;
}

export default function UserFormModal({
  open,
  onClose,
  user,
  jobTitles = [],
  departments = [],
  teams = [],
  teamsWithMembers = [],
  allUsers = [],
  currentUserRole = "collaborateur",
}: UserFormModalProps) {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "collaborateur" as UserRole,
    job_title: "",
    phone: "",
    gender: "" as "" | "M" | "F",
    department: "",
    team: "",
    agency: "Siège",
    date_of_birth: "",
    hire_date: "",
    manager_id: "",
  });

  // Local lists (updated optimistically when creating/deleting items)
  const [localJobTitles, setLocalJobTitles] = useState(jobTitles);
  const [localDepartments, setLocalDepartments] = useState(departments);
  const [localTeams, setLocalTeams] = useState(teams);

  useEffect(() => {
    setLocalJobTitles(jobTitles);
    setLocalDepartments(departments);
    setLocalTeams(teams);
  }, [jobTitles, departments, teams]);

  useEffect(() => {
    if (user) {
      // Resolve team from team_members if available, fallback to profiles.team
      let teamLabel = user.team || "";
      if (teamsWithMembers.length > 0) {
        const memberTeam = teamsWithMembers.find((t) =>
          t.members.some((m) => m.user_id === user.id)
        );
        if (memberTeam) {
          teamLabel = memberTeam.label;
        }
      }
      setForm({
        email: user.email,
        password: "",
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        job_title: user.job_title || "",
        phone: user.phone || "",
        gender: user.gender || "",
        department: user.department || "",
        team: teamLabel,
        agency: user.agency || "Siège",
        date_of_birth: user.date_of_birth || "",
        hire_date: user.hire_date || "",
        manager_id: user.manager_id || "",
      });
    } else {
      setForm({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "collaborateur",
        job_title: "",
        phone: "",
        gender: "",
        department: "",
        team: "",
        agency: "Siège",
        date_of_birth: "",
        hire_date: "",
        manager_id: "",
      });
    }
  }, [user, open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose, loading]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && user) {
        const result = await updateUser(user.id, {
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role,
          job_title: form.job_title,
          phone: form.phone,
          gender: form.gender,
          department: form.department,
          team: form.team,
          agency: form.agency,
          date_of_birth: form.date_of_birth || null,
          hire_date: form.hire_date || null,
          manager_id: form.manager_id || null,
        });
        if (result.success) {
          toast.success(`${form.first_name} ${form.last_name} mis à jour`);
          onClose();
        } else {
          toast.error(result.error || "Erreur lors de la modification");
        }
      } else {
        const result = await createUser(form);
        if (result.success) {
          toast.success(`${form.first_name} ${form.last_name} créé avec succès`);
          onClose();
        } else {
          toast.error(result.error || "Erreur lors de la création");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Add/Delete handlers for SearchableSelect
  async function handleAddJobTitle(label: string) {
    const result = await addJobTitle(label);
    if (result.success && result.jobTitle) {
      setLocalJobTitles((prev) =>
        [...prev, result.jobTitle!].sort((a, b) => a.label.localeCompare(b.label))
      );
      toast.success("Poste créé");
      return result.jobTitle;
    }
    toast.error(result.error || "Erreur");
    return null;
  }

  async function handleDeleteJobTitle(id: string) {
    const result = await deleteJobTitle(id);
    if (result.success) {
      setLocalJobTitles((prev) => prev.filter((jt) => jt.id !== id));
      toast.success("Poste supprimé");
      return true;
    }
    toast.error(result.error || "Erreur");
    return false;
  }

  async function handleAddDepartment(label: string) {
    const result = await addDepartment(label);
    if (result.success && result.department) {
      setLocalDepartments((prev) =>
        [...prev, result.department!].sort((a, b) => a.label.localeCompare(b.label))
      );
      toast.success("Département créé");
      return result.department;
    }
    toast.error(result.error || "Erreur");
    return null;
  }

  async function handleDeleteDepartment(id: string) {
    const result = await deleteDepartment(id);
    if (result.success) {
      setLocalDepartments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Département supprimé");
      return true;
    }
    toast.error(result.error || "Erreur");
    return false;
  }

  async function handleAddTeam(label: string) {
    const result = await addTeam(label);
    if (result.success && result.team) {
      setLocalTeams((prev) =>
        [...prev, result.team!].sort((a, b) => a.label.localeCompare(b.label))
      );
      toast.success("Équipe créée");
      return result.team;
    }
    toast.error(result.error || "Erreur");
    return null;
  }

  async function handleDeleteTeam(id: string) {
    const result = await deleteTeam(id);
    if (result.success) {
      setLocalTeams((prev) => prev.filter((t) => t.id !== id));
      toast.success("Équipe supprimée");
      return true;
    }
    toast.error(result.error || "Erreur");
    return false;
  }

  if (!open) return null;

  const inputClass =
    "w-full rounded-xl border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]";
  const selectClass =
    "w-full rounded-xl border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-[560px] max-h-[90vh] animate-scale-in overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/[0.04]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-1)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--yellow-surface)]">
              {isEdit ? (
                <Pencil className="h-4 w-4 text-[var(--yellow)]" />
              ) : (
                <UserPlus className="h-4 w-4 text-[var(--yellow)]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--heading)]">
                {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {isEdit
                  ? "Modifiez les informations du collaborateur"
                  : "Remplissez les informations du collaborateur"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-1.5 text-[var(--text-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--heading)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5 p-6">
            {/* Identité */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]">
                Identité
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Prénom *"
                  value={form.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  required
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Nom *"
                  value={form.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <select
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className={`mt-3 ${selectClass}`}
              >
                <option value="">Genre</option>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>

            {/* Compte */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]">
                Compte
              </label>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email *"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  disabled={isEdit}
                  className={`${inputClass} disabled:bg-[var(--hover)] disabled:text-[var(--text-muted)]`}
                />
                {!isEdit && (
                  <input
                    type="password"
                    placeholder="Mot de passe * (min. 6 caractères)"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    required
                    minLength={6}
                    className={inputClass}
                  />
                )}
              </div>
            </div>

            {/* Poste & Rôle */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]">
                Poste {currentUserRole === "admin" && "& Rôle"}
              </label>
              <div className={currentUserRole === "admin" ? "grid grid-cols-2 gap-3" : ""}>
                <SearchableSelect
                  value={form.job_title}
                  onChange={(v) => handleChange("job_title", v)}
                  options={localJobTitles}
                  placeholder="Poste *"
                  onAdd={handleAddJobTitle}
                  onDelete={handleDeleteJobTitle}
                  addLabel="Nouveau poste"
                />
                {currentUserRole === "admin" && (
                  <select
                    value={form.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className={selectClass}
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                Les permissions sont déterminées par le poste. Configurez-les dans Administration → Permissions.
              </p>
            </div>

            {/* Contact */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]">
                Contact
              </label>
              <input
                type="tel"
                placeholder="Téléphone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Organisation */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]">
                Organisation
              </label>
              <div className="grid grid-cols-3 gap-3">
                <SearchableSelect
                  value={form.department}
                  onChange={(v) => handleChange("department", v)}
                  options={localDepartments}
                  placeholder="Département"
                  onAdd={handleAddDepartment}
                  onDelete={handleDeleteDepartment}
                  addLabel="Nouveau département"
                />
                <SearchableSelect
                  value={form.team}
                  onChange={(v) => handleChange("team", v)}
                  options={localTeams}
                  placeholder="Équipe"
                  onAdd={handleAddTeam}
                  onDelete={handleDeleteTeam}
                  addLabel="Nouvelle équipe"
                />
                <input
                  type="text"
                  placeholder="Agence"
                  value={form.agency}
                  onChange={(e) => handleChange("agency", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Manager */}
            {allUsers.length > 0 && (
              <div>
                <label className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]">
                  Manager
                </label>
                <select
                  value={form.manager_id}
                  onChange={(e) => handleChange("manager_id", e.target.value)}
                  className={selectClass}
                >
                  <option value="">— Aucun manager —</option>
                  {allUsers
                    .filter((u) => u.id !== user?.id && u.is_active)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name}
                        {u.job_title ? ` — ${u.job_title}` : ""}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Dates */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]">
                Dates
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => handleChange("date_of_birth", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-secondary)]">
                    Date d&apos;embauche
                  </label>
                  <input
                    type="date"
                    value={form.hire_date}
                    onChange={(e) => handleChange("hire_date", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border-1)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[var(--border-1)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition-all hover:bg-black/[0.03] disabled:opacity-50"
            >
              Annuler
            </button>
            <Button type="submit" disabled={loading} size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  En cours...
                </span>
              ) : isEdit ? (
                "Enregistrer"
              ) : (
                "Créer l'utilisateur"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
