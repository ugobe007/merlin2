/**
 * ProQuote Configuration Page
 *
 * Standalone page wrapper for AdvancedQuoteBuilder (ProQuote Configuration)
 * Handles URL parameter parsing and state management
 */

import React, { useState } from "react";
import AdvancedQuoteBuilder from "@/components/AdvancedQuoteBuilder";
import type { WizardExport } from "@/wizard/v8/types/wizardExportSchema";

function getWizardHandoffFromSession(): WizardExport | null {
  try {
    const raw = sessionStorage.getItem("merlin_wizard_handoff_v1");
    if (!raw) return null;
    return JSON.parse(raw) as WizardExport;
  } catch {
    return null;
  }
}

function mapSuggestedMode(
  mode?: WizardExport["suggestedQuoteMode"]
):
  | "landing"
  | "custom-config"
  | "interactive-dashboard"
  | "professional-model"
  | "upload"
  | "upload-first" {
  if (mode === "professional_model") return "professional-model";
  if (mode === "quick_quote") return "landing";
  return "custom-config";
}

export default function ProQuoteConfigurationPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const handoff = getWizardHandoffFromSession();

  const recommendedTier =
    handoff?.energyStack?.tiers.find((tier) => tier.label === "Recommended") ??
    handoff?.energyStack?.tiers[1] ??
    handoff?.energyStack?.tiers[0];

  const handoffSystemSizeKW = recommendedTier?.bessKW;
  const handoffDurationHours =
    recommendedTier && recommendedTier.bessKW > 0
      ? recommendedTier.bessKWh / recommendedTier.bessKW
      : undefined;

  // Parse URL parameters for pre-filling
  const modeParam =
    (urlParams.get("mode") as
      | "landing"
      | "custom-config"
      | "interactive-dashboard"
      | "professional-model"
      | "upload"
      | "upload-first") || mapSuggestedMode(handoff?.suggestedQuoteMode);
  const systemSizeKW = parseFloat(
    urlParams.get("systemSizeKW") || String(handoffSystemSizeKW || 1000)
  );
  const durationHours = parseFloat(
    urlParams.get("durationHours") || String(handoffDurationHours || 4)
  );

  // State management for AdvancedQuoteBuilder
  const [storageSizeMW, setStorageSizeMW] = useState(systemSizeKW / 1000);
  const [duration, setDuration] = useState(durationHours);
  const [systemCostState, setSystemCostState] = useState(0);

  const handleClose = () => {
    // Navigate back to wizard landing page
    window.location.href = "/";
  };

  return (
    <AdvancedQuoteBuilder
      show={true}
      onClose={handleClose}
      storageSizeMW={storageSizeMW}
      durationHours={duration}
      systemCost={systemCostState}
      onStorageSizeChange={setStorageSizeMW}
      onDurationChange={setDuration}
      onSystemCostChange={setSystemCostState}
      initialView={modeParam}
    />
  );
}
