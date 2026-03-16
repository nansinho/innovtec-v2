"use client";

import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { updateAvatar } from "@/actions/profile";
import type { Profile } from "@/lib/types/database";

export default function ProfileAvatarSection({
  profile,
}: {
  profile: Profile;
}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() ||
    "?";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'upload");
        return;
      }

      const result = await updateAvatar(data.url);

      if (result.success) {
        setAvatarUrl(data.url);
        toast.success("Avatar mis à jour");
      } else {
        toast.error(result.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mb-6 flex items-center gap-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full transition-transform hover:scale-105 disabled:opacity-50"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${profile.first_name} ${profile.last_name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--navy)] text-2xl font-bold text-white">
            {initials}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <div>
        <p className="text-sm font-semibold text-[var(--heading)]">
          {profile.first_name} {profile.last_name}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {profile.job_title || "Collaborateur"}
        </p>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          Cliquez sur la photo pour changer votre avatar
        </p>
      </div>
    </div>
  );
}
