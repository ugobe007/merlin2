/**
 * TrueQuote™ Minimal Authority Badge - CANONICAL SPEC
 * ====================================================
 *
 * The definitive TrueQuote™ badge implementation.
 * Designed for institutional software - quiet confidence, timeless design.
 *
 * Inspired by: Stripe, Bloomberg, enterprise financial software
 *
 * @version 3.0.0 - Canonical Spec (Jan 20, 2026)
 */

import React, { useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface TrueQuoteBadgeCanonicalProps {
  /** Trust label - defaults to "Verified" */
  label?: "Verified" | "Certified" | "Model-verified";
  /** Show tooltip on hover/tap */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

// ============================================================================
// CANONICAL BADGE COMPONENT
// ============================================================================

/**
 * The canonical TrueQuote™ badge - use this everywhere.
 *
 * Visual identity: TrueQuote™ • Verified
 * - TrueQuote™ = soft white (#F1F5F9)
 * - • = metallic gold authority dot (signature element)
 * - Verified = slate-blue secondary (#94A3B8)
 *
 * @example
 * ```tsx
 * // Default (use 99% of the time)
 * <TrueQuoteBadgeCanonical />
 *
 * // With custom label (use sparingly)
 * <TrueQuoteBadgeCanonical label="Certified" />
 * ```
 */
export const TrueQuoteBadgeCanonical: React.FC<TrueQuoteBadgeCanonicalProps> = ({
  label = "Verified",
  showTooltip = true,
  className = "",
  onClick,
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Gold dot shadow styles (enhanced on hover)
  const dotShadow = isHovered
    ? "0 0 10px rgba(242, 193, 79, 0.65), inset 0 0 2px rgba(255, 255, 255, 0.45)"
    : "0 0 6px rgba(242, 193, 79, 0.45), inset 0 0 2px rgba(255, 255, 255, 0.35)";

  return (
    <div className="relative inline-block">
      {/* Badge */}
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => {
          if (showTooltip) setShowTooltipState(true);
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setShowTooltipState(false);
          setIsHovered(false);
        }}
        className={`
          truequote-badge
          inline-flex items-center gap-2
          h-7 px-3 rounded-lg
          bg-slate-800/60 border backdrop-blur-md
          text-[12px] tracking-[0.04em]
          transition-all duration-200
          ${isHovered ? "border-indigo-400/60" : "border-indigo-400/40"}
          ${onClick ? "cursor-pointer" : "cursor-default"}
          ${className}
        `}
        style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
        aria-label="TrueQuote verified quote"
      >
        {/* Brand: TrueQuote™ */}
        <span className="tq-brand text-white font-bold" style={{ letterSpacing: "0.02em" }}>
          TrueQuote™
        </span>

        {/* Gold Authority Dot - Signature Element */}
        <span
          className="tq-dot w-[6px] h-[6px] rounded-full flex-shrink-0"
          style={{
            background: "radial-gradient(circle at 30% 30%, #FFDFA3, #F2C14F 60%, #B8892F 100%)",
            boxShadow: dotShadow,
            transition: "box-shadow 200ms ease",
          }}
          aria-hidden="true"
        />

        {/* Trust Label */}
        <span className="tq-label text-slate-300 font-semibold">{label}</span>
      </button>

      {/* Tooltip - Critical for credibility */}
      {showTooltip && showTooltipState && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                     w-72 p-3 rounded-lg
                     bg-slate-900 border border-indigo-500/30
                     shadow-xl shadow-black/30
                     pointer-events-none"
          role="tooltip"
        >
          <div className="text-xs font-bold text-white mb-1">TrueQuote™</div>
          <div className="text-xs text-slate-300 leading-relaxed">
            TrueQuote™ combines utility tariffs, climate data, and industry load models to produce
            source-backed estimates.
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// USAGE GUIDE
// ============================================================================

/**
 * WHERE TO PLACE THIS BADGE (STRATEGIC LOCATIONS):
 *
 * 1️⃣ Top telemetry bar (primary location)
 *    Right after "Merlin Intelligence":
 *    Merlin Intelligence  [TrueQuote™ • Verified]  $0.10/kWh  ☀️ 5.3 hrs
 *
 * 2️⃣ Results / Quote summary header
 *    Above or next to savings number:
 *    Estimated Annual Savings
 *    $42,000 – $58,000
 *    [TrueQuote™ • Verified]
 *
 * 3️⃣ Exports / proposals / PDFs
 *    Top-right corner of every quote
 *
 * LABEL VARIANTS (use sparingly):
 * - Default: "Verified" (use 90% of the time)
 * - Header/Wizard: "Verified"
 * - Results/Financial: "Certified"
 * - Technical/Analytics: "Model-verified"
 */

// ============================================================================
// EXPORT DEFAULT FOR CONVENIENCE
// ============================================================================

export default TrueQuoteBadgeCanonical;
