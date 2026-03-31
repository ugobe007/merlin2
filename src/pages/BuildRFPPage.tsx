/**
 * BuildRFPPage — Full-page RFP builder
 *
 * Design: Merlin wizard design system —
 *   background: radial green glow + dark gradient (#080b14 → #0f1420)
 *   accent:     #3ECF8E
 *   cards:      rgba(255,255,255,0.025) + rgba(255,255,255,0.06) border
 *   buttons:    stroke-only, #3ECF8E for primary
 *
 * Data flow: Step5V8 writes `merlin_rfp_context` to sessionStorage,
 *            this page reads + prefills all fields. No upload needed.
 */

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  Zap,
  Sun,
  DollarSign,
  CheckCircle2,
  Send,
  Info,
  Cpu,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import BessSpecSheet from "@/components/BessSpecSheet";

// ─── Design tokens ────────────────────────────────────────────────────────────

const MERLIN_BG = `
  radial-gradient(ellipse 1400px 900px at 50% 15%, rgba(62,207,142,0.12) 0%, rgba(62,207,142,0.04) 40%, transparent 60%),
  linear-gradient(160deg, #080b14 0%, #0f1420 40%, #0a0d16 100%)
`;
const CARD_BG = "rgba(255,255,255,0.025)";
const CARD_BORDER = "rgba(255,255,255,0.06)";
const INPUT_BG = "rgba(255,255,255,0.04)";
const INPUT_BORDER = "rgba(255,255,255,0.10)";
const INPUT_FOCUS_BORDER = "rgba(62,207,142,0.50)";
const TEXT_PRIMARY = "#e8ebf3";
const TEXT_MUTED = "rgba(232,235,243,0.45)";
const TEXT_DIM = "rgba(232,235,243,0.22)";
const ACCENT = "#3ECF8E";
const ACCENT_DIM = "rgba(62,207,142,0.10)";
const ACCENT_BORDER = "rgba(62,207,142,0.28)";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RFPContext {
  industry: string;
  location: { city?: string; state?: string; country?: string };
  countryCode?: string;
  tier: {
    bessKW: number;
    bessKWh: number;
    durationHours: number;
    solarKW?: number;
    generatorKW?: number;
    selectedBESS?: {
      chemistry?: string;
      make?: string;
      model?: string;
      moduleKwh?: number;
      roundtripEfficiencyPct?: number;
      warrantyYears?: number;
      cycleLife?: number;
    };
    netCost?: number;
    paybackYears?: number;
    // Load profile — written by wizard Step 3
    baseLoadKW?: number;
    peakLoadKW?: number;
  };
  // Optional: if a quote was already saved we can link it
  savedQuoteId?: string;
}

const SESSION_KEY = "merlin_rfp_context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRfqNumber(): string {
  const today = new Date();
  const ymd =
    today.getFullYear() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `RFQ-${ymd}-${rand}`;
}

function defaultDueDate(): string {
  const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

function formatIndustry(slug: string): string {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildRequirements(ctx: RFPContext): string {
  const { tier, industry } = ctx;
  const lines: string[] = [
    `Industry: ${formatIndustry(industry)}`,
    `BESS: ${tier.bessKWh} kWh / ${tier.bessKW} kW (${tier.durationHours}h C2 spec)`,
  ];
  if (tier.solarKW) lines.push(`Solar: ${tier.solarKW} kW`);
  if (tier.generatorKW) lines.push(`Generator: ${tier.generatorKW} kW`);
  if (tier.selectedBESS?.chemistry)
    lines.push(`Preferred chemistry: ${tier.selectedBESS.chemistry}`);
  if (tier.netCost) lines.push(`Est. investment: $${Math.round(tier.netCost).toLocaleString()}`);
  if (tier.paybackYears) lines.push(`Est. payback: ${tier.paybackYears.toFixed(1)} years`);
  return lines.join("\n");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: TEXT_DIM,
        marginBottom: 12,
      }}
    >
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 500,
        color: TEXT_MUTED,
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

function FocusInput({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  readOnly,
  min,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  min?: string;
}) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      type={type}
      value={value}
      min={min}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        background: readOnly ? "transparent" : INPUT_BG,
        border: `1px solid ${focused ? INPUT_FOCUS_BORDER : readOnly ? CARD_BORDER : INPUT_BORDER}`,
        borderRadius: 8,
        padding: "9px 13px",
        fontSize: 13,
        color: readOnly ? TEXT_MUTED : TEXT_PRIMARY,
        fontFamily: "inherit",
        outline: "none",
        transition: "border-color 0.15s",
      }}
    />
  );
}

