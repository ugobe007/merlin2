import React, { useMemo } from "react";
import type {
  WizardState as WizardV7State,
  WizardStep,
  PricingStatus,
} from "@/wizard/v7/hooks/useWizardV7";
import { sanitizeQuoteForDisplay } from "@/wizard/v7/utils/pricingSanity";

type Props = {
  state: WizardV7State;
  actions: {
    goBack: () => void;
    resetSession: () => void;
    goToStep: (step: WizardStep) => Promise<void>;
    // Phase 6: Pricing retry (non-blocking)
    retryPricing?: () => Promise<{ ok: boolean; error?: string }>;
    // Phase 7: Template retry (upgrade fallback → industry)
    retryTemplate?: () => Promise<void>;
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

/**
 * Safe USD formatter — handles null/undefined/NaN/Infinity
 * The sanitizer may have stripped poison values to null
 */
function fmtUSD(n?: number | null): string {
  if (n === null || n === undefined) return "—";
  if (!Number.isFinite(n)) return "—"; // Catches NaN and Infinity
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

/**
 * Safe number formatter for non-currency values
 */
function fmtNum(n?: number | null, fallback = "—"): string {
  if (n === null || n === undefined) return fallback;
  if (!Number.isFinite(n)) return fallback;
  return String(n);
}

export default function Step4ResultsV7({ state, actions }: Props) {
  // ============================================================================
  // PHASE 6: PRICING STATUS (non-blocking)
  // ============================================================================
  const pricingStatus: PricingStatus = state.pricingStatus ?? "idle";
  const pricingWarnings: string[] = state.pricingWarnings ?? [];
  const pricingError: string | null = state.pricingError ?? null;
  const pricingUpdatedAt: number | null = state.pricingUpdatedAt ?? null;

  // Raw quote from state (may contain poison: NaN, Infinity, negative)
  const quoteRaw = state.quote ?? null;

  // Sanitized quote — poison values replaced with null for safe rendering
  // Now includes Layer A (load profile) + Layer B (financial metrics)
  const quote = useMemo(
    () =>
      sanitizeQuoteForDisplay(quoteRaw) as Record<string, unknown> & {
        // Layer A: Load Profile
        baseLoadKW?: number | null;
        peakLoadKW?: number | null;
        energyKWhPerDay?: number | null;
        storageToPeakRatio?: number | null;
        durationHours?: number | null;
        // Layer B: Financial Metrics
        capexUSD?: number | null;
        annualSavingsUSD?: number | null;
        roiYears?: number | null;
        npv?: number | null;
        irr?: number | null;
        paybackYears?: number | null;
        demandChargeSavings?: number | null;
        // Equipment Sizing
        bessKWh?: number | null;
        bessKW?: number | null;
        solarKW?: number | null;
        generatorKW?: number | null;
        // Audit
        pricingSnapshotId?: string | null;
        pricingComplete?: boolean | null;
        notes?: string[];
      },
    [quoteRaw]
  );

  const locLine = useMemo(() => {
    if (!state.location) return "—";
    const parts = [state.location.city, state.location.state, state.location.postalCode].filter(
      Boolean
    );
    return parts.length ? parts.join(", ") : state.location.formattedAddress;
  }, [state.location]);

  const freeze = state.pricingFreeze;

  const freezeReady = !!freeze;
  const quoteReady = pricingStatus === "ok" && !!quoteRaw;

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

      {/* ================================================================
          PARTIAL RESULTS WARNING
          Shows when quote.isProvisional === true (from incomplete Step 3)
          Uses quote flag (not step state) for stability across navigation
      ================================================================ */}
      {quote?.isProvisional && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(251, 191, 36, 0.35)",
            background: "rgba(251, 191, 36, 0.08)",
            padding: 16,
            color: "#b45309",
          }}
        >
          <div style={{ fontWeight: 700 }}>⚠️ Provisional Results</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
            {quote.missingInputs && quote.missingInputs.length > 0
              ? `${quote.missingInputs.length} inputs missing — using defaults. `
              : "Some inputs missing — using defaults. "}
            Results may not reflect your actual load profile.
            <button
              onClick={() => actions.goToStep?.("profile")}
              style={{
                marginLeft: 8,
                textDecoration: "underline",
                cursor: "pointer",
                background: "none",
                border: "none",
                color: "inherit",
                fontWeight: 700,
              }}
            >
              Complete Step 3 →
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8, fontStyle: "italic" }}>
            💡 Pricing disabled until inputs complete
          </div>
        </div>
      )}

      {/* ================================================================
          FALLBACK TEMPLATE BANNER
          Shows when using generic facility template instead of industry-specific
          Offers retry to upgrade from Estimate → TrueQuote™
      ================================================================ */}
      {state.templateMode === "fallback" && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(59, 130, 246, 0.3)",
            background: "rgba(59, 130, 246, 0.06)",
            padding: 16,
            color: "#1e40af",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14 }}>📋 Estimate Mode</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
            This quote uses a general facility model because the industry-specific profile wasn't
            available. Numbers are directionally correct but won't carry TrueQuote™ source
            attribution.
          </div>
          {actions.retryTemplate && (
            <button
              onClick={() => void actions.retryTemplate?.()}
              disabled={state.busy}
              style={{
                marginTop: 10,
                padding: "6px 14px",
                borderRadius: 10,
                border: "1px solid rgba(59, 130, 246, 0.4)",
                background: state.busy ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.12)",
                color: state.busy ? "#93c5fd" : "#2563eb",
                cursor: state.busy ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {state.busy ? "Retrying…" : "Retry industry profile →"}
            </button>
          )}
        </div>
      )}

      {/* ================================================================
          PRICING STATUS — Phase 6 Non-Blocking UI
          Shows: idle → pending → ok/error
          Never blocks wizard navigation
      ================================================================ */}
      {pricingStatus === "idle" && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(100,100,100,0.2)",
            background: "rgba(250,250,250,0.95)",
            padding: 16,
            color: "#555",
          }}
        >
          <div style={{ fontWeight: 700 }}>💤 Pricing queued…</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
            Your quote will be calculated shortly.
          </div>
        </div>
      )}

      {pricingStatus === "pending" && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(59, 130, 246, 0.3)",
            background: "rgba(59, 130, 246, 0.05)",
            padding: 16,
            color: "#3b82f6",
          }}
        >
          <div style={{ fontWeight: 700 }}>⚡ Pricing running…</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
            TrueQuote™ pending • This will not block navigation
          </div>
        </div>
      )}

      {pricingStatus === "error" && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(239, 68, 68, 0.3)",
            background: "rgba(239, 68, 68, 0.08)",
            padding: 16,
            color: "#dc2626",
          }}
        >
          <div style={{ fontWeight: 700 }}>🚨 Pricing engine error</div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              opacity: 0.9,
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
            }}
          >
            {pricingError || "Unknown error"}
          </div>
          {actions.retryPricing && (
            <button
              type="button"
              onClick={() => actions.retryPricing?.()}
              style={{
                marginTop: 12,
                height: 36,
                padding: "0 14px",
                borderRadius: 10,
                border: "1px solid rgba(239, 68, 68, 0.4)",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#dc2626",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              🔄 Retry pricing
            </button>
          )}
        </div>
      )}

      {pricingStatus === "timed_out" && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(249, 115, 22, 0.3)",
            background: "rgba(249, 115, 22, 0.08)",
            padding: 16,
            color: "#ea580c",
          }}
        >
          <div style={{ fontWeight: 700 }}>⏱️ Pricing timed out</div>
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              opacity: 0.9,
            }}
          >
            The quote calculation exceeded the time limit. Your load profile is still available
            below.
          </div>
          {actions.retryPricing && (
            <button
              type="button"
              onClick={() => actions.retryPricing?.()}
              style={{
                marginTop: 12,
                height: 36,
                padding: "0 14px",
                borderRadius: 10,
                border: "1px solid rgba(249, 115, 22, 0.4)",
                background: "rgba(249, 115, 22, 0.1)",
                color: "#ea580c",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              🔄 Retry pricing
            </button>
          )}
        </div>
      )}

      {pricingStatus === "ok" && pricingWarnings.length > 0 && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(251, 191, 36, 0.35)",
            background: "rgba(251, 191, 36, 0.08)",
            padding: 16,
            color: "#b45309",
          }}
        >
          <div style={{ fontWeight: 700 }}>⚠️ Math warnings detected</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
            We generated a quote, but flagged potential issues:
          </div>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, opacity: 0.85 }}>
            {pricingWarnings.slice(0, 10).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {import.meta.env.DEV && pricingUpdatedAt && (
        <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>
          pricingUpdatedAt: {new Date(pricingUpdatedAt).toISOString()}
        </div>
      )}

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

        {pricingStatus === "pending" ? (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>⏳ Calculating quote…</div>
        ) : pricingStatus === "error" ? (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            ❌ Quote unavailable due to pricing error. Use the Retry button above.
          </div>
        ) : !quoteReady ? (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            ⚠️ No quote found. Wire <code>api.runQuoteEngine()</code> in SSOT to populate outputs.
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            {/* Load Profile Section (Layer A) */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  opacity: 0.6,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Load Profile
              </div>
              <Row k="Base Load" v={quote.baseLoadKW ? `${fmtNum(quote.baseLoadKW)} kW` : "—"} />
              <Row k="Peak Load" v={quote.peakLoadKW ? `${fmtNum(quote.peakLoadKW)} kW` : "—"} />
              <Row
                k="Daily Energy"
                v={
                  quote.energyKWhPerDay
                    ? `${fmtNum(Math.round(quote.energyKWhPerDay))} kWh/day`
                    : "—"
                }
              />
            </div>

            {/* Equipment Sizing Section */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  opacity: 0.6,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Recommended Equipment
              </div>
              <Row
                k="BESS Capacity"
                v={quote.bessKWh ? `${fmtNum(Math.round(quote.bessKWh))} kWh` : "—"}
              />
              <Row
                k="BESS Power"
                v={quote.bessKW ? `${fmtNum(Math.round(quote.bessKW))} kW` : "—"}
              />
              <Row
                k="Duration"
                v={quote.durationHours ? `${fmtNum(quote.durationHours)} hrs` : "—"}
              />
              {quote.solarKW && quote.solarKW > 0 && (
                <Row k="Solar" v={`${fmtNum(Math.round(quote.solarKW))} kW`} />
              )}
              {quote.generatorKW && quote.generatorKW > 0 && (
                <Row k="Generator" v={`${fmtNum(Math.round(quote.generatorKW))} kW`} />
              )}
            </div>

            {/* Financial Summary Section (Layer B) */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  opacity: 0.6,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Financial Summary
              </div>
              <Row k="Total Investment" v={fmtUSD(quote.capexUSD as number | null)} />
              <Row k="Annual Savings" v={fmtUSD(quote.annualSavingsUSD as number | null)} />
              {quote.demandChargeSavings && (
                <Row
                  k="Demand Charge Savings"
                  v={fmtUSD(quote.demandChargeSavings as number | null)}
                />
              )}
              <Row
                k="Simple Payback"
                v={quote.roiYears ? `${fmtNum(Number(quote.roiYears).toFixed(1))} years` : "—"}
              />
              {quote.npv && <Row k="NPV (25yr)" v={fmtUSD(quote.npv as number | null)} />}
              {quote.irr && (
                <Row k="IRR" v={quote.irr ? `${(Number(quote.irr) * 100).toFixed(1)}%` : "—"} />
              )}
              {quote.paybackYears && (
                <Row
                  k="Discounted Payback"
                  v={`${fmtNum(Number(quote.paybackYears).toFixed(1))} years`}
                />
              )}
            </div>

            {/* ============================================================
                PRICING STATUS BADGE — TrueQuote™ Honesty Rules:
                ✓ TrueQuote™ Complete  → pricingComplete + templateMode=industry + confidence.industry=v1
                📊 Estimate Mode       → pricingComplete + (fallback template OR fallback confidence)
                ⚠️ Load Profile Only   → pricing not yet complete
                INVARIANT: confidence.industry !== "v1" → NEVER show TrueQuote™ Complete
            ============================================================ */}
            {(() => {
              const isTrueQuote =
                quote.pricingComplete &&
                state.templateMode !== "fallback" &&
                quote.confidence?.industry !== "fallback";
              const isEstimate =
                quote.pricingComplete &&
                (state.templateMode === "fallback" || quote.confidence?.industry === "fallback");

              if (isTrueQuote) {
                return (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      color: "#16a34a",
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    ✓ TrueQuote™ Complete
                    {quote.pricingSnapshotId && (
                      <span style={{ opacity: 0.7, fontSize: 10, fontFamily: "monospace" }}>
                        #{quote.pricingSnapshotId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                );
              }
              if (isEstimate) {
                return (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      color: "#2563eb",
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    📊 Estimate — Based on general facility model
                  </div>
                );
              }
              return (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "rgba(251, 191, 36, 0.1)",
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                    color: "#b45309",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  ⚠️ Load Profile Only — Financial calculations pending
                </div>
              );
            })()}

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Notes & Assumptions</div>
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
