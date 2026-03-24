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
import {
  estimateSolarKW,
  estimateGenKW,
  getEffectiveSolarCapKW,
  defaultGeneratorScope,
  type SolarScopeId,
  type GeneratorScopeId,
} from "../addonSizing";

interface Props {
  state: WizardState;
  actions: WizardActions;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SOLAR_SCOPES = [
  { id: "roof_only", label: "Roof only", penetration: 0.55, recommended: false },
  { id: "roof_canopy", label: "Roof + canopy", penetration: 0.8, recommended: true },
  { id: "maximum", label: "Maximum coverage", penetration: 1.0, recommended: false },
] as const;

const GENERATOR_SCOPES = [
  { id: "essential", label: "Critical loads", desc: "Essential circuits only", recommended: false },
  { id: "full", label: "Full facility", desc: "Entire facility + 10% margin", recommended: true },
  {
    id: "critical",
    label: "Mission critical",
    desc: "Full load + 35% headroom",
    recommended: false,
  },
] as const;

type SolarScope = SolarScopeId;
type GeneratorScope = GeneratorScopeId;

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
    (state.intel?.solarFeasible ?? false) ||
    state.solarPhysicalCapKW > 0 ||
    !!(state.step3Answers?.roofArea as number | undefined);

  // Toggle state
  const [wantsSolar, setWantsSolar] = useState(state.wantsSolar);
  const [wantsGenerator, setWantsGenerator] = useState(state.wantsGenerator);
  const [wantsEV, setWantsEV] = useState(state.wantsEVCharging);

  // Scope state
  const [solarScope, setSolarScope] = useState<SolarScope>(
    (state.step3Answers?.solarScope as SolarScope | undefined) ?? "roof_canopy"
  );
  const [generatorScope, setGeneratorScope] = useState<GeneratorScope>(
    (state.step3Answers?.generatorScope as GeneratorScope | undefined) ??
      defaultGeneratorScope(state)
  );
  const [fuelType, setFuelType] = useState<"diesel" | "natural-gas">(
    state.generatorFuelType === "diesel" ? "diesel" : "natural-gas"
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
    if (next) actions.setAnswer("evScope", "custom");
  };

  const handleSolarScope = (s: SolarScope) => {
    setSolarScope(s);
    actions.setAnswer("solarScope", s);
  };
  const handleGeneratorScope = (s: GeneratorScope) => {
    setGeneratorScope(s);
    actions.setAnswer("generatorScope", s);
  };
  const handleEVConfig = (l2: number, dcfc: number, hpc: number) => {
    actions.setAnswer("evScope", "custom");
    actions.setAddonConfig({ level2Chargers: l2, dcfcChargers: dcfc, hpcChargers: hpc });
  };
  const handleFuelType = (fuel: "diesel" | "natural-gas") => {
    setFuelType(fuel);
    actions.setAddonConfig({ generatorFuelType: fuel });
  };

  // Derived values
  const effectiveSolarCapKW = getEffectiveSolarCapKW(state);
  const roofAreaSqFt = state.step3Answers?.roofArea as number | undefined;
  const activeSolarKW = wantsSolar && solarFeasible ? estimateSolarKW(solarScope, state) : 0;
  const activeGenKW = wantsGenerator ? estimateGenKW(generatorScope, state) : 0;
  const hasAnyAddon = wantsSolar || wantsGenerator || wantsEV;

