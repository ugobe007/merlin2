/**
 * WizardShellV7.tsx
 *
 * Clean floating panel design - NO borders, just shadows for depth.
 * Rebuilt Jan 30, 2026 for quality bar.
 *
 * ✅ FIX Jan 31+: Shell no longer owns step ordering.
 * Parent supplies stepLabels to eliminate drift / off-by-one issues.
 *
 * ✅ FEB 11, 2026: Progress steps moved from left rail to horizontal bar
 * at the top of the content panel. Left rail is now 100% Merlin's advisor space.
 */

import React, { useState, useEffect, useRef } from "react";
import TrueQuoteModal from "@/components/shared/TrueQuoteModal";

interface WizardShellV7Props {
  currentStep: number; // 0-indexed from parent
  stepLabels: string[]; // ✅ single source of truth from parent
  nextHint?: string;
  /** Contextual label for Next button, e.g. "Choose Industry →" */
  nextLabel?: string;
  canGoBack?: boolean;
  canGoNext?: boolean;
  isNextLoading?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  isVerified?: boolean;
  /** Advisor narration + intel rendered in left rail below progress steps */
  advisorContent?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * WizardShellV7 — 2-Column Layout (Feb 11, 2026)
 *
 * LEFT RAIL (360px): Merlin avatar + advisor narration (full height for insights)
 * RIGHT PANEL (flex): Horizontal progress bar + step content
 *
 * CHANGE Feb 11, 2026: Progress steps moved from left rail to horizontal bar
 * at the top of the content panel. Freed ~280px for Merlin's cross-slot insights.
 */
export default function WizardShellV7({
  currentStep,
  stepLabels,
  nextHint = "Next step",
  nextLabel,
  canGoBack = true,
  canGoNext = true,
  isNextLoading = false,
  onBack,
  onNext,
  advisorContent,
  children,
}: WizardShellV7Props) {
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  // ✅ SCROLL-TO-TOP on every step transition
  useEffect(() => {
    // 1) Try scrolling the wizard's own scroll container (modal path)
    const scrollContainer = shellRef.current?.closest('[data-wizard-scroll]') as HTMLElement | null;
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
    // 2) Always also scroll window (direct /v7 route path)
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentStep]);

  const totalSteps = stepLabels?.length ?? 0;
  const safeStep = Number.isFinite(currentStep)
    ? Math.max(0, Math.min(currentStep, totalSteps - 1))
    : 0;

  return (
    <>
      <TrueQuoteModal
        isOpen={showTrueQuoteModal}
        onClose={() => setShowTrueQuoteModal(false)}
        mode="about"
      />

      <div
        ref={shellRef}
        data-merlin="hud"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg, #080b14 0%, #0f1420 40%, #0a0d16 100%)",
          color: "#e8ebf3",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Main Layout */}
        <div
          className="merlin-shell-grid"
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "360px 1fr",
            gap: 28,
            maxWidth: 1440,
            margin: "0 auto",
            width: "100%",
            padding: "24px 32px",
          }}
        >
          {/* LEFT RAIL — Merlin's advisor space (Feb 11, 2026) */}
          <div
            className="merlin-shell-rail"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: 12,
              padding: 24,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Merlin Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <img
                    src="/images/new_profile_merlin.png"
                    alt="Merlin AI"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#3ECF8E",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Merlin AI</div>
                <div style={{ fontSize: 12, color: "rgba(62, 207, 142, 0.8)", fontWeight: 500 }}>
                  ● Active — Step {safeStep + 1} of {totalSteps}
                </div>
              </div>
            </div>

            {/* Unified Merlin Advisor — full rail height (Feb 11, 2026) */}
            <div
              style={{
                flex: 1,
                padding: 20,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.04)",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {advisorContent ? (
                advisorContent
              ) : (
                /* Fallback welcome when no step-specific advisor data */
                <>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      lineHeight: 1.6,
                      color: "rgba(255, 255, 255, 0.95)",
                      marginBottom: 12,
                    }}
                  >
                    Hi, I'm <span style={{ color: "#3ECF8E" }}>Merlin</span> — your energy savings
                    advisor.
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "rgba(232, 235, 243, 0.7)",
                      lineHeight: 1.65,
                    }}
                  >
                    In just a few steps, I'll help you discover how much you could save.
                  </div>
                </>
              )}
            </div>

            {/* Spacer to push TrueQuote badge to bottom */}
            <div style={{ marginTop: "auto" }} />

            {/* TrueQuote Badge — Always visible, clickable to open modal */}
            <div
              style={{
                padding: "12px 0",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={() => setShowTrueQuoteModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 14,
                  background: "rgba(30, 32, 48, 0.6)",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontSize: 12,
                  letterSpacing: "0.04em",
                  WebkitFontSmoothing: "antialiased",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                  e.currentTarget.style.background = "rgba(30, 32, 48, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                  e.currentTarget.style.background = "rgba(30, 32, 48, 0.6)";
                }}
                aria-label="Learn about TrueQuote verification"
              >
                <span style={{ color: "#F1F5F9", fontWeight: 700, letterSpacing: "0.02em" }}>
                  TrueQuote™
                </span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 30% 30%, #FFDFA3, #F2C14F 60%, #B8892F 100%)",
                    boxShadow: "0 0 6px rgba(242, 193, 79, 0.4)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#94A3B8", fontWeight: 600 }}>Verified</span>
              </button>
            </div>
          </div>

          {/* ── RIGHT: CONTENT AREA (full width) ─────────────── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {/* Horizontal Progress Bar (Feb 11, 2026) */}
            <div
              className="merlin-progress-bar"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "12px 24px",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "12px 12px 0 0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              {stepLabels.map((label, idx) => {
                const isActive = idx === safeStep;
                const isComplete = idx < safeStep;
                const isFuture = idx > safeStep;

                return (
                  <React.Fragment key={`${label}-${idx}`}>
                    {/* Connector line between steps */}
                    {idx > 0 && (
                      <div
                        style={{
                          width: 24,
                          height: 2,
                          borderRadius: 1,
                          background: isComplete
                            ? "rgba(62, 207, 142, 0.3)"
                            : isActive
                              ? "rgba(62, 207, 142, 0.2)"
                              : "rgba(255, 255, 255, 0.06)",
                          flexShrink: 0,
                        }}
                      />
                    )}

                    {/* Step pill */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 14px",
                        borderRadius: 999,
                        background: isActive
                          ? "rgba(62, 207, 142, 0.10)"
                          : isComplete
                            ? "rgba(62, 207, 142, 0.06)"
                            : "transparent",
                        boxShadow: "none",
                        opacity: isFuture ? 0.4 : 1,
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {/* Step number/check */}
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          background: isActive
                            ? "rgba(62, 207, 142, 0.25)"
                            : isComplete
                              ? "rgba(62, 207, 142, 0.15)"
                              : "rgba(255, 255, 255, 0.06)",
                          color: isComplete ? "#3ECF8E" : isActive ? "#fff" : "#e8ebf3",
                          flexShrink: 0,
                        }}
                      >
                        {isComplete ? "✓" : idx + 1}
                      </div>

                      {/* Label — shown on active + completed, hidden on future for compactness */}
                      <span
                        className="merlin-progress-label"
                        style={{
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 500,
                          color: isActive
                            ? "#fff"
                            : isComplete
                              ? "rgba(62, 207, 142, 0.8)"
                              : "rgba(232, 235, 243, 0.35)",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Step Content */}
            <div
              key={`step-${safeStep}`}
              className="merlin-step merlin-step-enter"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "0 0 12px 12px",
                padding: 36,
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderTop: "none",
                minHeight: 500,
                animation: "merlin-step-fadein 0.3s ease-out",
              }}
            >
              {children}
            </div>
          </div>

          {/* Step transition animation + responsive */}
          <style>{`
            @keyframes merlin-step-fadein {
              from { opacity: 0; transform: translateY(12px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            
            /* Mobile: collapse to single column, hide rail, compact progress */
            @media (max-width: 900px) {
              .merlin-shell-grid {
                grid-template-columns: 1fr !important;
                padding: 12px 16px !important;
                gap: 16px !important;
              }
              .merlin-shell-rail {
                display: none !important;
              }
              .merlin-shell-bottomnav {
                padding: 12px 16px 20px !important;
              }
              .merlin-progress-bar {
                gap: 2px !important;
                padding: 10px 12px !important;
              }
              .merlin-progress-label {
                display: none !important;
              }
            }
            
            /* Tablet: narrower rail, compact progress labels */
            @media (min-width: 901px) and (max-width: 1200px) {
              .merlin-shell-grid {
                grid-template-columns: 280px 1fr !important;
                gap: 20px !important;
                padding: 20px 24px !important;
              }
              .merlin-progress-bar {
                gap: 2px !important;
                padding: 12px 16px !important;
              }
            }
          `}</style>
        </div>

        {/* BOTTOM NAV */}
        <div
          className="merlin-shell-bottomnav"
          style={{
            padding: "16px 28px 24px",
            maxWidth: 1400,
            margin: "0 auto",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Back */}
          <button
            onClick={onBack}
            disabled={!canGoBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 8,
              background: canGoBack ? "rgba(255, 255, 255, 0.04)" : "transparent",
              border: canGoBack ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid transparent",
              color: canGoBack ? "rgba(232, 235, 243, 0.6)" : "rgba(232, 235, 243, 0.20)",
              cursor: canGoBack ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 500,
              boxShadow: "none",
              transition: "all 0.15s ease",
            }}
          >
            <span>‹</span> Back
          </button>

          {/* Hint */}
          <div style={{ fontSize: 13, color: "rgba(232, 235, 243, 0.4)" }}>
            {nextHint && `Next: ${nextHint}`}
          </div>

          {/* Next */}
          <button
            onClick={onNext}
            disabled={!canGoNext || isNextLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 8,
              background:
                canGoNext && !isNextLoading
                  ? "#3ECF8E"
                  : "rgba(255, 255, 255, 0.04)",
              border: "none",
              color: canGoNext && !isNextLoading ? "#000" : "rgba(232, 235, 243, 0.20)",
              cursor: canGoNext && !isNextLoading ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "none",
              transition: "all 0.15s ease",
            }}
          >
            {isNextLoading ? "Working..." : nextLabel || "Next Step"} <span>›</span>
          </button>
        </div>
      </div>
    </>
  );
}
