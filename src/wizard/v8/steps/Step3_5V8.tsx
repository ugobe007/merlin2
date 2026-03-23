/**
 * WIZARD V8 — STEP 3.5: ADD-ON INTENTS
 * ============================================================================
 * Solar recommendation is derived from the user's roof area (step 3).
 * Generator recommendation is driven by grid reliability (step 1).
 * EV Charging uses 3 specific packages with annual revenue estimates.
 * ============================================================================
 */

import React, { useState } from "react";
import type { WizardState, WizardActions } from "../wizardState";

interface Props {
  state: WizardState;
  actions: WizardActions;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** sq ft per kW installed (standard 400W panel ≈ 40 sqft + 60% usable factor) */
const SQFT_PER_KW = 100;

const SOLAR_SCOPES = [
  { id: "roof_only",   label: "Roof only",         penetration: 0.55, recommended: false },
  { id: "roof_canopy", label: "Roof + canopy",      penetration: 0.80, recommended: true  },
  { id: "maximum",     label: "Maximum coverage",   penetration: 1.00, recommended: false },
] as const;

const GENERATOR_SCOPES = [
  { id: "essential", label: "Critical loads",   desc: "Essential circuits only",   recommended: false },
  { id: "full",      label: "Full facility",    desc: "Entire facility + 10% margin", recommended: true  },
  { id: "critical",  label: "Mission critical", desc: "Full load + 35% headroom",  recommended: false },
] as const;

// EV packages — specific charger counts + annual revenue estimates
const EV_PACKAGES = [
  {
    id: "pkg_basic",
    label: "Starter",
    l2: 4,
    dcfc: 0,
    annualRevenue: 7200,
    recommended: false,
    tagline: "Employee & visitor charging",
  },
  {
    id: "pkg_pro",
    label: "Pro Hub",
    l2: 6,
    dcfc: 2,
    annualRevenue: 34800,
    recommended: true,
    tagline: "Public + fast charging revenue",
  },
  {
    id: "pkg_fleet",
    label: "Fleet+",
    l2: 6,
    dcfc: 4,
    annualRevenue: 58800,
    recommended: false,
    tagline: "Fleet depot or high-traffic site",
  },
] as const;

type SolarScope     = (typeof SOLAR_SCOPES)[number]["id"];
type GeneratorScope = (typeof GENERATOR_SCOPES)[number]["id"];
type EVPackage      = (typeof EV_PACKAGES)[number]["id"];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive solar cap from step 3 roofArea answer first, fall back to SSOT */
function getEffectiveSolarCapKW(state: WizardState): number {
  const roofAreaSqFt = state.step3Answers?.roofArea as number | undefined;
  if (roofAreaSqFt && roofAreaSqFt > 0) {
    return Math.round((roofAreaSqFt * 0.75) / SQFT_PER_KW); // 75% usable
  }
  return state.solarPhysicalCapKW;
}

function estimateSolarKW(scope: SolarScope, state: WizardState): number {
  const cap = getEffectiveSolarCapKW(state);
  if (cap <= 0) return 0;
  const sunFactor = Math.max(0, Math.min(1.0, ((state.intel?.peakSunHours ?? 4.5) - 3.0) / 2.5));
  const pen = SOLAR_SCOPES.find((s) => s.id === scope)?.penetration ?? 0.80;
  return Math.round(cap * (0.7 + sunFactor * 0.3) * pen);
}

function estimateGenKW(scope: GeneratorScope, state: WizardState): number {
  const { peakLoadKW, criticalLoadPct } = state;
  if (peakLoadKW <= 0) return 0;
  if (scope === "essential") return Math.max(10, Math.round(peakLoadKW * criticalLoadPct * 1.25));
  if (scope === "critical")  return Math.max(10, Math.round(peakLoadKW * 1.35));
  return Math.max(10, Math.round(peakLoadKW * 1.10));
}

/** Smart default generator scope based on grid reliability */
function defaultGeneratorScope(state: WizardState): GeneratorScope {
  if (state.gridReliability === "unreliable") return "critical";
  if (state.gridReliability === "frequent-outages") return "full";
  return "essential";
}

function fmtKW(kw: number): string {
  return kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${kw} kW`;
}

function fmtRevenue(annual: number): string {
  if (annual >= 1000) return `$${(annual / 1000).toFixed(0)}K`;
  return `$${annual}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Step3_5V8({ state, actions }: Props) {
  const solarFeasible =
    (state.intel?.solarFeasible ?? false) || state.solarPhysicalCapKW > 0 ||
    !!(state.step3Answers?.roofArea as number | undefined);

  // Toggle state
  const [wantsSolar,     setWantsSolar]     = useState(state.wantsSolar);
  const [wantsGenerator, setWantsGenerator] = useState(state.wantsGenerator);
  const [wantsEV,        setWantsEV]        = useState(state.wantsEVCharging);

  // Scope state
  const [solarScope,     setSolarScope]     = useState<SolarScope>(
    (state.step3Answers?.solarScope as SolarScope | undefined) ?? "roof_canopy"
  );
  const [generatorScope, setGeneratorScope] = useState<GeneratorScope>(
    (state.step3Answers?.generatorScope as GeneratorScope | undefined) ?? defaultGeneratorScope(state)
  );
  const [evPackage, setEvPackage] = useState<EVPackage>(
    (state.step3Answers?.evScope as EVPackage | undefined) ?? "pkg_pro"
  );

  // Toggle handlers
  const toggleSolar = () => {
    const next = !wantsSolar;
    setWantsSolar(next);
    actions.setAddonPreference("solar", next);
    if (next) actions.setAnswer("solarScope", solarScope);
  };
  const toggleGenerator = () => {
    const next = !wantsGenerator;
    setWantsGenerator(next);
    actions.setAddonPreference("generator", next);
    if (next) actions.setAnswer("generatorScope", generatorScope);
  };
  const toggleEV = () => {
    const next = !wantsEV;
    setWantsEV(next);
    actions.setAddonPreference("ev", next);
    if (next) actions.setAnswer("evScope", evPackage);
  };

  const handleSolarScope = (s: SolarScope) => {
    setSolarScope(s);
    actions.setAnswer("solarScope", s);
  };
  const handleGeneratorScope = (s: GeneratorScope) => {
    setGeneratorScope(s);
    actions.setAnswer("generatorScope", s);
  };
  const handleEVPackage = (pkg: EVPackage) => {
    setEvPackage(pkg);
    actions.setAnswer("evScope", pkg);
  };

  // Derived values
  const effectiveSolarCapKW = getEffectiveSolarCapKW(state);
  const roofAreaSqFt = state.step3Answers?.roofArea as number | undefined;
  const activeSolarKW = wantsSolar && solarFeasible ? estimateSolarKW(solarScope, state) : 0;
  const activeGenKW   = wantsGenerator ? estimateGenKW(generatorScope, state) : 0;
  const activeEVPkg   = wantsEV ? EV_PACKAGES.find((p) => p.id === evPackage) ?? EV_PACKAGES[1] : null;
  const hasAnyAddon   = wantsSolar || wantsGenerator || wantsEV;

  // Generator smart recommendation signal
  const gridReliability = state.gridReliability;
  const generatorSuggested =
    gridReliability === "frequent-outages" || gridReliability === "unreliable";
  const gridReliabilityLabel: Record<string, string> = {
    "reliable": "Reliable grid",
    "occasional-outages": "Occasional outages",
    "frequent-outages": "Frequent outages",
    "unreliable": "Unreliable grid",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.3px" }}>
          Customize your scope
        </h2>
        <p style={{ fontSize: 13, color: "rgba(148,163,184,0.85)", marginTop: 6, lineHeight: 1.5 }}>
          Toggle what to include. Estimates are calculated from your facility profile.
        </p>
      </div>

      {/* Battery — always included */}
      <AlwaysIncludedCard
        icon="🔋"
        name="Battery Storage"
        description="Shifts load to off-peak hours, shaves demand charges, and powers through outages. Merlin sizes it to your exact load profile."
        bessKW={state.baseLoadKW}
        bessKWh={state.baseLoadKW > 0 ? Math.round(state.baseLoadKW * 4) : null}
      />

      {/* Solar */}
      {solarFeasible && (
        <IntentCard
          icon="☀️"
          name="Solar Generation"
          description="Generate clean electricity from your facility's roof or canopy."
          isOn={wantsSolar}
          onToggle={toggleSolar}
          scopes={SOLAR_SCOPES}
          selectedScope={solarScope}
          onScopeChange={handleSolarScope}
          scopeQuestion="How much of your facility will have panels?"
          estimateKW={(id) => estimateSolarKW(id as SolarScope, state)}
          estimateLabel="est. at your site"
          headerBadge={
            state.intel?.solarGrade
              ? `Grade ${state.intel.solarGrade}${state.intel.peakSunHours ? ` · ${state.intel.peakSunHours.toFixed(1)} PSH` : ""}`
              : undefined
          }
          headerBadgeColor="#F59E0B"
          contextNote={
            roofAreaSqFt && roofAreaSqFt > 0
              ? `Based on your ${roofAreaSqFt.toLocaleString()} sq ft roof · ${effectiveSolarCapKW} kW physical capacity · ${state.intel?.peakSunHours?.toFixed(1) ?? "4.5"} PSH factored in`
              : state.solarPhysicalCapKW > 0
                ? `Roof capacity: ${state.solarPhysicalCapKW} kW · Sun quality (${state.intel?.peakSunHours?.toFixed(1) ?? "?"} PSH) factored into estimate`
                : undefined
          }
          confirmLines={
            activeSolarKW > 0
              ? [
                  `${fmtKW(activeSolarKW)} solar generation added to your quote`,
                  `Tiers scale: Essential ~${fmtKW(Math.round(activeSolarKW * 0.75))}  ·  Optimized ~${fmtKW(activeSolarKW)}  ·  Premium ~${fmtKW(Math.min(Math.round(activeSolarKW * 1.1), effectiveSolarCapKW))}`,
                ]
              : undefined
          }
        />
      )}

      {/* Generator */}
      <IntentCard
        icon="⚡"
        name="Backup Generator"
        description={
          generatorSuggested
            ? `Recommended based on your grid profile: ${gridReliabilityLabel[gridReliability ?? ""] ?? "grid issues detected"}.`
            : "Natural gas or diesel power for outages and grid-independence goals."
        }
        isOn={wantsGenerator}
        onToggle={toggleGenerator}
        scopes={GENERATOR_SCOPES}
        selectedScope={generatorScope}
        onScopeChange={handleGeneratorScope}
        scopeQuestion="What load must the generator cover?"
        estimateKW={(id) => estimateGenKW(id as GeneratorScope, state)}
        estimateLabel={(id) => GENERATOR_SCOPES.find((s) => s.id === id)?.desc ?? ""}
        headerBadge={
          gridReliability
            ? gridReliabilityLabel[gridReliability]
            : state.criticalLoadPct > 0
              ? `${Math.round(state.criticalLoadPct * 100)}% critical · ${Math.round(state.peakLoadKW * state.criticalLoadPct)} kW`
              : undefined
        }
        headerBadgeColor={generatorSuggested ? "#f87171" : "#94a3b8"}
        recommendedAlert={
          generatorSuggested
            ? `Your grid is ${gridReliabilityLabel[gridReliability ?? ""] ?? "unreliable"} — a generator protects your revenue during outages.`
            : undefined
        }
        contextNote={
          state.peakLoadKW > 0
            ? `Facility peak: ${state.peakLoadKW} kW · Critical systems: ${Math.round(state.criticalLoadPct * 100)}% (${Math.round(state.peakLoadKW * state.criticalLoadPct)} kW)`
            : undefined
        }
        confirmLines={
          activeGenKW > 0
            ? [
                `${fmtKW(activeGenKW)} generator added to your quote`,
                `Tiers scale: Essential ~${fmtKW(Math.round(activeGenKW * 0.8))}  ·  Optimized ~${fmtKW(activeGenKW)}  ·  Premium ~${fmtKW(Math.round(activeGenKW * 1.25))}`,
              ]
            : undefined
        }
      />

      {/* EV Charging — package selector */}
      <EVPackageCard
        isOn={wantsEV}
        onToggle={toggleEV}
        selectedPackage={evPackage}
        onSelectPackage={handleEVPackage}
        peakLoadKW={state.peakLoadKW}
      />

      {/* Summary strip */}
      {hasAnyAddon && (
        <div style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.18)", background: "rgba(15,17,23,0.65)", marginTop: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(16,185,129,0.65)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Quote scope — what Merlin is sizing</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 12 }}>🔋</span>
              <span style={{ fontSize: 11, color: "rgba(148,163,184,0.6)" }}>BESS:</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6EE7B7" }}>{state.baseLoadKW} kW facility load</span>
            </div>
            {activeSolarKW > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12 }}>☀️</span>
                <span style={{ fontSize: 11, color: "rgba(148,163,184,0.6)" }}>Solar:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>~{fmtKW(activeSolarKW)}</span>
              </div>
            )}
            {activeGenKW > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12 }}>⚡</span>
                <span style={{ fontSize: 11, color: "rgba(148,163,184,0.6)" }}>Generator:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>~{fmtKW(activeGenKW)}</span>
              </div>
            )}
            {activeEVPkg && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12 }}>🚗</span>
                <span style={{ fontSize: 11, color: "rgba(148,163,184,0.6)" }}>EV:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                  {activeEVPkg.l2} L2{activeEVPkg.dcfc > 0 ? ` + ${activeEVPkg.dcfc} DCFC` : ""} · ~{fmtRevenue(activeEVPkg.annualRevenue)}/yr revenue
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Always-included card (Battery) ────────────────────────────────────────────

