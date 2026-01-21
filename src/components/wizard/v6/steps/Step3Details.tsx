/**
 * Step3Details - COMPLETE REPLACEMENT
 *
 * Drop-in replacement for existing Step3Details.tsx
 * Uses new CompleteStep3 with full backward compatibility
 *
 * This replaces the old questionnaire engine with the new
 * CompleteStep3 system that includes:
 * - 27 comprehensive questions
 * - 12 question types
 * - Conditional logic
 * - Live calculations
 * - Quote generation
 *
 * ✅ NEW (Jan 21, 2026): Includes ProgressiveModelPanel for TrueQuote™ accuracy
 * - Collects service size, demand charge, HVAC type via micro-prompts
 * - Improves peakDemand and gridCapacity inference without form bloat
 * 
 * ✅ NEW (Jan 21, 2026 - Phase 5): LiveSystemPreview + PowerProfileChart
 * - Real-time BESS sizing recommendations with confidence bands
 * - 24-hour load curve visualization with peak shaving preview
 */

import React from "react";
import { Step3Integration } from "../../Step3Integration";
import { ProgressiveModelPanel } from "../micro-prompts";
import { LiveSystemPreview } from "../LiveSystemPreview";
import { PowerProfileChart } from "../PowerProfileChart";
import type {
  WizardState,
  ServiceSizeOption,
  DemandChargeBand,
  HVACTypeOption,
  GeneratorCapacityBand,
} from "../types";
import type { TrueQuoteSizing, LoadCurve } from "@/services/truequote";

interface Step3DetailsProps {
  state: unknown;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
  /** TrueQuote™ sizing recommendation (Phase 5) */
  trueQuoteSizing?: TrueQuoteSizing | null;
  /** Load curve for visualization (Phase 5) */
  loadCurve?: LoadCurve | null;
}

export function Step3Details({
  state,
  updateState,
  onNext,
  onBack,
  onValidityChange,
  trueQuoteSizing,
  loadCurve,
}: Step3DetailsProps) {
  // Cast state to proper type
  const wizardState = state as WizardState;

  // Extract current answers from state
  const initialData = (wizardState.useCaseData?.inputs as Record<string, unknown>) || {};

  // Get industry for context-aware prompts
  const industry = wizardState.industry || wizardState.detectedIndustry || "";

  return (
    <div className="space-y-6">
      {/* ========================================================================
          PROGRESSIVE MODEL PANEL - Micro-prompts for TrueQuote™ accuracy
          ======================================================================== */}
      <ProgressiveModelPanel
        industry={industry}
        serviceSize={wizardState.serviceSize}
        hasDemandCharge={wizardState.hasDemandCharge}
        demandChargeBand={wizardState.demandChargeBand}
        hvacType={wizardState.hvacType}
        hasBackupGenerator={wizardState.hasBackupGenerator}
        generatorCapacityBand={wizardState.generatorCapacityBand}
        onServiceSizeChange={(value: ServiceSizeOption) => {
          updateState({
            serviceSize: value,
            progressiveFieldsAnswered: [
              ...(wizardState.progressiveFieldsAnswered || []),
              "serviceSize",
            ].filter((v, i, a) => a.indexOf(v) === i),
          });
        }}
        onHasDemandChargeChange={(value: "yes" | "no" | "not-sure") => {
          updateState({
            hasDemandCharge: value,
            progressiveFieldsAnswered: [
              ...(wizardState.progressiveFieldsAnswered || []),
              "hasDemandCharge",
            ].filter((v, i, a) => a.indexOf(v) === i),
          });
        }}
        onDemandChargeBandChange={(value: DemandChargeBand) => {
          updateState({
            demandChargeBand: value,
            progressiveFieldsAnswered: [
              ...(wizardState.progressiveFieldsAnswered || []),
              "demandChargeBand",
            ].filter((v, i, a) => a.indexOf(v) === i),
          });
        }}
        onHVACTypeChange={(value: HVACTypeOption) => {
          updateState({
            hvacType: value,
            progressiveFieldsAnswered: [
              ...(wizardState.progressiveFieldsAnswered || []),
              "hvacType",
            ].filter((v, i, a) => a.indexOf(v) === i),
          });
        }}
        onHasBackupGeneratorChange={(value: "yes" | "no" | "planned") => {
          updateState({
            hasBackupGenerator: value,
            progressiveFieldsAnswered: [
              ...(wizardState.progressiveFieldsAnswered || []),
              "hasBackupGenerator",
            ].filter((v, i, a) => a.indexOf(v) === i),
          });
        }}
        onGeneratorCapacityBandChange={(value: GeneratorCapacityBand) => {
          updateState({
            generatorCapacityBand: value,
            progressiveFieldsAnswered: [
              ...(wizardState.progressiveFieldsAnswered || []),
              "generatorCapacityBand",
            ].filter((v, i, a) => a.indexOf(v) === i),
          });
        }}
      />

      {/* ========================================================================
          TRUEQUOTE™ LIVE PREVIEW (Phase 5 - Jan 21, 2026)
          Real-time sizing recommendations + load curve visualization
          ======================================================================== */}
      {(trueQuoteSizing || loadCurve) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Live System Preview - Sizing recommendations with bands */}
          {trueQuoteSizing && (
            <LiveSystemPreview sizing={trueQuoteSizing} />
          )}
          
          {/* Power Profile Chart - 24-hour load curve */}
          {loadCurve && (
            <PowerProfileChart 
              loadCurve={loadCurve} 
              targetCapKW={trueQuoteSizing?.constraints.targetCapKW}
              height={220}
            />
          )}
        </div>
      )}

      {/* ========================================================================
          STEP 3 QUESTIONNAIRE - Industry-specific questions
          Note: Step3Integration has slightly different types due to legacy API
          eslint-disable @typescript-eslint/no-explicit-any - Type coercion needed
          ======================================================================== */}
      <Step3Integration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state={wizardState as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateState={updateState as any}
        initialData={initialData}
        onComplete={(data) => {
          // Sync answers back to state as user types
          updateState({
            useCaseData: {
              ...wizardState.useCaseData,
              inputs: data as Record<string, unknown>,
            },
          });
        }}
        onNext={(quoteData) => {
          // Save complete data and proceed to Step 4
          // Note: 'calculated' and 'timestamp' are not part of useCaseData type
          // TrueQuote is SSOT for calculations (Step 5)
          updateState({
            useCaseData: {
              ...wizardState.useCaseData,
              inputs: quoteData.answers,
            },
          });
          onNext();
        }}
        onBack={onBack}
        onValidityChange={onValidityChange}
      />
    </div>
  );
}

export default Step3Details;
