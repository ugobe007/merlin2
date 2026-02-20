/**
 * V7DebugPanel — Dev-only debug surface for smoke tests
 * 
 * Shows critical state for validating:
 * - Stale-write guards (requestKey)
 * - Deterministic snapshots (snapshotId)
 * - Monotonic merge (pricingComplete)
 * - Input fallbacks (transparency)
 * - Timing (quoteRunMs)
 * - Mock mode (for test verification)
 * 
 * VISIBILITY:
 * - ?debug=1 in URL → auto-show (GUARDRAIL A: no keyboard dependency in CI)
 * - Ctrl+Shift+D (or Cmd+Shift+D) → manual toggle
 * 
 * Provides data-testid attributes for Playwright:
 * - data-testid="v7-debug-panel"
 * - data-testid="debug-pricing-status"
 * - data-testid="debug-request-key"
 * - data-testid="debug-snapshot-id"
 * - data-testid="debug-pricing-complete"
 * - data-testid="debug-fallbacks"
 * - data-testid="debug-mock-mode" (GUARDRAIL B: verify mock is active)
 */

import React, { useState, useEffect, useCallback } from "react";
import type { WizardState } from "@/wizard/v7/hooks/useWizardV7";
import { getMockPricingMode } from "@/wizard/v7/pricing/mockPricingControl";

type Props = {
  state: WizardState;
  // Optional: timing metrics (if tracked)
  timings?: {
    layerAMs?: number;
    layerBMs?: number;
    totalMs?: number;
  };
};

// Compute display status with timed_out detection
function computeDisplayStatus(state: WizardState): "idle" | "loading" | "ready" | "error" | "timed_out" {
  const { pricingStatus, pricingError } = state;
  
  // Map internal FSM to smoke-test display status
  if (pricingStatus === "idle") return "idle";
  if (pricingStatus === "pending") return "loading";
  if (pricingStatus === "error") {
    // Check if it's a timeout error
    if (pricingError?.toLowerCase().includes("timeout")) return "timed_out";
    return "error";
  }
  if (pricingStatus === "ok") return "ready";
  
  return "idle";
}

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  idle: { bg: "rgba(156, 163, 175, 0.1)", border: "rgba(156, 163, 175, 0.3)", text: "#6b7280" },
  loading: { bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)", text: "#3b82f6" },
  ready: { bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.3)", text: "#16a34a" },
  error: { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", text: "#dc2626" },
  timed_out: { bg: "rgba(249, 115, 22, 0.1)", border: "rgba(249, 115, 22, 0.3)", text: "#ea580c" },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.idle;
  return (
    <span
      data-testid="debug-pricing-status"
      data-status={status}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: 6,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {status}
    </span>
  );
}

