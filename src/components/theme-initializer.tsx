"use client";

import { useEffect } from "react";

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

export default function ThemeInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem("innovtec-accent-color");
    if (saved) {
      try {
        const { hue, sat } = JSON.parse(saved);
        const root = document.documentElement;
        root.style.setProperty("--accent", hslToHex(hue, sat, 50));
        root.style.setProperty("--accent-hover", hslToHex(hue, sat, 42));
        root.style.setProperty("--accent-surface", `hsla(${hue}, ${sat}%, 50%, 0.06)`);
        root.style.setProperty("--accent-border", `hsla(${hue}, ${sat}%, 50%, 0.14)`);
        // Legacy aliases
        root.style.setProperty("--yellow", hslToHex(hue, sat, 50));
        root.style.setProperty("--yellow-hover", hslToHex(hue, sat, 42));
        root.style.setProperty("--yellow-surface", `hsla(${hue}, ${sat}%, 50%, 0.06)`);
        root.style.setProperty("--yellow-border", `hsla(${hue}, ${sat}%, 50%, 0.14)`);
      } catch {
        // ignore
      }
    }
  }, []);

  return null;
}
