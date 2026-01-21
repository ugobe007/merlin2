/**
 * TrueQuote™ Load Curve Generator
 * ================================
 * Generates 24-point load curves for visualization.
 * Shows baseline demand vs demand with BESS intervention.
 * 
 * Created: January 21, 2026
 * Phase 5: Live Battery Sizing + Power Profile Preview
 */

// ============================================================================
// TYPES
// ============================================================================

export interface LoadCurvePoint {
  hour: number;         // 0-23
  demandKW: number;     // Load at this hour
  label?: string;       // "12am", "1am", etc.
}

export interface LoadCurve {
  baseline: LoadCurvePoint[];
  withBess: LoadCurvePoint[];
  peakKW: number;
  peakKWAfter: number;
  peakReduction: number;
  peakHour: number;
  energyKWhDay: number;
}

export interface LoadCurveInputs {
  industry?: string;
  peakDemandKW: number;
  avgDemandKW?: number;
  bessCapacityKWh?: number;
  bessDischargeKW?: number;
  targetCapKW?: number;  // Peak shaving target
  hvacMultiplier?: number;
}

// ============================================================================
// INDUSTRY LOAD PROFILES (normalized 0-1 scale)
// ============================================================================

/**
 * Normalized 24-hour load profiles by industry
 * Values represent % of peak demand at each hour (0-23)
 */
