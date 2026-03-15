interface IconProps {
  className?: string;
  size?: number;
}

/** Les Faits - Green circular icon with document/facts symbol */
export function RexFaitsIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="24" fill="#4CAF50" />
      <g transform="translate(12, 10)">
        {/* Clipboard/document with lines */}
        <rect x="3" y="2" width="18" height="24" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="8" y="0" width="8" height="4" rx="1" fill="white" />
        <line x1="7" y1="10" x2="17" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="14" x2="17" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="18" x2="14" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="22" r="1.5" fill="white" opacity="0.6" />
      </g>
    </svg>
  );
}

/** Les Causes et les Circonstances - Orange icon with question/magnifier */
export function RexCausesIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="24" fill="#FF9800" />
      <g transform="translate(11, 11)">
        {/* Magnifying glass with question mark */}
        <circle cx="12" cy="12" r="8" fill="none" stroke="white" strokeWidth="2" />
        <line x1="18" y1="18" x2="24" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Inter, sans-serif">?</text>
      </g>
    </svg>
  );
}

/** La Synthèse des Actions Engagées - Teal/Blue icon with checklist */
export function RexActionsIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="24" fill="#00897B" />
      <g transform="translate(12, 11)">
        {/* Checklist with checkmarks */}
        <rect x="2" y="1" width="20" height="24" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
        {/* Check 1 */}
        <polyline points="5,8 7,10 11,6" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="14" y1="8" x2="19" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        {/* Check 2 */}
        <polyline points="5,14 7,16 11,12" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="14" y1="14" x2="19" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        {/* Check 3 */}
        <polyline points="5,20 7,22 11,18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="14" y1="20" x2="19" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Le Rappel à Vigilance - Yellow/Warning icon with alert triangle */
export function RexVigilanceIcon({ className, size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="24" fill="#FFC107" />
      <g transform="translate(10, 10)">
        {/* Warning triangle */}
        <path d="M14 4L26 25H2L14 4Z" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        <line x1="14" y1="12" x2="14" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="14" cy="22" r="1.2" fill="white" />
      </g>
    </svg>
  );
}
