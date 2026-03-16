"use client";

import { useState, useTransition } from "react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  Calendar,
  Cake,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sendBirthdayWish } from "@/actions/birthday";
import type { Profile } from "@/lib/types/database";

interface ProfileDrawerProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  isBirthday: boolean;
  currentUserId: string;
}

export default function ProfileDrawer({
  profile,
  isOpen,
  onClose,
  isBirthday,
  currentUserId,
}: ProfileDrawerProps) {
  const [wishSent, setWishSent] = useState(false);
  const [wishMessage, setWishMessage] = useState("");
  const [showWishInput, setShowWishInput] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!profile) return null;

  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const isOwnProfile = profile.id === currentUserId;

  function handleSendWish() {
    startTransition(async () => {
      const result = await sendBirthdayWish(
        profile!.id,
        wishMessage.trim() || "Joyeux anniversaire !"
      );
      if (result.success) {
        setWishSent(true);
        setShowWishInput(false);
        setWishMessage("");
      }
    });
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-[201] flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[var(--navy)] to-[#2a4a7a] px-6 pb-8 pt-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mt-6 flex flex-col items-center text-center">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${profile.first_name} ${profile.last_name}`}
                className="h-20 w-20 rounded-full border-3 border-white/20 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-3 border-white/20 bg-white/10 text-2xl font-bold text-white">
                {initials}
              </div>
            )}

            {/* Birthday badge */}
            {isBirthday && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white ring-1 ring-white/20">
                <Cake className="h-3 w-3" />
                Anniversaire !
              </div>
            )}

            <h2 className="mt-3 text-lg font-bold text-white">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="mt-0.5 text-[13px] text-white/60">
              {profile.job_title || "Collaborateur"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Info cards */}
          <div className="space-y-3">
            {profile.department && (
              <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--hover)] px-4 py-3">
                <Building2 className="h-4 w-4 shrink-0 text-[var(--navy)]" />
                <div>
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">
                    Département
                  </p>
                  <p className="text-[13px] font-medium text-[var(--heading)]">
                    {profile.department}
                  </p>
                </div>
              </div>
            )}

            {profile.team && (
              <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--hover)] px-4 py-3">
                <Users className="h-4 w-4 shrink-0 text-[var(--navy)]" />
                <div>
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">
                    Équipe
                  </p>
                  <p className="text-[13px] font-medium text-[var(--heading)]">
                    {profile.team}
                  </p>
                </div>
              </div>
            )}

            {profile.agency && (
              <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--hover)] px-4 py-3">
                <MapPin className="h-4 w-4 shrink-0 text-[var(--navy)]" />
                <div>
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">
                    Agence
                  </p>
                  <p className="text-[13px] font-medium text-[var(--heading)]">
                    {profile.agency}
                  </p>
                </div>
              </div>
            )}

            {profile.hire_date && (
              <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--hover)] px-4 py-3">
                <Calendar className="h-4 w-4 shrink-0 text-[var(--navy)]" />
                <div>
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">
                    Date d&apos;arrivée
                  </p>
                  <p className="text-[13px] font-medium text-[var(--heading)]">
                    {new Date(profile.hire_date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="mt-5">
            <p className="mb-2.5 text-[10px] font-semibold text-[var(--text-muted)]">
              Contact
            </p>
            <div className="space-y-2">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-1)] px-4 py-3 text-[13px] text-[var(--heading)] transition-all duration-200 hover:border-[var(--yellow)]/40 hover:bg-[var(--yellow-surface)]"
                >
                  <Mail className="h-4 w-4 shrink-0 text-[var(--yellow)]" />
                  <span className="truncate">{profile.email}</span>
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-1)] px-4 py-3 text-[13px] text-[var(--heading)] transition-all duration-200 hover:border-[var(--yellow)]/40 hover:bg-[var(--yellow-surface)]"
                >
                  <Phone className="h-4 w-4 shrink-0 text-[var(--yellow)]" />
                  {profile.phone}
                </a>
              )}
            </div>
          </div>

          {/* Birthday wish */}
          {isBirthday && !isOwnProfile && (
            <div className="mt-5 rounded-[var(--radius)] border border-pink-200 bg-gradient-to-r from-pink-50 to-orange-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Cake className="h-4 w-4 text-pink-500" />
                <p className="text-xs font-semibold text-[var(--heading)]">
                  C&apos;est son anniversaire !
                </p>
              </div>

              {wishSent ? (
                <p className="text-[12px] text-green-600 font-medium">
                  Vos voeux ont été envoyés !
                </p>
              ) : showWishInput ? (
                <div className="flex gap-2">
                  <input
                    value={wishMessage}
                    onChange={(e) => setWishMessage(e.target.value)}
                    placeholder="Joyeux anniversaire !"
                    className="flex-1 rounded-lg border border-[var(--border-1)] bg-white px-3 py-1.5 text-[12px] text-[var(--heading)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)]"
                  />
                  <button
                    onClick={handleSendWish}
                    disabled={isPending}
                    className="rounded-lg bg-[var(--yellow)] px-3 py-1.5 text-white transition-all duration-200 hover:bg-[var(--yellow-hover)] active:scale-[0.97] disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowWishInput(true)}
                  className="rounded-full bg-[var(--yellow)] px-3 py-1 text-[11px] font-medium text-white transition-all duration-200 hover:bg-[var(--yellow-hover)] active:scale-[0.97]"
                >
                  Souhaiter son anniversaire
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
