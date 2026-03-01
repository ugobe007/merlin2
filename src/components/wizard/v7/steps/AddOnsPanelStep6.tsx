/**
 * AddOnsPanelStep6
 * ================
 * Industry-specific Solar PV and EV Charging add-on packages.
 * Shown in Step 6 after the base BESS quote.
 *
 * Each add-on shows 3 pre-configured packages tuned to the user's industry.
 * Selecting a package triggers recalculateWithAddOns() — the quote updates live.
 * Preserves existing generator configuration on every recalculate call.
 *
 * Solar packages: sized by industry (e.g. car wash 20–40 kW, hotel 150–300 kW,
 *                 data center 500 kW–10 MW).
 * EV packages:    sized by use case (destination L2, fleet DCFC, transit hub).
 */

import React, { useState, useMemo } from "react";
import { Sun, Zap, ChevronDown, Check, X } from "lucide-react";
import type { SystemAddOns } from "@/wizard/v7/hooks/useWizardV7";
import { TrueQuoteTemp } from "@/wizard/v7/trueQuoteTemp";
import { calculateEvPreview } from "@/services/step4PreviewService";

// ─────────────────────────────────────────────────────────────────────────────
// Internal types
// ─────────────────────────────────────────────────────────────────────────────

interface SolarPkg {
  name: string;
  kW: number;
  tag?: string;
}

interface EVPkg {
  name: string;
  l2: number;
  dcfc: number;
  tag?: string;
}

interface IndustrySolarCfg {
  headline: string;
  context: string;
  pkgs: [SolarPkg, SolarPkg, SolarPkg];
}

interface IndustryEVCfg {
  headline: string;
  context: string;
  pkgs: [EVPkg, EVPkg, EVPkg];
}

// ─────────────────────────────────────────────────────────────────────────────
// Solar packages — keyed by industry slug
// ─────────────────────────────────────────────────────────────────────────────

