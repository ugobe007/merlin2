// src/components/wizard/v6/advisor/AdvisorCard.tsx

import React from "react";
import type { AdvisorCard as Card } from "./advisorTypes";

const typeStyles: Record<string, string> = {
  discovery: "border-violet-500/30 bg-violet-500/5",
  tip: "border-cyan-500/30 bg-cyan-500/5",
  progress: "border-amber-500/30 bg-amber-500/5",
  action: "border-emerald-500/30 bg-emerald-500/5",
  summary: "border-white/10 bg-white/[0.04]",
};

export function AdvisorCard({ card }: { card: Card }) {
  const cls = typeStyles[card.type] || typeStyles.summary;

  return (
    <div className={`rounded-xl border ${cls} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-white">{card.title}</div>
        {card.badge && (
          <span className="text-[11px] px-2 py-0.5 rounded-md border border-white/20 text-slate-200 bg-white/[0.08]">
            {card.badge}
          </span>
        )}
      </div>
      {card.body && (
        <div className="mt-2 text-xs text-slate-300 whitespace-pre-line">{card.body}</div>
      )}
    </div>
  );
}
