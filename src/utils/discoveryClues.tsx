/**
 * DISCOVERY CLUES SYSTEM
 * =======================
 *
 * Generates contextual suggestions and tips based on wizard state.
 * Moved from MerlinBar to be shared between components.
 *
 * Created: Jan 15, 2026
 */

import React from "react";
import {
  DollarSign,
  Sun,
  Battery,
  Zap,
  TrendingUp,
  Gift,
  AlertTriangle,
  Target,
} from "lucide-react";

export interface DiscoveryClue {
  id: string;
  icon: React.ReactNode;
  title: string;
  secret: string;
  unlocked: boolean;
  unlockedBy: string;
  category: "savings" | "opportunity" | "warning" | "bonus";
  impactValue?: string;
}

interface WizardStateForClues {
  state?: string;
  electricityRate?: number;
  sunHours?: number;
  goals?: string[];
  industry?: string;
  hasSolar?: boolean;
  hasGenerator?: boolean;
  hasEv?: boolean;
  solarKw?: number;
  bessKwh?: number;
  currentStep: number;
}

export function generateDiscoveryClues(props: WizardStateForClues): DiscoveryClue[] {
  const clues: DiscoveryClue[] = [];
  const {
    state,
    electricityRate,
    sunHours,
    goals = [],
    industry,
    hasSolar,
    hasGenerator,
    hasEv,
    solarKw,
    bessKwh,
    currentStep,
  } = props;

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATION-BASED CLUES
  // ═══════════════════════════════════════════════════════════════════════════

  // High electricity rate
  clues.push({
    id: "high-rate-bonus",
    icon: <DollarSign className="w-4 h-4" />,
    title: "Rate Arbitrage Opportunity",
    secret:
      electricityRate && electricityRate >= 0.15
        ? `Your $${electricityRate.toFixed(2)}/kWh rate means BESS pays back 2x faster than average!`
        : "Unlock: Location with rates above $0.15/kWh reveals arbitrage bonus",
    unlocked: !!(electricityRate && electricityRate >= 0.15),
    unlockedBy: "High electricity rate detected",
    category: "savings",
    impactValue: electricityRate && electricityRate >= 0.15 ? "+40% ROI boost" : undefined,
  });

  // Solar goldmine states
  const solarGoldmineStates = ["CA", "AZ", "NV", "TX", "FL", "NM", "CO", "UT"];
  clues.push({
    id: "solar-goldmine",
    icon: <Sun className="w-4 h-4" />,
    title: "Solar Goldmine Zone",
    secret:
      state && solarGoldmineStates.includes(state)
        ? `${state} is in the top 10% for solar production! Your panels will generate 20-30% more than northern states.`
        : "Unlock: Select a location in the Solar Belt (CA, AZ, NV, TX, FL...)",
    unlocked: !!(state && solarGoldmineStates.includes(state)),
    unlockedBy: "Solar Belt state selected",
    category: "opportunity",
    impactValue: state && solarGoldmineStates.includes(state) ? "+25% solar output" : undefined,
  });

  // Peak sun hours
  clues.push({
    id: "peak-sun-bonus",
    icon: <Sun className="w-4 h-4" />,
    title: "Exceptional Solar Resource",
    secret:
      sunHours && sunHours >= 6.0
        ? `${sunHours} hrs/day is outstanding! You'll hit ROI 2-3 years faster than typical projects.`
        : "Unlock: Location with 6+ peak sun hours/day",
    unlocked: !!(sunHours && sunHours >= 6.0),
    unlockedBy: "High solar irradiance detected",
    category: "bonus",
    impactValue: sunHours && sunHours >= 6.0 ? "2-3 years faster payback" : undefined,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GOAL-BASED CLUES
  // ═══════════════════════════════════════════════════════════════════════════

  // Multiple goals = better optimization
  clues.push({
    id: "multi-goal-bonus",
    icon: <Target className="w-4 h-4" />,
    title: "Multi-Objective Optimization",
    secret:
      goals.length >= 3
        ? `With ${goals.length} goals, I can optimize your system for maximum value across all objectives!`
        : "Unlock: Select 3+ energy goals for comprehensive optimization",
    unlocked: goals.length >= 3,
    unlockedBy: "Multiple goals selected",
    category: "bonus",
    impactValue: goals.length >= 3 ? "+15% total value" : undefined,
  });

  // Backup power goal
  clues.push({
    id: "resilience-premium",
    icon: <Battery className="w-4 h-4" />,
    title: "Resilience Premium Value",
    secret: goals.includes("backup_power")
      ? "Business continuity during outages adds 20-40% to your system ROI beyond just savings!"
      : 'Unlock: Select "Backup Power" as a goal',
    unlocked: goals.includes("backup_power"),
    unlockedBy: "Backup power goal selected",
    category: "bonus",
    impactValue: goals.includes("backup_power") ? "+30% ROI boost" : undefined,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION-BASED CLUES
  // ═══════════════════════════════════════════════════════════════════════════

  // Solar + BESS combo
  clues.push({
    id: "solar-bess-synergy",
    icon: <Zap className="w-4 h-4" />,
    title: "Solar + Storage Synergy",
    secret:
      hasSolar && bessKwh && bessKwh > 0
        ? "Solar + BESS unlocks 40% more value than either alone: arbitrage, self-consumption, AND demand charge reduction!"
        : "Unlock: Configure both solar and battery storage",
    unlocked: !!(hasSolar && bessKwh && bessKwh > 0),
    unlockedBy: "Solar + BESS configured",
    category: "opportunity",
    impactValue: hasSolar && bessKwh && bessKwh > 0 ? "+40% combined value" : undefined,
  });

  // Right-sized solar
  clues.push({
    id: "optimal-solar-sizing",
    icon: <Sun className="w-4 h-4" />,
    title: "Optimal Solar Sizing",
    secret:
      solarKw && solarKw >= 100 && solarKw <= 500
        ? "Your solar size hits the sweet spot: enough to offset energy, not so big that you waste generation!"
        : "Unlock: Configure solar between 100-500 kW",
    unlocked: !!(solarKw && solarKw >= 100 && solarKw <= 500),
    unlockedBy: "Optimal solar capacity selected",
    category: "savings",
    impactValue: solarKw && solarKw >= 100 && solarKw <= 500 ? "Maximized utilization" : undefined,
  });

  // EV charging revenue
  clues.push({
    id: "ev-revenue-stream",
    icon: <DollarSign className="w-4 h-4" />,
    title: "EV Charging Revenue Stream",
    secret: hasEv
      ? "EV chargers can generate $500-2,000/month per unit while providing employee/customer amenity value!"
      : "Unlock: Add EV charging to your configuration",
    unlocked: !!hasEv,
    unlockedBy: "EV charging configured",
    category: "opportunity",
    impactValue: hasEv ? "$6K-24K/year per charger" : undefined,
  });

  // Generator backup
  clues.push({
    id: "generator-hybrid",
    icon: <Battery className="w-4 h-4" />,
    title: "Hybrid Backup Strategy",
    secret: hasGenerator
      ? "Generator + BESS hybrid provides seamless switchover AND 60% lower fuel costs during outages!"
      : "Unlock: Add backup generator to your system",
    unlocked: !!hasGenerator,
    unlockedBy: "Generator configured",
    category: "opportunity",
    impactValue: hasGenerator ? "-60% fuel costs" : undefined,
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // INDUSTRY-SPECIFIC TIPS (Phase 3)
  // ═════════════════════════════════════════════════════════════════════════════

  // Hotels - pool heating opportunity
  if (industry === "hotel") {
    clues.push({
      id: "hotel-pool-heating",
      icon: <Sun className="w-4 h-4" />,
      title: "Pool Heating Goldmine",
      secret:
        "Hotels with pools can slash heating costs 70-90% with solar thermal + heat pumps powered by BESS!",
      unlocked: true,
      unlockedBy: "Hotel industry selected",
      category: "savings",
      impactValue: "-80% pool heating costs",
    });
  }

  // Data centers - cooling optimization
  if (industry === "data-center") {
    clues.push({
      id: "datacenter-cooling",
      icon: <Zap className="w-4 h-4" />,
      title: "Cooling Cost Crusher",
      secret:
        "Data centers spend 40% of energy on cooling. BESS enables off-peak cooling and thermal storage for 50% savings!",
      unlocked: true,
      unlockedBy: "Data center industry selected",
      category: "savings",
      impactValue: "-50% cooling costs",
    });
  }

  // Manufacturing - demand response revenue
  if (industry === "manufacturing") {
    clues.push({
      id: "manufacturing-demand-response",
      icon: <DollarSign className="w-4 h-4" />,
      title: "Demand Response Jackpot",
      secret:
        "Manufacturers can earn $50-150/kW/year from demand response programs while cutting peak charges!",
      unlocked: true,
      unlockedBy: "Manufacturing industry selected",
      category: "opportunity",
      impactValue: "$50-150/kW/year DR revenue",
    });
  }

  // Hospitals - critical uptime premium
  if (industry === "hospital") {
    clues.push({
      id: "hospital-uptime-premium",
      icon: <Battery className="w-4 h-4" />,
      title: "Mission-Critical Uptime",
      secret:
        "Hospital downtime costs $100K-1M per hour. BESS + generator hybrid ensures zero interruption to critical systems!",
      unlocked: true,
      unlockedBy: "Hospital industry selected",
      category: "bonus",
      impactValue: "99.999% uptime guarantee",
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // WARNINGS & OPTIMIZATION (Phase 3)
  // ═════════════════════════════════════════════════════════════════════════════

  // Oversized solar warning
  if (solarKw && solarKw > 1000) {
    clues.push({
      id: "oversized-solar-warning",
      icon: <AlertTriangle className="w-4 h-4" />,
      title: "Solar Oversize Alert",
      secret: `${solarKw} kW may be too large for your facility. Excess generation means lost value. Consider right-sizing or adding more BESS.`,
      unlocked: true,
      unlockedBy: "Large solar system configured",
      category: "warning",
    });
  }

  // Undersized BESS warning
  if (solarKw && bessKwh && bessKwh / solarKw < 2) {
    clues.push({
      id: "undersized-bess-warning",
      icon: <AlertTriangle className="w-4 h-4" />,
      title: "Battery Capacity Low",
      secret: `Your BESS is undersized for your solar. Add ${Math.round(solarKw * 3 - bessKwh)} kWh to maximize solar utilization!`,
      unlocked: true,
      unlockedBy: "Solar + small BESS configured",
      category: "warning",
    });
  }

  // No solar in high sun area
  if (sunHours && sunHours >= 5.5 && !hasSolar) {
    clues.push({
      id: "missing-solar-opportunity",
      icon: <Sun className="w-4 h-4" />,
      title: "Missing Solar Opportunity",
      secret: `You're in an excellent solar area (${sunHours} hrs/day) but haven't added solar. You're leaving 30-50% of potential savings on the table!`,
      unlocked: true,
      unlockedBy: "Good solar resource without solar",
      category: "warning",
      impactValue: "+40% more savings with solar",
    });
  }

  // BESS only (no solar) in solar state
  if (!hasSolar && bessKwh && bessKwh > 0 && state && solarGoldmineStates.includes(state)) {
    clues.push({
      id: "bess-only-inefficient",
      icon: <Gift className="w-4 h-4" />,
      title: "Pairing Solar = 2x Value",
      secret:
        "BESS-only in a solar state means buying all your stored energy from the grid. Add solar to generate free energy to store!",
      unlocked: true,
      unlockedBy: "BESS without solar in solar state",
      category: "opportunity",
      impactValue: "2x total system value",
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP-SPECIFIC TIPS
  // ═══════════════════════════════════════════════════════════════════════════

  // Step 1 tips
  if (currentStep === 1) {
    clues.push({
      id: "step1-location-matters",
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Location Determines Everything",
      secret:
        "Your address reveals: utility rates, solar potential, incentives, and weather risks - all critical to ROI!",
      unlocked: true,
      unlockedBy: "Step 1 guidance",
      category: "opportunity",
    });
  }

  // Step 2 tips
  if (currentStep === 2) {
    clues.push({
      id: "step2-industry-benchmarks",
      icon: <Target className="w-4 h-4" />,
      title: "Industry Benchmarks Matter",
      secret:
        "Different industries have unique load profiles - hotels need 24/7 power, offices peak 9-5, retail surges on weekends.",
      unlocked: true,
      unlockedBy: "Step 2 guidance",
      category: "opportunity",
    });
  }

  return clues;
}