const SOLAR_CONFIGS: Record<string, IndustrySolarCfg> = {
  car_wash: {
    headline: "Rooftop & Canopy Solar",
    context:
      "Covers your bay and equipment loads. Canopy installations are both functional and a strong customer-facing differentiator.",
    pkgs: [
      { name: "Starter", kW: 20 },
      { name: "Standard", kW: 30, tag: "Most Popular" },
      { name: "Full Cover", kW: 40 },
    ],
  },
  gas_station: {
    headline: "Fueling Canopy Solar",
    context:
      "Convert your fueling canopy to a solar canopy — a visual differentiator that generates revenue from the same structure.",
    pkgs: [
      { name: "Starter", kW: 15 },
      { name: "Standard", kW: 25, tag: "Recommended" },
      { name: "Full Canopy", kW: 35 },
    ],
  },
  restaurant: {
    headline: "Rooftop Solar",
    context:
      "Offset kitchen and HVAC loads during peak operating hours. Strong ROI given daytime operation overlap with solar peak.",
    pkgs: [
      { name: "Starter", kW: 20 },
      { name: "Standard", kW: 40, tag: "Best ROI" },
      { name: "Maximum", kW: 60 },
    ],
  },
  retail: {
    headline: "Commercial Rooftop",
    context:
      "Lighting and HVAC are your largest operating cost drivers. Solar offsets both during business hours.",
    pkgs: [
      { name: "Starter", kW: 50 },
      { name: "Standard", kW: 100, tag: "Best ROI" },
      { name: "Maximum", kW: 200 },
    ],
  },
  office: {
    headline: "Commercial Rooftop",
    context:
      "Flat roofs offer clean installation. Strong HVAC and lighting offset potential during business hours.",
    pkgs: [
      { name: "Starter", kW: 50 },
      { name: "Standard", kW: 100, tag: "Best ROI" },
      { name: "Maximum", kW: 200 },
    ],
  },
  hotel: {
    headline: "Rooftop Solar",
    context:
      "Primary building roof installation. Façade and aesthetic impact should be reviewed with your architect before expansion beyond the roofline.",
    pkgs: [
      { name: "Standard", kW: 150 },
      { name: "Enhanced", kW: 250, tag: "Most Popular" },
      { name: "Full Roof", kW: 300 },
    ],
  },
  hospital: {
    headline: "Medical Campus Solar",
    context:
      "Large roof areas and 24/7 critical operations make hospitals strong solar candidates. Can offset 10–15% of total facility load.",
    pkgs: [
      { name: "Standard", kW: 200 },
      { name: "Enhanced", kW: 500, tag: "Recommended" },
      { name: "Maximum", kW: 1000 },
    ],
  },
  data_center: {
    headline: "Utility-Scale Solar",
    context:
      "Ground-mount arrays preferred at this scale. Utility interconnection may be required above 1 MW. Combines well with BESS for demand charge reduction.",
    pkgs: [
      { name: "Commercial", kW: 500 },
      { name: "Large Scale", kW: 2000, tag: "Best Value" },
      { name: "Utility Scale", kW: 10000 },
    ],
  },
  manufacturing: {
    headline: "Industrial Rooftop",
    context:
      "Large flat roofs and stable daytime operations make manufacturing one of the highest-ROI solar segments available.",
    pkgs: [
      { name: "Standard", kW: 200 },
      { name: "Enhanced", kW: 500, tag: "Recommended" },
      { name: "Maximum", kW: 1000 },
    ],
  },
  warehouse: {
    headline: "Warehouse Rooftop",
    context:
      "Large, flat, south-facing rooftops offer some of the best solar economics available — low structural complexity and high yield.",
    pkgs: [
      { name: "Standard", kW: 150 },
      { name: "Enhanced", kW: 350, tag: "Best ROI" },
      { name: "Full Roof", kW: 600 },
    ],
  },
  airport: {
    headline: "Airport Solar",
    context:
      "Terminal roofs, parking structures, and open land can support large installations. Ground-mount preferred for utility-scale arrays.",
    pkgs: [
      { name: "Terminal", kW: 500 },
      { name: "Campus Scale", kW: 2000, tag: "Recommended" },
      { name: "Full Site", kW: 5000 },
    ],
  },
  shopping_center: {
    headline: "Rooftop & Canopy Solar",
    context:
      "Anchor tenant roofs and parking canopies. Canopy solar provides both generation and a shopper shade amenity.",
    pkgs: [
      { name: "Standard", kW: 200 },
      { name: "Enhanced", kW: 400, tag: "Best ROI" },
      { name: "Full Campus", kW: 600 },
    ],
  },
  ev_charging: {
    headline: "Solar Canopy",
    context:
      "Solar-over-charging combines aesthetics with station economics — generate as you charge, reduce grid draw and operating cost.",
    pkgs: [
      { name: "Partial Cover", kW: 100 },
      { name: "Full Canopy", kW: 250, tag: "Most Popular" },
      { name: "Expanded", kW: 500 },
    ],
  },
  apartment: {
    headline: "Rooftop Solar",
    context:
      "Offset common-area loads and add a resident EV charging benefit. A proven property value driver in urban markets.",
    pkgs: [
      { name: "Starter", kW: 50 },
      { name: "Standard", kW: 100, tag: "Best Value" },
      { name: "Maximum", kW: 200 },
    ],
  },
  college: {
    headline: "Campus Solar",
    context:
      "Multi-building campuses have exceptional solar economics — multiple rooftops plus institutional sustainability commitments.",
    pkgs: [
      { name: "Phase 1", kW: 200 },
      { name: "Phase 2", kW: 500, tag: "Recommended" },
      { name: "Full Campus", kW: 1000 },
    ],
  },
  casino: {
    headline: "Commercial Solar",
    context:
      "24/7 operations and large flat rooftops make casinos strong solar candidates with predictable ROI.",
    pkgs: [
      { name: "Standard", kW: 200 },
      { name: "Enhanced", kW: 400, tag: "Best ROI" },
      { name: "Full Scale", kW: 600 },
    ],
  },
  agricultural: {
    headline: "Agrivoltaic Solar",
    context:
      "Ground-mount arrays can be combined with crop production. Rural solar economics are among the strongest in the US.",
    pkgs: [
      { name: "Standard", kW: 100 },
      { name: "Enhanced", kW: 300, tag: "Recommended" },
      { name: "Maximum", kW: 600 },
    ],
  },
  cold_storage: {
    headline: "Industrial Solar",
    context:
      "Offset refrigeration loads — your highest operating cost. ROI is typically under 5 years with the BESS pairing.",
    pkgs: [
      { name: "Standard", kW: 100 },
      { name: "Enhanced", kW: 250, tag: "Best ROI" },
      { name: "Maximum", kW: 400 },
    ],
  },
  microgrid: {
    headline: "Utility-Scale Solar",
    context:
      "Solar is foundational to microgrid economics — zero marginal fuel cost generation with direct BESS integration.",
    pkgs: [
      { name: "Standard", kW: 500 },
      { name: "Enhanced", kW: 1000, tag: "Recommended" },
      { name: "Maximum", kW: 2000 },
    ],
  },
  government: {
    headline: "Government Solar",
    context:
      "IRA 2022 direct-pay provisions make government projects highly bankable. Strong eligibility for energy community bonuses.",
    pkgs: [
      { name: "Standard", kW: 200 },
      { name: "Enhanced", kW: 500, tag: "Recommended" },
      { name: "Maximum", kW: 1000 },
    ],
  },
  residential: {
    headline: "Home Solar",
    context:
      "Complete your home energy system. Solar + BESS = near grid independence and protection from utility rate increases.",
    pkgs: [
      { name: "Starter", kW: 8 },
      { name: "Standard", kW: 12, tag: "Most Popular" },
      { name: "Maximum", kW: 18 },
    ],
  },
};

