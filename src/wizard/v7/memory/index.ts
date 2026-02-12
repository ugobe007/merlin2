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

// ── TrueQuote™ Validator ──────────────────────────────────────────────────
export {
  validateMemory,
  validateSlot,
  generateChecksum,
  formatViolations,
  getComplianceBadge,
} from "./truequoteValidator";

export type {
  TrueQuoteReport,
  TrueQuoteViolation,
  ViolationSeverity,
  ViolationCategory,
} from "./truequoteValidator";
