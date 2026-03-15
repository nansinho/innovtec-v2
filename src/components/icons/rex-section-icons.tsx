interface IconProps {
  className?: string;
  size?: number;
}

/**
 * LES FAITS - Cercle beige/kaki avec icône de groupe de personnes (bleu marine)
 * + Badge bleu marine "LES FAITS"
 */
export function RexFaitsIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cercle beige/kaki avec contour */}
      <circle cx="24" cy="24" r="22" fill="#D4C9A8" stroke="#8B7D5E" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="19" fill="#C5B89A" />
      {/* Personnes/groupe - bleu marine */}
      <g fill="#1E3A5F">
        {/* Personne gauche */}
        <circle cx="17" cy="17" r="3" />
        <path d="M11 28 C11 23 14 21 17 21 C20 21 23 23 23 28" />
        {/* Personne droite */}
        <circle cx="31" cy="17" r="3" />
        <path d="M25 28 C25 23 28 21 31 21 C34 21 37 23 37 28" />
        {/* Connexion/discussion - petites lignes */}
        <rect x="22" y="14" width="4" height="1" rx="0.5" />
        <rect x="21" y="17" width="6" height="1" rx="0.5" />
        <rect x="22" y="20" width="4" height="1" rx="0.5" />
      </g>
    </svg>
  );
}

/**
 * LES FAITS - Version badge complet (icône + label)
 */
export function RexFaitsBadge({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0 ${className || ""}`}>
      <RexFaitsIcon size={44} />
      <div className="rounded-r-md bg-[#1E3A5F] px-4 py-1.5 -ml-2">
        <span className="text-[13px] font-extrabold tracking-wide text-white">
          LES FAITS
        </span>
      </div>
    </div>
  );
}

/**
 * LES CAUSES ET LES CIRCONSTANCES - Cercle beige/kaki avec "??" rouges
 * + Badge vert olive
 */
export function RexCausesIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cercle beige/kaki avec contour */}
      <circle cx="24" cy="24" r="22" fill="#D4C9A8" stroke="#8B7D5E" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="19" fill="#C5B89A" />
      {/* Double point d'interrogation - rouge foncé */}
      <text
        x="16"
        y="32"
        fill="#8B1A1A"
        fontSize="26"
        fontWeight="900"
        fontFamily="Inter, Arial, sans-serif"
      >
        ?
      </text>
      <text
        x="27"
        y="32"
        fill="#8B1A1A"
        fontSize="26"
        fontWeight="900"
        fontFamily="Inter, Arial, sans-serif"
      >
        ?
      </text>
    </svg>
  );
}

/**
 * LES CAUSES - Version badge complet (icône + label)
 */
export function RexCausesBadge({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0 ${className || ""}`}>
      <RexCausesIcon size={44} />
      <div className="rounded-r-md bg-[#6B8E23] px-3 py-1 -ml-2">
        <span className="text-[11px] font-extrabold leading-tight tracking-wide text-white">
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

/**
 * LA SYNTHÈSE DES ACTIONS ENGAGÉES - Cercle vert foncé avec document+crayon blanc
 * + Badge orange
 */
export function RexActionsIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cercle vert foncé avec contour */}
      <circle cx="24" cy="24" r="22" fill="#2E7D32" stroke="#1B5E20" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="19" fill="#388E3C" />
      {/* Document avec crayon - blanc */}
      <g stroke="white" strokeWidth="1.5" fill="none">
        {/* Document */}
        <rect x="14" y="11" width="14" height="20" rx="1.5" />
        {/* Lignes du document */}
        <line x1="17" y1="16" x2="25" y2="16" strokeWidth="1.2" />
        <line x1="17" y1="20" x2="25" y2="20" strokeWidth="1.2" />
        <line x1="17" y1="24" x2="22" y2="24" strokeWidth="1.2" />
      </g>
      {/* Crayon */}
      <g transform="translate(27, 22) rotate(-45)">
        <rect x="0" y="0" width="4" height="14" rx="0.5" fill="white" />
        <polygon points="0,14 4,14 2,18" fill="white" />
        <rect x="0" y="0" width="4" height="3" rx="0.5" fill="#FFC107" />
      </g>
    </svg>
  );
}

/**
 * LA SYNTHÈSE - Version badge complet (icône + label)
 */
export function RexActionsBadge({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0 ${className || ""}`}>
      <RexActionsIcon size={44} />
      <div className="rounded-r-md bg-[#E67E22] px-3 py-1 -ml-2">
        <span className="text-[11px] font-extrabold leading-tight tracking-wide text-white">
          LA SYNTHÈSE DES
          <br />
          ACTIONS ENGAGÉES
        </span>
      </div>
    </div>
  );
}

/**
 * LE RAPPEL À VIGILANCE - Cercle vert foncé avec triangle attention orange
 * + Badge jaune
 */
export function RexVigilanceIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cercle vert foncé avec contour */}
      <circle cx="24" cy="24" r="22" fill="#2E7D32" stroke="#1B5E20" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="19" fill="#388E3C" />
      {/* Triangle attention - orange */}
      <path
        d="M24 10 L38 34 H10 Z"
        fill="#FF9800"
        stroke="#E65100"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Point d'exclamation dans le triangle */}
      <line x1="24" y1="18" x2="24" y2="27" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="31" r="1.5" fill="white" />
    </svg>
  );
}

/**
 * LE RAPPEL À VIGILANCE - Version badge complet (icône + label)
 */
export function RexVigilanceBadge({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0 ${className || ""}`}>
      <RexVigilanceIcon size={44} />
      <div className="rounded-r-md bg-[#F1C40F] px-3 py-1.5 -ml-2">
        <span className="text-[12px] font-extrabold leading-tight tracking-wide text-[#333]">
          LE RAPPEL À
          <br />
          VIGILANCE
        </span>
      </div>
    </div>
  );
}
