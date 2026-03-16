"use client";

import { useState, useEffect, useCallback } from "react";
import { Palette, RotateCcw } from "lucide-react";

const STORAGE_KEY = "innovtec-accent-color";
const DEFAULT_HUE = 38; // amber/yellow
const DEFAULT_SAT = 92;

const presets = [
  { label: "Jaune INNOVTEC", hue: 38, sat: 92 },
  { label: "Bleu", hue: 211, sat: 100 },
  { label: "Vert", hue: 142, sat: 71 },
  { label: "Violet", hue: 271, sat: 76 },
  { label: "Rouge", hue: 4, sat: 90 },
  { label: "Rose", hue: 330, sat: 81 },
  { label: "Cyan", hue: 187, sat: 85 },
  { label: "Orange", hue: 24, sat: 95 },
];

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function applyAccentColor(hue: number, sat: number) {
  const root = document.documentElement;
  const main = hslToHex(hue, sat, 50);
  const hover = hslToHex(hue, sat, 42);
  const surface = `hsla(${hue}, ${sat}%, 50%, 0.06)`;
  const border = `hsla(${hue}, ${sat}%, 50%, 0.14)`;

  root.style.setProperty("--yellow", main);
  root.style.setProperty("--yellow-hover", hover);
  root.style.setProperty("--yellow-surface", surface);
  root.style.setProperty("--yellow-border", border);
}

export default function ThemeSettings() {
  const [hue, setHue] = useState(DEFAULT_HUE);
  const [sat, setSat] = useState(DEFAULT_SAT);

  // Load saved color on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { hue: h, sat: s } = JSON.parse(saved);
        setHue(h);
        setSat(s);
        applyAccentColor(h, s);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleChange = useCallback((h: number, s: number) => {
    setHue(h);
    setSat(s);
    applyAccentColor(h, s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ hue: h, sat: s }));
  }, []);

  function handleReset() {
    handleChange(DEFAULT_HUE, DEFAULT_SAT);
  }

  const currentColor = hslToHex(hue, sat, 50);
  const currentColorLight = `hsl(${hue}, ${sat}%, 95%)`;

  return (
    <div className="rounded-2xl bg-white/92 p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: currentColorLight }}>
            <Palette className="h-4 w-4" style={{ color: currentColor }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--heading)]">Apparence</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Personnalisez la couleur d&apos;accent</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-all duration-200 hover:bg-black/[0.04] hover:text-[var(--heading)]"
        >
          <RotateCcw className="h-3 w-3" />
          Réinitialiser
        </button>
      </div>

      {/* Presets */}
      <div className="mb-5">
        <label className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]">
          Couleurs prédéfinies
        </label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const color = hslToHex(preset.hue, preset.sat, 50);
            const isActive = hue === preset.hue && sat === preset.sat;
            return (
              <button
                key={preset.label}
                onClick={() => handleChange(preset.hue, preset.sat)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "ring-2 shadow-sm"
                    : "hover:bg-black/[0.03]"
                }`}
                style={{
                  background: isActive ? `${color}10` : undefined,
                  ...(isActive ? { boxShadow: `0 0 0 2px ${color}40` } : {}),
                }}
              >
                <div
                  className="h-4 w-4 rounded-full shadow-inner"
                  style={{ background: color }}
                />
                <span className="text-[var(--text-secondary)]">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom sliders */}
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">
              Teinte
            </label>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">{hue}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => handleChange(Number(e.target.value), sat)}
            className="hue-slider w-full"
            style={{
              height: "8px",
              borderRadius: "4px",
              background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
              appearance: "none",
              cursor: "pointer",
            }}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">
              Saturation
            </label>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">{sat}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={sat}
            onChange={(e) => handleChange(hue, Number(e.target.value))}
            className="sat-slider w-full"
            style={{
              height: "8px",
              borderRadius: "4px",
              background: `linear-gradient(to right, hsl(${hue}, 20%, 50%), hsl(${hue}, 100%, 50%))`,
              appearance: "none",
              cursor: "pointer",
            }}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="mt-5 rounded-xl p-4" style={{ background: currentColorLight }}>
        <div className="mb-2 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl shadow-sm" style={{ background: currentColor }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: currentColor }}>
              Aperçu de la couleur
            </div>
            <div className="font-mono text-[11px] text-[var(--text-muted)]">{currentColor}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]"
            style={{ background: currentColor }}
          >
            Bouton principal
          </button>
          <button
            className="rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200"
            style={{ background: `${currentColor}15`, color: currentColor }}
          >
            Bouton secondaire
          </button>
        </div>
      </div>
    </div>
  );
}
