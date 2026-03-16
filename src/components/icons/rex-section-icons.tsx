interface IconProps {
  className?: string;
  size?: number;
}

// ==========================================
// Color palette per section
// Badge = rounded text rectangle, Circle = icon background
// ==========================================
// Faits:     badge=#0B3655 (navy)      circle=#FAEEC8 (cream)
// Causes:    badge=#40884D (green)     circle=#C5D8A0 (light sage)
// Actions:   badge=#9A326D (magenta)   circle=#BACAA6 (sage)
// Vigilance: badge=#0D7C38 (green)     circle=#FFF6F0 (peach)

// ==========================================
// LES FAITS
// ==========================================
export function RexFaitsIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="23" fill="#E8D9A8" stroke="#B5A67A" strokeWidth="1" />
      <circle cx="24" cy="24" r="20" fill="#FAEEC8" />
      <circle cx="24" cy="24" r="18.5" stroke="#D4C49A" strokeWidth="0.5" fill="none" />
      {/* Personne gauche */}
      <circle cx="16.5" cy="16" r="3.2" fill="#0B3655" />
      <path d="M10 27.5c0-4.5 2.8-7 6.5-7s6.5 2.5 6.5 7" fill="#0B3655" />
      {/* Personne droite */}
      <circle cx="31.5" cy="16" r="3.2" fill="#0B3655" />
      <path d="M25 27.5c0-4.5 2.8-7 6.5-7s6.5 2.5 6.5 7" fill="#0B3655" />
      {/* Lignes de discussion */}
      <rect x="21.5" y="14" width="5" height="1.2" rx="0.6" fill="#0B3655" opacity="0.6" />
      <rect x="20.5" y="17" width="7" height="1.2" rx="0.6" fill="#0B3655" opacity="0.6" />
      <rect x="21.5" y="20" width="5" height="1.2" rx="0.6" fill="#0B3655" opacity="0.6" />
    </svg>
  );
}

export function RexFaitsBadge({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <RexFaitsIcon size={46} />
      <div className="rounded-r-lg bg-[#0B3655] px-5 py-2 -ml-3 shadow-sm">
        <span className="text-[13px] font-extrabold tracking-wider text-white">
          LES FAITS
        </span>
      </div>
    </div>
  );
}

// ==========================================
// LES CAUSES ET LES CIRCONSTANCES
// ==========================================
export function RexCausesIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="23" fill="#A8C482" stroke="#8AAF5E" strokeWidth="1" />
      <circle cx="24" cy="24" r="20" fill="#C5D8A0" />
      <circle cx="24" cy="24" r="18.5" stroke="#A8C482" strokeWidth="0.5" fill="none" />
      <text x="13" y="34" fill="#8B1A1A" fontSize="28" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif">?</text>
      <text x="26" y="34" fill="#8B1A1A" fontSize="28" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif">?</text>
    </svg>
  );
}

export function RexCausesBadge({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <RexCausesIcon size={46} />
      <div className="rounded-r-lg bg-[#40884D] px-4 py-1.5 -ml-3 shadow-sm">
        <span className="text-[11px] font-extrabold leading-tight tracking-wider text-white block">
          LES CAUSES
          <br />
          ET LES
          <br />
          CIRCONSTANCES
        </span>
      </div>
    </div>
  );
}

// ==========================================
// LA SYNTHÈSE DES ACTIONS ENGAGÉES
// ==========================================
export function RexActionsIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="23" fill="#A0B488" stroke="#8A9E72" strokeWidth="1" />
      <circle cx="24" cy="24" r="20" fill="#BACAA6" />
      <circle cx="24" cy="24" r="18.5" stroke="#A0B488" strokeWidth="0.5" fill="none" />
      {/* Document */}
      <rect x="13" y="10" width="15" height="21" rx="1.5" stroke="#9A326D" strokeWidth="1.8" fill="none" />
      {/* Lignes du document */}
      <line x1="16" y1="15.5" x2="25" y2="15.5" stroke="#9A326D" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="16" y1="19.5" x2="25" y2="19.5" stroke="#9A326D" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="16" y1="23.5" x2="22" y2="23.5" stroke="#9A326D" strokeWidth="1.3" strokeLinecap="round" />
      {/* Crayon */}
      <rect x="30" y="12" width="3.5" height="14" rx="0.5" fill="#9A326D" transform="rotate(20 31.75 19)" />
      <polygon points="29.5,26 33.5,26 31.5,30" fill="#9A326D" transform="rotate(20 31.75 28)" />
    </svg>
  );
}

export function RexActionsBadge({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <RexActionsIcon size={46} />
      <div className="rounded-r-lg bg-[#9A326D] px-4 py-1.5 -ml-3 shadow-sm">
        <span className="text-[11px] font-extrabold leading-tight tracking-wider text-white block">
          LA SYNTHÈSE DES
          <br />
          ACTIONS ENGAGÉES
        </span>
      </div>
    </div>
  );
}

// ==========================================
// LE RAPPEL À VIGILANCE
// ==========================================
export function RexVigilanceIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="23" fill="#E8D8CC" stroke="#C8B8A8" strokeWidth="1" />
      <circle cx="24" cy="24" r="20" fill="#FFF6F0" />
      <circle cx="24" cy="24" r="18.5" stroke="#E8D8CC" strokeWidth="0.5" fill="none" />
      {/* Triangle attention orange */}
      <path
        d="M24 8 L40 36 H8 Z"
        fill="#FF9800"
        stroke="#E65100"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Barre du ! */}
      <line x1="24" y1="16" x2="24" y2="27" stroke="white" strokeWidth="3" strokeLinecap="round" />
      {/* Point du ! */}
      <circle cx="24" cy="32" r="1.8" fill="white" />
    </svg>
  );
}