const SOLAR_DEFAULT: IndustrySolarCfg = {
  headline: "Commercial Solar",
  context: "Pair solar with your BESS to maximize savings and reduce grid dependency year-round.",
  pkgs: [
    { name: "Starter", kW: 50 },
    { name: "Standard", kW: 100, tag: "Recommended" },
    { name: "Maximum", kW: 200 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EV packages — keyed by industry slug
// ─────────────────────────────────────────────────────────────────────────────

const EV_CONFIGS: Record<string, IndustryEVCfg> = {
  car_wash: {
    headline: "Convenience Charging",
    context:
      "Customers wait 15–30 minutes — ideal for L2 top-off. A strong amenity differentiator with minimal infrastructure cost.",
    pkgs: [
      { name: "Starter", l2: 2, dcfc: 0 },
      { name: "Standard", l2: 2, dcfc: 1, tag: "Recommended" },
      { name: "Full Service", l2: 4, dcfc: 1 },
    ],
  },
  gas_station: {
    headline: "Fueling + Charging Hub",
    context:
      "The future of fuel stops. DCFC alongside legacy pumps creates dual revenue streams and future-proofs your real estate.",
    pkgs: [
      { name: "Starter", l2: 2, dcfc: 2 },
      { name: "Standard", l2: 4, dcfc: 4, tag: "Most Popular" },
      { name: "Full Hub", l2: 4, dcfc: 8 },
    ],
  },
  restaurant: {
    headline: "Dining Convenience",
    context:
      "45–90 minute dining visits pair perfectly with L2 top-off. Attracts a high-value EV owner segment with above-average spend.",
    pkgs: [
      { name: "Starter", l2: 2, dcfc: 0 },
      { name: "Standard", l2: 4, dcfc: 1, tag: "Recommended" },
      { name: "Maximum", l2: 4, dcfc: 2 },
    ],
  },
  retail: {
    headline: "Shopper Charging",
    context:
      "EV drivers shop longer and spend more. 60–90 minute visits are ideal for L2 charging and extend time-on-property.",
    pkgs: [
      { name: "Starter", l2: 4, dcfc: 0 },
      { name: "Standard", l2: 4, dcfc: 2, tag: "Best ROI" },
      { name: "Full Hub", l2: 8, dcfc: 4 },
    ],
  },
  office: {
    headline: "Workplace Charging",
    context:
      "A top-requested employee benefit. An 8-hour workday fully charges most EVs on L2. Increasingly required for lease competitiveness.",
    pkgs: [
      { name: "Starter", l2: 6, dcfc: 0 },
      { name: "Standard", l2: 8, dcfc: 2, tag: "Most Popular" },
      { name: "Full Fleet", l2: 12, dcfc: 4 },
    ],
  },
  hotel: {
    headline: "Guest Destination Charging",
    context:
      "EV guests are high-value travelers. An overnight stay equals a full L2 charge. Now the industry standard for AAA 3-star+ properties.",
    pkgs: [
      { name: "Starter", l2: 4, dcfc: 0 },
      { name: "Standard", l2: 4, dcfc: 2, tag: "Industry Standard" },
      { name: "Premium", l2: 8, dcfc: 2 },
    ],
  },
  hospital: {
    headline: "Staff & Visitor Charging",
    context:
      "Long shifts equal full L2 charges. Critical for attracting nursing staff in competitive labor markets.",
    pkgs: [
      { name: "Starter", l2: 4, dcfc: 0 },
      { name: "Standard", l2: 4, dcfc: 2, tag: "Recommended" },
      { name: "Full Access", l2: 8, dcfc: 2 },
    ],
  },
  data_center: {
    headline: "Staff & Fleet Charging",
    context:
      "Support staff commuting and service vehicle fleet electrification. Reduces fleet fuel cost and supports sustainability reporting.",
    pkgs: [
      { name: "Starter", l2: 4, dcfc: 0 },
      { name: "Standard", l2: 8, dcfc: 2, tag: "Recommended" },
      { name: "Fleet Ready", l2: 12, dcfc: 4 },
    ],
  },
  manufacturing: {
    headline: "Fleet Fast Charging",
    context:
      "Electrify your forklift and service vehicle fleet. DCFC minimizes vehicle downtime — a critical metric in manufacturing environments.",
    pkgs: [
      { name: "Starter", l2: 0, dcfc: 2 },
      { name: "Standard", l2: 0, dcfc: 4, tag: "Recommended" },
      { name: "Full Fleet", l2: 0, dcfc: 8 },
    ],
  },
  warehouse: {
    headline: "Delivery Fleet Charging",
    context:
      "DCFC enables full last-mile delivery vehicle turnaround in under 90 minutes — keeping your fleet operational around the clock.",
    pkgs: [
      { name: "Starter", l2: 0, dcfc: 2 },
      { name: "Standard", l2: 0, dcfc: 4, tag: "Best ROI" },
      { name: "Full Fleet", l2: 0, dcfc: 8 },
    ],
  },
  airport: {
    headline: "Transit Charging Hub",
    context:
      "Ground transportation, rental car fleets, and traveler charging combined into a single infrastructure investment.",
    pkgs: [
      { name: "Phase 1", l2: 8, dcfc: 4 },
      { name: "Phase 2", l2: 16, dcfc: 8, tag: "Recommended" },
      { name: "Full Hub", l2: 24, dcfc: 12 },
    ],
  },
  shopping_center: {
    headline: "Destination Charging",
    context:
      "EV charging is increasingly a tenant requirement and drives 2+ hours of dwell time, increasing per-visit spend.",
    pkgs: [
      { name: "Starter", l2: 8, dcfc: 2 },
      { name: "Standard", l2: 12, dcfc: 4, tag: "Recommended" },
      { name: "Full Hub", l2: 16, dcfc: 8 },
    ],
  },
  ev_charging: {
    headline: "Expand Your Hub",
    context:
      "Add capacity or a fast-charge tier to serve more customers per day and increase revenue per square foot.",
    pkgs: [
      { name: "Tier 1", l2: 4, dcfc: 2 },
      { name: "Tier 2", l2: 8, dcfc: 4, tag: "Recommended" },
      { name: "Tier 3", l2: 12, dcfc: 8 },
    ],
  },
  apartment: {
    headline: "Resident Charging",
    context:
      "EV charging is becoming a lease standard. Overnight L2 is the most requested amenity from prospective residents.",
    pkgs: [
      { name: "Starter", l2: 4, dcfc: 0 },
      { name: "Standard", l2: 8, dcfc: 1, tag: "Most Popular" },
      { name: "Full Coverage", l2: 12, dcfc: 2 },
    ],
  },
  college: {
    headline: "Campus Charging",
    context:
      "Students and staff expect charging access. L2 distributed across surface lots is cost-effective at campus scale.",
    pkgs: [
      { name: "Phase 1", l2: 8, dcfc: 2 },
      { name: "Phase 2", l2: 16, dcfc: 4, tag: "Recommended" },
      { name: "Full Campus", l2: 24, dcfc: 8 },
    ],
  },
  casino: {
    headline: "Valet & Guest Charging",
    context:
      "A premium amenity for high-value guests. DCFC at valet drop reinforces luxury positioning and attracts repeat visits.",
    pkgs: [
      { name: "Standard", l2: 8, dcfc: 2 },
      { name: "Enhanced", l2: 12, dcfc: 4, tag: "Recommended" },
      { name: "Premium", l2: 16, dcfc: 6 },
    ],
  },
  agricultural: {
    headline: "Farm Fleet Charging",
    context:
      "Electrify light equipment, utility vehicles, and worker transport. Strong pairing with your on-site solar generation.",
    pkgs: [
      { name: "Starter", l2: 2, dcfc: 0 },
      { name: "Standard", l2: 4, dcfc: 1, tag: "Recommended" },
      { name: "Full Fleet", l2: 4, dcfc: 2 },
    ],
  },
  cold_storage: {
    headline: "Dock & Fleet Charging",
    context:
      "Electric refrigerated trucks significantly reduce fuel and maintenance costs. DCFC at loading docks minimizes turnaround time.",
    pkgs: [
      { name: "Starter", l2: 0, dcfc: 2 },
      { name: "Standard", l2: 0, dcfc: 4, tag: "Recommended" },
      { name: "Full Dock", l2: 4, dcfc: 4 },
    ],
  },
  microgrid: {
    headline: "Community Charging",
    context:
      "Community microgrids anchor EV charging as a public-facing revenue service. Pairs with on-site solar and BESS.",
    pkgs: [
      { name: "Standard", l2: 4, dcfc: 2 },
      { name: "Enhanced", l2: 8, dcfc: 4, tag: "Recommended" },
      { name: "Hub Scale", l2: 12, dcfc: 8 },
    ],
  },
  government: {
    headline: "Public & Fleet Charging",
    context:
      "Government fleet electrification and public access charging are fully IRA-eligible with direct-pay provisions.",
    pkgs: [
      { name: "Standard", l2: 4, dcfc: 1 },
      { name: "Enhanced", l2: 8, dcfc: 2, tag: "Recommended" },
      { name: "Full Fleet", l2: 12, dcfc: 4 },
    ],
  },
  residential: {
    headline: "Home EV Charging",
    context:
      "L2 home charging completes your solar + BESS home energy system. Overnight charging on clean energy.",
    pkgs: [
      { name: "Single Port", l2: 1, dcfc: 0 },
      { name: "Dual Port", l2: 2, dcfc: 0, tag: "Most Popular" },
      { name: "Fast Charge", l2: 2, dcfc: 1 },
    ],
  },
};

const EV_DEFAULT: IndustryEVCfg = {
  headline: "EV Charging",
  context:
    "Add EV charging to generate new revenue, reduce fleet fuel costs, and attract customers.",
  pkgs: [
    { name: "Starter", l2: 4, dcfc: 0 },
    { name: "Standard", l2: 4, dcfc: 2, tag: "Recommended" },
    { name: "Maximum", l2: 8, dcfc: 4 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Pricing helpers
// ─────────────────────────────────────────────────────────────────────────────

function solarCostPerWatt(kW: number): number {
  if (kW < 100) return 1.25; // small-scale
  if (kW < 5000) return 0.95; // commercial
  return 0.75; // utility-scale
}

interface SolarMetrics {
  installCost: number;
  netCost: number;
  annualSavings: number;
  paybackYrs: number;
}

function calcSolarMetrics(kW: number, electricityRate: number, peakSunHours: number): SolarMetrics {
  const installCost = kW * 1000 * solarCostPerWatt(kW);
  const netCost = installCost * 0.7; // 30% federal ITC
  const annualKWh = kW * peakSunHours * 365 * 0.8; // 80% efficiency factor
  const annualSavings = annualKWh * electricityRate;
  const paybackYrs = annualSavings > 0 ? netCost / annualSavings : 0;
  return { installCost, netCost, annualSavings, paybackYrs };
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function fmtKW(kW: number): string {
  if (kW >= 1000) {
    const mw = kW / 1000;
    return `${mw % 1 === 0 ? mw.toFixed(0) : mw.toFixed(1)} MW`;
  }
  return `${kW} kW`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  industry: string;
  currentSolarKW: number;
  currentEVKW: number;
  currentAddOns: SystemAddOns;
  recalculateWithAddOns?: (addOns: SystemAddOns) => Promise<{ ok: boolean; error?: string }>;
}

const AddOnsPanelStep6 = React.memo(function AddOnsPanelStep6({
  industry,
  currentSolarKW,
  currentEVKW,
  currentAddOns,
  recalculateWithAddOns,
}: Props) {
  const tqt = TrueQuoteTemp.get();
  const electricityRate = tqt.utilityRate > 0 ? tqt.utilityRate : 0.12;
  const peakSunHours = tqt.peakSunHours > 0 ? tqt.peakSunHours : 5;

  const solarCfg = SOLAR_CONFIGS[industry] ?? SOLAR_DEFAULT;
  const evCfg = EV_CONFIGS[industry] ?? EV_DEFAULT;

  const [activePanel, setActivePanel] = useState<"solar" | "ev" | null>(null);
  const [selSolar, setSelSolar] = useState(1); // default: middle (recommended)
  const [selEV, setSelEV] = useState(1);
  const [isAddingSolar, setIsAddingSolar] = useState(false);
  const [isAddingEV, setIsAddingEV] = useState(false);

  const solarAdded = currentSolarKW > 0;
  const evAdded = currentEVKW > 0;

  // Pre-compute solar metrics for all 3 tiers
  const solarMetrics = useMemo(
    () =>
      solarCfg.pkgs.map((p) => ({
        ...p,
        ...calcSolarMetrics(p.kW, electricityRate, peakSunHours),
      })),
    [solarCfg, electricityRate, peakSunHours]
  );

  // Pre-compute EV metrics for all 3 tiers
  const evMetrics = useMemo(
    () => evCfg.pkgs.map((p) => calculateEvPreview({ l2Count: p.l2, dcfcCount: p.dcfc }, p.name)),
    [evCfg]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  function togglePanel(p: "solar" | "ev") {
    setActivePanel((prev) => (prev === p ? null : p));
  }

  async function handleAddSolar() {
    if (!recalculateWithAddOns) return;
    const pkg = solarCfg.pkgs[selSolar];
    setIsAddingSolar(true);
    const cur = TrueQuoteTemp.get();
    TrueQuoteTemp.writeAddOns({
      includeSolar: true,
      solarKW: pkg.kW,
      includeGenerator: cur.includeGenerator,
      generatorKW: cur.generatorKW,
      generatorFuelType: cur.generatorFuelType,
      includeWind: cur.includeWind,
      windKW: cur.windKW,
      includeEV: cur.includeEV,
      evChargerKW: cur.evChargerKW,
      evInstallCost: cur.evInstallCost,
      evMonthlyRevenue: cur.evMonthlyRevenue,
    });
    const result = await recalculateWithAddOns({
      ...currentAddOns,
      includeSolar: true,
      solarKW: pkg.kW,
    });
    setIsAddingSolar(false);
    if (result.ok) {
      setActivePanel(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleRemoveSolar() {
    if (!recalculateWithAddOns) return;
    setIsAddingSolar(true);
    const cur = TrueQuoteTemp.get();
    TrueQuoteTemp.writeAddOns({
      includeSolar: false,
      solarKW: 0,
      includeGenerator: cur.includeGenerator,
      generatorKW: cur.generatorKW,
      generatorFuelType: cur.generatorFuelType,
      includeWind: cur.includeWind,
      windKW: cur.windKW,
      includeEV: cur.includeEV,
      evChargerKW: cur.evChargerKW,
      evInstallCost: cur.evInstallCost,
      evMonthlyRevenue: cur.evMonthlyRevenue,
    });
    await recalculateWithAddOns({ ...currentAddOns, includeSolar: false, solarKW: 0 });
    setIsAddingSolar(false);
  }

  async function handleAddEV() {
    if (!recalculateWithAddOns) return;
    const ev = evMetrics[selEV];
    setIsAddingEV(true);
    const cur = TrueQuoteTemp.get();
    TrueQuoteTemp.writeAddOns({
      includeSolar: cur.includeSolar,
      solarKW: cur.solarKW,
      includeGenerator: cur.includeGenerator,
      generatorKW: cur.generatorKW,
      generatorFuelType: cur.generatorFuelType,
      includeWind: cur.includeWind,
      windKW: cur.windKW,
      includeEV: true,
      evChargerKW: ev.totalPowerKw,
      evInstallCost: ev.installCost,
      evMonthlyRevenue: ev.monthlyRevenue,
    });
    const result = await recalculateWithAddOns({
      ...currentAddOns,
      includeEV: true,
      evChargerKW: ev.totalPowerKw,
    });
    setIsAddingEV(false);
    if (result.ok) {
      setActivePanel(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleRemoveEV() {
    if (!recalculateWithAddOns) return;
    setIsAddingEV(true);
    const cur = TrueQuoteTemp.get();
    TrueQuoteTemp.writeAddOns({
      includeSolar: cur.includeSolar,
      solarKW: cur.solarKW,
      includeGenerator: cur.includeGenerator,
      generatorKW: cur.generatorKW,
      generatorFuelType: cur.generatorFuelType,
      includeWind: cur.includeWind,
      windKW: cur.windKW,
      includeEV: false,
      evChargerKW: 0,
      evInstallCost: 0,
      evMonthlyRevenue: 0,
    });
    await recalculateWithAddOns({ ...currentAddOns, includeEV: false, evChargerKW: 0 });
    setIsAddingEV(false);
  }

  // ── Solar card ─────────────────────────────────────────────────────────────

  function renderSolarCard() {
    const isOpen = activePanel === "solar";
    const selectedPkg = solarMetrics[selSolar];

    return (
      <div
        style={{
          border: solarAdded
            ? "1.5px solid rgba(52,211,153,0.45)"
            : isOpen
              ? "1.5px solid rgba(251,191,36,0.45)"
              : "1.5px solid rgba(255,255,255,0.08)",
          background: solarAdded
            ? "rgba(52,211,153,0.03)"
            : isOpen
              ? "rgba(251,191,36,0.03)"
              : "rgba(255,255,255,0.02)",
          borderRadius: 12,
          transition: "border 0.2s, background 0.2s",
        }}
      >
        {/* ── Header row ── */}
        <div className="flex items-center gap-3 p-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "rgba(251,191,36,0.12)",
              border: "1px solid rgba(251,191,36,0.22)",
            }}
          >
            <Sun className="w-4 h-4 text-amber-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-100">{solarCfg.headline}</span>
              {solarAdded && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    color: "#34d399",
                    background: "rgba(52,211,153,0.10)",
                    border: "1px solid rgba(52,211,153,0.22)",
                  }}
                >
                  <Check className="w-2.5 h-2.5" />
                  {fmtKW(Math.round(currentSolarKW))} added
                </span>
              )}
            </div>
            {!solarAdded && (
              <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-1">
                {solarCfg.context}
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2 ml-2">
            {solarAdded ? (
              <>
                <button
                  type="button"
                  onClick={() => togglePanel("solar")}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-100 px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
                >
                  {isOpen ? "Close" : "Change"}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveSolar}
                  disabled={isAddingSolar}
                  className="text-[11px] font-semibold text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg border border-red-500/[0.15] bg-red-500/[0.05] hover:bg-red-500/[0.10] transition-colors disabled:opacity-40"
                >
                  {isAddingSolar ? "…" : "Remove"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => togglePanel("solar")}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 px-2.5 py-1.5 rounded-lg border border-amber-500/[0.22] bg-amber-500/[0.06] hover:bg-amber-500/[0.12] transition-colors"
              >
                <span>{isOpen ? "Close" : "Configure"}</span>
                <ChevronDown
                  className="w-3 h-3 transition-transform"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
            )}
          </div>
        </div>

        {/* ── Expanded body ── */}
        {isOpen && (
          <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-slate-400 mt-4 mb-5 leading-relaxed max-w-xl">
              {solarCfg.context}
            </p>

            {/* Package tier cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {solarMetrics.map((pkg, i) => {
                const isSel = selSolar === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelSolar(i)}
                    className="relative text-left rounded-xl p-3 transition-all"
                    style={{
                      border: isSel
                        ? "1.5px solid rgba(251,191,36,0.65)"
                        : "1.5px solid rgba(255,255,255,0.07)",
                      background: isSel ? "rgba(251,191,36,0.07)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                    }}
                  >
                    {pkg.tag && (
                      <div
                        className="absolute -top-2 left-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: "rgba(139,92,246,0.88)" }}
                      >
                        {pkg.tag}
                      </div>
                    )}
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      {pkg.name}
                    </div>
                    <div
                      className="text-lg font-bold leading-none mb-3"
                      style={{ color: isSel ? "#fbbf24" : "white" }}
                    >
                      {fmtKW(pkg.kW)}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          Net cost
                        </span>
                        <span className="text-[11px] font-bold text-white tabular-nums">
                          {fmtK(pkg.netCost)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          Annual savings
                        </span>
                        <span
                          className="text-[11px] font-semibold tabular-nums"
                          style={{ color: "#34d399" }}
                        >
                          {fmtK(pkg.annualSavings)}/yr
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          Payback
                        </span>
                        <span className="text-[11px] font-semibold text-slate-300 tabular-nums">
                          {pkg.paybackYrs > 0 ? `${pkg.paybackYrs.toFixed(1)} yr` : "—"}
                        </span>
                      </div>
                    </div>
                    {isSel && (
                      <div className="mt-2.5 flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full flex items-center justify-center"
                          style={{ border: "2px solid #fbbf24" }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        </div>
                        <span className="text-[10px] font-semibold text-amber-400">Selected</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CTA row */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddSolar}
                disabled={isAddingSolar || !recalculateWithAddOns}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(251,191,36,0.22), rgba(251,191,36,0.12))",
                  border: "1.5px solid rgba(251,191,36,0.55)",
                  color: "#fbbf24",
                }}
              >
                {isAddingSolar ? (
                  <>
                    <div
                      className="w-3 h-3 rounded-full border-2 animate-spin"
                      style={{ borderColor: "rgba(251,191,36,0.35)", borderTopColor: "#fbbf24" }}
                    />
                    Updating quote…
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5" />
                    Add {fmtKW(selectedPkg.kW)} Solar to Quote
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[10px] text-slate-600 mt-2.5 leading-relaxed">
              Net cost reflects 30% federal ITC. Annual savings based on {peakSunHours.toFixed(1)}{" "}
              peak sun hours/day at ${electricityRate.toFixed(3)}/kWh. Final costs depend on site
              conditions and equipment selection.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── EV card ────────────────────────────────────────────────────────────────

  function renderEVCard() {
    const isOpen = activePanel === "ev";
    const selectedEV = evMetrics[selEV];

    return (
      <div
        style={{
          border: evAdded
            ? "1.5px solid rgba(52,211,153,0.45)"
            : isOpen
              ? "1.5px solid rgba(6,182,212,0.45)"
              : "1.5px solid rgba(255,255,255,0.08)",
          background: evAdded
            ? "rgba(52,211,153,0.03)"
            : isOpen
              ? "rgba(6,182,212,0.03)"
              : "rgba(255,255,255,0.02)",
          borderRadius: 12,
          transition: "border 0.2s, background 0.2s",
        }}
      >
        {/* ── Header row ── */}
        <div className="flex items-center gap-3 p-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "rgba(6,182,212,0.12)",
              border: "1px solid rgba(6,182,212,0.22)",
            }}
          >
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-100">{evCfg.headline}</span>
              {evAdded && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    color: "#34d399",
                    background: "rgba(52,211,153,0.10)",
                    border: "1px solid rgba(52,211,153,0.22)",
                  }}
                >
                  <Check className="w-2.5 h-2.5" />
                  {Math.round(currentEVKW)} kW added
                </span>
              )}
            </div>
            {!evAdded && (
              <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-1">
                {evCfg.context}
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2 ml-2">
            {evAdded ? (
              <>
                <button
                  type="button"
                  onClick={() => togglePanel("ev")}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-100 px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
                >
                  {isOpen ? "Close" : "Change"}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveEV}
                  disabled={isAddingEV}
                  className="text-[11px] font-semibold text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg border border-red-500/[0.15] bg-red-500/[0.05] hover:bg-red-500/[0.10] transition-colors disabled:opacity-40"
                >
                  {isAddingEV ? "…" : "Remove"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => togglePanel("ev")}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg border border-cyan-500/[0.22] bg-cyan-500/[0.06] hover:bg-cyan-500/[0.12] transition-colors"
              >
                <span>{isOpen ? "Close" : "Configure"}</span>
                <ChevronDown
                  className="w-3 h-3 transition-transform"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
            )}
          </div>
        </div>

        {/* ── Expanded body ── */}
        {isOpen && (
          <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-slate-400 mt-4 mb-5 leading-relaxed max-w-xl">
              {evCfg.context}
            </p>

            {/* Package tier cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {evMetrics.map((ev, i) => {
                const isSel = selEV === i;
                const pkg = evCfg.pkgs[i];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelEV(i)}
                    className="relative text-left rounded-xl p-3 transition-all"
                    style={{
                      border: isSel
                        ? "1.5px solid rgba(6,182,212,0.65)"
                        : "1.5px solid rgba(255,255,255,0.07)",
                      background: isSel ? "rgba(6,182,212,0.07)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                    }}
                  >
                    {pkg.tag && (
                      <div
                        className="absolute -top-2 left-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: "rgba(6,182,212,0.88)" }}
                      >
                        {pkg.tag}
                      </div>
                    )}
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      {ev.name}
                    </div>
                    <div
                      className="text-sm font-bold leading-tight mb-3"
                      style={{ color: isSel ? "#22d3ee" : "white" }}
                    >
                      {ev.chargersLabel}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          Install cost
                        </span>
                        <span className="text-[11px] font-bold text-white tabular-nums">
                          {fmtK(ev.installCost)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          Monthly revenue
                        </span>
                        <span
                          className="text-[11px] font-semibold tabular-nums"
                          style={{ color: "#34d399" }}
                        >
                          {fmtK(ev.monthlyRevenue)}/mo
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          10yr revenue
                        </span>
                        <span className="text-[11px] font-semibold text-slate-300 tabular-nums">
                          {fmtK(ev.tenYearRevenue)}
                        </span>
                      </div>
                    </div>
                    {isSel && (
                      <div className="mt-2.5 flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full flex items-center justify-center"
                          style={{ border: "2px solid #22d3ee" }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        </div>
                        <span className="text-[10px] font-semibold text-cyan-400">Selected</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CTA row */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddEV}
                disabled={isAddingEV || !recalculateWithAddOns}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(6,182,212,0.22), rgba(6,182,212,0.12))",
                  border: "1.5px solid rgba(6,182,212,0.55)",
                  color: "#22d3ee",
                }}
              >
                {isAddingEV ? (
                  <>
                    <div
                      className="w-3 h-3 rounded-full border-2 animate-spin"
                      style={{ borderColor: "rgba(6,182,212,0.35)", borderTopColor: "#22d3ee" }}
                    />
                    Updating quote…
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Add {selectedEV.chargersLabel} to Quote
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[10px] text-slate-600 mt-2.5 leading-relaxed">
              Revenue estimates based on industry session averages. Actual revenue depends on
              utilization and pricing strategy. L2 = Level 2 (19.2 kW), DC Fast = 150 kW.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Two add-on panels stacked */}
      <div className="space-y-3">
        {renderSolarCard()}
        {renderEVCard()}
      </div>
    </div>
  );
});

export default AddOnsPanelStep6;
