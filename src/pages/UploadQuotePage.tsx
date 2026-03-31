/**
 * Upload Quote Page — /upload-quote
 *
 * Standalone route for the Smart Upload™ flow, reached when a user selects
 * "Upload" mode on the WizardV8 mode-select screen (Step0V8_ModeSelect).
 *
 * Renders AdvancedQuoteBuilder with initialView="upload-first" so the
 * DocumentUploadZone is shown immediately. After extraction the user is
 * transitioned into the ProQuote config view within the same component.
 */

import React, { useState } from "react";
import AdvancedQuoteBuilder from "@/components/AdvancedQuoteBuilder";

export default function UploadQuotePage() {
  const [storageSizeMW, setStorageSizeMW] = useState(1);
  const [duration, setDuration] = useState(4);
  const [systemCost, setSystemCost] = useState(0);

  const handleClose = () => {
    window.location.href = "/wizard";
  };

  return (
    <AdvancedQuoteBuilder
      show={true}
      onClose={handleClose}
      storageSizeMW={storageSizeMW}
      durationHours={duration}
      systemCost={systemCost}
      onStorageSizeChange={setStorageSizeMW}
      onDurationChange={setDuration}
      onSystemCostChange={setSystemCost}
      initialView="upload-first"
    />
  );
}