function Row({ label, value, testId }: { label: string; value: React.ReactNode; testId?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <span style={{ fontSize: 10, opacity: 0.7, fontFamily: "monospace" }}>{label}</span>
      <span data-testid={testId} style={{ fontSize: 10, fontWeight: 600, fontFamily: "monospace", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function V7DebugPanel({ state, timings }: Props) {
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // GUARDRAIL A: Auto-show if ?debug=1 in URL (no keyboard dependency in CI)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug") === "1") {
        setVisible(true);
      }
    } catch {
      // URL parse failure - ignore
    }
  }, []);

  // Keyboard toggle: Ctrl+Shift+D (or Cmd+Shift+D on Mac)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
      e.preventDefault();
      setVisible((v) => !v);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Get current mock mode (GUARDRAIL B: verify mock is active in tests)
  const mockMode = getMockPricingMode();

  // Only show in development
  if (!import.meta.env.DEV) return null;
  if (!visible) return null;

  const displayStatus = computeDisplayStatus(state);
  const quote = state.quote ?? {};
  const inputFallbacks = quote.inputFallbacks ?? {};
  const hasFallbacks = Object.keys(inputFallbacks).length > 0;

  return (
    <div
      data-testid="v7-debug-panel"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        width: minimized ? 220 : 320,
        maxHeight: minimized ? 40 : 500,
        overflow: "hidden",
        background: "rgba(255, 255, 255, 0.98)",
        border: "1px solid rgba(0, 0, 0, 0.15)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        zIndex: 99999,
        transition: "all 0.2s ease",
      }}
    >
      {/* Header — Final Polish: Mock mode + compact info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          background: "rgba(0, 0, 0, 0.03)",
          borderBottom: minimized ? "none" : "1px solid rgba(0, 0, 0, 0.08)",
          cursor: "pointer",
        }}
        onClick={() => setMinimized((m) => !m)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "-0.2px" }}>
            🔧 V7
          </span>
          {/* GUARDRAIL B: Mock mode indicator with data-testid */}
          <span
            data-testid="debug-mock-mode"
            data-mode={mockMode}
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 5px",
              borderRadius: 4,
              background: mockMode === "ok" ? "rgba(34,197,94,0.15)" : "rgba(249,115,22,0.2)",
              color: mockMode === "ok" ? "#16a34a" : "#ea580c",
              textTransform: "uppercase",
            }}
          >
            {mockMode}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StatusBadge status={displayStatus} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setVisible(false);
            }}
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              border: "none",
              background: "rgba(0,0,0,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body (collapsible) */}
      {!minimized && (
        <div style={{ padding: "8px 12px", maxHeight: 440, overflowY: "auto" }}>
          {/* Pricing State */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
              Pricing State
            </div>
            <Row label="pricingStatus" value={state.pricingStatus} />
            <Row 
              label="pricingRequestKey" 
              value={state.pricingRequestKey ? state.pricingRequestKey.slice(0, 12) + "…" : "null"}
              testId="debug-request-key"
            />
            <Row 
              label="pricingSnapshotId" 
              value={quote.pricingSnapshotId ? quote.pricingSnapshotId.slice(0, 12) + "…" : "null"}
              testId="debug-snapshot-id"
            />
            <Row 
              label="pricingComplete" 
              value={quote.pricingComplete ? "✓ true" : "✗ false"}
              testId="debug-pricing-complete"
            />
            <Row label="pricingUpdatedAt" value={state.pricingUpdatedAt ? new Date(state.pricingUpdatedAt).toLocaleTimeString() : "null"} />
          </div>

          {/* Timing (if available) */}
          {timings && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                Timing
              </div>
              <Row label="Layer A (contract)" value={timings.layerAMs ? `${timings.layerAMs}ms` : "—"} />
              <Row label="Layer B (pricing)" value={timings.layerBMs ? `${timings.layerBMs}ms` : "—"} />
              <Row label="Total" value={timings.totalMs ? `${timings.totalMs}ms` : "—"} />
            </div>
          )}

          {/* Warnings/Errors */}
          {(state.pricingWarnings?.length > 0 || state.pricingError) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                Warnings / Errors
              </div>
              {state.pricingError && (
                <div style={{ fontSize: 10, color: "#dc2626", padding: "4px 6px", background: "rgba(239, 68, 68, 0.08)", borderRadius: 4, marginBottom: 4 }}>
                  ❌ {state.pricingError}
                </div>
              )}
              {state.pricingWarnings?.slice(0, 5).map((w, i) => (
                <div key={i} style={{ fontSize: 10, color: "#b45309", padding: "2px 0" }}>
                  ⚠️ {w}
                </div>
              ))}
            </div>
          )}

          {/* Input Fallbacks */}
          <div style={{ marginBottom: 12 }} data-testid="debug-fallbacks" data-has-fallbacks={hasFallbacks}>
            <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
              Input Fallbacks {hasFallbacks && "⚠️"}
            </div>
            {hasFallbacks ? (
              Object.entries(inputFallbacks).map(([key, val]) => {
                const fb = val as { value: unknown; reason: string } | undefined;
                return fb ? (
                  <div key={key} style={{ fontSize: 10, padding: "2px 0", color: "#b45309" }}>
                    <strong>{key}:</strong> {String(fb.value)} <em style={{ opacity: 0.7 }}>({fb.reason})</em>
                  </div>
                ) : null;
              })
            ) : (
              <div style={{ fontSize: 10, opacity: 0.6 }}>No fallbacks — all inputs from user/intel</div>
            )}
          </div>

          {/* Financial Fields Summary */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
              Financial Fields
            </div>
            <Row label="capexUSD" value={quote.capexUSD ? `$${Number(quote.capexUSD).toLocaleString()}` : "null"} />
            <Row label="annualSavingsUSD" value={quote.annualSavingsUSD ? `$${Number(quote.annualSavingsUSD).toLocaleString()}` : "null"} />
            <Row label="roiYears" value={quote.roiYears ? `${Number(quote.roiYears).toFixed(1)}` : "null"} />
            <Row label="npv" value={quote.npv ? `$${Number(quote.npv).toLocaleString()}` : "null"} />
            <Row label="irr" value={quote.irr ? `${(Number(quote.irr) * 100).toFixed(1)}%` : "null"} />
          </div>

          {/* Load Profile Summary */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
              Load Profile (Layer A)
            </div>
            <Row label="baseLoadKW" value={quote.baseLoadKW ?? "null"} />
            <Row label="peakLoadKW" value={quote.peakLoadKW ?? "null"} />
            <Row label="energyKWhPerDay" value={quote.energyKWhPerDay ? Math.round(Number(quote.energyKWhPerDay)) : "null"} />
          </div>

          {/* Current Step & Industry */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
              Wizard State
            </div>
            <Row label="step" value={state.step} />
            <Row label="industry" value={state.industry} />
            <Row label="step3Complete" value={state.step3Complete ? "✓" : "✗"} />
          </div>

          {/* Keyboard hint */}
          <div style={{ marginTop: 12, fontSize: 9, opacity: 0.4, textAlign: "center" }}>
            Press <kbd style={{ padding: "1px 4px", background: "rgba(0,0,0,0.08)", borderRadius: 3 }}>Ctrl+Shift+D</kbd> to toggle
          </div>
        </div>
      )}
    </div>
  );
}
