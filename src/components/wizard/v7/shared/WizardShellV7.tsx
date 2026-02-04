/**
 * WizardShellV7.tsx
 *
 * Clean floating panel design - NO borders, just shadows for depth.
 * Rebuilt Jan 30, 2026 for quality bar.
 *
 * ✅ FIX Jan 31+: Shell no longer owns step ordering.
 * Parent supplies stepLabels to eliminate drift / off-by-one issues.
 */

import React, { useState } from "react";
import TrueQuoteModal from "@/components/shared/TrueQuoteModal";

interface WizardShellV7Props {
  currentStep: number; // 0-indexed from parent
  stepLabels: string[]; // ✅ single source of truth from parent
  nextHint?: string;
  canGoBack?: boolean;
  canGoNext?: boolean;
  isNextLoading?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  isVerified?: boolean;
  rightPanel?: React.ReactNode; // ✅ Optional right panel (Advisor, etc.)
  children: React.ReactNode;
}

export default function WizardShellV7({
  currentStep,
  stepLabels,
  nextHint = "Next step",
  canGoBack = true,
  canGoNext = true,
  isNextLoading = false,
  onBack,
  onNext,
  isVerified = true,
  rightPanel,
  children,
}: WizardShellV7Props) {
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  const totalSteps = stepLabels?.length ?? 0;
  const safeStep = Number.isFinite(currentStep) ? Math.max(0, Math.min(currentStep, totalSteps - 1)) : 0;

  return (
    <>
      <TrueQuoteModal
        isOpen={showTrueQuoteModal}
        onClose={() => setShowTrueQuoteModal(false)}
        mode="about"
      />

      <div
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
          {/* LEFT RAIL */}
          <div
            style={{
              background: "rgba(16, 20, 36, 0.85)",
              borderRadius: 20,
              padding: 24,
              boxShadow: `
                0 8px 40px rgba(0, 0, 0, 0.5),
                0 0 60px rgba(79, 140, 255, 0.12),
                0 0 80px rgba(139, 92, 246, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `,
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
                    boxShadow: "0 4px 16px rgba(139, 92, 246, 0.25)",
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
                    background: "#4ade80",
                    boxShadow: "0 0 8px rgba(74, 222, 128, 0.5)",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Merlin AI</div>
                <div style={{ fontSize: 13, color: "rgba(74, 222, 128, 0.9)", fontWeight: 500 }}>
                  ● Live Analysis — Step {safeStep + 1} of {totalSteps}
                </div>
              </div>
            </div>

            {/* Merlin Welcome Message */}
            <div
              style={{
                marginBottom: 28,
                padding: 20,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, rgba(79, 140, 255, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 40px rgba(79, 140, 255, 0.12)",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.6,
                  color: "rgba(255, 255, 255, 0.95)",
                  marginBottom: 12,
                }}
              >
                Hi, I'm <span style={{ color: "#22D3EE" }}>Merlin</span> — your energy savings advisor.
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
            </div>

            {/* Progress Steps */}
            <div style={{ marginBottom: 24 }}>
              {stepLabels.map((label, idx) => {
                const isActive = idx === safeStep;
                const isComplete = idx < safeStep;
                const isFuture = idx > safeStep;

                return (
                  <div
                    key={`${label}-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 0",
                      opacity: isFuture ? 0.4 : 1,
                    }}
                  >
                    {/* Step Number */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        background: isActive
                          ? "linear-gradient(135deg, rgba(79, 140, 255, 0.4), rgba(139, 92, 246, 0.35))"
                          : isComplete
                          ? "rgba(74, 222, 128, 0.2)"
                          : "rgba(255, 255, 255, 0.06)",
                        color: isComplete ? "#4ade80" : "#e8ebf3",
                        boxShadow: isActive ? "0 4px 12px rgba(79, 140, 255, 0.3)" : "none",
                      }}
                    >
                      {isComplete ? "✓" : idx + 1}
                    </div>

                    {/* Step Label */}
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#fff" : "rgba(232, 235, 243, 0.7)",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* TrueQuote Badge */}
            <div
              onClick={() => setShowTrueQuoteModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 20,
                background: "rgba(16, 20, 36, 0.7)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                cursor: "pointer",
                width: "fit-content",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span style={{ fontSize: 16 }}>◎</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f9a825" }}>TrueQuote™</span>
              {isVerified && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
                  <span style={{ fontSize: 12, color: "#4ade80" }}>Verified</span>
                </>
              )}
            </div>

            {/* Main Content + Optional Advisor Panel */}
            <div style={{ display: "flex", gap: 20, flex: 1 }}>
              {/* Main Content Area (min-width: 0 prevents squeeze/overflow) */}
              <div
                className="merlin-step"
                style={{
                  flex: 1,
                  minWidth: 0, // ✅ Prevents text overflow on narrow viewports
                  background: "rgba(16, 20, 36, 0.75)",
                  borderRadius: 20,
                  padding: 36,
                  boxShadow: `
                    0 8px 40px rgba(0, 0, 0, 0.5),
                    0 0 60px rgba(79, 140, 255, 0.12),
                    0 0 80px rgba(139, 92, 246, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05)
                  `,
                }}
              >
                {children}
              </div>

              {/* Advisor Panel (optional, hidden below xl breakpoint) */}
              {rightPanel ? (
                <aside 
                  className="hidden xl:block"
                  style={{ width: 320, flexShrink: 0 }}
                >
                  {rightPanel}
                </aside>
              ) : null}
            </div>
          </div>
        </div>

        {/* BOTTOM NAV */}
        <div
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
              padding: "12px 20px",
              borderRadius: 12,
              background: canGoBack ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.02)",
              border: "none",
              color: canGoBack ? "rgba(232, 235, 243, 0.8)" : "rgba(232, 235, 243, 0.25)",
              cursor: canGoBack ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 600,
              boxShadow: canGoBack ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "none",
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
              padding: "12px 24px",
              borderRadius: 12,
              background:
                canGoNext && !isNextLoading
                  ? "linear-gradient(135deg, rgba(79, 140, 255, 0.5), rgba(139, 92, 246, 0.45))"
                  : "rgba(255, 255, 255, 0.04)",
              border: "none",
              color: canGoNext && !isNextLoading ? "#fff" : "rgba(232, 235, 243, 0.25)",
              cursor: canGoNext && !isNextLoading ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 700,
              boxShadow:
                canGoNext && !isNextLoading
                  ? "0 4px 20px rgba(79, 140, 255, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)"
                  : "none",
              transition: "all 0.15s ease",
            }}
          >
            {isNextLoading ? "Working..." : "Next Step"} <span>›</span>
          </button>
        </div>
      </div>
    </>
  );
}