  // Generator smart recommendation signal
  const gridReliability = state.gridReliability;
  const generatorSuggested =
    gridReliability === "frequent-outages" || gridReliability === "unreliable";
  const gridReliabilityLabel: Record<string, string> = {
    reliable: "Reliable grid",
    "occasional-outages": "Occasional outages",
    "frequent-outages": "Frequent outages",
    unreliable: "Unreliable grid",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            margin: 0,
            letterSpacing: "-0.3px",
          }}
        >
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
          expansionNotice={
            wantsSolar &&
            solarScope === "roof_only" &&
            effectiveSolarCapKW > 0 &&
            state.baseLoadKW > 0 &&
            effectiveSolarCapKW < state.baseLoadKW * 0.5
              ? {
                  roofKW: effectiveSolarCapKW,
                  canopyKW: Math.round((effectiveSolarCapKW / 0.55) * 0.8),
                  onExpand: () => handleSolarScope("roof_canopy"),
                }
              : undefined
          }
        />
      )}

      {/* Generator */}
      <IntentCard
        icon="⚡"
        name="Backup Generator"
        topContent={
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(148,163,184,0.55)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 7,
              }}
            >
              Fuel type
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["diesel", "natural-gas"] as const).map((fuel) => {
                const active = fuelType === fuel;
                return (
                  <button
                    key={fuel}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFuelType(fuel);
                    }}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: active
                        ? "1.5px solid rgba(16,185,129,0.55)"
                        : "1px solid rgba(255,255,255,0.08)",
                      background: active ? "rgba(16,185,129,0.11)" : "rgba(51,65,85,0.45)",
                      cursor: "pointer",
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      transition: "all 0.12s",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{fuel === "diesel" ? "⛽" : "🔥"}</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: active ? "#6EE7B7" : "rgba(255,255,255,0.82)",
                      }}
                    >
                      {fuel === "diesel" ? "Diesel" : "Natural Gas"}
                    </span>
                    {active && (
                      <div
                        style={{
                          marginLeft: "auto",
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "#3ECF8E",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 8,
                          fontWeight: 700,
                          color: "#0D1117",
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        }
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

      {/* EV Charging */}
      <EVPackageCard
        isOn={wantsEV}
        onToggle={toggleEV}
        peakLoadKW={state.peakLoadKW}
        initialL2={state.level2Chargers}
        initialDcfc={state.dcfcChargers}
        initialHpc={state.hpcChargers}
        onConfig={handleEVConfig}
      />

      {/* Summary strip */}
      {hasAnyAddon && (
        <div
          style={{
            padding: "11px 14px",
            borderRadius: 10,
            border: "1px solid rgba(16,185,129,0.18)",
            background: "rgba(15,17,23,0.65)",
            marginTop: 2,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(16,185,129,0.65)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Quote scope — what Merlin is sizing
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 12 }}>🔋</span>
              <span style={{ fontSize: 11, color: "rgba(148,163,184,0.6)" }}>BESS:</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6EE7B7" }}>
                {state.baseLoadKW} kW facility load
              </span>
            </div>
            {activeSolarKW > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12 }}>☀️</span>
                <span style={{ fontSize: 11, color: "rgba(148,163,184,0.6)" }}>Solar:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                  ~{fmtKW(activeSolarKW)}
                </span>
              </div>
            )}
            {activeGenKW > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12 }}>⚡</span>
                <span style={{ fontSize: 11, color: "rgba(148,163,184,0.6)" }}>Generator:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                  ~{fmtKW(activeGenKW)}
                </span>
              </div>
            )}
            {wantsEV &&
              (state.level2Chargers > 0 || state.dcfcChargers > 0 || state.hpcChargers > 0) && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 12 }}>⚡</span>
                  <span style={{ fontSize: 11, color: "rgba(148,163,184,0.6)" }}>EV:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                    {state.level2Chargers > 0 ? `${state.level2Chargers} L2` : ""}
                    {state.dcfcChargers > 0 ? ` + ${state.dcfcChargers} DCFC` : ""}
                    {state.hpcChargers > 0 ? ` + ${state.hpcChargers} HPC` : ""} ·{" "}
                    {(
                      state.level2Chargers * 11 +
                      state.dcfcChargers * 100 +
                      state.hpcChargers * 300
                    ).toLocaleString()}{" "}
                    kW
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
    <div
      style={{
        padding: "13px 15px",
        borderRadius: 10,
        border: "1px solid rgba(16,185,129,0.25)",
        background: "rgba(16,185,129,0.06)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{name}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#3ECF8E",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 4,
              padding: "2px 6px",
              textTransform: "uppercase",
            }}
          >
            Always included
          </span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(148,163,184,0.8)", margin: 0, lineHeight: 1.5 }}>
          {description}
        </p>
        {bessKW != null && bessKW > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                padding: "5px 9px",
                borderRadius: 6,
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.18)",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(16,185,129,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                }}
              >
                Facility load
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#6EE7B7" }}>{bessKW} kW</span>
            </div>
            {bessKWh != null && bessKWh > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  padding: "5px 9px",
                  borderRadius: 6,
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.18)",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "rgba(16,185,129,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 600,
                  }}
                >
                  Est. storage · 4h baseline
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#6EE7B7" }}>
                  ~{bessKWh} kWh
                </span>
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
  /** Optional content rendered between the header and scope pills when isOn */
  topContent?: React.ReactNode;
  /** Solar expansion gate: shown when roof-only is too small */
  expansionNotice?: { roofKW: number; canopyKW: number; onExpand: () => void } | undefined;
}

