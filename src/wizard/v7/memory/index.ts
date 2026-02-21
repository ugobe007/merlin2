/**
 * Merlin Memory — barrel export
 * + TrueQuote™ Validator (Feb 11, 2026)
 */
export {
  merlinMemory,
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
  getEffectiveRate,
  getEffectiveDemandCharge,
} from "./merlinMemory";

export type {
  MemoryLocation,
  MemoryGoals,
  MemoryIndustry,
  MemoryBusiness,
  MemoryProfile,
  MemorySizing,
  MemoryAddOns,
  MemoryQuote,
  MerlinMemorySlots,
  MemorySlotKey,
  EnergyGoal,
} from "./merlinMemory";

export {
  useMerlinMemory,
  useMerlinMemorySlots,
  useMerlinMemoryMap,
  useMerlinMemorySet,
  useMerlinSessionId,
} from "./useMerlinMemory";

// ── Memory-First Data Access (Steps 4/5/6 consume this) ────────────────
export { useMerlinData, getProQuoteSeed } from "./useMerlinData";
export type { MerlinData } from "./useMerlinData";

// ── TrueQuote™ Validator Types (NO runtime exports to avoid circular TDZ) ──
export type {
  TrueQuoteReport,
  TrueQuoteViolation,
  ViolationSeverity,
  ViolationCategory,
} from "./memoryTypes";

// ⚠️ NOTE: Validator FUNCTIONS are NOT exported from barrel to prevent TDZ.
// Import directly from ./truequoteValidator if needed:
//   import { validateMemory } from "@/wizard/v7/memory/truequoteValidator";

