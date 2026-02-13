import React from "react";
import { TrueQuoteBadgeCanonical } from "@/components/shared/TrueQuoteBadgeCanonical";

// Original Places API shape
type BusinessProfile = {
  placeId?: string;
  name?: string;
  formattedAddress?: string;
  address?: string;  // V7 alias
  categoryLabel?: string;
  types?: string[];
  rating?: number;
  userRatingsTotal?: number;
  website?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  logoUrl?: string | null;
  isVerified?: boolean;

  // V7 industry inference fields (optional)
  inferredIndustry?: string;
  industryConfidence?: number;
  industryEvidence?: string[];
  city?: string;
  stateCode?: string;
  postal?: string;
  resolvedAt?: number;
};

function initials(name?: string) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

interface BusinessProfileCardProps {
  /** Business data - supports both Places API shape and V7 BusinessCard shape */
  business?: BusinessProfile | null;
  /** Alias for business (V7 compat) */
  data?: BusinessProfile | null;
  subtitle?: string;
  rightTag?: string;
  /** Show industry inference section (V7 feature) */
  showIndustryInference?: boolean;
  /** Edit callback (V7 feature) */
  onEdit?: () => void;
  /** TrueQuote badge click handler — opens TrueQuote explainer modal */
  onTrueQuoteClick?: () => void;
}

export default function BusinessProfileCard({
  business,
  data,
  subtitle = "Business Profile",
  rightTag,
  showIndustryInference = false,
  onEdit,
  onTrueQuoteClick,
}: BusinessProfileCardProps) {
  // Support both `business` and `data` props
  const biz = business ?? data;
  if (!biz?.name) return null;

  const photo = biz.photoUrl || biz.logoUrl || null;
  const displayAddress = biz.formattedAddress || biz.address;
  const hasIndustryInference = showIndustryInference && biz.inferredIndustry;
  const confidencePct = biz.industryConfidence ? Math.round(biz.industryConfidence * 100) : 0;

  return (
    <div className="rounded-xl bg-[rgba(22,27,48,0.6)] p-5 border border-white/[0.06]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs text-slate-300/80 tracking-wide uppercase">
          {subtitle}
        </div>

        <div className="flex items-center gap-2">
          {biz.isVerified && (
            rightTag ? (
              <span className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/20 text-emerald-300">
                ✓ {rightTag}
              </span>
            ) : (
              <TrueQuoteBadgeCanonical showTooltip={false} onClick={onTrueQuoteClick} />
            )
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-slate-300 hover:bg-white/10 transition"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className="mt-4 flex items-start gap-4">
        {/* Avatar / Photo */}
        <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-900/40 shrink-0">
          {photo ? (
            <img
              src={photo}
              alt={`${biz.name} photo`}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-white font-bold">
              {initials(biz.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-white font-semibold text-lg leading-tight truncate">
            {biz.name}
          </div>
          {displayAddress && (
            <div className="text-slate-300 text-sm mt-1 line-clamp-2">
              {displayAddress}
            </div>
          )}

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {biz.categoryLabel && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-slate-200 shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
                {biz.categoryLabel}
              </span>
            )}

            {typeof biz.rating === "number" && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-slate-200 shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
                ⭐ {biz.rating.toFixed(1)}
                {biz.userRatingsTotal
                  ? ` (${biz.userRatingsTotal})`
                  : ""}
              </span>
            )}

            {biz.website && (
              <a
                className="text-[11px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-200 hover:bg-purple-500/15 transition shadow-[0_2px_6px_rgba(139,92,246,0.12)]"
                href={biz.website}
                target="_blank"
                rel="noreferrer"
              >
                Website
              </a>
            )}

            {biz.phone && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-slate-200 shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
                {biz.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Industry Inference Section (V7 feature) */}
      {hasIndustryInference && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Detected Industry
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden"
                title={`${confidencePct}% confidence`}
              >
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${confidencePct}%`,
                    background: confidencePct >= 85 
                      ? "linear-gradient(90deg, rgba(74,222,128,0.8), rgba(74,222,128,1))"
                      : confidencePct >= 60 
                        ? "linear-gradient(90deg, rgba(251,191,36,0.8), rgba(251,191,36,1))"
                        : "linear-gradient(90deg, rgba(239,68,68,0.8), rgba(239,68,68,1))",
                  }}
                />
              </div>
              <span className="text-[11px] text-slate-400">{confidencePct}%</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-white font-medium capitalize">
            {biz.inferredIndustry?.replace(/-/g, " ")}
          </div>
          {biz.industryEvidence && biz.industryEvidence.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {biz.industryEvidence.slice(0, 3).map((ev, i) => (
                <span 
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-200 shadow-[0_2px_4px_rgba(139,92,246,0.1)]"
                >
                  {ev}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
