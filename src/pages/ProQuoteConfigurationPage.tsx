/**
 * ProQuote Configuration Page
 *
 * Standalone page wrapper for AdvancedQuoteBuilder (ProQuote Configuration)
 * Handles URL parameter parsing and state management
 */

import React, { useState } from "react";
import AdvancedQuoteBuilder from "@/components/AdvancedQuoteBuilder";

export default function ProQuoteConfigurationPage() {
  const urlParams = new URLSearchParams(window.location.search);

  // Parse URL parameters for pre-filling
  const modeParam = urlParams.get("mode") || "custom-config";
  const systemSizeKW = parseFloat(urlParams.get("systemSizeKW") || "1000");
  const durationHours = parseFloat(urlParams.get("durationHours") || "4");

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
      initialView={
        modeParam as "landing" | "custom-config" | "interactive-dashboard" | "professional-model" | "upload"
      }
    />
  );
}
