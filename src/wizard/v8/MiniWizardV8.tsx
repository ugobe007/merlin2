/**
 * =============================================================================
 * MINI WIZARD V8 — VERTICAL-SPECIFIC VERSION
 * =============================================================================
 *
 * Simplified wizard flow for vertical-specific landing pages (car wash, hotel, etc.)
 *
 * FLOW (3 steps instead of 6):
 *   Step 1: Location
 *   Step 2: Industry-specific inputs (pre-filled with industry)
 *   Step 3: Add-ons
 *   Step 4: Quote
 *
 * DIFFERENCES FROM FULL WIZARD:
 *   - Skips Mode Select (Step 0)
 *   - Skips Industry Selection (Step 2) — industry is pre-determined
 *   - Includes company logo
 *   - Simplified navigation
 *
 * Props:
 *   - industry: Pre-set industry type (e.g., 'car_wash', 'hotel')
 *   - companyName: Company name for branding
 *   - companyLogo: Optional logo URL or component
 * =============================================================================
 */

import React, { Suspense, lazy, useEffect } from "react";
import { useWizardV8 } from "./useWizardV8";
import type { IndustrySlug } from "./wizardState";
import { Step1V8 } from "./steps/Step1V8";
import WizardShellV7 from "@/components/wizard/v7/shared/WizardShellV7";
import { ElCarWashLogo } from "@/components/logos/ElCarWashLogo";

// Lazy-load steps
const Step3V8 = lazy(() => import("./steps/Step3V8"));
const Step3_5V8 = lazy(() => import("./steps/Step3_5V8")); // Add-ons step
const Step4V8 = lazy(() => import("./steps/Step4V8")); // MagicFit tiers
const Step5V8 = lazy(() => import("./steps/Step5V8"));

interface MiniWizardV8Props {
  industry: string;
  companyName: string;
  companyLogo?: string | React.ReactNode;
}

const ACCENT = "#3ECF8E";
const T = {
  secondary: "rgba(255,255,255,0.60)",
  muted: "rgba(255,255,255,0.35)",
};

function hi(text: string): React.ReactNode {
  return <span style={{ color: ACCENT }}>{text}</span>;
}

function bullet(text: string): React.ReactNode {
  return (
    <div
      key={text}
      style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.secondary }}
    >
      <span style={{ color: ACCENT, fontSize: 10, flexShrink: 0 }}>●</span>
      {text}
    </div>
  );
}

// Mini wizard step mapping
// For the mini wizard, we show: Location (1), Industry Details (3), Add-ons (3.5), MagicFit (4), Quote (5)
// But since WizardStep type is 0|1|2|3|4|5|6, we'll use 4 to represent the add-ons screen
// and 5 for the final quote. We'll map internally.
type MiniStep = "location" | "profile" | "addons" | "magicfit" | "quote";

const MINI_STEPS: MiniStep[] = ["location", "profile", "addons", "magicfit", "quote"];
const STEP_LABELS = ["Location", "Profile", "Add-ons", "Configure", "Quote"];

type S = ReturnType<typeof useWizardV8>["state"];