interface AlwaysIncludedCardProps {
  icon: string;
  name: string;
  description: string;
  bessKW?: number;
  bessKWh?: number | null;
}

function AlwaysIncludedCard({ icon, name, description, bessKW, bessKWh }: AlwaysIncludedCardProps) {
  return (
    <div style={{ padding: "13px 15px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.06)", display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{name}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "#3ECF8E", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 4, padding: "2px 6px", textTransform: "uppercase" }}>Always included</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(148,163,184,0.8)", margin: 0, lineHeight: 1.5 }}>{description}</p>
        {bessKW != null && bessKW > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "5px 9px", borderRadius: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>
              <span style={{ fontSize: 9, color: "rgba(16,185,129,0.6)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Facility load</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#6EE7B7" }}>{bessKW} kW</span>
            </div>
            {bessKWh != null && bessKWh > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "5px 9px", borderRadius: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>
                <span style={{ fontSize: 9, color: "rgba(16,185,129,0.6)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Est. storage · 4h baseline</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#6EE7B7" }}>~{bessKWh} kWh</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Intent card (Solar + Generator) ──────────────────────────────────────────

interface ScopeOption {
  id: string;
  label: string;
  recommended?: boolean;
  sub?: string;
  desc?: string;
}

interface IntentCardProps<T extends string> {
  icon: string;
  name: string;
  description: string;
  isOn: boolean;
  onToggle: () => void;
  scopes: readonly ScopeOption[];
  selectedScope: T;
  onScopeChange: (scope: T) => void;
  scopeQuestion?: string;
  estimateKW?: (id: string) => number;
  estimateLabel?: string | ((id: string) => string);
  estimateNote?: string | ((id: string) => string);
  headerBadge?: string;
  headerBadgeColor?: string;
  /** Red alert banner shown when add-on is strongly recommended */
  recommendedAlert?: string;
  contextNote?: string;
  confirmLines?: string[];
}

function IntentCard<T extends string>({
  icon, name, description, isOn, onToggle, scopes, selectedScope, onScopeChange,
  scopeQuestion, estimateKW, estimateLabel, estimateNote, headerBadge, headerBadgeColor,
  recommendedAlert, contextNote, confirmLines,
}: IntentCardProps<T>) {
  const selectedKWVal = isOn && estimateKW ? estimateKW(selectedScope) : 0;
  const selectedLabelFn = typeof estimateLabel === "function" ? estimateLabel : undefined;
  const selectedBadge = isOn && selectedKWVal > 0
    ? (selectedLabelFn ? selectedLabelFn(selectedScope) : fmtKW(selectedKWVal))
    : undefined;

  return (
    <div style={{ borderRadius: 12, border: isOn ? "1.5px solid rgba(16,185,129,0.45)" : (recommendedAlert ? "1.5px solid rgba(248,113,113,0.35)" : "1px solid rgba(255,255,255,0.08)"), background: isOn ? "rgba(16,185,129,0.07)" : (recommendedAlert ? "rgba(248,113,113,0.04)" : "rgba(51,65,85,0.45)"), overflow: "hidden", transition: "border-color 0.15s, background 0.15s" }}>
      {/* Recommended alert banner (shown when not yet toggled on) */}
      {!isOn && recommendedAlert && (
        <div style={{ padding: "7px 14px", background: "rgba(248,113,113,0.10)", borderBottom: "1px solid rgba(248,113,113,0.18)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11 }}>⚠️</span>
          <span style={{ fontSize: 11, color: "#fca5a5", fontWeight: 500 }}>{recommendedAlert}</span>
        </div>
      )}
      {/* Header */}
      <button onClick={onToggle} style={{ width: "100%", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: isOn ? "rgba(16,185,129,0.14)" : "rgba(255,255,255,0.05)", border: isOn ? "1px solid rgba(16,185,129,0.28)" : "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, transition: "all 0.15s" }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: isOn ? "#6EE7B7" : "#fff" }}>{name}</span>
            {headerBadge && (
              <span style={{ fontSize: 10, fontWeight: 600, color: headerBadgeColor ?? "#94a3b8", background: "rgba(100,116,139,0.12)", border: "1px solid rgba(100,116,139,0.22)", borderRadius: 4, padding: "1px 5px" }}>{headerBadge}</span>
            )}
            {isOn && selectedBadge && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#3ECF8E", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 4, padding: "1px 6px" }}>{selectedBadge}</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", margin: "2px 0 0", lineHeight: 1.4 }}>{description}</p>
        </div>
        <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", border: isOn ? "none" : "1.5px solid rgba(255,255,255,0.22)", background: isOn ? "#3ECF8E" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0D1117", transition: "all 0.15s ease", boxShadow: isOn ? "0 0 8px rgba(16,185,129,0.45)" : "none" }}>
          {isOn && "✓"}
        </div>
      </button>

      {/* Scope pills */}
      {isOn && (
        <div style={{ padding: "0 14px 14px" }}>
          {scopeQuestion && (
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(148,163,184,0.55)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>{scopeQuestion}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {scopes.map((s) => {
              const active = selectedScope === s.id;
              const kwVal   = estimateKW ? estimateKW(s.id) : 0;
              const valLabel = typeof estimateLabel === "function" ? estimateLabel(s.id)
                             : typeof estimateLabel === "string"   ? estimateLabel
                             : kwVal > 0 ? fmtKW(kwVal) : "—";
              const valNote  = typeof estimateNote === "function" ? estimateNote(s.id)
                             : typeof estimateNote === "string"   ? estimateNote
                             : kwVal > 0 ? "est. at your site" : (s.desc ?? s.sub ?? "");
              return (
                <button
                  key={s.id}
                  onClick={() => onScopeChange(s.id as T)}
                  style={{ padding: "10px 10px 9px", borderRadius: 8, border: active ? "1.5px solid rgba(16,185,129,0.55)" : "1px solid rgba(255,255,255,0.08)", background: active ? "rgba(16,185,129,0.11)" : "rgba(51,65,85,0.45)", cursor: "pointer", textAlign: "left", transition: "all 0.12s", display: "flex", flexDirection: "column", gap: 3, position: "relative" }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(51,65,85,0.65)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "rgba(51,65,85,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; } }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? "#6EE7B7" : "rgba(255,255,255,0.82)", lineHeight: 1.2 }}>{s.label}</span>
                    <div style={{ flexShrink: 0, width: 14, height: 14, borderRadius: "50%", border: active ? "none" : "1.5px solid rgba(255,255,255,0.18)", background: active ? "#3ECF8E" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#0D1117", transition: "all 0.12s" }}>{active && "✓"}</div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: active ? "#3ECF8E" : "rgba(255,255,255,0.72)", letterSpacing: "-0.3px", lineHeight: 1 }}>{valLabel}</span>
                  <span style={{ fontSize: 10, color: active ? "rgba(110,231,183,0.58)" : "rgba(148,163,184,0.48)", lineHeight: 1.3 }}>{valNote}</span>
                  {s.recommended && (
                    <span style={{ position: "absolute", top: 5, right: active ? 22 : 6, fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#3ECF8E", background: "rgba(16,185,129,0.13)", border: "1px solid rgba(16,185,129,0.22)", borderRadius: 3, padding: "1px 4px", letterSpacing: "0.04em" }}>Best</span>
                  )}
                </button>
              );
            })}
          </div>
          {contextNote && (
            <div style={{ fontSize: 10, color: "rgba(148,163,184,0.42)", marginTop: 7, lineHeight: 1.4 }}>{contextNote}</div>
          )}
          {confirmLines && confirmLines.length > 0 && (
            <div style={{ marginTop: 10, padding: "9px 11px", borderRadius: 8, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                {confirmLines.map((line, i) => (
                  <div key={i} style={{ fontSize: i === 0 ? 12 : 11, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "#6EE7B7" : "rgba(148,163,184,0.60)", lineHeight: 1.4, marginTop: i > 0 ? 2 : 0 }}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── EV Package Card ───────────────────────────────────────────────────────────

interface EVPackageCardProps {
  isOn: boolean;
  onToggle: () => void;
  selectedPackage: EVPackage;
  onSelectPackage: (pkg: EVPackage) => void;
  peakLoadKW: number;
}

function EVPackageCard({ isOn, onToggle, selectedPackage, onSelectPackage, peakLoadKW }: EVPackageCardProps) {
  const selected = EV_PACKAGES.find((p) => p.id === selectedPackage) ?? EV_PACKAGES[1];
  const totalKW = (pkg: typeof EV_PACKAGES[number]) => Math.round(pkg.l2 * 7.2 + pkg.dcfc * 50);
  const loadImpact = (pkg: typeof EV_PACKAGES[number]) => {
    const kw = totalKW(pkg);
    return peakLoadKW > 0 ? `+${Math.round((kw / peakLoadKW) * 100)}% peak load` : `${kw} kW peak`;
  };

  return (
    <div style={{ borderRadius: 12, border: isOn ? "1.5px solid rgba(16,185,129,0.45)" : "1px solid rgba(255,255,255,0.08)", background: isOn ? "rgba(16,185,129,0.07)" : "rgba(51,65,85,0.45)", overflow: "hidden", transition: "border-color 0.15s, background 0.15s" }}>
      {/* Header */}
      <button onClick={onToggle} style={{ width: "100%", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: isOn ? "rgba(16,185,129,0.14)" : "rgba(255,255,255,0.05)", border: isOn ? "1px solid rgba(16,185,129,0.28)" : "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, transition: "all 0.15s" }}>
          🚗
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: isOn ? "#6EE7B7" : "#fff" }}>EV Charging</span>
            {isOn && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#3ECF8E", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 4, padding: "1px 6px" }}>
                ~{fmtRevenue(selected.annualRevenue)}/yr revenue
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", margin: "2px 0 0", lineHeight: 1.4 }}>
            Level 2 and DC fast chargers for customers, staff, or fleet vehicles.
          </p>
        </div>
        <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", border: isOn ? "none" : "1.5px solid rgba(255,255,255,0.22)", background: isOn ? "#3ECF8E" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0D1117", transition: "all 0.15s ease", boxShadow: isOn ? "0 0 8px rgba(16,185,129,0.45)" : "none" }}>
          {isOn && "✓"}
        </div>
      </button>

      {/* Package selector */}
      {isOn && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(148,163,184,0.55)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>Select your charging package</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {EV_PACKAGES.map((pkg) => {
              const active = selectedPackage === pkg.id;
              const kw = totalKW(pkg);
              return (
                <button
                  key={pkg.id}
                  onClick={() => onSelectPackage(pkg.id)}
                  style={{ padding: "10px 10px 10px", borderRadius: 8, border: active ? "1.5px solid rgba(16,185,129,0.55)" : "1px solid rgba(255,255,255,0.08)", background: active ? "rgba(16,185,129,0.11)" : "rgba(51,65,85,0.45)", cursor: "pointer", textAlign: "left", transition: "all 0.12s", display: "flex", flexDirection: "column", gap: 4, position: "relative" }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(51,65,85,0.65)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "rgba(51,65,85,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; } }}
                >
                  {/* Package name + checkmark */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: active ? "#6EE7B7" : "rgba(255,255,255,0.88)", lineHeight: 1.2 }}>{pkg.label}</span>
                    <div style={{ flexShrink: 0, width: 14, height: 14, borderRadius: "50%", border: active ? "none" : "1.5px solid rgba(255,255,255,0.18)", background: active ? "#3ECF8E" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#0D1117" }}>{active && "✓"}</div>
                  </div>
                  {/* Charger counts */}
                  <div style={{ fontSize: 10, color: active ? "rgba(110,231,183,0.70)" : "rgba(148,163,184,0.55)", lineHeight: 1.3 }}>
                    {pkg.l2} L2{pkg.dcfc > 0 ? ` + ${pkg.dcfc} L3` : ""}
                  </div>
                  {/* Revenue — THE key number */}
                  <div style={{ fontSize: 14, fontWeight: 800, color: active ? "#3ECF8E" : "rgba(255,255,255,0.70)", letterSpacing: "-0.3px", lineHeight: 1, marginTop: 2 }}>
                    {fmtRevenue(pkg.annualRevenue)}/yr
                  </div>
                  <div style={{ fontSize: 9, color: active ? "rgba(110,231,183,0.50)" : "rgba(148,163,184,0.40)", lineHeight: 1.2 }}>
                    est. revenue
                  </div>
                  {/* Load impact */}
                  <div style={{ fontSize: 9, color: "rgba(148,163,184,0.38)", marginTop: 1 }}>{loadImpact(pkg)} · {kw} kW</div>
                  {pkg.recommended && (
                    <span style={{ position: "absolute", top: 5, right: active ? 22 : 6, fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#3ECF8E", background: "rgba(16,185,129,0.13)", border: "1px solid rgba(16,185,129,0.22)", borderRadius: 3, padding: "1px 4px", letterSpacing: "0.04em" }}>Best</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Revenue note */}
          <div style={{ fontSize: 10, color: "rgba(148,163,184,0.40)", marginTop: 7, lineHeight: 1.4 }}>
            L2 = 7.2 kW · L3 (DCFC) = 50 kW · Revenue estimates based on avg utilization &amp; $0.40/kWh charging rate
          </div>
          {/* Confirm banner */}
          <div style={{ marginTop: 10, padding: "9px 11px", borderRadius: 8, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>🚗</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6EE7B7", lineHeight: 1.4 }}>
                {selected.l2} Level 2 + {selected.dcfc} DC fast chargers · {totalKW(selected)} kW peak demand
              </div>
              <div style={{ fontSize: 11, color: "rgba(148,163,184,0.60)", lineHeight: 1.4, marginTop: 2 }}>
                ~{fmtRevenue(selected.annualRevenue)}/year estimated revenue · EV load integrated into BESS sizing
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

