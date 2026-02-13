/**
 * Merlin V7 — Supabase-Aligned Design Tokens
 *
 * Single source of truth for all visual tokens across wizard steps.
 * Inspired by Supabase's product pages: ultra-dark, emerald accent,
 * near-zero visual noise, content-first, data-forward.
 *
 * Created: February 13, 2026
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COLOR PALETTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SB = {
  // ── Backgrounds ──
  bg: "#080b14",
  bgCard: "rgba(255, 255, 255, 0.03)",
  bgCardHover: "rgba(255, 255, 255, 0.06)",
  bgInput: "rgba(255, 255, 255, 0.04)",
  bgSurface: "#101424",

  // ── Borders ──
  border: "rgba(255, 255, 255, 0.05)",
  borderHover: "rgba(255, 255, 255, 0.10)",
  borderAccent: "rgba(62, 207, 142, 0.35)",

  // ── Brand accent — Supabase emerald ──
  accent: "#3ECF8E",
  accentMuted: "rgba(62, 207, 142, 0.15)",
  accentBorder: "rgba(62, 207, 142, 0.25)",
  accentText: "#3ECF8E",

  // ── Text ──
  textPrimary: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.60)",
  textMuted: "rgba(255, 255, 255, 0.35)",
  textFaint: "rgba(255, 255, 255, 0.20)",

  // ── Semantic ──
  success: "#4ade80",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // ── Status / Equipment (used sparingly) ──
  solar: "#f59e0b",
  ev: "#06b6d4",
  generator: "#ef4444",
  purple: "#8b5cf6",
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SPACING & RADII
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPOGRAPHY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TYPE = {
  // Hero headline — Supabase uses ~40-48px, weight 600, normal case
  hero: {
    fontSize: 44,
    fontWeight: 600,
    letterSpacing: "-0.8px",
    lineHeight: 1.15,
    color: SB.textPrimary,
  },
  // Section heading
  heading: {
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: "-0.3px",
    lineHeight: 1.3,
    color: SB.textPrimary,
  },
  // Subheading / description
  subtitle: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    color: SB.textSecondary,
  },
  // Body text
  body: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.6,
    color: SB.textSecondary,
  },
  // Small label
  label: {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.02em",
    color: SB.textMuted,
  },
  // Micro text
  micro: {
    fontSize: 11,
    fontWeight: 500,
    color: SB.textMuted,
  },
  // Data / number display
  data: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.5px",
    color: SB.textPrimary,
    fontVariantNumeric: "tabular-nums" as const,
  },
  // Big number (savings hero)
  bigNumber: {
    fontSize: 56,
    fontWeight: 700,
    letterSpacing: "-1px",
    lineHeight: 1,
    color: SB.accent,
    fontVariantNumeric: "tabular-nums" as const,
  },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Flat card — Supabase style */
export const CARD_STYLE: React.CSSProperties = {
  borderRadius: RADIUS.md,
  border: `1px solid ${SB.border}`,
  background: SB.bgCard,
  padding: 20,
};

/** Ghost button — transparent + subtle border */
export const GHOST_BUTTON: React.CSSProperties = {
  height: 40,
  padding: "0 16px",
  borderRadius: RADIUS.sm,
  border: `1px solid ${SB.border}`,
  background: "transparent",
  color: SB.textSecondary,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

/** Primary CTA — solid emerald, dark text */
export const CTA_BUTTON: React.CSSProperties = {
  height: 40,
  padding: "0 20px",
  borderRadius: RADIUS.sm,
  border: "none",
  background: SB.accent,
  color: "#000",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

/** CTA disabled state */
export const CTA_BUTTON_DISABLED: React.CSSProperties = {
  ...CTA_BUTTON,
  background: "rgba(255, 255, 255, 0.04)",
  color: SB.textFaint,
  cursor: "not-allowed",
};

/** Input field — flat dark, thin border */
export const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  borderRadius: RADIUS.sm,
  border: `1px solid ${SB.border}`,
  background: SB.bgInput,
  fontSize: 14,
  color: SB.textPrimary,
  outline: "none",
  transition: "border-color 0.15s ease",
};