function getAdvisorContent(
  miniStep: MiniStep,
  state: S,
  companyName: string,
  industry: string
): React.ReactNode {
  const industryDisplay = industry.replace(/_/g, " ");

  switch (miniStep) {
    case "location":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Let's find your {companyName} location.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            I'll use your location to look up {hi("local utility rates")} and{" "}
            {hi("solar irradiance")} — two of the biggest factors in your savings estimate.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {["Utility rates by zip code", "Peak demand windows", "Solar potential score"].map(
              bullet
            )}
          </div>
        </div>
      );

    case "profile":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            {companyName} facility profile.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Questions are pre-filled with {hi(`${industryDisplay} industry defaults`)}. Accept them
            or review — the more accurate your inputs, the better your quote.
          </div>
          {state.baseLoadKW > 0 && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                background: "rgba(62,207,142,0.06)",
                border: "1px solid rgba(62,207,142,0.22)",
                marginTop: 4,
              }}
            >
              <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, marginBottom: 4 }}>
                📊 LIVE ENERGY INTEL
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>
                Base Load: {hi(`${state.baseLoadKW} kW`)} · Peak: {hi(`${state.peakLoadKW} kW`)}
              </div>
            </div>
          )}
        </div>
      );

    case "addons":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Optional add-ons for {companyName}.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            These are {hi("optional enhancements")} based on your facility profile. Skip anything
            you don't need.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {["EV charging stations", "Backup power systems", "Energy management software"].map(
              bullet
            )}
          </div>
        </div>
      );

    case "magicfit":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Choose your system size.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Pick the {hi("perfect tier")} for {companyName}. Each tier is optimized for different
            priorities: budget, savings, or maximum backup power.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {[
              "STARTER: Budget-friendly entry",
              "PERFECT FIT: Best ROI",
              "BEAST MODE: Maximum power",
            ].map(bullet)}
          </div>
        </div>
      );

    case "quote":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Your {companyName} quote is ready.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            All calculations are {hi("TrueQuote™ verified")} — backed by real equipment pricing,
            labor costs, and 25 years of utility rate forecasting.
          </div>
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              background: "rgba(62,207,142,0.06)",
              border: "1px solid rgba(62,207,142,0.22)",
              marginTop: 4,
            }}
          >
            <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, marginBottom: 4 }}>
              ✓ QUOTE VERIFIED
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>
              All pricing sources documented · 25-year warranty · Valid 90 days
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function MiniWizardV8({ industry, companyName, companyLogo }: MiniWizardV8Props) {
  const wizard = useWizardV8();
  const { state, actions } = wizard;

  // Track which mini step we're on using state
  const [internalMiniStep, setInternalMiniStep] = React.useState<number>(0);

  // Prevent URL navigation by blocking history/location changes
  useEffect(() => {
    // Block any URL changes while in mini wizard
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      // Allow pushState but don't actually change URL
      console.log("[MiniWizardV8] Blocked pushState:", args);
      return;
    };

    window.history.replaceState = function (...args) {
      // Allow replaceState but don't actually change URL
      console.log("[MiniWizardV8] Blocked replaceState:", args);
      return;
    };

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  // Set industry on mount - do this AFTER blocking navigation
  useEffect(() => {
    if (industry && !state.industry) {
      actions.setIndustry(industry as IndustrySlug); // Type cast for vertical-specific industries
    }
  }, [industry, state.industry, actions]);

  // Sync internal step with wizard state changes
  useEffect(() => {
    const actualStep = state.step;
    console.log(
      "[MiniWizardV8] Wizard step changed to:",
      actualStep,
      "Current internal mini step:",
      internalMiniStep
    );

    if (actualStep === 1 && internalMiniStep !== 0) {
      console.log("[MiniWizardV8] Syncing to location");
      setInternalMiniStep(0); // location
    } else if (actualStep === 3 && internalMiniStep !== 1) {
      console.log("[MiniWizardV8] Syncing to profile");
      setInternalMiniStep(1); // profile
    } else if (actualStep === 4 && internalMiniStep === 1) {
      // Coming from profile (step 1), should go to addons (step 2)
      console.log("[MiniWizardV8] Profile completed, moving to addons");
      setInternalMiniStep(2); // addons
    } else if (actualStep === 5 && internalMiniStep === 2) {
      // Coming from addons (step 2), but trying to skip to quote
      // Redirect to magicfit (step 3) first, then it can go to quote
      console.log("[MiniWizardV8] Addons completed, redirecting to magicfit");
      setInternalMiniStep(3); // magicfit
      actions.goToStep(4); // Stay on wizard step 4 to show magicfit
    } else if (actualStep === 5 && internalMiniStep === 3) {
      // Coming from magicfit (step 3), this is valid - go to quote
      console.log("[MiniWizardV8] Valid progression from magicfit to quote");
      setInternalMiniStep(4); // quote
    } else if (actualStep === 6 && internalMiniStep === 3) {
      // Step4V8 goes to step 6 in full wizard, but in mini wizard that's step 5
      console.log("[MiniWizardV8] Intercepting step 6, redirecting to step 5 (quote)");
      setInternalMiniStep(4); // quote
      actions.goToStep(5); // Redirect to wizard step 5 for mini wizard
    }
  }, [state.step, internalMiniStep, actions]);

  const miniStepIndex = internalMiniStep;
  const currentMiniStep = MINI_STEPS[miniStepIndex];

  // Navigation logic
  const canGoBack = miniStepIndex > 0;
  // Only show Next button for steps that don't have their own continue button
  // Step3V8 (profile) has its own continue button in the completion banner
  // Step4V8 (magicfit) handles its own navigation, so don't show wrapper's Next button
  const canGoNext =
    miniStepIndex < MINI_STEPS.length - 1 &&
    currentMiniStep !== "profile" &&
    currentMiniStep !== "magicfit";

  console.log("[MiniWizardV8] Navigation state:", {
    miniStepIndex,
    currentMiniStep,
    canGoNext,
    canGoBack,
    industry: state.industry,
    peakLoadKW: state.peakLoadKW,
  });

  const handleNext = () => {
    const nextIndex = miniStepIndex + 1;
    console.log(
      "[MiniWizardV8] handleNext called, current mini step:",
      miniStepIndex,
      "next mini step:",
      nextIndex
    );

    if (nextIndex < MINI_STEPS.length) {
      setInternalMiniStep(nextIndex);
      const nextMiniStep = MINI_STEPS[nextIndex];
      console.log("[MiniWizardV8] Navigating to mini step:", nextMiniStep);

      // Map mini steps to wizard steps
      if (nextMiniStep === "location") actions.goToStep(1);
      else if (nextMiniStep === "profile") actions.goToStep(3);
      else if (nextMiniStep === "addons") {
        // Stay on step 4 but show addons
        console.log("[MiniWizardV8] Going to addons (wizard step 4)");
        actions.goToStep(4);
      } else if (nextMiniStep === "magicfit") {
        // Stay on step 4 but show magicfit
        console.log("[MiniWizardV8] Going to magicfit (wizard step 4)");
        actions.goToStep(4);
      } else if (nextMiniStep === "quote") actions.goToStep(5);
    }
  };

  const handleBack = () => {
    const prevIndex = miniStepIndex - 1;
    if (prevIndex >= 0) {
      setInternalMiniStep(prevIndex);
      const prevMiniStep = MINI_STEPS[prevIndex];

      // Map mini steps to wizard steps
      if (prevMiniStep === "location") actions.goToStep(1);
      else if (prevMiniStep === "profile") actions.goToStep(3);
      else if (prevMiniStep === "addons") {
        // Stay on step 4 but show addons
        actions.goToStep(4);
      } else if (prevMiniStep === "magicfit") {
        // Stay on step 4 but show magicfit
        actions.goToStep(4);
      } else if (prevMiniStep === "quote") actions.goToStep(5);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentMiniStep) {
      case "location":
        return <Step1V8 {...wizard} />;
      case "profile":
        return (
          <Suspense fallback={<div style={{ padding: 40, color: "#fff" }}>Loading...</div>}>
            <Step3V8 {...wizard} />
          </Suspense>
        );
      case "addons":
        return (
          <Suspense fallback={<div style={{ padding: 40, color: "#fff" }}>Loading...</div>}>
            <Step3_5V8 {...wizard} />
          </Suspense>
        );
      case "magicfit":
        return (
          <Suspense fallback={<div style={{ padding: 40, color: "#fff" }}>Loading...</div>}>
            <Step4V8 {...wizard} />
          </Suspense>
        );
      case "quote":
        return (
          <Suspense fallback={<div style={{ padding: 40, color: "#fff" }}>Loading...</div>}>
            <Step5V8 {...wizard} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  // Custom header with company logo
  const renderCustomHeader = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {companyName === "El Car Wash" && !companyLogo ? (
          <ElCarWashLogo height={40} />
        ) : typeof companyLogo === "string" ? (
          <>
            <img src={companyLogo} alt={companyName} style={{ height: 40, width: "auto" }} />
            <div style={{ height: 30, width: 1, background: "rgba(255,255,255,0.2)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>Merlin Energy</span>
            </div>
          </>
        ) : (
          <>
            {companyLogo}
            <div style={{ height: 30, width: 1, background: "rgba(255,255,255,0.2)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>Merlin Energy</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      {renderCustomHeader()}
      <WizardShellV7
        currentStep={miniStepIndex}
        stepLabels={STEP_LABELS}
        advisorContent={getAdvisorContent(currentMiniStep, state, companyName, industry)}
        onBack={canGoBack ? handleBack : undefined}
        onNext={canGoNext ? handleNext : undefined}
        canGoNext={canGoNext}
        nextLabel="Continue"
        nextHint="Proceed to next step"
        railWidth={currentMiniStep >= 2 && currentMiniStep <= 4 ? 616 : 440}
      >
        {renderStepContent()}
      </WizardShellV7>
    </div>
  );
}