const LOAD_PROFILES: Record<string, number[]> = {
  // Hotel: Morning peak (breakfast/checkout), evening peak (dinner/checkin)
  hotel: [
    0.45, 0.40, 0.35, 0.32, 0.30, 0.35, // 12am-5am: Low overnight
    0.55, 0.75, 0.90, 0.80, 0.70, 0.65, // 6am-11am: Morning peak
    0.60, 0.55, 0.55, 0.60, 0.70, 0.85, // 12pm-5pm: Afternoon
    0.95, 1.00, 0.90, 0.75, 0.60, 0.50, // 6pm-11pm: Evening peak
  ],
  
  // Office: Classic 9-5 with HVAC ramp-up
  office: [
    0.25, 0.22, 0.20, 0.20, 0.20, 0.25, // 12am-5am: Base load
    0.35, 0.55, 0.80, 0.95, 1.00, 0.98, // 6am-11am: Ramp-up
    0.95, 0.96, 1.00, 0.95, 0.85, 0.65, // 12pm-5pm: Peak hours
    0.45, 0.35, 0.30, 0.28, 0.27, 0.26, // 6pm-11pm: Wind down
  ],
  
  // Data Center: Very flat, always near peak
  'data-center': [
    0.92, 0.91, 0.90, 0.90, 0.90, 0.91, // 12am-5am
    0.93, 0.95, 0.97, 0.98, 0.99, 1.00, // 6am-11am
    1.00, 1.00, 0.99, 0.98, 0.97, 0.96, // 12pm-5pm
    0.94, 0.93, 0.92, 0.91, 0.92, 0.92, // 6pm-11pm
  ],
  
  // EV Charging: Spiky with evening commuter peak
  'ev-charging': [
    0.15, 0.10, 0.08, 0.05, 0.05, 0.10, // 12am-5am: Overnight
    0.30, 0.55, 0.40, 0.35, 0.40, 0.55, // 6am-11am: Morning commuters
    0.60, 0.50, 0.45, 0.50, 0.65, 0.85, // 12pm-5pm: Lunch + afternoon
    1.00, 0.95, 0.80, 0.60, 0.40, 0.25, // 6pm-11pm: Evening peak
  ],
  
  // Car Wash: Afternoon/weekend peak
  'car-wash': [
    0.05, 0.05, 0.05, 0.05, 0.05, 0.08, // 12am-5am: Closed
    0.15, 0.25, 0.40, 0.60, 0.80, 0.90, // 6am-11am: Morning ramp
    0.95, 1.00, 0.95, 0.85, 0.75, 0.60, // 12pm-5pm: Peak afternoon
    0.40, 0.25, 0.15, 0.08, 0.05, 0.05, // 6pm-11pm: Close
  ],
  
  // Hospital: Fairly flat with morning peak (surgeries, admissions)
  hospital: [
    0.70, 0.65, 0.62, 0.60, 0.62, 0.68, // 12am-5am: Night shift
    0.78, 0.88, 0.95, 1.00, 0.98, 0.95, // 6am-11am: Morning peak
    0.90, 0.88, 0.85, 0.82, 0.80, 0.78, // 12pm-5pm: Afternoon
    0.75, 0.73, 0.72, 0.70, 0.70, 0.70, // 6pm-11pm: Evening
  ],
  
  // Retail: Late morning to evening
  retail: [
    0.15, 0.12, 0.10, 0.10, 0.10, 0.12, // 12am-5am: Closed
    0.18, 0.25, 0.40, 0.60, 0.80, 0.90, // 6am-11am: Opening
    0.95, 1.00, 0.98, 0.92, 0.88, 0.90, // 12pm-5pm: Peak shopping
    0.85, 0.75, 0.55, 0.35, 0.22, 0.18, // 6pm-11pm: Closing
  ],
  
  // Manufacturing: Shift-based, 2-shift pattern
  manufacturing: [
    0.75, 0.70, 0.68, 0.65, 0.65, 0.70, // 12am-5am: Night shift
    0.85, 0.95, 1.00, 1.00, 0.98, 0.95, // 6am-11am: Day shift peak
    0.92, 0.88, 0.90, 0.92, 0.88, 0.75, // 12pm-5pm: Day shift
    0.65, 0.60, 0.58, 0.60, 0.65, 0.72, // 6pm-11pm: Shift change
  ],
  
  // Warehouse: Daytime operations
  warehouse: [
    0.20, 0.18, 0.15, 0.15, 0.15, 0.20, // 12am-5am: Minimal
    0.45, 0.70, 0.85, 0.95, 1.00, 0.95, // 6am-11am: Morning ops
    0.90, 0.85, 0.88, 0.85, 0.75, 0.55, // 12pm-5pm: Afternoon
    0.35, 0.28, 0.25, 0.22, 0.20, 0.20, // 6pm-11pm: Wind down
  ],
  
  // Casino: Evening/night peak
  casino: [
    0.85, 0.80, 0.70, 0.55, 0.45, 0.40, // 12am-5am: Late night
    0.35, 0.35, 0.40, 0.50, 0.60, 0.70, // 6am-11am: Morning
    0.75, 0.78, 0.80, 0.82, 0.88, 0.92, // 12pm-5pm: Afternoon
    0.95, 1.00, 1.00, 0.98, 0.95, 0.90, // 6pm-11pm: Peak
  ],
  
  // Airport: Complex pattern with morning/evening flight peaks
  airport: [
    0.55, 0.45, 0.40, 0.40, 0.50, 0.70, // 12am-5am: Red-eye flights
    0.90, 1.00, 0.95, 0.85, 0.80, 0.82, // 6am-11am: Morning rush
    0.85, 0.82, 0.80, 0.85, 0.90, 0.95, // 12pm-5pm: Afternoon
    1.00, 0.95, 0.85, 0.75, 0.65, 0.60, // 6pm-11pm: Evening rush
  ],
  
  // Default: Generic commercial pattern
  default: [
    0.30, 0.28, 0.25, 0.25, 0.25, 0.30, // 12am-5am
    0.45, 0.65, 0.80, 0.90, 0.95, 1.00, // 6am-11am
    0.95, 0.90, 0.92, 0.88, 0.80, 0.65, // 12pm-5pm
    0.50, 0.40, 0.35, 0.32, 0.30, 0.30, // 6pm-11pm
  ],
};

