import React, { useMemo } from "react";
import type { WizardState, WizardStep } from "@/wizard/v7/hooks/useWizardV7";

type Props = {
  state: WizardState;
  actions: {
    goBack: () => void;
    resetSession: () => void;
    goToStep: (step: WizardStep) => Promise<void>;
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

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{k}</div>
      <div style={{ fontSize: 13, fontWeight: 800 }}>{v}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
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

function fmtUSD(n?: number) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

export default function Step4ResultsV7({ state, actions }: Props) {
  const locLine = useMemo(() => {
    if (!state.location) return "—";
    const parts = [state.location.city, state.location.state, state.location.postalCode].filter(
      Boolean
    );
    return parts.length ? parts.join(", ") : state.location.formattedAddress;
  }, [state.location]);

  const freeze = state.pricingFreeze;
  const quote = state.quote;

  const freezeReady = !!freeze;
  const quoteReady = !!quote;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.2px" }}>
              Step 4 — Results
            </div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
              Location: <b>{locLine}</b> • Industry: <b>{state.industry}</b>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill>🧊 Pricing Freeze: {freezeReady ? "locked" : "missing"}</Pill>
              <Pill>📦 Quote: {quoteReady ? "ready" : "missing"}</Pill>
              {freeze?.createdAtISO ? <Pill>⏱ {freeze.createdAtISO}</Pill> : null}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={actions.goBack}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "rgba(0,0,0,0.05)",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              ← Back
            </button>

            <button
              onClick={actions.resetSession}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "rgba(255,0,0,0.06)",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      {/* Pricing Freeze Snapshot */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 900 }}>Pricing Freeze (SSOT Snapshot)</div>
          <button
            onClick={() => actions.goToStep("profile")}
            style={{
              height: 34,
              padding: "0 10px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(0,0,0,0.05)",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Edit inputs
          </button>
        </div>

        {!freeze ? (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            ⚠️ No pricing freeze found. This usually means QuoteEngine didn't run or SSOT didn't
            persist outputs.
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <Row k="Power (MW)" v={freeze.powerMW ?? "—"} />
            <Row k="Hours" v={freeze.hours ?? "—"} />
            <Row k="Energy (MWh)" v={freeze.mwh ?? "—"} />
            <Row k="Voltage" v={freeze.voltage ?? "—"} />
            <Row k="Grid Mode" v={freeze.gridMode ?? "—"} />
            <Row k="Use Case" v={freeze.useCase ?? "—"} />
            <Row
              k="Certifications"
              v={freeze.certifications?.length ? freeze.certifications.join(", ") : "—"}
            />
            <Row k="Hybrid: Generator (MW)" v={freeze.generatorMW ?? "—"} />
            <Row k="Hybrid: Solar (MWp)" v={freeze.solarMWp ?? "—"} />
            <Row k="Hybrid: Wind (MW)" v={freeze.windMW ?? "—"} />
          </div>
        )}
      </Card>

      {/* Quote Output */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 900 }}>Quote Output</div>
          <button
            onClick={() => actions.goToStep("location")}
            style={{
              height: 34,
              padding: "0 10px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(0,0,0,0.05)",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Start new quote
          </button>
        </div>

        {!quote ? (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            ⚠️ No quote found. Wire <code>api.runQuoteEngine()</code> in SSOT to populate outputs.
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <Row k="CapEx" v={fmtUSD(quote.capexUSD)} />
            <Row k="Annual Savings" v={fmtUSD(quote.annualSavingsUSD)} />
            <Row
              k="ROI (years)"
              v={quote.roiYears !== undefined && quote.roiYears !== null ? quote.roiYears : "—"}
            />

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Notes</div>
              {quote.notes?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, opacity: 0.85 }}>
                  {quote.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: 13, opacity: 0.75 }}>—</div>
              )}
            </div>
          </div>
        )}
      </Card>

      <div style={{ fontSize: 12, opacity: 0.6 }}>
        Results is a renderer. SSOT owns pricing, freezing, validation, and transitions.
      </div>
    </div>
  );
}