function PrimaryButton({
  onClick,
  disabled,
  type = "button",
  loading,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  loading?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "9px 20px",
        borderRadius: 8,
        border: `1px solid ${hovered && !disabled ? ACCENT : ACCENT_BORDER}`,
        background: hovered && !disabled ? ACCENT_DIM : "transparent",
        color: disabled ? TEXT_DIM : ACCENT,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        fontFamily: "inherit",
      }}
    >
      {loading ? (
        <>
          <span
            style={{
              display: "inline-block",
              width: 13,
              height: 13,
              border: `2px solid ${ACCENT}`,
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "merlin-spin 0.7s linear infinite",
            }}
          />{" "}
          Submitting…
        </>
      ) : (
        children
      )}
    </button>
  );
}

function GhostButton({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "9px 20px",
        borderRadius: 8,
        border: `1px solid ${hovered ? INPUT_BORDER : CARD_BORDER}`,
        background: "transparent",
        color: hovered ? TEXT_PRIMARY : TEXT_MUTED,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Spec is submitted",
    body: "Your BESS configuration — size, chemistry, location, and timeline — is packaged as a structured RFP and distributed to vetted vendors in your region.",
  },
  {
    step: "02",
    title: "Vendors bid competitively",
    body: "Certified BESS suppliers and EPCs review your requirements and submit proposals within your deadline. No cold calls, no guesswork.",
  },
  {
    step: "03",
    title: "You choose the best fit",
    body: "Compare bids side-by-side in your Merlin dashboard. Pricing, lead time, warranty terms — everything in one place.",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BuildRFPPage() {
  // ── Load context from sessionStorage ────────────────────────────────────
  const [ctx, setCtx] = useState<RFPContext | null>(null);
  const [contextMissing, setContextMissing] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        setCtx(JSON.parse(raw) as RFPContext);
      } else {
        setContextMissing(true);
      }
    } catch {
      setContextMissing(true);
    }
  }, []);

  // ── Form state (prefilled once ctx loads) ────────────────────────────────
  const [projectName, setProjectName] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [startDate, setStartDate] = useState("");
  const [requirements, setRequirements] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!ctx) return;
    const cityState = [ctx.location.city, ctx.location.state].filter(Boolean).join(", ");
    setProjectName([formatIndustry(ctx.industry), cityState || null].filter(Boolean).join(" — "));
    setRequirements(buildRequirements(ctx));
  }, [ctx]);

  // ── Submission state ─────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [rfqNumber, setRfqNumber] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  // ── Submit handler ───────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ctx) return;
    setSubmitting(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAuthRequired(true);
        setSubmitting(false);
        return;
      }
      const cityState = [ctx.location.city, ctx.location.state].filter(Boolean).join(", ");
      const rfqNum = generateRfqNumber();
      const fullRequirements =
        requirements + (notes.trim() ? `\n\nAdditional notes:\n${notes}` : "");

      const { error: insertError } = await supabase.from("rfqs").insert({
        created_by: user.id,
        rfq_number: rfqNum,
        project_name: projectName || "BESS Project",
        system_size_mw: ctx.tier.bessKW / 1000,
        duration_hours: ctx.tier.durationHours,
        location: cityState || ctx.location.state || "TBD",
        state_province: ctx.location.state ?? null,
        country: ctx.countryCode ?? "US",
        preferred_chemistry: ctx.tier.selectedBESS?.chemistry ?? null,
        due_date: dueDate,
        project_start_date: startDate || null,
        status: "open",
        requirements: fullRequirements,
      });

      if (insertError) throw insertError;

      // Clear sessionStorage context — it's been consumed
      sessionStorage.removeItem(SESSION_KEY);

      setRfqNumber(rfqNum);
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message || "Failed to submit RFP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Inject keyframes once ────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById("merlin-rfp-styles")) return;
    const style = document.createElement("style");
    style.id = "merlin-rfp-styles";
    style.textContent = `
      @keyframes merlin-spin { to { transform: rotate(360deg); } }
      @keyframes merlin-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      .rfp-fadein { animation: merlin-fadein 0.35s ease forwards; }
    `;
    document.head.appendChild(style);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Success state
  // ─────────────────────────────────────────────────────────────────────────
  if (submitted && rfqNumber) {
    return (
      <div
        style={{
          minHeight: "100svh",
          background: MERLIN_BG,
          color: TEXT_PRIMARY,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        <div className="rfp-fadein" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: `1px solid ${ACCENT_BORDER}`,
              background: ACCENT_DIM,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <CheckCircle2 size={26} color={ACCENT} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>RFP Submitted</h1>
          <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.7, marginBottom: 24 }}>
            Your request for proposal has been created and will be distributed to certified vendors
            in your region.
          </p>
          <div
            style={{
              background: CARD_BG,
              border: `1px solid ${CARD_BORDER}`,
              borderRadius: 10,
              padding: "12px 20px",
              marginBottom: 16,
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: TEXT_DIM,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 4,
              }}
            >
              RFQ Number
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono','Courier New',monospace",
                fontSize: 14,
                fontWeight: 600,
                color: ACCENT,
              }}
            >
              {rfqNumber}
            </p>
          </div>
          <div
            style={{
              background: CARD_BG,
              border: `1px solid ${CARD_BORDER}`,
              borderRadius: 10,
              padding: "16px 20px",
              marginBottom: 28,
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: TEXT_DIM,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 12,
              }}
            >
              What happens next
            </p>
            {[
              "Vendors in your region are notified of your RFP",
              "Proposals arrive in your Merlin dashboard within the deadline",
              "You compare bids and select your preferred partner",
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: i < 2 ? 10 : 0,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `1px solid ${CARD_BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: TEXT_DIM,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <p style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <GhostButton onClick={() => (window.location.href = "/wizard")}>
              <ArrowLeft size={13} /> Back to Wizard
            </GhostButton>
            <PrimaryButton onClick={() => (window.location.href = "/account")}>
              View Dashboard
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Missing context fallback
  // ─────────────────────────────────────────────────────────────────────────
  if (contextMissing) {
    return (
      <div
        style={{
          minHeight: "100svh",
          background: MERLIN_BG,
          color: TEXT_PRIMARY,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: `1px solid ${CARD_BORDER}`,
              background: CARD_BG,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Info size={20} color={TEXT_MUTED} />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
            No quote context found
          </h1>
          <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.7, marginBottom: 24 }}>
            This page is reached from the Merlin TrueQuote wizard. Run the wizard and click{" "}
            <strong style={{ color: TEXT_PRIMARY }}>Build RFP</strong> from your quote results.
          </p>
          <GhostButton onClick={() => (window.location.href = "/wizard")}>
            <ArrowLeft size={13} /> Go to Wizard
          </GhostButton>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Loading
  // ─────────────────────────────────────────────────────────────────────────
  if (!ctx) {
    return (
      <div
        style={{
          minHeight: "100svh",
          background: MERLIN_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 24,
            height: 24,
            border: `2px solid ${CARD_BORDER}`,
            borderTopColor: ACCENT,
            borderRadius: "50%",
            animation: "merlin-spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Main form
  // ─────────────────────────────────────────────────────────────────────────
  const cityState = [ctx.location.city, ctx.location.state].filter(Boolean).join(", ");

  return (
    <div
      style={{
        minHeight: "100svh",
        background: MERLIN_BG,
        color: TEXT_PRIMARY,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ── Top nav bar ── */}
      <div
        style={{
          borderBottom: `1px solid ${CARD_BORDER}`,
          background: "rgba(8,11,20,0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 20px",
            height: 52,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={() => window.history.back()}
            onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_PRIMARY)}
            onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUTED)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: TEXT_MUTED,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "color 0.15s",
              fontFamily: "inherit",
            }}
          >
            <ArrowLeft size={15} /> Back to Quote
          </button>
          <span style={{ color: CARD_BORDER }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <ClipboardList size={14} color={TEXT_DIM} />
            <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_MUTED }}>Build RFP</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <Cpu size={13} color={ACCENT} />
            <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.05em" }}>
              MERLIN
            </span>
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div
        className="rfp-fadein"
        style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px 80px" }}
      >
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>
            Request for Proposal
          </h1>
          <p style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.7, maxWidth: 520 }}>
            Submit your BESS specification to certified vendors. They'll bid competitively on your
            project so you can compare pricing, lead times, and warranty terms in one place.
          </p>
        </div>

        {/* Quote summary strip */}
        <div
          style={{
            background: CARD_BG,
            border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 36,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: ACCENT,
              opacity: 0.8,
              marginBottom: 12,
            }}
          >
            Quote Summary — Prefilled from TrueQuote
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 28px" }}>
            {cityState && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <MapPin size={13} color={TEXT_DIM} /> {cityState}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Zap size={13} color={TEXT_DIM} />
              {ctx.tier.bessKWh} kWh / {ctx.tier.bessKW} kW BESS
              <span style={{ color: TEXT_DIM, fontSize: 12 }}>({ctx.tier.durationHours}h C2)</span>
            </span>
            {(ctx.tier.solarKW ?? 0) > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <Sun size={13} color={TEXT_DIM} /> {ctx.tier.solarKW} kW Solar
              </span>
            )}
            {(ctx.tier.netCost ?? 0) > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <DollarSign size={13} color={TEXT_DIM} />
                ~${Math.round(ctx.tier.netCost!).toLocaleString()} est.
              </span>
            )}
            {ctx.tier.selectedBESS?.chemistry && (
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                Chemistry: {ctx.tier.selectedBESS.chemistry}
              </span>
            )}
          </div>
        </div>

        {/* Technical Specifications — derived from quote, visible to vendors */}
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: TEXT_DIM,
              marginBottom: 14,
            }}
          >
            Technical Specifications — sent with RFP
          </p>
          <BessSpecSheet
            bessKW={ctx.tier.bessKW}
            bessKWh={ctx.tier.bessKWh}
            durationHours={ctx.tier.durationHours}
            chemistry={ctx.tier.selectedBESS?.chemistry ?? "LFP"}
            manufacturer={ctx.tier.selectedBESS?.make}
            model={ctx.tier.selectedBESS?.model}
            moduleKwh={ctx.tier.selectedBESS?.moduleKwh}
            roundtripEfficiencyPct={ctx.tier.selectedBESS?.roundtripEfficiencyPct}
            warrantyYears={ctx.tier.selectedBESS?.warrantyYears}
            cycleLife={ctx.tier.selectedBESS?.cycleLife}
            solarKW={ctx.tier.solarKW ?? 0}
            generatorKW={ctx.tier.generatorKW ?? 0}
            baseLoadKW={ctx.tier.baseLoadKW}
            peakLoadKW={ctx.tier.peakLoadKW}
          />
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 272px",
            gap: 36,
            alignItems: "start",
          }}
        >
          {/* LEFT — form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 28 }}
          >
            {/* RFP Settings */}
            <div>
              <SectionLabel>RFP Settings</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <FieldLabel>Project Name</FieldLabel>
                  <FocusInput
                    value={projectName}
                    onChange={setProjectName}
                    placeholder="e.g. Car Wash — Austin, TX"
                    required
                  />
                </div>

                <div>
                  <FieldLabel>Location</FieldLabel>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "transparent",
                      border: `1px solid ${CARD_BORDER}`,
                      borderRadius: 8,
                      padding: "9px 13px",
                      fontSize: 13,
                      color: TEXT_MUTED,
                    }}
                  >
                    <MapPin size={13} color={TEXT_DIM} />
                    {cityState || ctx.location.state || "From your quote"}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <FieldLabel>
                      Response Deadline{" "}
                      <span style={{ color: TEXT_DIM, fontWeight: 400 }}>(+14 days)</span>
                    </FieldLabel>
                    <FocusInput type="date" value={dueDate} onChange={setDueDate} required />
                  </div>
                  <div>
                    <FieldLabel>
                      Project Start{" "}
                      <span style={{ color: TEXT_DIM, fontWeight: 400 }}>(optional)</span>
                    </FieldLabel>
                    <FocusInput type="date" value={startDate} onChange={setStartDate} />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <SectionLabel>Notes to Vendors</SectionLabel>
              <div
                style={{
                  background: INPUT_BG,
                  border: `1px solid ${INPUT_BORDER}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Special requirements, installation constraints, financing preferences…"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: TEXT_PRIMARY,
                    lineHeight: 1.7,
                    fontFamily: "inherit",
                    resize: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <p style={{ fontSize: 10, color: TEXT_DIM, marginTop: 6 }}>
                The full technical spec sheet above will be included with your RFP — vendors see
                every detail.
              </p>
            </div>

            {/* Auth notice */}
            {authRequired && (
              <div
                style={{
                  background: "rgba(245,158,11,0.07)",
                  border: "1px solid rgba(245,158,11,0.22)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <Info size={15} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#FCD34D", marginBottom: 3 }}>
                    Sign in required
                  </p>
                  <p style={{ fontSize: 12, color: TEXT_MUTED }}>
                    You need a Merlin account to submit an RFP.{" "}
                    <a
                      href="/?signup=true"
                      style={{ color: "#F59E0B", textDecoration: "underline" }}
                    >
                      Create a free account →
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p
                style={{
                  fontSize: 12,
                  color: "#f87171",
                  background: "rgba(248,113,113,0.06)",
                  border: "1px solid rgba(248,113,113,0.20)",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                {error}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <PrimaryButton type="submit" loading={submitting} disabled={!projectName || !dueDate}>
                <Send size={13} /> Submit RFP
              </PrimaryButton>
              <GhostButton onClick={() => window.history.back()}>Cancel</GhostButton>
            </div>
          </form>

          {/* RIGHT — How it works */}
          <div style={{ position: "sticky", top: 68 }}>
            <SectionLabel>How it works</SectionLabel>
            <div>
              {HOW_IT_WORKS.map((item, i) => (
                <div
                  key={item.step}
                  style={{
                    background: CARD_BG,
                    border: `1px solid ${CARD_BORDER}`,
                    borderTop: i > 0 ? "none" : `1px solid ${CARD_BORDER}`,
                    borderRadius:
                      i === 0
                        ? "10px 10px 0 0"
                        : i === HOW_IT_WORKS.length - 1
                          ? "0 0 10px 10px"
                          : 0,
                    padding: "14px 16px",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      color: TEXT_DIM,
                      paddingTop: 2,
                      width: 20,
                    }}
                  >
                    {item.step}
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.title}</p>
                    <p style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.65 }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Merlin note */}
            <div
              style={{
                marginTop: 14,
                background: ACCENT_DIM,
                border: `1px solid ${ACCENT_BORDER}`,
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                gap: 8,
              }}
            >
              <Cpu size={13} color={ACCENT} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.65 }}>
                Merlin pre-fills all spec fields from your TrueQuote. No re-entry, no upload.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
