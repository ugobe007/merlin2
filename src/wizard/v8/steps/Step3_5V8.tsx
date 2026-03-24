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
} from "../addonSizing";

interface Props {
  state: WizardState;
  actions: WizardActions;
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

  const [fuelType, setFuelType] = useState<"diesel" | "natural-gas">(
    state.generatorFuelType === "diesel" ? "diesel" : "natural-gas"
  );

  // Toggle handlers
  const toggleSolar = () => {
    const next = !wantsSolar;
    setWantsSolar(next);
    actions.setAddonPreference("solar", next);
  };
  const toggleGenerator = () => {
    const next = !wantsGenerator;
    setWantsGenerator(next);
    actions.setAddonPreference("generator", next);
  };
  const toggleEV = () => {
    const next = !wantsEV;
    setWantsEV(next);
    actions.setAddonPreference("ev", next);
    if (next) actions.setAnswer("evScope", "custom");
  };

  const handleSolarConfig = (kw: number) => {
    actions.setAddonConfig({ solarKW: kw });
  };
  const handleGeneratorConfig = (kw: number) => {
    actions.setAddonConfig({ generatorKW: kw });
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
  const activeSolarKW = wantsSolar && solarFeasible ? state.solarKW : 0;
  const activeGenKW = wantsGenerator ? state.generatorKW : 0;
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
        <SolarSliderCard
          isOn={wantsSolar}
          onToggle={toggleSolar}
          baseLoadKW={state.baseLoadKW}
          maxKW={estimateSolarKW("maximum", state)}
          recKW={estimateSolarKW("roof_canopy", state)}
          initialKW={state.solarKW > 0 ? state.solarKW : estimateSolarKW("roof_canopy", state)}
          peakSunHours={state.intel?.peakSunHours ?? 4.5}
          solarGrade={state.intel?.solarGrade ? `Grade ${state.intel.solarGrade}` : undefined}
          roofAreaSqFt={roofAreaSqFt}
          effectiveCapKW={effectiveSolarCapKW}
          utilityRate={state.intel?.utilityRate ?? 0.14}
          onConfig={handleSolarConfig}
        />
      )}

      {/* Generator */}
      <GeneratorSliderCard
        isOn={wantsGenerator}
        onToggle={toggleGenerator}
        peakLoadKW={state.peakLoadKW}
        criticalLoadPct={state.criticalLoadPct}
        maxKW={estimateGenKW("critical", state)}
        recKW={estimateGenKW("full", state)}
        initialKW={
          state.generatorKW > 0
            ? state.generatorKW
            : estimateGenKW(defaultGeneratorScope(state), state)
        }
        fuelType={fuelType}
        onFuelChange={handleFuelType}
        gridReliability={gridReliability ?? undefined}
        gridReliabilityLabel={gridReliabilityLabel[gridReliability ?? ""] ?? undefined}
        generatorSuggested={generatorSuggested}
        onConfig={handleGeneratorConfig}
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

// ── Solar Slider Card ─────────────────────────────────────────────────────────

interface SolarSliderCardProps {
  isOn: boolean;
  onToggle: () => void;
  baseLoadKW: number;
  maxKW: number;
  recKW: number;
  initialKW: number;
  peakSunHours: number;
  solarGrade?: string;
  roofAreaSqFt?: number;
  effectiveCapKW: number;
  utilityRate: number;
  onConfig: (kw: number) => void;
}

