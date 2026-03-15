interface InnovtecLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function InnovtecLogo({ className, width = 160, height = 50 }: InnovtecLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* INNOVTEC text - stylized with zigzag NN */}
      <g>
        {/* I */}
        <rect x="10" y="20" width="8" height="40" fill="#1E3A5F" />
        {/* First N - zigzag style */}
        <path d="M26 60 L26 20 L34 20 L50 52 L50 20 L58 20 L58 60 L50 60 L34 28 L34 60 Z" fill="#F59E0B" />
        {/* Second N - zigzag style */}
        <path d="M66 60 L66 20 L74 20 L90 52 L90 20 L98 20 L98 60 L90 60 L74 28 L74 60 Z" fill="#F59E0B" />
        {/* O */}
        <path d="M106 20 L134 20 L134 60 L106 60 Z M114 28 L114 52 L126 52 L126 28 Z" fill="#1E3A5F" fillRule="evenodd" />
        {/* V */}
        <path d="M140 20 L152 56 L164 20 L174 20 L157 60 L147 60 L130 20 Z" fill="#1E3A5F" />
        {/* T */}
        <rect x="178" y="20" width="38" height="8" fill="#1E3A5F" />
        <rect x="193" y="28" width="8" height="32" fill="#1E3A5F" />
        {/* E */}
        <path d="M222 20 L252 20 L252 28 L230 28 L230 36 L248 36 L248 44 L230 44 L230 52 L252 52 L252 60 L222 60 Z" fill="#1E3A5F" />
        {/* C */}
        <path d="M260 20 L292 20 L292 28 L268 28 L268 52 L292 52 L292 60 L260 60 Z" fill="#1E3A5F" />
      </g>
      {/* RESEAUX text */}
      <text
        x="160"
        y="82"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="14"
        fontWeight="600"
        letterSpacing="8"
        fill="#1E3A5F"
      >
        RESEAUX
      </text>
      {/* Yellow accent line */}
      <rect x="80" y="66" width="160" height="2" rx="1" fill="#F59E0B" />
    </svg>
  );
}
