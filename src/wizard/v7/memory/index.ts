/**
 * Merlin Memory — barrel export
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