function SolarSliderCard({
  isOn,
  onToggle,
  baseLoadKW,
  maxKW,
  recKW,
  initialKW,
  peakSunHours,
  solarGrade,
  roofAreaSqFt,
  effectiveCapKW,
  utilityRate,
  onConfig,
}: SolarSliderCardProps) {
  const safeMax = maxKW > 0 ? maxKW : 500;
  const safeRec = recKW > 0 ? Math.min(recKW, safeMax) : Math.round(safeMax * 0.7);
  const safeInitial = initialKW > 0 ? Math.min(initialKW, safeMax) : safeRec;

  const [sliderKW, setSliderKW] = useState(safeInitial);
  const [confirmed, setConfirmed] = useState(false);

  const annualSavings = Math.round(sliderKW * peakSunHours * 365 * utilityRate);

  const isSmall = baseLoadKW > 0 && effectiveCapKW > 0 && effectiveCapKW < baseLoadKW * 0.5;

  const accentGrad = "linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)";
  const amber = "#fbbf24";
  const amberDim = "rgba(251,191,36,0.18)";
  const amberBorder = "rgba(251,191,36,0.35)";

  return (
    <div
      style={{
        borderRadius: 12,
        border: isOn ? `1.5px solid ${amberBorder}` : "1px solid rgba(255,255,255,0.07)",
        background: isOn ? "rgba(245,158,11,0.05)" : "rgba(15,17,23,0.55)",
        overflow: "hidden",
        transition: "all 0.15s",
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: isOn ? accentGrad : "rgba(255,255,255,0.06)" }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "12px 14px 10px",
          cursor: "pointer",
        }}
        onClick={onToggle}
      >
        <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>☀️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Solar Generation</span>
            {solarGrade && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: amber,
                  background: amberDim,
                  border: `1px solid ${amberBorder}`,
                  borderRadius: 4,
                  padding: "2px 6px",
                  letterSpacing: "0.04em",
                }}
              >
                {solarGrade}
                {peakSunHours > 0 ? ` · ${peakSunHours.toFixed(1)} PSH` : ""}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(148,163,184,0.75)",
              margin: "3px 0 0",
              lineHeight: 1.4,
            }}
          >
            Generate clean electricity from your facility's roof or canopy.
          </p>
        </div>
        {/* Toggle pill */}
        <div
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: isOn ? amber : "rgba(255,255,255,0.12)",
            position: "relative",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: isOn ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.15s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          />
        </div>
      </div>

      {/* Expanded body */}
      {isOn && (
        <div style={{ padding: "0 14px 14px" }}>
          {/* Merlin recommendation banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 11px",
              borderRadius: 8,
              background: amberDim,
              border: `1px solid ${amberBorder}`,
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>🧙</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: amber,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Merlin recommendation
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                {fmtKW(safeRec)} solar
                {roofAreaSqFt && roofAreaSqFt > 0
                  ? ` · ${roofAreaSqFt.toLocaleString()} sq ft roof · ${effectiveCapKW} kW capacity`
                  : effectiveCapKW > 0
                    ? ` · ${effectiveCapKW} kW roof capacity`
                    : ""}
              </div>
            </div>
            <button
              onClick={() => setSliderKW(safeRec)}
              style={{
                padding: "4px 9px",
                borderRadius: 6,
                border: `1px solid ${amberBorder}`,
                background: "rgba(251,191,36,0.12)",
                color: amber,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Use rec
            </button>
          </div>

          {/* Solar expansion notice */}
          {isSmall && (
            <div
              style={{
                padding: "8px 11px",
                borderRadius: 8,
                background: "rgba(251,191,36,0.06)",
                border: "1px solid rgba(251,191,36,0.22)",
                marginBottom: 14,
                fontSize: 11,
                color: "rgba(251,191,36,0.85)",
                lineHeight: 1.5,
              }}
            >
              ⚠️ Roof-only ({effectiveCapKW} kW) covers less than 50% of your load. Consider adding
              canopy panels to maximize offset.
            </div>
          )}

          {/* kW Slider */}
          <SliderRow
            label="Solar capacity"
            value={sliderKW}
            max={safeMax}
            color={amber}
            onChange={(v) => {
              setSliderKW(v);
              setConfirmed(false);
            }}
          />

          {/* Stats row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <div
              style={{
                flex: 1,
                minWidth: 100,
                padding: "7px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(148,163,184,0.55)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 2,
                }}
              >
                Selected
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: amber }}>{fmtKW(sliderKW)}</div>
              <div style={{ fontSize: 10, color: "rgba(148,163,184,0.55)" }}>at your site</div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 100,
                padding: "7px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(148,163,184,0.55)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 2,
                }}
              >
                Est. savings
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#6EE7B7" }}>
                {fmtRevenue(annualSavings)}/yr
              </div>
              <div style={{ fontSize: 10, color: "rgba(148,163,184,0.55)" }}>grid offset</div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 100,
                padding: "7px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(148,163,184,0.55)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 2,
                }}
              >
                Sun hours
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>
                {peakSunHours.toFixed(1)} PSH
              </div>
              <div style={{ fontSize: 10, color: "rgba(148,163,184,0.55)" }}>daily average</div>
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={() => {
              onConfig(sliderKW);
              setConfirmed(true);
            }}
            style={{
              width: "100%",
              padding: "11px 16px",
              borderRadius: 9,
              border: confirmed ? `1.5px solid ${amberBorder}` : "1px solid rgba(255,255,255,0.12)",
              background: confirmed ? amberDim : "rgba(255,255,255,0.06)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            {confirmed && (
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: amber,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#0D1117",
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
            )}
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: confirmed ? amber : "rgba(255,255,255,0.7)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {confirmed ? `${fmtKW(sliderKW)} solar added` : "Confirm Solar"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Generator Slider Card ─────────────────────────────────────────────────────

interface GeneratorSliderCardProps {
  isOn: boolean;
  onToggle: () => void;
  peakLoadKW: number;
  criticalLoadPct: number;
  maxKW: number;
  recKW: number;
  initialKW: number;
  fuelType: "diesel" | "natural-gas";
  onFuelChange: (fuel: "diesel" | "natural-gas") => void;
  gridReliability?: string;
  gridReliabilityLabel?: string;
  generatorSuggested: boolean;
  onConfig: (kw: number) => void;
}

function GeneratorSliderCard({
  isOn,
  onToggle,
  peakLoadKW,
  criticalLoadPct,
  maxKW,
  recKW,
  initialKW,
  fuelType,
  onFuelChange,
  gridReliability,
  gridReliabilityLabel,
  generatorSuggested,
  onConfig,
}: GeneratorSliderCardProps) {
  const safeMax = maxKW > 0 ? maxKW : 1000;
  const safeRec = recKW > 0 ? Math.min(recKW, safeMax) : Math.round(safeMax * 0.7);
  const safeInitial = initialKW > 0 ? Math.min(initialKW, safeMax) : safeRec;

  const [sliderKW, setSliderKW] = useState(safeInitial);
  const [confirmed, setConfirmed] = useState(false);

  const criticalKW = peakLoadKW > 0 ? Math.round(peakLoadKW * criticalLoadPct) : 0;

  const orangeGrad = "linear-gradient(90deg, #fb923c 0%, #f97316 50%, #ea580c 100%)";
  const orange = "#fb923c";
  const orangeDim = "rgba(249,115,22,0.18)";
  const orangeBorder = "rgba(249,115,22,0.35)";

  return (
    <div
      style={{
        borderRadius: 12,
        border: isOn ? `1.5px solid ${orangeBorder}` : "1px solid rgba(255,255,255,0.07)",
        background: isOn ? "rgba(249,115,22,0.05)" : "rgba(15,17,23,0.55)",
        overflow: "hidden",
        transition: "all 0.15s",
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: isOn ? orangeGrad : "rgba(255,255,255,0.06)" }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "12px 14px 10px",
          cursor: "pointer",
        }}
        onClick={onToggle}
      >
        <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>⚡</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Backup Generator</span>
            {gridReliability && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: generatorSuggested ? "#f87171" : "#94a3b8",
                  background: generatorSuggested
                    ? "rgba(248,113,113,0.12)"
                    : "rgba(148,163,184,0.1)",
                  border: `1px solid ${generatorSuggested ? "rgba(248,113,113,0.3)" : "rgba(148,163,184,0.2)"}`,
                  borderRadius: 4,
                  padding: "2px 6px",
                  letterSpacing: "0.04em",
                }}
              >
                {gridReliabilityLabel ?? gridReliability}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(148,163,184,0.75)",
              margin: "3px 0 0",
              lineHeight: 1.4,
            }}
          >
            {generatorSuggested
              ? `Recommended — grid issues detected.`
              : "Natural gas or diesel backup for outages and grid independence."}
          </p>
        </div>
        {/* Toggle pill */}
        <div
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: isOn ? orange : "rgba(255,255,255,0.12)",
            position: "relative",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: isOn ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.15s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          />
        </div>
      </div>

      {/* Expanded body */}
      {isOn && (
        <div style={{ padding: "0 14px 14px" }}>
          {/* Red alert banner when grid is unreliable */}
          {generatorSuggested && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 9,
                padding: "8px 11px",
                borderRadius: 8,
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.28)",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
              <p
                style={{ fontSize: 11, color: "rgba(248,113,113,0.9)", margin: 0, lineHeight: 1.5 }}
              >
                Your grid is <strong>{gridReliabilityLabel ?? gridReliability}</strong> — a
                generator protects your revenue during outages.
              </p>
            </div>
          )}

          {/* Fuel type toggle */}
          <div style={{ marginBottom: 14 }}>
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
                      onFuelChange(fuel);
                    }}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: active
                        ? `1.5px solid ${orangeBorder}`
                        : "1px solid rgba(255,255,255,0.08)",
                      background: active ? orangeDim : "rgba(51,65,85,0.45)",
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
                        color: active ? orange : "rgba(255,255,255,0.82)",
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
                          background: orange,
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

          {/* Merlin recommendation banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 11px",
              borderRadius: 8,
              background: orangeDim,
              border: `1px solid ${orangeBorder}`,
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>🧙</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: orange,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Merlin recommendation
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                {fmtKW(safeRec)} generator
                {peakLoadKW > 0 ? ` · Facility peak: ${peakLoadKW} kW` : ""}
                {criticalKW > 0 ? ` · Critical: ${criticalKW} kW` : ""}
              </div>
            </div>
            <button
              onClick={() => setSliderKW(safeRec)}
              style={{
                padding: "4px 9px",
                borderRadius: 6,
                border: `1px solid ${orangeBorder}`,
                background: "rgba(249,115,22,0.12)",
                color: orange,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Use rec
            </button>
          </div>

          {/* kW Slider */}
          <SliderRow
            label="Generator capacity"
            value={sliderKW}
            max={safeMax}
            color={orange}
            onChange={(v) => {
              setSliderKW(v);
              setConfirmed(false);
            }}
          />

          {/* Stats row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <div
              style={{
                flex: 1,
                minWidth: 100,
                padding: "7px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(148,163,184,0.55)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 2,
                }}
              >
                Selected
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: orange }}>{fmtKW(sliderKW)}</div>
              <div style={{ fontSize: 10, color: "rgba(148,163,184,0.55)" }}>
                {fuelType === "diesel" ? "⛽ Diesel" : "🔥 Natural Gas"}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 100,
                padding: "7px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(148,163,184,0.55)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 2,
                }}
              >
                Coverage
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>
                {peakLoadKW > 0
                  ? `${Math.min(100, Math.round((sliderKW / peakLoadKW) * 100))}%`
                  : "—"}
              </div>
              <div style={{ fontSize: 10, color: "rgba(148,163,184,0.55)" }}>of facility peak</div>
            </div>
            {criticalKW > 0 && (
              <div
                style={{
                  flex: 1,
                  minWidth: 100,
                  padding: "7px 10px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(148,163,184,0.55)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 2,
                  }}
                >
                  Critical load
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>
                  {fmtKW(criticalKW)}
                </div>
                <div style={{ fontSize: 10, color: "rgba(148,163,184,0.55)" }}>
                  {Math.round(criticalLoadPct * 100)}% of peak
                </div>
              </div>
            )}
          </div>

          {/* Confirm button */}
          <button
            onClick={() => {
              onConfig(sliderKW);
              setConfirmed(true);
            }}
            style={{
              width: "100%",
              padding: "11px 16px",
              borderRadius: 9,
              border: confirmed
                ? `1.5px solid ${orangeBorder}`
                : "1px solid rgba(255,255,255,0.12)",
              background: confirmed ? orangeDim : "rgba(255,255,255,0.06)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            {confirmed && (
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: orange,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#0D1117",
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
            )}
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: confirmed ? orange : "rgba(255,255,255,0.7)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {confirmed ? `${fmtKW(sliderKW)} generator added` : "Confirm Generator"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Slider Row Helper ────────────────────────────────────────────────────────
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
