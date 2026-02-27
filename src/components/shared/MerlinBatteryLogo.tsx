interface MerlinBatteryLogoProps {
  size?: number;
  className?: string;
}

/**
 * MerlinBatteryLogo
 * Brand icon — vertical battery spelling M-E-R-L-I-N.
 * Uses the official PNG asset from src/assets/images/Merlin_Battery_Icon.png
 * Used in navbars, favicons, OG images.
 */
export function MerlinBatteryLogo({ size = 28, className = '' }: MerlinBatteryLogoProps) {
  return (
    <img
      src="/favicon.png"
      width={size}
      height={size}
      alt="Merlin Energy"
      className={className}
      style={{ borderRadius: 6, display: 'block' }}
    />
  );
}

// Keep SVG shell below for reference — not used
function _MerlinBatteryLogoSVGUnused({ size = 28, className = '' }: MerlinBatteryLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Merlin Energy"
    >
      <defs>
        {/* Emerald top → deep navy bottom */}
        <linearGradient id="mbatt-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a9968" />
          <stop offset="30%" stopColor="#0b4872" />
          <stop offset="70%" stopColor="#030f28" />
          <stop offset="100%" stopColor="#010810" />
        </linearGradient>
        {/* Neon glow filter */}
        <filter id="mbatt-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Letter glow */}
        <filter id="mbatt-textglow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Very dark navy background */}
      <rect width="100" height="100" rx="16" fill="#040b18" />
      {/* Terminal nub with neon glow */}
      <rect x="37" y="3" width="26" height="9" rx="3" fill="#3ECF8E" filter="url(#mbatt-glow)" />
      {/* Border glow bloom */}
      <rect x="14" y="11" width="72" height="86" rx="8" fill="none" stroke="#3ECF8E" strokeWidth="5" opacity="0.3" filter="url(#mbatt-glow)" />
      {/* Battery body */}
      <rect x="14" y="11" width="72" height="86" rx="8" fill="#010810" stroke="#3ECF8E" strokeWidth="2.2" />
      {/* Gradient fill */}
      <rect x="16.5" y="13.5" width="67" height="81" rx="6" fill="url(#mbatt-fill)" />
      {/* Bottom blue glow pool */}
      <ellipse cx="50" cy="90" rx="26" ry="5" fill="#1a5fcc" opacity="0.45" />
      {/* Letters M-E-R-L-I-N with glow */}
      <text x="50" y="20.5" textAnchor="middle" dominantBaseline="central" fill="white" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="12" filter="url(#mbatt-textglow)">M</text>
      <text x="50" y="34" textAnchor="middle" dominantBaseline="central" fill="white" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="12" filter="url(#mbatt-textglow)">E</text>
      <text x="50" y="47.5" textAnchor="middle" dominantBaseline="central" fill="white" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="12" filter="url(#mbatt-textglow)">R</text>
      <text x="50" y="61" textAnchor="middle" dominantBaseline="central" fill="white" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="12" filter="url(#mbatt-textglow)">L</text>
      <text x="50" y="74.5" textAnchor="middle" dominantBaseline="central" fill="white" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="12" filter="url(#mbatt-textglow)">I</text>
      <text x="50" y="88" textAnchor="middle" dominantBaseline="central" fill="white" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="12" filter="url(#mbatt-textglow)">N</text>
    </svg>
  );
}
