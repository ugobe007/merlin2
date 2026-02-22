/**
 * MerlinTip - Advisor tip component with Merlin avatar
 * Used throughout ProQuote for contextual guidance
 */

import React from "react";
import merlinImage from "@/assets/images/merlin_avatar.png";

interface MerlinTipProps {
  tip: string;
  context?: string;
}

export const MerlinTip = React.memo(function MerlinTip({ tip, context }: MerlinTipProps) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 mt-3 transition-all hover:brightness-110"
      style={{
        background: "linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(59,130,246,0.06) 100%)",
        border: "1px solid rgba(52,211,153,0.12)",
      }}
    >
      <img
        src={merlinImage}
        alt="Merlin"
        className="w-6 h-6 rounded-full shrink-0 mt-0.5"
        style={{
          border: "1.5px solid rgba(52,211,153,0.3)",
          boxShadow: "0 0 8px rgba(52,211,153,0.15)",
        }}
      />
      <div className="min-w-0">
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
          <span className="font-bold text-emerald-400/80">Merlin says:</span> {tip}
        </p>
        {context && (
          <p className="text-[10px] mt-0.5 italic" style={{ color: "rgba(255,255,255,0.3)" }}>
            {context}
          </p>
        )}
      </div>
    </div>
  );
});
