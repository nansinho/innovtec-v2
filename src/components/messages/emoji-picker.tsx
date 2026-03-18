"use client";

import { useState, useEffect, useRef } from "react";

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "😀": [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊",
    "😇", "🥰", "😍", "🤩", "😘", "😋", "🤗", "🤔", "🤫", "🤭",
    "😎", "🥳", "😏", "😒", "😞", "😔", "😟", "😢", "😭", "🤯",
    "😱", "😤", "😡", "🥹", "😴", "🤮", "🤧", "😷", "🤠", "🥸",
  ],
  "👋": [
    "👋", "🤚", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫶",
    "🤟", "🤘", "👍", "👎", "👏", "🙌", "🤝", "👊", "✊", "💪",
    "🫡", "🙏", "💅", "🤳", "👀", "👁️", "🧠", "🫀", "👶", "👨‍💻",
  ],
  "❤️": [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❣️",
    "💕", "💗", "💖", "💘", "💝", "💟", "♥️", "💯", "💢", "💥",
    "💫", "💦", "💨", "🔥", "⭐", "🌟", "✨", "🎉", "🎊", "🎈",
  ],
  "🐶": [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
    "🦁", "🐸", "🐵", "🦄", "🐝", "🦋", "🌸", "🌺", "🌻", "🌹",
    "🌈", "☀️", "⛅", "🌧️", "❄️", "🍀", "🌴", "🌊", "🌙", "🪻",
  ],
  "🍕": [
    "🍕", "🍔", "🍟", "🌭", "🍿", "🧀", "🥐", "🍞", "🥖", "🥨",
    "🍰", "🎂", "🍩", "🍪", "🍫", "🍬", "☕", "🍺", "🥂", "🍷",
    "🥤", "🧃", "🧁", "🍓", "🍎", "🍊", "🍋", "🍉", "🥑", "🍌",
  ],
  "⚽": [
    "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🎯", "🏆", "🥇",
    "🥈", "🥉", "🎮", "🎲", "🎭", "🎬", "🎵", "🎶", "🎤", "🎧",
    "📸", "🎨", "🖌️", "✏️", "📚", "📖", "💡", "🔔", "📌", "🗂️",
  ],
  "✅": [
    "✅", "❌", "⚠️", "🚫", "💬", "💭", "🗨️", "📢", "📣", "🔊",
    "🔇", "📱", "💻", "⌨️", "🖥️", "📧", "📎", "📋", "🗑️", "🔒",
    "🔑", "🛠️", "⚙️", "🔍", "📍", "🏠", "🚗", "✈️", "🚀", "🏗️",
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  "😀": "Smileys",
  "👋": "Gestes",
  "❤️": "Coeurs",
  "🐶": "Nature",
  "🍕": "Nourriture",
  "⚽": "Activités",
  "✅": "Objets",
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const categories = Object.keys(EMOJI_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 w-[300px] animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-xl border border-[var(--border-1)] bg-white shadow-xl"
    >
      {/* Category tabs */}
      <div className="flex items-center gap-0.5 border-b border-[var(--border-1)] px-2 py-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            title={CATEGORY_LABELS[cat]}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition-colors ${
              activeCategory === cat
                ? "bg-[var(--yellow)]/15 scale-110"
                : "hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-[220px] overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => onSelect(emoji)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl transition-transform hover:scale-125 hover:bg-gray-100 active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
