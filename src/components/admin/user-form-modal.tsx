"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { createUser, updateUser } from "@/actions/users";
import { addJobTitle, type JobTitle } from "@/actions/job-titles";
import { addDepartment, type Department } from "@/actions/departments";
import { addTeam, type Team } from "@/actions/teams";
import type { Profile, UserRole } from "@/lib/types/database";

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
}

export default function UserFormModal({ open, onClose, user, jobTitles = [], departments = [], teams = [] }: UserFormModalProps) {
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
  });

  // Local lists (updated optimistically when creating new items)
  const [localJobTitles, setLocalJobTitles] = useState(jobTitles);
  const [localDepartments, setLocalDepartments] = useState(departments);
  const [localTeams, setLocalTeams] = useState(teams);

  // Custom input states
  const [showCustomJobTitle, setShowCustomJobTitle] = useState(false);
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [customDepartment, setCustomDepartment] = useState("");
  const [showCustomTeam, setShowCustomTeam] = useState(false);
  const [customTeam, setCustomTeam] = useState("");

  useEffect(() => {
    setLocalJobTitles(jobTitles);
    setLocalDepartments(departments);
    setLocalTeams(teams);
  }, [jobTitles, departments, teams]);

  useEffect(() => {
    if (user) {
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
        team: user.team || "",
        agency: user.agency || "Siège",
        date_of_birth: user.date_of_birth || "",
        hire_date: user.hire_date || "",
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
      });
    }
    setShowCustomJobTitle(false);
    setCustomJobTitle("");
    setShowCustomDepartment(false);
    setCustomDepartment("");
    setShowCustomTeam(false);
    setCustomTeam("");
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

  async function handleAddCustomJobTitle() {
    if (!customJobTitle.trim()) return;
    const result = await addJobTitle(customJobTitle.trim());
    if (result.success && result.jobTitle) {
      setLocalJobTitles((prev) => [...prev, result.jobTitle!].sort((a, b) => a.label.localeCompare(b.label)));
      handleChange("job_title", customJobTitle.trim());
      toast.success("Poste créé");
    } else {
      toast.error(result.error || "Erreur");
    }
    setCustomJobTitle("");
    setShowCustomJobTitle(false);
  }

  async function handleAddCustomDepartment() {
    if (!customDepartment.trim()) return;
    const result = await addDepartment(customDepartment.trim());
    if (result.success && result.department) {
      setLocalDepartments((prev) => [...prev, result.department!].sort((a, b) => a.label.localeCompare(b.label)));
      handleChange("department", customDepartment.trim());
      toast.success("Département créé");
    } else {
      toast.error(result.error || "Erreur");
    }
    setCustomDepartment("");
    setShowCustomDepartment(false);
  }

  async function handleAddCustomTeam() {
    if (!customTeam.trim()) return;
    const result = await addTeam(customTeam.trim());
    if (result.success && result.team) {
      setLocalTeams((prev) => [...prev, result.team!].sort((a, b) => a.label.localeCompare(b.label)));
      handleChange("team", customTeam.trim());
      toast.success("Équipe créée");
    } else {
      toast.error(result.error || "Erreur");
    }
    setCustomTeam("");
    setShowCustomTeam(false);
  }

  if (!open) return null;

  const inputClass = "w-full rounded-xl border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]";
  const selectClass = "w-full rounded-xl border border-[var(--border-1)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-[560px] max-h-[90vh] animate-scale-in overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/[0.05]">
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
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Identité
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Prénom *"
                    value={form.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Nom *"
                    value={form.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
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
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
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
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Poste & Rôle
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Job title select + create */}
                <div>
                  {showCustomJobTitle ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={customJobTitle}
                        onChange={(e) => setCustomJobTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleAddCustomJobTitle(); }
                          if (e.key === "Escape") setShowCustomJobTitle(false);
                        }}
                        autoFocus
                        placeholder="Nouveau poste..."
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomJobTitle}
                        className="shrink-0 rounded-xl bg-[var(--yellow)] p-2.5 text-white hover:bg-[var(--yellow-hover)]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={form.job_title}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setShowCustomJobTitle(true);
                        } else {
                          handleChange("job_title", e.target.value);
                        }
                      }}
                      className={selectClass}
                    >
                      <option value="">-- Poste --</option>
                      {localJobTitles.map((jt) => (
                        <option key={jt.id} value={jt.label}>
                          {jt.label}
                        </option>
                      ))}
                      <option value="__custom__">+ Ajouter un poste...</option>
                    </select>
                  )}
                </div>
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
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
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
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Organisation
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* Department select + create */}
                <div>
                  {showCustomDepartment ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={customDepartment}
                        onChange={(e) => setCustomDepartment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleAddCustomDepartment(); }
                          if (e.key === "Escape") setShowCustomDepartment(false);
                        }}
                        autoFocus
                        placeholder="Nouveau dept..."
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomDepartment}
                        className="shrink-0 rounded-xl bg-[var(--yellow)] p-2.5 text-white hover:bg-[var(--yellow-hover)]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={form.department}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setShowCustomDepartment(true);
                        } else {
                          handleChange("department", e.target.value);
                        }
                      }}
                      className={selectClass}
                    >
                      <option value="">-- Département --</option>
                      {localDepartments.map((d) => (
                        <option key={d.id} value={d.label}>
                          {d.label}
                        </option>
                      ))}
                      <option value="__custom__">+ Ajouter...</option>
                    </select>
                  )}
                </div>

                {/* Team select + create */}
                <div>
                  {showCustomTeam ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={customTeam}
                        onChange={(e) => setCustomTeam(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleAddCustomTeam(); }
                          if (e.key === "Escape") setShowCustomTeam(false);
                        }}
                        autoFocus
                        placeholder="Nouvelle équipe..."
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTeam}
                        className="shrink-0 rounded-xl bg-[var(--yellow)] p-2.5 text-white hover:bg-[var(--yellow-hover)]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={form.team}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setShowCustomTeam(true);
                        } else {
                          handleChange("team", e.target.value);
                        }
                      }}
                      className={selectClass}
                    >
                      <option value="">-- Équipe --</option>
                      {localTeams.map((t) => (
                        <option key={t.id} value={t.label}>
                          {t.label}
                        </option>
                      ))}
                      <option value="__custom__">+ Ajouter...</option>
                    </select>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Agence"
                  value={form.agency}
                  onChange={(e) => handleChange("agency", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Dates */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
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
                    Date d'embauche
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
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-amber-700 active:scale-[0.97] disabled:opacity-50"
            >
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
