/**
 * STEP 3 — NORMALIZED LOAD PROFILE MODULE
 * ========================================
 *
 * Created: February 8, 2026
 * Updated: February 8, 2026 — Move 5 (hard boundary + policy taxonomy)
 *
 * PUBLIC API (the service boundary):
 *   - step3Compute() — the ONLY entry point for Step 3 calculation
 *   - Types: LoadProfileEnvelope, NormalizedLoadInputs, etc.
 *   - Policy: PolicyEvent, PolicyCode, summarizePolicyEvents
 *
 * INTERNAL (test-only exports, NOT for UI/hooks):
 *   - Adapters: hotelAdapter, carWashAdapter, etc.
 *   - Contracts: getCalculatorContract, validateInputsAgainstContract
 *   - Helpers: computeConfidence, checkEnvelopeInvariants
 *   - Registration: registerAdapter, getAdapter, listAdapterSlugs
 *
 * USAGE (production code):
 *   import {
 *     step3Compute,
 *     type LoadProfileEnvelope,
 *   } from '@/wizard/v7/step3';
 *
 * USAGE (tests only):
 *   import { getAdapter, listAdapterSlugs } from '@/wizard/v7/step3';
 *   import { getCalculatorContract } from '@/wizard/v7/step3';
 */

// ============================================================================
// PUBLIC API — The service boundary
// ============================================================================

// The SINGLE entry point
export {
  step3Compute,
  type Step3ComputeInput,
} from "./step3Compute";

// Types (pure type exports — zero runtime cost)
export type {
  NormalizedLoadInputs,
  LoadProfileEnvelope,
  IndustryAdapter,
  LoadContributor,
  EnvelopeInvariant,
  ConfidenceLevel,
  ProvenanceConflict,
  ScheduleBundle,
  ScaleBundle,
  HVACBundle,
  ProcessLoad,
  ArchitectureBundle,
} from "./loadProfile";

// TrueQuote™ Policy Taxonomy (Move 5)
export {
  PolicyCode,
  summarizePolicyEvents,
  filterBySeverity,
  type PolicyEvent,
  type PolicyCodeType,
} from "./policyTaxonomy";

// Policy Translation Layer (Move 7) — Founder-friendly messages
export {
  translatePolicyEvents,
  hasVisiblePolicyEvents,
  maxUserSeverity,
  type UserFacingPolicyEvent,
  type UserSeverity,
} from "./policyTranslation";

// ============================================================================
// INTERNAL — Exported for tests and infrastructure ONLY
// ============================================================================
// UI components and hooks should NEVER import these directly.
// Use step3Compute() instead.
//
// Enforcement: adapterContracts.test.ts Tier A scans for violations.

// Helpers & presets (used by tests and adapters)
export {
  computeConfidence,
  checkEnvelopeInvariants,
  SCHEDULE_PRESETS,
  HVAC_PRESETS,
  ARCHITECTURE_PRESETS,
} from "./loadProfile";

// Adapter registration (used by adapter modules + tests)
export {
  registerAdapter,
  getAdapter,
  listAdapterSlugs,
} from "./step3Compute";

// Gold-standard adapters (Move 2 — self-register on import)
export { hotelAdapter } from "./adapters/hotel";
export { carWashAdapter } from "./adapters/carWash";
export { evChargingAdapter } from "./adapters/evCharging";

// Move 3 adapters (self-register on import)
export { restaurantAdapter } from "./adapters/restaurant";
export { officeAdapter } from "./adapters/office";
export { truckStopAdapter, gasStationAdapter } from "./adapters/truckStop";

// Calculator contracts registry (used by tests + infrastructure)
export {
  getCalculatorContract,
  listContractIds,
  getAllContracts,
  validateInputsAgainstContract,
  type CalculatorContractSpec,
  type KeyRange,
} from "./calculatorContracts";

// Policy event collector (used by step3Compute internally + tests)
export { PolicyEventCollector } from "./policyTaxonomy";
