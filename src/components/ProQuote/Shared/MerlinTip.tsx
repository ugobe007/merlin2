/**
 * MerlinTip - Advisor tip component with Merlin avatar
 * Used throughout ProQuote for contextual guidance
 */

import React from "react";
import merlinImage from "@/assets/images/new_profile_merlin.png";

interface MerlinTipProps {
  tip: string;
  context?: string;
}

export const MerlinTip = React.memo(function MerlinTip({ tip, context }: MerlinTipProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3.5 mt-3 transition-all hover:brightness-110"
      style={{
        background: "linear-gradient(135deg, rgba(52,211,153,0.09) 0%, rgba(59,130,246,0.07) 100%)",
        border: "1px solid rgba(52,211,153,0.22)",
        borderLeft: "3px solid rgba(52,211,153,0.65)",
        boxShadow:
          "0 0 0 1px rgba(52,211,153,0.06), 0 0 18px rgba(52,211,153,0.10), inset 0 0 24px rgba(52,211,153,0.04)",
      }}
    >
      <img
        src={merlinImage}
        alt="Merlin"
        className="w-7 h-7 rounded-full shrink-0 mt-0.5"
        style={{
          border: "1.5px solid rgba(52,211,153,0.45)",
          boxShadow: "0 0 12px rgba(52,211,153,0.30)",
        }}
      />
      <div className="min-w-0">
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
          <span
            className="font-bold"
            style={{
              color: "#34d399",
              textShadow: "0 0 12px rgba(52,211,153,0.40)",
            }}
          >
            Merlin says:
          </span>{" "}
          {tip}
        </p>
        {context && (
          <p className="text-xs mt-1 italic" style={{ color: "rgba(255,255,255,0.38)" }}>
            {context}
          </p>
        )}
      </div>
    </div>
  );
});
