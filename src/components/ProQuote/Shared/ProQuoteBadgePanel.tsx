/**
 * ProQuoteBadgePanel - ProQuote™ branding badge
 * Blue shield badge with "Pro Mode" indicator
 * Used in: custom-config view
 */

import React from "react";
import { ShieldCheck } from "lucide-react";
import badgeIcon from "@/assets/badge-icon.png";

interface ProQuoteBadgePanelProps {
  onShowHowItWorks: () => void;
}

export const ProQuoteBadgePanel = React.memo(function ProQuoteBadgePanel({
  onShowHowItWorks,
}: ProQuoteBadgePanelProps) {
  return (
    <button
      type="button"
      onClick={onShowHowItWorks}
      className="group w-full flex items-center gap-5 p-5 rounded-xl transition-all duration-300 cursor-pointer"
      style={{
        background:
          "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(96,165,250,0.04) 50%, rgba(59,130,246,0.06) 100%)",
        border: "2px solid rgba(59,130,246,0.20)",
        boxShadow: "0 0 0 1px rgba(59,130,246,0.05), 0 4px 24px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.40)";
        e.currentTarget.style.boxShadow =
          "0 0 0 1px rgba(59,130,246,0.1), 0 4px 32px rgba(59,130,246,0.1), 0 0 60px rgba(59,130,246,0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.20)";
        e.currentTarget.style.boxShadow =
          "0 0 0 1px rgba(59,130,246,0.05), 0 4px 24px rgba(0,0,0,0.2)";
      }}
      aria-label="Learn how ProQuote works"
    >
      {/* Blue Shield Badge */}
      <div className="shrink-0 relative">
        <div className="relative">
          <img
            src={badgeIcon}
            alt="ProQuote Badge"
            className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(59,130,246,0.9)",
              boxShadow: "0 0 8px rgba(59,130,246,0.4)",
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>

      {/* Badge Text */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-xl font-bold text-blue-400 tracking-tight">ProQuote™</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            Pro Mode
          </span>
        </div>
        <p className="text-sm leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>
          Full engineering control — custom equipment, fuel cells, financial modeling, and
          bank-ready exports.
          <span className="text-blue-400/60 font-medium"> Click to learn more →</span>
        </p>
      </div>

      {/* Arrow */}
      <div className="shrink-0 text-blue-500/40 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
});
