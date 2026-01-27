/**
 * Wizard V7 — Web Page Surface
 * - SSOT: useWizardV7() orchestrates all state + transitions
 * - Steps are dumb: they render state + emit intents
 * - No business logic in steps, no nested parsers, no state drift
 */

import React from "react";
import { useWizardV7 } from "@/wizard/v7/hooks/useWizardV7";

// Dumb step components
import {
  Step1LocationV7,
  Step2IndustryV7,
  Step3ProfileV7,
  Step4ResultsV7,
} from "@/components/wizard/v7/steps";

function ErrorBar({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(255,0,0,0.08)",
        border: "1px solid rgba(255,0,0,0.18)",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 14, lineHeight: "18px" }}>{message}</div>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 14,
            opacity: 0.7,
          }}
          aria-label="Close error"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function BusyBar({ label }: { label?: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.08)",
        marginBottom: 12,
        fontSize: 13,
      }}
    >
      {label || "Loading…"}
    </div>
  );
}

export default function WizardV7Page() {
  const wizard = useWizardV7();
  const { state } = wizard;

  // Web-page V7: no shell assumptions. This page is fully self-contained.
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
      {/* Minimal top chrome (optional) */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.2px" }}>Merlin Wizard</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          Step{" "}
          {state.step === "location"
            ? 1
            : state.step === "industry"
              ? 2
              : state.step === "profile"
                ? 3
                : 4}{" "}
          of 4 •{" "}
          {state.step === "location"
            ? 25
            : state.step === "industry"
              ? 50
              : state.step === "profile"
                ? 75
                : 100}
          %
        </div>
      </div>

      {state.error?.message ? (
        <ErrorBar message={state.error.message} onClose={wizard.clearError} />
      ) : null}

      {state.isBusy ? <BusyBar label={state.busyLabel} /> : null}

      {/* Step Router */}
      {state.step === "location" && (
        <Step1LocationV7
          state={state}
          actions={{
            updateLocationRaw: wizard.updateLocationRaw,
            submitLocation: wizard.submitLocation,
          }}
        />
      )}

      {state.step === "industry" && (
        <Step2IndustryV7
          state={state}
          actions={{
            goBack: wizard.goBack,
            selectIndustry: wizard.selectIndustry,
          }}
        />
      )}

      {state.step === "profile" && (
        <Step3ProfileV7
          state={state}
          actions={{
            goBack: wizard.goBack,
            setStep3Answer: wizard.setStep3Answer,
            setStep3Answers: wizard.setStep3Answers,
            submitStep3: wizard.submitStep3,
          }}
        />
      )}

      {state.step === "results" && (
        <Step4ResultsV7
          state={state}
          actions={{
            goBack: wizard.goBack,
            resetSession: wizard.resetSession,
            goToStep: wizard.goToStep,
          }}
        />
      )}

      {/* Debug (toggle later) */}
      <div style={{ marginTop: 18, fontSize: 12, opacity: 0.55 }}>
        <div>session: {state.sessionId}</div>
        <div>lastAction: {state.debug.lastAction ?? "-"}</div>
        <div>lastApi: {state.debug.lastApi ?? "-"}</div>
        <div>lastTransition: {state.debug.lastTransition ?? "-"}</div>
      </div>
    </div>
  );
}
