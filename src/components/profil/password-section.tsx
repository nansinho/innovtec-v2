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
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
          <Lock className="h-[18px] w-[18px] text-red-500" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">
          Mot de passe
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Mot de passe actuel
            </label>
            <input
              type="password"
              required
              value={form.currentPassword}
              onChange={(e) =>
                setForm({ ...form, currentPassword: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
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
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
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
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-orange-700 hover:shadow-sm disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>
      </form>
    </section>
  );
}
