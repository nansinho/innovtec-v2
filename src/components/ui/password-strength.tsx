"use client";

import { Check, X } from "lucide-react";

export interface PasswordRule {
  label: string;
  met: boolean;
}

export function validatePasswordStrength(password: string) {
  const rules: PasswordRule[] = [
    { label: "Au moins 8 caractères", met: password.length >= 8 },
    { label: "Une lettre majuscule", met: /[A-Z]/.test(password) },
    { label: "Une lettre minuscule", met: /[a-z]/.test(password) },
    { label: "Un chiffre", met: /[0-9]/.test(password) },
    {
      label: "Un caractère spécial (!@#$%...)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const score = rules.filter((r) => r.met).length;

  return { score, rules };
}

const STRENGTH_CONFIG = [
  { label: "Très faible", color: "var(--red)" },
  { label: "Faible", color: "var(--red)" },
  { label: "Moyen", color: "#f97316" },
  { label: "Bon", color: "var(--yellow)" },
  { label: "Excellent", color: "var(--green)" },
] as const;

export default function PasswordStrength({
  password,
}: {
  password: string;
}) {
  if (!password) return null;

  const { score, rules } = validatePasswordStrength(password);
  const config = STRENGTH_CONFIG[score];

  return (
    <div className="mt-2 space-y-2.5">
      {/* Strength bar */}
      <div className="flex items-center gap-2.5">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor:
                  score >= level ? config.color : "var(--border-1)",
              }}
            />
          ))}
        </div>
        <span
          className="text-xs font-medium transition-colors duration-300"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      </div>

      {/* Rules checklist */}
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {rules.map((rule) => (
          <li
            key={rule.label}
            className="flex items-center gap-1.5 transition-all duration-200"
          >
            {rule.met ? (
              <Check
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--green)" }}
              />
            ) : (
              <X
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--text-muted)" }}
              />
            )}
            <span
              className="text-[11px] transition-colors duration-200"
              style={{
                color: rule.met ? "var(--green)" : "var(--text-muted)",
              }}
            >
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