export function RexVigilanceBadge({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <RexVigilanceIcon size={46} />
      <div className="rounded-r-lg bg-[#0D7C38] px-4 py-2 -ml-3 shadow-sm">
        <span className="text-[12px] font-extrabold leading-tight tracking-wider text-white block">
          LE RAPPEL À
          <br />
          VIGILANCE
        </span>
      </div>
    </div>
  );
}

// ==========================================
// RAW SVG STRINGS — For PDF export (canvas rendering)
// ==========================================
export const REX_BADGE_SVGS = {
  faits: `<svg width="240" height="56" viewBox="0 0 240 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="27" fill="#E8D9A8" stroke="#B5A67A" stroke-width="1"/>
    <circle cx="28" cy="28" r="24" fill="#FAEEC8"/>
    <circle cx="28" cy="28" r="22" stroke="#D4C49A" stroke-width="0.5" fill="none"/>
    <circle cx="20" cy="19" r="3.8" fill="#0B3655"/>
    <path d="M12 32c0-5.5 3.2-8 8-8s8 2.5 8 8" fill="#0B3655"/>
    <circle cx="36" cy="19" r="3.8" fill="#0B3655"/>
    <path d="M28 32c0-5.5 3.2-8 8-8s8 2.5 8 8" fill="#0B3655"/>
    <rect x="25" y="16" width="6" height="1.5" rx="0.75" fill="#0B3655" opacity="0.6"/>
    <rect x="24" y="20" width="8" height="1.5" rx="0.75" fill="#0B3655" opacity="0.6"/>
    <rect x="25" y="24" width="6" height="1.5" rx="0.75" fill="#0B3655" opacity="0.6"/>
    <rect x="52" y="14" width="110" height="28" rx="6" fill="#0B3655"/>
    <text x="107" y="33" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="16" font-weight="800" text-anchor="middle" letter-spacing="1">LES FAITS</text>
  </svg>`,

  causes: `<svg width="280" height="60" viewBox="0 0 280 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="29" fill="#A8C482" stroke="#8AAF5E" stroke-width="1"/>
    <circle cx="30" cy="30" r="26" fill="#C5D8A0"/>
    <circle cx="30" cy="30" r="24" stroke="#A8C482" stroke-width="0.5" fill="none"/>
    <text x="15" y="42" fill="#8B1A1A" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="900">?</text>
    <text x="32" y="42" fill="#8B1A1A" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="900">?</text>
    <rect x="56" y="6" width="160" height="48" rx="6" fill="#40884D"/>
    <text x="136" y="22" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="800" text-anchor="middle" letter-spacing="0.5">LES CAUSES</text>
    <text x="136" y="36" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="800" text-anchor="middle" letter-spacing="0.5">ET LES</text>
    <text x="136" y="50" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="800" text-anchor="middle" letter-spacing="0.5">CIRCONSTANCES</text>
  </svg>`,

  actions: `<svg width="290" height="60" viewBox="0 0 290 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="29" fill="#A0B488" stroke="#8A9E72" stroke-width="1"/>
    <circle cx="30" cy="30" r="26" fill="#BACAA6"/>
    <circle cx="30" cy="30" r="24" stroke="#A0B488" stroke-width="0.5" fill="none"/>
    <rect x="17" y="13" width="17" height="25" rx="2" stroke="#9A326D" stroke-width="2" fill="none"/>
    <line x1="21" y1="19" x2="30" y2="19" stroke="#9A326D" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="21" y1="24" x2="30" y2="24" stroke="#9A326D" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="21" y1="29" x2="27" y2="29" stroke="#9A326D" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="30" y="12" width="3.5" height="14" rx="0.5" fill="#9A326D" transform="rotate(20 31.75 19)"/>
    <polygon points="29.5,26 33.5,26 31.5,30" fill="#9A326D" transform="rotate(20 31.75 28)"/>
    <rect x="56" y="10" width="185" height="40" rx="6" fill="#9A326D"/>
    <text x="148" y="28" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="0.5">LA SYNTHESE DES</text>
    <text x="148" y="44" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="0.5">ACTIONS ENGAGEES</text>
  </svg>`,

  vigilance: `<svg width="260" height="60" viewBox="0 0 260 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="29" fill="#E8D8CC" stroke="#C8B8A8" stroke-width="1"/>
    <circle cx="30" cy="30" r="26" fill="#FFF6F0"/>
    <circle cx="30" cy="30" r="24" stroke="#E8D8CC" stroke-width="0.5" fill="none"/>
    <path d="M30 9 L48 42 H12 Z" fill="#FF9800" stroke="#E65100" stroke-width="1.2" stroke-linejoin="round"/>
    <line x1="30" y1="18" x2="30" y2="31" stroke="white" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="30" cy="36" r="2" fill="white"/>
    <rect x="56" y="10" width="145" height="40" rx="6" fill="#0D7C38"/>
    <text x="128" y="28" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="800" text-anchor="middle" letter-spacing="0.5">LE RAPPEL A</text>
    <text x="128" y="44" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="800" text-anchor="middle" letter-spacing="0.5">VIGILANCE</text>
  </svg>`,
};