// Hour labels for display
const HOUR_LABELS: string[] = [
  '12am', '1am', '2am', '3am', '4am', '5am',
  '6am', '7am', '8am', '9am', '10am', '11am',
  '12pm', '1pm', '2pm', '3pm', '4pm', '5pm',
  '6pm', '7pm', '8pm', '9pm', '10pm', '11pm',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize industry string for lookups
 */
function normalizeIndustry(industry?: string): string {
  if (!industry) return 'default';
  return industry.toLowerCase().replace(/[_\s]/g, '-');
}

/**
 * Get load profile for industry
 */
function getLoadProfile(industry?: string): number[] {
  const normalized = normalizeIndustry(industry);
  return LOAD_PROFILES[normalized] ?? LOAD_PROFILES.default;
}

// ============================================================================
// MAIN LOAD CURVE BUILDER
// ============================================================================

/**
 * Build a 24-hour load curve showing baseline and BESS-optimized demand
 * 
 * The withBess curve shows how BESS peak shaving reduces peak demand
 * by discharging during high-demand hours and (optionally) charging
 * during low-demand hours.
 */
export function buildLoadCurve(inputs: LoadCurveInputs): LoadCurve {
  const {
    industry,
    peakDemandKW,
    avgDemandKW,
    bessCapacityKWh = 0,
    bessDischargeKW = 0,
    targetCapKW,
    hvacMultiplier = 1.0,
  } = inputs;
  
  // Get normalized profile (0-1 scale)
  const profile = getLoadProfile(industry);
  
  // Calculate baseline curve
  const effectivePeak = peakDemandKW * hvacMultiplier;
  
  const baseline: LoadCurvePoint[] = profile.map((factor, hour) => ({
    hour,
    demandKW: Math.round(effectivePeak * factor),
    label: HOUR_LABELS[hour],
  }));
  
  // Find peak info
  const peakKW = Math.max(...baseline.map(p => p.demandKW));
  const peakHour = baseline.findIndex(p => p.demandKW === peakKW);
  const energyKWhDay = baseline.reduce((sum, p) => sum + p.demandKW, 0);
  
  // Calculate BESS-optimized curve
  const cap = targetCapKW ?? peakKW * 0.85;
  let bessEnergy = bessCapacityKWh;
  
  const withBess: LoadCurvePoint[] = baseline.map((point, hour) => {
    let adjustedDemand = point.demandKW;
    
    // Peak shaving: discharge when above cap
    if (point.demandKW > cap && bessEnergy > 0 && bessDischargeKW > 0) {
      const excess = point.demandKW - cap;
      const discharge = Math.min(excess, bessDischargeKW, bessEnergy);
      adjustedDemand = point.demandKW - discharge;
      bessEnergy -= discharge;
    }
    
    return {
      hour,
      demandKW: Math.round(adjustedDemand),
      label: HOUR_LABELS[hour],
    };
  });
  
  const peakKWAfter = Math.max(...withBess.map(p => p.demandKW));
  const peakReduction = peakKW - peakKWAfter;
  
  return {
    baseline,
    withBess,
    peakKW,
    peakKWAfter,
    peakReduction,
    peakHour,
    energyKWhDay,
  };
}

/**
 * Get available industry profiles
 */
export function getAvailableIndustries(): string[] {
  return Object.keys(LOAD_PROFILES).filter(k => k !== 'default');
}

/**
 * Check if industry has custom profile
 */
export function hasCustomProfile(industry?: string): boolean {
  const normalized = normalizeIndustry(industry);
  return normalized !== 'default' && normalized in LOAD_PROFILES;
}

/**
 * Get profile description for industry
 */
export function getProfileDescription(industry?: string): string {
  const normalized = normalizeIndustry(industry);
  
  const descriptions: Record<string, string> = {
    hotel: 'Morning + evening peaks (breakfast/dinner)',
    office: 'Classic 9-5 daytime pattern',
    'data-center': 'Very flat, near-constant demand',
    'ev-charging': 'Spiky with evening commuter peak',
    'car-wash': 'Afternoon peak during business hours',
    hospital: 'Fairly flat with morning medical procedures',
    retail: 'Late morning to evening shopping hours',
    manufacturing: 'Shift-based with day shift dominance',
    warehouse: 'Daytime operations pattern',
    casino: 'Evening and night entertainment peak',
    airport: 'Complex with AM/PM flight rush',
    default: 'Generic commercial pattern',
  };
  
  return descriptions[normalized] ?? descriptions.default;
}
