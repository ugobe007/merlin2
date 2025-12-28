/**
 * V6 SAVAGE - Salvaged Components Index
 * =====================================
 * 
 * "We're not just salvaging. We're going SAVAGE."
 * 
 * These components were extracted from Merlin V5 for use in V6.
 * Each has been validated as working and worth keeping.
 */

// Components - Badges
export { TrueQuoteBadge, TrueQuoteSeal } from './components/badges/TrueQuoteBadge';
export { AUTHORITY_SOURCES } from './components/badges/IndustryComplianceBadges';

// Components - Displays
export { RAVSDisplay } from './components/displays/RAVSDisplay';

// Components - Modals
export { TrueQuoteModal } from './components/modals/TrueQuoteModal';

// UI - Progress
export { ProgressRing } from './ui/progress/ProgressRing';

// UI - Profiles
export { WizardPowerProfile } from './ui/profiles/WizardPowerProfile';

// UI - Widgets
export { default as EnergyNewsTicker } from './ui/widgets/EnergyNewsTicker';

// Services
export { calculateRAVS, getRAVSColor } from './services/ravsService';
export { calculateDatabaseBaseline } from './services/baselineService';

// Data
export { SOLAR_DATA, getSolarRating } from './data/solarData';
export { EV_ADOPTION_RATES, getEVAdoptionRate, getEVRating } from './data/evData';
export { getStateFromZip } from './data/zipToState';
