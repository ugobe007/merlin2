import React from "react";

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

/** Title-case a business name — "dash car wash" → "Dash Car Wash" */
function titleCase(str?: string) {
  if (!str) return "";
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format industry slug for display — "car_wash" → "Car Wash" */
function formatIndustry(slug?: string) {
  if (!slug) return "";
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
  subtitle: _subtitle,
  rightTag: _rightTag,
  showIndustryInference = false,
  onEdit,
  onTrueQuoteClick: _onTrueQuoteClick,
}: BusinessProfileCardProps) {
  // Support both `business` and `data` props
  const biz = business ?? data;
  if (!biz?.name) return null;

  const photo = biz.photoUrl || biz.logoUrl || null;
  const displayName = titleCase(biz.name);
  const displayAddress = biz.formattedAddress || biz.address;
  const hasIndustryInference = showIndustryInference && biz.inferredIndustry;
  const confidencePct = biz.industryConfidence ? Math.round(biz.industryConfidence * 100) : 0;
  const confidenceLabel = confidencePct >= 85 ? "High" : confidencePct >= 60 ? "Medium" : "Low";
  const confidenceColor = confidencePct >= 85 ? "#4ade80" : confidencePct >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(74, 222, 128, 0.20)",
        background: "linear-gradient(135deg, rgba(14, 18, 32, 0.85) 0%, rgba(20, 30, 48, 0.75) 100%)",
        overflow: "hidden",
      }}
    >
      {/* ── Top bar: green accent line ── */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #4ade80 0%, #22d3ee 100%)" }} />

      {/* ── Business photo banner (from Google Maps) ── */}
      {photo && (
        <div style={{
          width: "100%",
          height: 140,
          overflow: "hidden",
          position: "relative",
          background: "rgba(0,0,0,0.3)",
        }}>
          <img
            src={photo}
            alt={displayName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.85,
            }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            background: "linear-gradient(transparent, rgba(14, 18, 32, 0.9))",
          }} />
        </div>
      )}

      <div style={{ padding: "20px 24px 16px" }}>
        {/* ── Header: Verified + Edit ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 6px rgba(74, 222, 128, 0.5)",
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: "0.6px",
              textTransform: "uppercase",
              color: "rgba(74, 222, 128, 0.9)",
            }}>
              Verified Business
            </span>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(232, 235, 243, 0.6)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(232, 235, 243, 0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "rgba(232, 235, 243, 0.6)";
              }}
            >
              Edit
            </button>
          )}
        </div>

        {/* ── Profile row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Avatar — only show when no banner photo */}
          {!photo && (
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              overflow: "hidden", flexShrink: 0,
              background: "linear-gradient(135deg, rgba(79, 140, 255, 0.25) 0%, rgba(139, 92, 246, 0.20) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "rgba(255,255,255,0.7)", letterSpacing: "1px" }}>
                {initials(biz.name)}
              </span>
            </div>
          )}

          {/* Name + address */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 18, fontWeight: 800, color: "#fff",
              letterSpacing: "-0.3px", lineHeight: 1.2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {displayName}
            </div>
            {displayAddress && (
              <div style={{
                fontSize: 13, color: "rgba(232, 235, 243, 0.55)",
                marginTop: 4, lineHeight: 1.4,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                📍 {displayAddress}
              </div>
            )}
          </div>
        </div>

        {/* ── Meta pills: category, rating, website ── */}
        {(biz.categoryLabel || typeof biz.rating === "number" || biz.website || biz.phone) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {biz.categoryLabel && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(232, 235, 243, 0.7)",
              }}>
                {biz.categoryLabel}
              </span>
            )}
            {typeof biz.rating === "number" && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                background: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.12)",
                color: "rgba(251, 191, 36, 0.9)",
              }}>
                ⭐ {biz.rating.toFixed(1)}{biz.userRatingsTotal ? ` (${biz.userRatingsTotal.toLocaleString()})` : ""}
              </span>
            )}
            {biz.website && (
              <a
                href={biz.website}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                  background: "rgba(79, 140, 255, 0.08)", border: "1px solid rgba(79, 140, 255, 0.12)",
                  color: "rgba(79, 140, 255, 0.9)", textDecoration: "none",
                }}
              >
                🔗 Website
              </a>
            )}
            {biz.phone && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(232, 235, 243, 0.7)",
              }}>
                📞 {biz.phone}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Industry Inference Section ── */}
      {hasIndustryInference && (
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14 }}>🏭</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(232, 235, 243, 0.4)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Industry
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginTop: 1 }}>
                {formatIndustry(biz.inferredIndustry)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 48, height: 5, borderRadius: 3,
              background: "rgba(255,255,255,0.08)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${confidencePct}%`,
                background: confidenceColor,
                transition: "width 0.5s ease",
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor }}>
              {confidenceLabel}
            </span>
          </div>
        </div>
      )}

      {/* ── Continue nudge ── */}
      <div style={{
        padding: "12px 24px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        background: "rgba(79, 140, 255, 0.04)",
      }}>
        <span style={{ fontSize: 13 }}>👇</span>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: "rgba(79, 140, 255, 0.8)",
          letterSpacing: "0.2px",
        }}>
          Looks right? Click <strong style={{ color: "rgba(79, 140, 255, 1)" }}>Continue</strong> below to set your energy goals
        </span>
      </div>
    </div>
  );
}
