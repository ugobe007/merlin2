/**
 * Step 1: Location (V7) — SSOT-Compliant Clean Version
 *
 * Updates (Jan 26, 2026):
 * - Props: state + actions only (SSOT contract)
 * - Pure UI component (no business logic)
 * - Validates state confirmation (addresses missing state bug)
 */

import React, { useMemo, useState } from "react";
import type { WizardState } from "@/wizard/v7/hooks/useWizardV7";

type Props = {
  state: WizardState;
  actions: {
    updateLocationRaw: (value: string) => void;
    submitLocation: (rawInput?: string) => Promise<void>;
  };
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "white",
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{children}</div>;
}

function SmallPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.05)",
        border: "1px solid rgba(0,0,0,0.08)",
        fontSize: 12,
        opacity: 0.9,
      }}
    >
      {children}
    </span>
  );
}

export default function Step1LocationV7({ state, actions }: Props) {
  const [localValue, setLocalValue] = useState(state.locationRawInput ?? "");

  // keep UI in sync if session hydrates / resets
  React.useEffect(() => {
    setLocalValue(state.locationRawInput ?? "");
  }, [state.locationRawInput]);

  const locationSummary = useMemo(() => {
    if (!state.location) return null;
    const { formattedAddress, city, state: st, postalCode, country } = state.location;
    return {
      formattedAddress,
      city,
      state: st,
      postalCode,
      country,
    };
  }, [state.location]);

  const needsStateWarning = useMemo(() => {
    // If we have a location but it doesn't have a "state", raise a warning.
    // This is the bug you called out: SSOT must confirm state.
    if (!state.location) return false;
    return !state.location.state || state.location.state.trim().length < 2;
  }, [state.location]);

  const onChange = (v: string) => {
    setLocalValue(v);
    actions.updateLocationRaw(v);
  };

  const onSubmit = async () => {
    await actions.submitLocation(localValue);
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.2px" }}>
              Step 1 — Location Analysis
            </div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
              Enter your business address (or business name). We'll confirm the location and pull
              local intel.
            </div>
          </div>
          <SmallPill>🌎 Web-page V7</SmallPill>
        </div>

        <div style={{ marginTop: 14 }}>
          <Label>Business address / name</Label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={localValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., WOW Car Wash, Henderson NV"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.14)",
                padding: "0 12px",
                fontSize: 14,
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
            />
            <button
              onClick={onSubmit}
              disabled={state.isBusy}
              style={{
                height: 44,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: state.isBusy ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.06)",
                cursor: state.isBusy ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {state.isBusy ? "Working..." : "Analyze"}
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
            Tip: domain-level flows are for Pythh; Merlin needs a real address for local
            utility/solar context.
          </div>
        </div>
      </Card>

      {/* Confirmation card: SSOT must show confirmed state */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 800 }}>Confirmed location</div>

        {!locationSummary ? (
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
            No location confirmed yet. Submit an address above.
          </div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            <div style={{ fontSize: 14 }}>
              <div style={{ fontWeight: 800 }}>{locationSummary.formattedAddress}</div>
              <div style={{ marginTop: 4, fontSize: 13, opacity: 0.8 }}>
                {locationSummary.city ? `${locationSummary.city}, ` : ""}
                {locationSummary.state ? `${locationSummary.state} ` : ""}
                {locationSummary.postalCode ? locationSummary.postalCode : ""}
                {locationSummary.country ? ` • ${locationSummary.country}` : ""}
              </div>
            </div>

            {needsStateWarning ? (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(255,165,0,0.12)",
                  border: "1px solid rgba(255,165,0,0.28)",
                  fontSize: 13,
                  lineHeight: "18px",
                }}
              >
                ⚠️ <b>State not confirmed.</b> Your geocoder returned a location without a
                state/region.
                <div style={{ marginTop: 6, opacity: 0.85 }}>
                  Fix: ensure your resolveLocation() mapping includes{" "}
                  <code
                    style={{ padding: "2px 6px", borderRadius: 8, background: "rgba(0,0,0,0.05)" }}
                  >
                    administrative_area_level_1
                  </code>{" "}
                  (US state).
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <SmallPill>✅ State confirmed: {locationSummary.state}</SmallPill>
                {state.locationIntel?.peakSunHours !== undefined && (
                  <SmallPill>☀️ Peak Sun Hours: {state.locationIntel.peakSunHours}</SmallPill>
                )}
                {state.locationIntel?.utilityRate !== undefined && (
                  <SmallPill>⚡ Utility Rate: {state.locationIntel.utilityRate}</SmallPill>
                )}
                {state.locationIntel?.weatherRisk !== undefined && (
                  <SmallPill>🌩️ Weather Risk: {state.locationIntel.weatherRisk}</SmallPill>
                )}
                {state.locationIntel?.solarGrade && (
                  <SmallPill>📈 Solar Grade: {state.locationIntel.solarGrade}</SmallPill>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Primary next-step hint (SSOT decides step jump; UI just reflects state) */}
      <div style={{ fontSize: 12, opacity: 0.6 }}>
        Next: If industry is inferred with high confidence, SSOT will jump directly to Step 3.
        Otherwise you'll choose it on Step 2.
      </div>
    </div>
  );
}
