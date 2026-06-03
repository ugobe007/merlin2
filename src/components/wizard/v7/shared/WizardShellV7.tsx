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
import merlinProfileImage from "@/assets/images/new_profile_merlin.png";

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
  /** Width of the Merlin advisor rail in px. Default 520. Increase for data-heavy steps. */
  railWidth?: number;
  /** Called when the user clicks the ⚡ ProStack escape button. */
  onSwitchToProStack?: () => void;
  /** Live utility metrics from intel — renders a telemetry bar at the bottom of the step panel */
  telemetry?: {
    rate?: number;
    demand?: number;
    solar?: number;
    grade?: string;
    climate?: string;
    temp?: number;
    utility?: string;
  };
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
  railWidth: _railWidth = 520,
  onSwitchToProStack,
  telemetry,
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
            radial-gradient(ellipse 1400px 900px at 50% 15%, rgba(99,120,255,0.18) 0%, rgba(139,92,246,0.10) 34%, transparent 60%),
            linear-gradient(160deg, #080b14 0%, #0f1420 40%, #0a0d16 100%)
          `,
          color: "#e8ebf3",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          overflowX: "hidden",
          width: "100%",
          position: "relative",
        }}
      >
        {/* Ambient background glows */}
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "rgba(88,28,135,0.07)",
            filter: "blur(120px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "rgba(29,78,216,0.07)",
            filter: "blur(120px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Main Layout */}
        <div
          className="merlin-shell-grid"
          style={{
            flex: 1,
            display: "grid",
            // Fixed 380px left rail — wide enough to show intel cards comfortably.
            // Right panel takes remaining space. maxWidth centers on ultra-wide screens.
            gridTemplateColumns: "380px 1fr",
            gap: 32,
            width: "100%",
            maxWidth: 1440,
            margin: "0 auto",
            padding: "24px 32px",
          }}
        >
          {/* LEFT RAIL — Merlin's advisor space (Feb 11, 2026) */}
          <div
            className="merlin-shell-rail"
            style={{
              background: "#111a3e",
              borderRadius: 12,
              padding: 24,
              border: "1px solid rgba(99,120,255,0.18)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Merlin Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
              <div style={{ position: "relative" }}>
                <a
                  href="/"
                  title="About Merlin Energy"
                  style={{ display: "block", borderRadius: "50%", outline: "none" }}
                >
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
                      src={merlinProfileImage}
                      alt="Merlin AI"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                </a>
                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#4f8aff",
                    boxShadow: "0 0 8px rgba(79,138,255,0.55)",
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
                        background: "rgba(99,120,255,0.35)",
                        animation: "merlin-pulse 1.5s ease-in-out infinite",
                      }}
                    />
                    <span
                      style={{
                        position: "relative",
                        borderRadius: "50%",
                        width: "100%",
                        height: "100%",
                        background: "#4f8aff",
                      }}
                    />
                  </span>
                  <span style={{ color: "rgba(96,165,250,0.95)", letterSpacing: "0.04em" }}>
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

            {/* StackQuote™ Badge — top of rail, always visible */}
            <div style={{ padding: "0 0 12px" }}>
              <button
                type="button"
                onClick={() => setShowTrueQuoteModal(true)}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 16px",
                  borderRadius: 14,
                  background:
                    "linear-gradient(145deg, rgba(28,18,4,0.92) 0%, rgba(18,12,2,0.96) 100%)",
                  border: "1.5px solid rgba(245,158,11,0.45)",
                  boxShadow: "0 0 28px rgba(245,158,11,0.10), inset 0 1px 0 rgba(245,158,11,0.08)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  WebkitFontSmoothing: "antialiased",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(245,158,11,0.70)";
                  e.currentTarget.style.boxShadow =
                    "0 0 36px rgba(245,158,11,0.20), inset 0 1px 0 rgba(245,158,11,0.14)";
                  e.currentTarget.style.background =
                    "linear-gradient(145deg, rgba(36,23,5,0.95) 0%, rgba(22,15,3,0.98) 100%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(245,158,11,0.45)";
                  e.currentTarget.style.boxShadow =
                    "0 0 28px rgba(245,158,11,0.10), inset 0 1px 0 rgba(245,158,11,0.08)";
                  e.currentTarget.style.background =
                    "linear-gradient(145deg, rgba(28,18,4,0.92) 0%, rgba(18,12,2,0.96) 100%)";
                }}
                aria-label="Learn about StackQuote verification"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <svg
                    width="20"
                    height="22"
                    viewBox="0 0 20 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ flexShrink: 0 }}
                  >
                    <path
                      d="M10 1L2 4.5V10C2 14.97 5.42 19.6 10 21C14.58 19.6 18 14.97 18 10V4.5L10 1Z"
                      fill="rgba(245,158,11,0.15)"
                      stroke="#F2C14F"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 11L9.5 13.5L14 8.5"
                      stroke="#4f8aff"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: "#F5F0E8",
                      letterSpacing: "0.01em",
                    }}
                  >
                    StackQuote™
                  </span>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle at 30% 30%, #FFDFA3, #F2C14F 60%, #B8892F 100%)",
                      boxShadow: "0 0 8px rgba(242,193,79,0.55)",
                      flexShrink: 0,
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="6"
                      cy="6"
                      r="5.5"
                      fill="rgba(99,120,255,0.15)"
                      stroke="#4f8aff"
                      strokeWidth="1"
                    />
                    <path
                      d="M3.5 6L5.5 8L8.5 4"
                      stroke="#4f8aff"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.45)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Verified Pricing Sources
                  </span>
                </div>
              </button>
            </div>

            {/* Unified Merlin Advisor — full rail height (Feb 11, 2026) */}
            <div
              style={{
                flex: 1,
                borderRadius: 12,
                background:
                  "linear-gradient(180deg, rgba(12,22,45,0.90) 0%, rgba(10,16,32,0.78) 100%)",
                border: "1px solid rgba(99,120,255,0.22)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 0 0 1px rgba(99,120,255,0.06) inset",
              }}
            >
              {/* Advisor label bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(99,120,255,0.18)",
                  background:
                    "linear-gradient(135deg, rgba(99,120,255,0.10), rgba(155,109,255,0.08))",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    width: 7,
                    height: 7,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: "rgba(99,120,255,0.35)",
                      animation: "merlin-pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  <span
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: "#4f8aff",
                    }}
                  />
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(155,109,255,0.90)",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                  }}
                >
                  Merlin Advisor
                </span>
              </div>
              {/* Advisor content area */}
              <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
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
                      Hi, I'm <span style={{ color: "#9b6dff" }}>Merlin</span> — your energy savings
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
                justifyContent: "space-between",
                gap: 4,
                padding: "12px 24px",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "12px 12px 0 0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              {/* Left spacer to keep pills centered */}
              <div style={{ width: 138, flexShrink: 0 }} />

              {/* Step pills — centered */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {stepLabels.map((label, idx) => {
                  const isActive = idx === safeStep;
                  const isComplete = idx < safeStep;
                  const isFuture = idx > safeStep;

                  return (
                    <React.Fragment key={`${label}-${idx}`}>
                      {/* Chevron connector */}
                      {idx > 0 && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          style={{ flexShrink: 0, opacity: isFuture ? 0.25 : 0.45 }}
                        >
                          <path
                            d="M3 1.5L7 5L3 8.5"
                            stroke="#4a5568"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}

                      {/* Step pill */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 12px",
                          borderRadius: 999,
                          background: isActive
                            ? "linear-gradient(135deg, #4f8aff, #7c3aed)"
                            : isComplete
                              ? "rgba(52,211,153,0.10)"
                              : "transparent",
                          border: isActive
                            ? "none"
                            : isComplete
                              ? "1px solid rgba(52,211,153,0.25)"
                              : "none",
                          boxShadow: isActive ? "0 0 12px rgba(124,58,237,0.45)" : "none",
                          opacity: isFuture ? 0.4 : 1,
                          transition: "all 0.2s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {/* Step number/check bubble */}
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            background: isActive
                              ? "rgba(255,255,255,0.20)"
                              : isComplete
                                ? "#34d399"
                                : "rgba(255,255,255,0.06)",
                            color: isComplete ? "#0d1230" : "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {isComplete ? (
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                              <path
                                d="M1.5 4.5L3.5 6.5L7.5 2.5"
                                stroke="#0d1230"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Label */}
                        <span
                          className="merlin-progress-label"
                          style={{
                            fontSize: 11,
                            fontWeight: isActive ? 700 : 500,
                            color: isActive
                              ? "#fff"
                              : isComplete
                                ? "#34d399"
                                : "rgba(232, 235, 243, 0.35)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* ProStack escape button — top-right, always visible */}
              {onSwitchToProStack ? (
                <button
                  type="button"
                  onClick={onSwitchToProStack}
                  title="Switch to full engineering mode — your inputs are saved"
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 9,
                    border: "1.5px solid #f59e0b",
                    background: "transparent",
                    color: "#f59e0b",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase" as const,
                    boxShadow: "none",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#fbbf24";
                    e.currentTarget.style.color = "#fbbf24";
                    e.currentTarget.style.background = "rgba(245,158,11,0.07)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#f59e0b";
                    e.currentTarget.style.color = "#f59e0b";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  ⚡ ProStack
                </button>
              ) : (
                <div style={{ width: 138, flexShrink: 0 }} />
              )}
            </div>

            {/* Step Content — ref-based animation restart prevents flash on step change */}
            <div
              ref={stepContentRef}
              className="merlin-step merlin-step-enter"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "0 0 12px 12px",
                padding: 28,
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

            {/* Live Telemetry Bar — rendered when intel data is available */}
            {telemetry && (telemetry.rate || telemetry.utility) && (
              <div
                style={{
                  borderTop: "1px solid rgba(99,120,255,0.12)",
                  padding: "10px 20px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0 16px",
                  rowGap: 6,
                  fontSize: 11,
                  color: "#4a5568",
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  background: "rgba(255,255,255,0.01)",
                  borderRadius: "0 0 12px 12px",
                }}
              >
                {telemetry.rate != null && (
                  <span>
                    Rate{" "}
                    <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                      ${telemetry.rate.toFixed(2)}/kWh
                    </span>
                  </span>
                )}
                {telemetry.demand != null && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.1)" }}>•</span>
                    <span>
                      Demand{" "}
                      <span style={{ color: "#34d399", fontWeight: 700 }}>
                        ${telemetry.demand.toFixed(2)}/kW
                      </span>
                    </span>
                  </>
                )}
                {telemetry.solar != null && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.1)" }}>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      ☀️{" "}
                      <span style={{ color: "rgba(232,235,243,0.7)" }}>
                        {telemetry.solar.toFixed(2)} hrs
                      </span>
                    </span>
                  </>
                )}
                {telemetry.grade && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.1)" }}>•</span>
                    <span>
                      Grade{" "}
                      <span style={{ color: "#e8eaf6", fontWeight: 700 }}>{telemetry.grade}</span>
                    </span>
                  </>
                )}
                {telemetry.climate && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.1)" }}>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      🌡️ <span style={{ color: "rgba(232,235,243,0.7)" }}>{telemetry.climate}</span>
                    </span>
                  </>
                )}
                {telemetry.temp != null && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.1)" }}>•</span>
                    <span style={{ color: "#f87171" }}>{telemetry.temp}°F</span>
                  </>
                )}
                {telemetry.utility && (
                  <>
                    <span style={{ color: "rgba(255,255,255,0.1)" }}>•</span>
                    <span style={{ color: "rgba(232,235,243,0.5)" }}>{telemetry.utility}</span>
                  </>
                )}
              </div>
            )}
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
            @keyframes nextBtnPulse {
              0%, 100% {
                box-shadow: 0 0 32px rgba(79, 140, 255, 0.42), 0 0 18px rgba(139,92,246,0.16), 0 4px 16px rgba(0,0,0,0.3);
              }
              50% {
                box-shadow: 0 0 56px rgba(79, 140, 255, 0.72), 0 0 22px rgba(139,92,246,0.34), 0 4px 20px rgba(0,0,0,0.35);
              }
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
            
            /* Tablet: tighten spacing, fix left rail at 300px */
            @media (min-width: 901px) and (max-width: 1200px) {
              .merlin-shell-grid {
                grid-template-columns: 300px 1fr !important;
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
               Handles iPad mini/Air in landscape. Show narrow rail.
               (pointer: coarse) ensures this ONLY targets touch tablets,
               NOT laptops — 1366×768 and 1440×900 laptops were being caught
               by the height range and wrongly capped the advisor at 240px. */
            @media (orientation: landscape) and (min-height: 521px) and (max-height: 900px) and (min-width: 901px) and (pointer: coarse) {
              .merlin-shell-grid {
                grid-template-columns: 240px 1fr !important;
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
            padding: "0 32px 12px",
            width: "100%",
          }}
        >
          {/* Separator */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 10 }} />

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
                background: "transparent",
                border: canGoBack ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                color: canGoBack ? "rgba(232, 235, 243, 0.65)" : "rgba(232, 235, 243, 0.18)",
                cursor: canGoBack ? "pointer" : "not-allowed",
                fontSize: 14,
                fontWeight: 500,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (canGoBack) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.color = "rgba(232, 235, 243, 0.9)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = canGoBack
                  ? "rgba(255,255,255,0.18)"
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
                          ? "rgba(79, 140, 255, 0.55)"
                          : isActive
                            ? "#7c3aed"
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
                    padding: isFilled ? "14px 28px" : "11px 22px",
                    borderRadius: isFilled ? 12 : 10,
                    minHeight: isFilled ? 54 : 46,
                    background: "transparent",
                    border: isFilled
                      ? "2px solid #7c3aed"
                      : isActive
                        ? "2px solid #4f8aff"
                        : "2px solid rgba(255,255,255,0.08)",
                    color: isFilled ? "#c4b5fd" : isActive ? "#BFDBFE" : "rgba(232,235,243,0.28)",
                    cursor: isActive ? "pointer" : "not-allowed",
                    fontSize: isFilled ? 16 : 14,
                    fontWeight: 700,
                    letterSpacing: "0.01em",
                    boxShadow: isFilled ? "0 0 20px rgba(124,58,237,0.30)" : "none",
                    animation: "none",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (isActive) {
                      if (isFilled) {
                        e.currentTarget.style.borderColor = "#9b6dff";
                        e.currentTarget.style.boxShadow = "0 0 28px rgba(124,58,237,0.45)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      } else {
                        e.currentTarget.style.background = "rgba(99,120,255,0.06)";
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = isFilled
                      ? "#7c3aed"
                      : isActive
                        ? "#4f8aff"
                        : "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow = isFilled
                      ? "0 0 20px rgba(124,58,237,0.30)"
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