function IntentCard<T extends string>({
  icon,
  name,
  description,
  isOn,
  onToggle,
  scopes,
  selectedScope,
  onScopeChange,
  scopeQuestion,
  estimateKW,
  estimateLabel,
  estimateNote,
  headerBadge,
  headerBadgeColor,
  recommendedAlert,
  contextNote,
  confirmLines,
  topContent,
  expansionNotice,
}: IntentCardProps<T>) {
  const selectedKWVal = isOn && estimateKW ? estimateKW(selectedScope) : 0;
  const selectedLabelFn = typeof estimateLabel === "function" ? estimateLabel : undefined;
  const selectedBadge =
    isOn && selectedKWVal > 0
      ? selectedLabelFn
        ? selectedLabelFn(selectedScope)
        : fmtKW(selectedKWVal)
      : undefined;

  return (
    <div
      style={{
        borderRadius: 12,
        border: isOn
          ? "1.5px solid rgba(16,185,129,0.45)"
          : recommendedAlert
            ? "1.5px solid rgba(248,113,113,0.35)"
            : "1px solid rgba(255,255,255,0.08)",
        background: isOn
          ? "rgba(16,185,129,0.07)"
          : recommendedAlert
            ? "rgba(248,113,113,0.04)"
            : "rgba(51,65,85,0.45)",
        overflow: "hidden",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Recommended alert banner (shown when not yet toggled on) */}
      {!isOn && recommendedAlert && (
        <div
          style={{
            padding: "7px 14px",
            background: "rgba(248,113,113,0.10)",
            borderBottom: "1px solid rgba(248,113,113,0.18)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 11 }}>⚠️</span>
          <span style={{ fontSize: 11, color: "#fca5a5", fontWeight: 500 }}>
            {recommendedAlert}
          </span>
        </div>
      )}
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "13px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            flexShrink: 0,
            background: isOn ? "rgba(16,185,129,0.14)" : "rgba(255,255,255,0.05)",
            border: isOn ? "1px solid rgba(16,185,129,0.28)" : "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 19,
            transition: "all 0.15s",
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: isOn ? "#6EE7B7" : "#fff" }}>
              {name}
            </span>
            {headerBadge && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: headerBadgeColor ?? "#94a3b8",
                  background: "rgba(100,116,139,0.12)",
                  border: "1px solid rgba(100,116,139,0.22)",
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
              >
                {headerBadge}
              </span>
            )}
            {isOn && selectedBadge && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#3ECF8E",
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                {selectedBadge}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(148,163,184,0.7)",
              margin: "2px 0 0",
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        </div>
        <div
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: isOn ? "none" : "1.5px solid rgba(255,255,255,0.22)",
            background: isOn ? "#3ECF8E" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#0D1117",
            transition: "all 0.15s ease",
            boxShadow: isOn ? "0 0 8px rgba(16,185,129,0.45)" : "none",
          }}
        >
          {isOn && "✓"}
        </div>
      </button>

      {/* Scope pills */}
      {isOn && (
        <div style={{ padding: "0 14px 14px" }}>
          {topContent}
          {scopeQuestion && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(148,163,184,0.55)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 7,
              }}
            >
              {scopeQuestion}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {scopes.map((s) => {
              const active = selectedScope === s.id;
              const kwVal = estimateKW ? estimateKW(s.id) : 0;
              const valLabel =
                typeof estimateLabel === "function"
                  ? estimateLabel(s.id)
                  : typeof estimateLabel === "string"
                    ? estimateLabel
                    : kwVal > 0
                      ? fmtKW(kwVal)
                      : "—";
              const valNote =
                typeof estimateNote === "function"
                  ? estimateNote(s.id)
                  : typeof estimateNote === "string"
                    ? estimateNote
                    : kwVal > 0
                      ? "est. at your site"
                      : (s.desc ?? s.sub ?? "");
              return (
                <button
                  key={s.id}
                  onClick={() => onScopeChange(s.id as T)}
                  style={{
                    padding: "10px 10px 9px",
                    borderRadius: 8,
                    border: active
                      ? "1.5px solid rgba(16,185,129,0.55)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: active ? "rgba(16,185,129,0.11)" : "rgba(51,65,85,0.45)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.12s",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(51,65,85,0.65)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(51,65,85,0.45)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: active ? "#6EE7B7" : "rgba(255,255,255,0.82)",
                        lineHeight: 1.2,
                      }}
                    >
                      {s.label}
                    </span>
                    <div
                      style={{
                        flexShrink: 0,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: active ? "none" : "1.5px solid rgba(255,255,255,0.18)",
                        background: active ? "#3ECF8E" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 8,
                        fontWeight: 700,
                        color: "#0D1117",
                        transition: "all 0.12s",
                      }}
                    >
                      {active && "✓"}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: active ? "#3ECF8E" : "rgba(255,255,255,0.72)",
                      letterSpacing: "-0.3px",
                      lineHeight: 1,
                    }}
                  >
                    {valLabel}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: active ? "rgba(110,231,183,0.58)" : "rgba(148,163,184,0.48)",
                      lineHeight: 1.3,
                    }}
                  >
                    {valNote}
                  </span>
                  {s.recommended && (
                    <span
                      style={{
                        position: "absolute",
                        top: 5,
                        right: active ? 22 : 6,
                        fontSize: 8,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "#3ECF8E",
                        background: "rgba(16,185,129,0.13)",
                        border: "1px solid rgba(16,185,129,0.22)",
                        borderRadius: 3,
                        padding: "1px 4px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Best
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {contextNote && (
            <div
              style={{
                fontSize: 10,
                color: "rgba(148,163,184,0.42)",
                marginTop: 7,
                lineHeight: 1.4,
              }}
            >
              {contextNote}
            </div>
          )}
          {confirmLines && confirmLines.length > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: "9px 11px",
                borderRadius: 8,
                background: "rgba(16,185,129,0.07)",
                border: "1px solid rgba(16,185,129,0.18)",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                {confirmLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: i === 0 ? 12 : 11,
                      fontWeight: i === 0 ? 600 : 400,
                      color: i === 0 ? "#6EE7B7" : "rgba(148,163,184,0.60)",
                      lineHeight: 1.4,
                      marginTop: i > 0 ? 2 : 0,
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
          {expansionNotice && (
            <div
              style={{
                marginTop: 8,
                padding: "9px 11px",
                borderRadius: 8,
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.22)",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>⬆️</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(245,158,11,0.85)",
                    lineHeight: 1.4,
                  }}
                >
                  Roof-only cap: {fmtKW(expansionNotice.roofKW)} — covers less than 50% of your load
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(148,163,184,0.55)",
                    lineHeight: 1.4,
                    marginTop: 1,
                  }}
                >
                  Add canopy panels to reach ~{fmtKW(expansionNotice.canopyKW)}
                </div>
              </div>
              <button
                onClick={expansionNotice.onExpand}
                style={{
                  flexShrink: 0,
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(245,158,11,0.35)",
                  background: "rgba(245,158,11,0.10)",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(245,158,11,0.90)",
                  whiteSpace: "nowrap",
                }}
              >
                Add canopy ↗
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Slider Row Helper ────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  max,
  color,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13, color: "rgba(203,213,225,0.85)", fontWeight: 400 }}>
          {label}
        </span>
        <span style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", lineHeight: 1 }}>
          {value}
        </span>
      </div>
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        {/* Track background */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 5,
            borderRadius: 3,
            background: "rgba(255,255,255,0.08)",
          }}
        />
        {/* Colored fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            height: 5,
            width: `${pct}%`,
            borderRadius: 3,
            background: color,
            transition: "width 0.06s",
          }}
        />
        {/* Thumb dot */}
        <div
          style={{
            position: "absolute",
            left: `calc(${pct}% - 9px)`,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 10px ${color}99`,
            transition: "left 0.06s",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        {/* Invisible range input */}
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            margin: 0,
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
}

// ── EV Package Card ───────────────────────────────────────────────────────────

interface EVPackageCardProps {
  isOn: boolean;
  onToggle: () => void;
  peakLoadKW: number;
  initialL2: number;
  initialDcfc: number;
  initialHpc: number;
  onConfig: (l2: number, dcfc: number, hpc: number) => void;
}

function EVPackageCard({
  isOn,
  onToggle,
  peakLoadKW,
  initialL2,
  initialDcfc,
  initialHpc,
  onConfig,
}: EVPackageCardProps) {
  // Smart Merlin recommendations based on peak load
  const recL2 = Math.min(12, Math.max(4, peakLoadKW > 0 ? Math.round(peakLoadKW / 150) : 6));
  const recDcfc = Math.min(8, Math.max(0, peakLoadKW > 0 ? Math.round(peakLoadKW / 600) : 2));
  const recHpc = Math.min(4, Math.max(0, peakLoadKW > 0 ? Math.round(peakLoadKW / 1200) : 0));

  const [l2, setL2] = useState(initialL2 > 0 ? initialL2 : recL2);
  const [dcfc, setDcfc] = useState(initialDcfc > 0 ? initialDcfc : recDcfc);
  const [hpc, setHpc] = useState(initialHpc > 0 ? initialHpc : recHpc);
  const [confirmed, setConfirmed] = useState(false);

  // kW midpoints per charger type
  const L2_KW = 11; // 7–22 kW range
  const DCFC_KW = 100; // 50–150 kW range
  const HPC_KW = 300; // 250–350 kW range

  const totalKW = l2 * L2_KW + dcfc * DCFC_KW + hpc * HPC_KW;
  const annualRevenue =
    Math.round(
      ((l2 * L2_KW * 0.25 + dcfc * DCFC_KW * 0.18 + hpc * HPC_KW * 0.15) * 365 * 0.4) / 100
    ) * 100;

  const updateCounts = (newL2: number, newDcfc: number, newHpc: number) => {
    setConfirmed(false);
    onConfig(newL2, newDcfc, newHpc);
  };

  return (
    <div
      style={{
        borderRadius: 12,
        border: isOn ? "1.5px solid rgba(56,189,248,0.40)" : "1px solid rgba(255,255,255,0.08)",
        background: isOn ? "rgba(14,165,233,0.06)" : "rgba(30,41,59,0.5)",
        overflow: "hidden",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Gradient accent line when on */}
      {isOn && (
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg, #22d3ee 0%, #818cf8 50%, #c084fc 100%)",
          }}
        />
      )}
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            flexShrink: 0,
            background: isOn ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.05)",
            border: isOn ? "1px solid rgba(56,189,248,0.30)" : "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            transition: "all 0.15s",
          }}
        >
          ⚡
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: isOn ? "#7dd3fc" : "#fff" }}>
              EV Charging
            </span>
            {isOn && totalKW > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#38bdf8",
                  background: "rgba(56,189,248,0.12)",
                  border: "1px solid rgba(56,189,248,0.28)",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                {l2 + dcfc + hpc} ports · {totalKW.toLocaleString()} kW
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(148,163,184,0.7)",
              margin: "2px 0 0",
              lineHeight: 1.4,
            }}
          >
            Employee &amp; customer charging
          </p>
        </div>
        <div
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: isOn ? "none" : "1.5px solid rgba(255,255,255,0.22)",
            background: isOn ? "#38bdf8" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#0D1117",
            transition: "all 0.15s ease",
            boxShadow: isOn ? "0 0 8px rgba(56,189,248,0.50)" : "none",
          }}
        >
          {isOn && "✓"}
        </div>
      </button>

      {/* Expanded content */}
      {isOn && (
        <div style={{ padding: "0 16px 16px" }}>
          {/* Merlin recommendation banner */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(16,185,129,0.07)",
              border: "1px solid rgba(16,185,129,0.16)",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.4 }}>ℹ️</span>
            <div style={{ fontSize: 12, color: "rgba(203,213,225,0.85)", lineHeight: 1.6 }}>
              <span style={{ fontSize: 14 }}>🧙 </span>
              <strong style={{ color: "#3ECF8E", fontWeight: 700 }}>
                Merlin: {recL2 > 0 ? `${recL2} L2` : ""}
                {recDcfc > 0 ? ` + ${recDcfc} DC Fast` : ""}
                {recHpc > 0 ? ` + ${recHpc} High Power` : ""} chargers recommended
              </strong>{" "}
              {peakLoadKW > 0
                ? `based on your ${peakLoadKW.toLocaleString()} kW facility load.`
                : "for employee and customer charging."}
            </div>
          </div>

          {/* Sliders */}
          <SliderRow
            label="Level 2 (7–22 kW)"
            value={l2}
            max={12}
            color="#22d3ee"
            onChange={(v) => {
              setL2(v);
              updateCounts(v, dcfc, hpc);
            }}
          />
          <SliderRow
            label="DC Fast (50–150 kW)"
            value={dcfc}
            max={8}
            color="#a78bfa"
            onChange={(v) => {
              setDcfc(v);
              updateCounts(l2, v, hpc);
            }}
          />
          <SliderRow
            label="High Power (250–350 kW)"
            value={hpc}
            max={4}
            color="#c084fc"
            onChange={(v) => {
              setHpc(v);
              updateCounts(l2, dcfc, v);
            }}
          />

          {/* Total capacity */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 14, color: "rgba(203,213,225,0.65)", fontWeight: 500 }}>
              Total Capacity:
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#f1f5f9",
                letterSpacing: "-0.5px",
              }}
            >
              {totalKW.toLocaleString()} kW
            </span>
          </div>

          {/* Confirm button */}
          <button
            onClick={() => {
              onConfig(l2, dcfc, hpc);
              setConfirmed(true);
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: confirmed
                ? "1px solid rgba(16,185,129,0.40)"
                : "1px solid rgba(255,255,255,0.10)",
              background: confirmed ? "rgba(16,185,129,0.10)" : "rgba(15,23,42,0.80)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.10em",
              textTransform: "uppercase" as const,
              color: confirmed ? "#3ECF8E" : "rgba(226,232,240,0.80)",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {confirmed ? "✓ EV CHARGING CONFIRMED" : "CONFIRM EV CHARGING"}
          </button>

          {annualRevenue > 0 && (
            <div
              style={{
                fontSize: 11,
                color: "rgba(148,163,184,0.40)",
                textAlign: "center",
                marginTop: 8,
                lineHeight: 1.4,
              }}
            >
              Est. ~{fmtRevenue(annualRevenue)}/yr charging revenue · load integrated into BESS
            </div>
          )}
        </div>
      )}
    </div>
  );
}
