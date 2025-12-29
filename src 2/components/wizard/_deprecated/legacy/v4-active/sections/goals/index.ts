// ═══════════════════════════════════════════════════════════════════════════
// GOALS SECTION INDEX - Dec 16, 2025
// Re-exports all goals sub-components for easy importing
// ═══════════════════════════════════════════════════════════════════════════

// Shared types and components
export type { SubComponentProps } from './GoalsSharedComponents';
export { PowerSlider, RoofSpaceWarning } from './GoalsSharedComponents';

// EV Charger components
export { EVChargersExisting, EVChargersNew, ChargerLevelInputs } from './GoalsEVChargers';

// Renewable energy components
export { SolarToggle, SolarCanopyToggle, WindToggle } from './GoalsRenewables';

// Infrastructure components
export { GeneratorToggle, GridConnectionSection } from './GoalsInfrastructure';
