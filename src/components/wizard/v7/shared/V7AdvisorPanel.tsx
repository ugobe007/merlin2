/**
 * V7AdvisorPanel.tsx
 *
 * Render-only Advisor panel for WizardV7.
 * SSOT stays in WizardV7Page — this component is purely presentational.
 *
 * Created: February 2, 2026
 * Updated: February 2, 2026 - Fly.io quality bar polish
 */

import React from "react";

type BadgeTone = "violet" | "green" | "amber" | "red" | "blue";

type Props = {
  title?: string;
  subtitle?: string;
  badges?: Array<{ label: string; tone?: BadgeTone }>;
  bullets?: string[];
  missing?: string[];
  progressPct?: number; // 0-100
};

function toneClasses(tone?: BadgeTone): string {
  if (tone === "green") return "bg-green-500/15 text-green-300 border-green-500/25";
  if (tone === "amber") return "bg-amber-500/15 text-amber-300 border-amber-500/25";
  if (tone === "red") return "bg-red-500/15 text-red-300 border-red-500/25";
  if (tone === "blue") return "bg-blue-500/15 text-blue-300 border-blue-500/25";
  return "bg-violet-500/15 text-violet-300 border-violet-500/25";
}

export default function V7AdvisorPanel(props: Props) {
  const {
    title = "Advisor",
    subtitle,
    badges = [],
    bullets = [],
    missing = [],
    progressPct,
  } = props;

  const pct =
    typeof progressPct === "number"
      ? Math.max(0, Math.min(100, Math.round(progressPct)))
      : undefined;

  return (
    <div className="sticky top-6 rounded-xl border border-slate-700/40 bg-slate-950/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-slate-50">{title}</div>
          {subtitle ? <div className="text-sm text-slate-400 mt-1">{subtitle}</div> : null}
        </div>

        {typeof pct === "number" ? (
          <div className="text-sm font-mono text-slate-300">{pct}%</div>
        ) : null}
      </div>

      {typeof pct === "number" ? (
        <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}

      {badges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <span
              key={`${b.label}-${i}`}
              className={`px-2.5 py-1 text-xs font-mono rounded border ${toneClasses(b.tone)}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      ) : null}

      {bullets.length > 0 ? (
        <div className="mt-4 space-y-2">
          {bullets.map((t, i) => (
            <div key={`${i}-${t}`} className="flex gap-2 text-sm text-slate-300">
              <span className="text-violet-300">›</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      ) : null}

      {missing.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
          <div className="text-[11px] font-mono text-amber-300 mb-2">
            Required remaining ({missing.length})
          </div>
          <div className="max-h-[180px] overflow-auto pr-1 text-xs text-amber-200/90 leading-relaxed">
            {missing.join(", ")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
