"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, UserX, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    buttonBg: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    buttonBg: "bg-amber-600 hover:bg-amber-700",
  },
  info: {
    icon: UserX,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    buttonBg: "bg-blue-600 hover:bg-blue-700",
  },
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

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

  if (!open) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => !loading && onClose()}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative mx-4 w-full max-w-[400px] animate-scale-in rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.iconBg}`}>
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
        </div>

        {/* Content */}
        <div className="mb-6 text-center">
          <h3 className="mb-2 text-base font-semibold text-gray-900">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-gray-500">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-50 ${config.buttonBg}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                En cours...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
