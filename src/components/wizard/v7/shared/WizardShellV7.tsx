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
  /** Width of the Merlin advisor rail in px. Default 440. Increase for data-heavy steps. */
  railWidth?: number;
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

// Live clock — signals the engine is running in real-time (from merlin-energy design system)
function LiveClock() {
  const [time, setTime] = React.useState(() =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  );
  React.useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>{time}</span>;
}

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
  railWidth = 440,
  children,
}: WizardShellV7Props) {
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef(currentStep);

  // ✅ SCROLL-TO-TOP + flash-free step transition animation
  useEffect(() => {
    // 1) Try scrolling the wizard's own scroll container (modal path)
    const scrollContainer = shellRef.current?.closest("[data-wizard-scroll]") as HTMLElement | null;
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "instant" });
    }
    // 2) Always also scroll window (direct /v7 route path)
    window.scrollTo({ top: 0, behavior: "instant" });

    // 3) Re-trigger step-fadein animation without unmount/remount (prevents flash)
    if (prevStepRef.current !== currentStep) {
      prevStepRef.current = currentStep;
      const el = stepContentRef.current;
      if (el) {
        el.style.animation = "none";
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        el.offsetHeight; // force reflow so animation restarts
        el.style.animation = "";
      }
    }
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
          minHeight: "100svh" as string,
          background: `
            radial-gradient(ellipse 1400px 900px at 50% 15%, rgba(62,207,142,0.15) 0%, rgba(62,207,142,0.05) 40%, transparent 60%),
            linear-gradient(160deg, #080b14 0%, #0f1420 40%, #0a0d16 100%)
          `,
          color: "#e8ebf3",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          overflowX: "hidden",
          width: "100%",
        }}
      >
        {/* Main Layout */}
        <div
          className="merlin-shell-grid"
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: `${railWidth}px 1fr`,
            gap: 32,
            /* No maxWidth cap — fill the full browser landscape width */
            width: "100%",
            maxWidth: "100%",
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
                    boxShadow: "0 0 8px rgba(62, 207, 142, 0.5)",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Merlin AI</div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      position: "relative",
                      display: "inline-flex",
                      width: 8,
                      height: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        background: "rgba(62,207,142,0.35)",
                        animation: "merlin-pulse 1.5s ease-in-out infinite",
                      }}
                    />
                    <span
                      style={{
                        position: "relative",
                        borderRadius: "50%",
                        width: "100%",
                        height: "100%",
                        background: "#3ECF8E",
                      }}
                    />
                  </span>
                  <span style={{ color: "rgba(62,207,142,0.85)", letterSpacing: "0.04em" }}>
                    LIVE
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.32)",
                      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    }}
                  >
                    <LiveClock />
                  </span>
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
                  background: "rgba(18, 13, 3, 0.55)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontSize: 12,
                  letterSpacing: "0.04em",
                  WebkitFontSmoothing: "antialiased",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.55)";
                  e.currentTarget.style.background = "rgba(26, 18, 2, 0.75)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.35)";
                  e.currentTarget.style.background = "rgba(18, 13, 3, 0.55)";
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
            className="merlin-step-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              minWidth: 0,
              width: "100%",
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

            {/* Step Content — ref-based animation restart prevents flash on step change */}
            <div
              ref={stepContentRef}
              className="merlin-step merlin-step-enter"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "0 0 12px 12px",
                padding: 36,
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderTop: "none",
                minHeight: 400,
                willChange: "transform, opacity",
                animation:
                  "merlin-step-fadein 0.28s ease-out, heartbeatBorder 4s ease-in-out 0.4s infinite",
              }}
            >
              {children}
            </div>
          </div>

          {/* Step transition animation + responsive */}
          <style>{`
            @keyframes heartbeatBorder {
              0%, 100% { box-shadow: 0 0 0 0 transparent; }
              50%       { box-shadow: 0 0 0 1px rgba(245,158,11,0.09), 0 24px 48px rgba(0,0,0,0.22); }
            }
            @keyframes merlin-pulse {
              0%, 100% { transform: scale(1); opacity: 0.75; }
              50%       { transform: scale(1.9); opacity: 0; }
            }
            @keyframes merlin-step-fadein {
              from { opacity: 0.1; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes merlin-spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            
            /* Mobile: collapse to single column, hide rail, compact progress */
            @media (max-width: 900px) {
              .merlin-shell-grid {
                grid-template-columns: 1fr !important;
                padding: 16px !important;
                gap: 16px !important;
                width: 100% !important;
                max-width: 100vw !important;
              }
              .merlin-shell-rail {
                display: none !important;
              }
              .merlin-shell-bottomnav {
                padding: 16px 16px 24px !important;
                width: 100% !important;
              }
              .merlin-progress-bar {
                gap: 4px !important;
                padding: 12px !important;
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch;
                border-radius: 8px !important;
              }
              .merlin-progress-label {
                display: none !important;
              }
              .merlin-step {
                padding: 20px !important;
                min-height: 400px !important;
                border-radius: 12px !important;
              }
              .merlin-nexthint {
                display: none !important;
              }
              /* Ensure content panel is full width on mobile */
              .merlin-step-panel {
                width: 100% !important;
                max-width: 100vw !important;
                overflow-x: hidden !important;
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

            /* ── LANDSCAPE PHONE (short viewport, wide) ───────────────────────
               Handles iPhone landscape (390×844 → 844×390 rotated).
               Goal: everything fits on screen without scrolling. */
            @media (orientation: landscape) and (max-height: 520px) {
              .merlin-shell-grid {
                grid-template-columns: 1fr !important;
                padding: 6px 12px !important;
                gap: 8px !important;
                width: 100% !important;
                max-width: 100vw !important;
              }
              .merlin-shell-rail {
                display: none !important;
              }
              .merlin-progress-bar {
                padding: 6px 12px !important;
                gap: 3px !important;
                border-radius: 8px !important;
              }
              .merlin-progress-label {
                display: none !important;
              }
              .merlin-step {
                padding: 12px 16px !important;
                min-height: 180px !important;
                border-radius: 8px !important;
              }
              .merlin-nexthint {
                display: none !important;
              }
              .merlin-shell-bottomnav {
                padding: 6px 12px 10px !important;
                width: 100% !important;
              }
              .merlin-step-panel {
                width: 100% !important;
                max-width: 100vw !important;
                overflow-x: hidden !important;
              }
            }

            /* ── LANDSCAPE TABLET (iPad, 521-900px height, landscape) ─────────
               Handles iPad mini/Air in landscape. Show narrow rail. */
            @media (orientation: landscape) and (min-height: 521px) and (max-height: 900px) and (min-width: 901px) {
              .merlin-shell-grid {
                grid-template-columns: 220px 1fr !important;
                gap: 16px !important;
                padding: 16px 20px !important;
              }
              .merlin-step {
                padding: 20px 24px !important;
                min-height: 280px !important;
              }
              .merlin-shell-bottomnav {
                padding: 0 20px 16px !important;
              }
            }
          `}</style>
        </div>

        {/* BOTTOM NAV */}
        <div
          className="merlin-shell-bottomnav"
          style={{
            padding: "0 32px 28px",
            width: "100%",
          }}
        >
          {/* Separator */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 20 }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Back */}
            <button
              onClick={onBack}
              disabled={!canGoBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 20px",
                borderRadius: 10,
                minHeight: 46,
                background: canGoBack ? "rgba(255, 255, 255, 0.04)" : "transparent",
                border: canGoBack ? "1px solid rgba(255, 255, 255, 0.09)" : "1px solid transparent",
                color: canGoBack ? "rgba(232, 235, 243, 0.65)" : "rgba(232, 235, 243, 0.18)",
                cursor: canGoBack ? "pointer" : "not-allowed",
                fontSize: 14,
                fontWeight: 500,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (canGoBack) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
                  e.currentTarget.style.color = "rgba(232, 235, 243, 0.9)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = canGoBack
                  ? "rgba(255, 255, 255, 0.04)"
                  : "transparent";
                e.currentTarget.style.borderColor = canGoBack
                  ? "rgba(255, 255, 255, 0.09)"
                  : "transparent";
                e.currentTarget.style.color = canGoBack
                  ? "rgba(232, 235, 243, 0.65)"
                  : "rgba(232, 235, 243, 0.18)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path
                  d="M9 11.5L4.5 7L9 2.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>

            {/* Center: hint + step dot pills — hidden on mobile */}
            <div
              className="merlin-nexthint"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              {nextHint && (
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(232, 235, 243, 0.35)",
                    letterSpacing: "0.01em",
                  }}
                >
                  Next: {nextHint}
                </div>
              )}
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {stepLabels.map((_, idx) => {
                  const isActive = idx === safeStep;
                  const isComplete = idx < safeStep;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: isActive ? 20 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: isComplete
                          ? "rgba(62, 207, 142, 0.5)"
                          : isActive
                            ? "#3ECF8E"
                            : "rgba(255, 255, 255, 0.12)",
                        transition: "all 0.25s ease",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Next — solid fill for steps 4+ (high-intent CTA), outline for early steps */}
            {(() => {
              const isFilled = canGoNext && !isNextLoading && safeStep >= 3;
              const isActive = canGoNext && !isNextLoading;
              return (
                <button
                  onClick={onNext}
                  disabled={!canGoNext || isNextLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 22px",
                    borderRadius: 10,
                    minHeight: 46,
                    background: isFilled
                      ? "#3ECF8E"
                      : isActive
                        ? "transparent"
                        : "rgba(255,255,255,0.03)",
                    border: isFilled
                      ? "2px solid #3ECF8E"
                      : isActive
                        ? "2px solid #3ECF8E"
                        : "2px solid rgba(255, 255, 255, 0.08)",
                    color: isFilled
                      ? "#0a1628"
                      : isActive
                        ? "#3ECF8E"
                        : "rgba(232, 235, 243, 0.28)",
                    cursor: isActive ? "pointer" : "not-allowed",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.01em",
                    boxShadow: isFilled ? "0 0 20px rgba(62, 207, 142, 0.25)" : "none",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (isActive) {
                      if (isFilled) {
                        e.currentTarget.style.background = "#4DDBA0";
                        e.currentTarget.style.boxShadow = "0 0 28px rgba(62, 207, 142, 0.40)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      } else {
                        e.currentTarget.style.background = "rgba(62, 207, 142, 0.10)";
                        e.currentTarget.style.boxShadow = "0 0 16px rgba(62, 207, 142, 0.15)";
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isFilled
                      ? "#3ECF8E"
                      : isActive
                        ? "transparent"
                        : "rgba(255,255,255,0.03)";
                    e.currentTarget.style.boxShadow = isFilled
                      ? "0 0 20px rgba(62, 207, 142, 0.25)"
                      : "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {isNextLoading ? (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{ animation: "merlin-spin 0.8s linear infinite", flexShrink: 0 }}
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="30 10"
                        />
                      </svg>
                      Working…
                    </>
                  ) : (
                    <>
                      {nextLabel || "Next Step"}
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        style={{ flexShrink: 0 }}
                      >
                        <path
                          d="M5.5 3L10 7.5L5.5 12"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
