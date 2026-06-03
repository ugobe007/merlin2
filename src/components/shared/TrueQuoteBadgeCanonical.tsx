/**
 * StackQuote™ Badge - CANONICAL SPEC v4.0
 * Visual identity for Energy Stacking™:
 * three stacked layer bars (solar amber / BESS blue / EV emerald).
 * Border: emerald. Tooltip: Energy Stacking™ messaging.
 */

import React, { useState } from "react";

export interface TrueQuoteBadgeCanonicalProps {
  label?: "Verified" | "Certified" | "Model-verified";
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
}

const StackIcon: React.FC<{ hovered: boolean }> = ({ hovered }) => (
  <span
    className="sq-stack flex flex-col gap-[2px] flex-shrink-0"
    aria-hidden="true"
    style={{ transition: "opacity 200ms ease", opacity: hovered ? 1 : 0.85 }}
  >
    <span className="block rounded-sm" style={{
      width: 14, height: 3,
      background: "linear-gradient(90deg, #F59E0B, #FCD34D)",
      boxShadow: hovered ? "0 0 5px rgba(245,158,11,0.7)" : "none",
      transition: "box-shadow 200ms ease",
    }} />
    <span className="block rounded-sm" style={{
      width: 14, height: 3,
      background: "linear-gradient(90deg, #3B82F6, #93C5FD)",
      boxShadow: hovered ? "0 0 5px rgba(59,130,246,0.7)" : "none",
      transition: "box-shadow 200ms ease",
    }} />
    <span className="block rounded-sm" style={{
      width: 14, height: 3,
      background: "linear-gradient(90deg, #10B981, #6EE7B7)",
      boxShadow: hovered ? "0 0 5px rgba(16,185,129,0.7)" : "none",
      transition: "box-shadow 200ms ease",
    }} />
  </span>
);

export const TrueQuoteBadgeCanonical: React.FC<TrueQuoteBadgeCanonicalProps> = ({
  label = "Verified",
  showTooltip = true,
  className = "",
  onClick,
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative inline-block">
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
          stackquote-badge
          inline-flex items-center gap-2
          h-7 px-3 rounded-lg
          bg-slate-800/60 border backdrop-blur-md
          text-[12px] tracking-[0.04em]
          transition-all duration-200
          ${isHovered ? "border-emerald-400/70" : "border-emerald-500/40"}
          ${onClick ? "cursor-pointer" : "cursor-default"}
          ${className}
        `}
        style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
        aria-label="StackQuote™ verified energy stack analysis"
      >
        <StackIcon hovered={isHovered} />
        <span className="sq-brand text-white font-bold" style={{ letterSpacing: "0.02em" }}>
          StackQuote&#8482;
        </span>
        <span className="text-slate-500" aria-hidden="true">&#183;</span>
        <span className="sq-label text-emerald-400 font-semibold">{label}</span>
      </button>

      {showTooltip && showTooltipState && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-80 p-3 rounded-lg bg-slate-900 border border-emerald-500/30 shadow-xl shadow-black/30 pointer-events-none"
          role="tooltip"
        >
          <div className="flex items-center gap-2 mb-2">
            <StackIcon hovered={true} />
            <span className="text-xs font-bold text-white">StackQuote&#8482;</span>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider ml-1">
              Energy Stacking&#8482;
            </span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            The goal isn&#39;t technology adoption &#8212; it&#39;s{" "}
            <span className="text-white font-semibold">optimization</span>.
            StackQuote&#8482; models your full energy stack (solar, BESS, EV, generator)
            using NREL data, utility tariffs, and IRA 2022 incentives.
            The right stack pays for itself.
          </div>
        </div>
      )}
    </div>
  );
};

export default TrueQuoteBadgeCanonical;
