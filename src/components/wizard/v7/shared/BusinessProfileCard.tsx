import React from "react";

type BusinessProfile = {
  placeId?: string;
  name?: string;
  formattedAddress?: string;
  categoryLabel?: string;
  types?: string[];
  rating?: number;
  userRatingsTotal?: number;
  website?: string | null;
  phone?: string | null;
  photoUrl?: string | null; // already resolved URL from your backend proxy
  logoUrl?: string | null;  // optional
  isVerified?: boolean;     // TrueQuote verified
};

function initials(name?: string) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export default function BusinessProfileCard({
  business,
  subtitle = "Business Profile",
  rightTag = "TrueQuote™ Verified",
}: {
  business: BusinessProfile | null | undefined;
  subtitle?: string;
  rightTag?: string;
}) {
  if (!business?.name) return null;

  const photo = business.photoUrl || business.logoUrl || null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_60px_rgba(0,0,0,0.35)]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs text-slate-300/80 tracking-wide uppercase">
          {subtitle}
        </div>

        {business.isVerified && (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-500/25">
            ✓ {rightTag}
          </span>
        )}
      </div>

      {/* Profile */}
      <div className="mt-4 flex items-start gap-4">
        {/* Avatar / Photo */}
        <div className="h-14 w-14 rounded-xl overflow-hidden border border-white/10 bg-slate-900/40 shrink-0">
          {photo ? (
            <img
              src={photo}
              alt={`${business.name} photo`}
              className="h-full w-full object-cover"
              onError={(e) => {
                // If photo fails, hide it and fall back to initials block below
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-white font-bold">
              {initials(business.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-white font-semibold text-lg leading-tight truncate">
            {business.name}
          </div>
          {business.formattedAddress && (
            <div className="text-slate-300 text-sm mt-1 line-clamp-2">
              {business.formattedAddress}
            </div>
          )}

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {business.categoryLabel && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200">
                {business.categoryLabel}
              </span>
            )}

            {typeof business.rating === "number" && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200">
                ⭐ {business.rating.toFixed(1)}
                {business.userRatingsTotal
                  ? ` (${business.userRatingsTotal})`
                  : ""}
              </span>
            )}

            {business.website && (
              <a
                className="text-[11px] px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200 hover:bg-purple-500/15 transition"
                href={business.website}
                target="_blank"
                rel="noreferrer"
              >
                Website
              </a>
            )}

            {business.phone && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200">
                {business.phone}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
