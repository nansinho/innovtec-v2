"use client";

import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { updatePassword } from "@/actions/profile";

export default function PasswordSection() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (form.newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setSaving(true);

    const result = await updatePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });

    if (result.success) {
      toast.success("Mot de passe mis à jour");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      toast.error(result.error || "Erreur lors de la mise à jour");
    }

    setSaving(false);
  }

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border-1)] bg-white p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
          <Lock className="h-4 w-4 text-red-500" />
        </div>
        <h2 className="text-sm font-semibold text-[var(--heading)]">
          Mot de passe
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Mot de passe actuel
            </label>
            <input
              type="password"
              required
              value={form.currentPassword}
              onChange={(e) =>
                setForm({ ...form, currentPassword: e.target.value })
              }
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              className="w-full rounded-[var(--radius-xs)] border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)]"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-[var(--radius-xs)] bg-[var(--yellow)] px-4 py-2 text-xs font-medium text-[var(--navy)] transition-colors duration-150 hover:bg-[var(--yellow-hover)] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>
      </form>
    </section>
  );
}
