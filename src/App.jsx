// ═══════════════════════════════════════════════════════════════════════════════
// MERLIN ENERGY v6.0 — App.jsx (Entry Point)
// Manages wizard state: WizA (Steps 1-3) → WizB (Steps 4-7)
// Last updated: February 16, 2026
// ═══════════════════════════════════════════════════════════════════════════════
import React, { useState, useCallback } from 'react';
import EnergyWizardA from './WizA';
import EnergyWizardB from './WizB';

function App() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [wizardData, setWizardData] = useState(null);

  // ─── WizA → WizB handoff ───────────────────────────────────────────────────
  // WizA calls onComplete({ locationData, selectedIndustry, annualBill, formData })
  const handleWizardAComplete = useCallback((data) => {
    console.log('✅ WizA complete — handing off to WizB:', {
      zip: data.locationData?.zip,
      state: data.locationData?.state,
      industry: data.selectedIndustry,
      annualBill: data.annualBill,
    });
    setWizardData(data);
  }, []);

  // ─── Back / Start Over ─────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    // Return to WizA with previous data preserved
    setWizardData(null);
  }, []);

  const handleStartOver = useCallback(() => {
    // Full reset — clear everything
    setWizardData(null);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="App">
      {!wizardData ? (
        <EnergyWizardA onComplete={handleWizardAComplete} />
      ) : (
        <EnergyWizardB
          locationData={wizardData.locationData}
          selectedIndustry={wizardData.selectedIndustry}
          annualBill={wizardData.annualBill}
          formData={wizardData.formData}
          onBack={handleBack}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}

export default App;
