/**
 * CAR WASH CAMPAIGN TEMPLATE - HOW TO USE
 * ========================================
 *
 * This generic template allows you to create branded landing pages
 * for different car wash chains by simply changing a configuration object.
 *
 * QUICK START FOR NEW CAR WASH:
 * =============================
 *
 * 1. Copy one of the example configs below
 * 2. Update company name, metrics, and locations
 * 3. Create a new route file (e.g., CleanWaveCarWashLanding.tsx)
 * 4. Import and use the config
 *
 * EXAMPLE: Creating a page for "Clean Wave Car Wash"
 * ===================================================
 */

import CarWashCampaign, { type CampaignConfig } from "./CarWashCampaign";

// Example 1: Single Location Car Wash
const CLEAN_WAVE_CONFIG: CampaignConfig = {
  companyName: "Clean Wave Car Wash",
  companyTagline: "Arizona's Premier Eco-Friendly Car Wash",
  industry: "car_wash",

  heroTitle: "Transform Clean Wave Into",
  heroSubtitle: "Solar + battery solution: $485K investment → $42K/year savings → 5.3yr payback",
  heroHighlight: "SUSTAINABLE CAR WASH PARTNERSHIP",

  // No portfolio metrics for single location
  portfolioMetrics: null,

  featuredLocation: {
    name: "Phoenix Flagship",
    annualSavings: "$42.1K",
    demandCharges: "$31.2K",
    energyArbitrage: "$10.9K",
    roi: "124%",
    payback: "5.3 years",
    irr: "20.1%",
    investment: "$485K",
    npv: "$685K",
    netGain: "$200K",
    peakLoad: "235 kW",
    solarSize: "180 kW",
    solarCoverage: "80% coverage",
    batteryEnergy: "440 kWh",
    batteryPower: "145 kW power",
    duration: "3.0 hrs",
    backupTime: "<16ms",
  },

  investmentBreakdown: {
    battery: "$185,000",
    solar: "$152,000",
    balance: "$64,000",
    labor: "$84,000",
  },

  valueProps: [
    {
      icon: "✓",
      title: "Arizona Solar = Perfect Fit",
      description: "Phoenix gets 300+ sunny days/year—ideal for maximum solar generation",
    },
    {
      icon: "✓",
      title: "Reduce Peak Demand Charges",
      description: "Save $31K/year by shaving peaks during Arizona's brutal summer months",
    },
    {
      icon: "✓",
      title: "Eco-Friendly Brand Marketing",
      description: "Stand out as the sustainable choice in competitive Phoenix market",
    },
    {
      icon: "✓",
      title: "Monsoon-Ready Backup Power",
      description: "Keep washing during monsoon season power outages",
    },
  ],

  whyThisCompany: {
    title: "Why Clean Wave Makes Sense",
    reasons: [
      {
        icon: "☀️",
        title: "Best Solar State",
        description: "Arizona has the 2nd best solar resource in the US—ROI is higher here",
      },
      {
        icon: "💰",
        title: "High Energy Costs",
        description: "APS demand charges are aggressive—BESS provides immediate savings",
      },
      {
        icon: "🚗",
        title: "Large Parking Lot",
        description: "60-space lot is perfect for 180kW solar carport installation",
      },
    ],
  },

  locations: null,
  scenarios: null,

  emailSubject: "Clean Wave Car Wash Solar Partnership",
  emailBody: "I'd like to discuss solar + battery solutions for Clean Wave Car Wash in Phoenix.",
};

// Example 2: Regional Chain (3-5 locations)
const SPARKLE_AUTO_SPA_CONFIG: CampaignConfig = {
  companyName: "Sparkle Auto Spa",
  companyTagline: "California's Fastest-Growing Car Wash Chain",
  industry: "car_wash",

  heroTitle: "Portfolio-Wide Energy Transformation for",
  heroSubtitle: "4 California locations: $1.8M investment → $165K/year savings → 5.5yr payback",
  heroHighlight: "MULTI-SITE SOLAR + BATTERY ROLLOUT",

  portfolioMetrics: {
    totalInvestment: "$1.8M",
    investmentNote: "4 CA Sites",
    annualSavings: "$165K",
    savingsNote: "Year 1",
    payback: "5.5yr",
    paybackNote: "Average",
    roi: "118%",
    roiNote: "10-Year",
  },

  featuredLocation: {
    name: "San Diego - Flagship",
    annualSavings: "$48.2K",
    demandCharges: "$35.8K",
    energyArbitrage: "$12.4K",
    roi: "128%",
    payback: "5.1 years",
    irr: "21.3%",
    investment: "$515K",
    npv: "$742K",
    netGain: "$227K",
    peakLoad: "265 kW",
    solarSize: "195 kW",
    solarCoverage: "75% coverage",
    batteryEnergy: "485 kWh",
    batteryPower: "165 kW power",
    duration: "2.9 hrs",
    backupTime: "<16ms",
  },

  investmentBreakdown: {
    battery: "$198,000",
    solar: "$165,000",
    balance: "$68,000",
    labor: "$84,000",
  },

  valueProps: [
    {
      icon: "✓",
      title: "California Solar Mandates",
      description: "Get ahead of CA's commercial solar requirements while saving money",
    },
    {
      icon: "✓",
      title: "PG&E/SDG&E Demand Savings",
      description: "California utilities have the highest demand charges—BESS cuts them 70%+",
    },
    {
      icon: "✓",
      title: "SGIP Rebates Available",
      description: "California's Self-Generation Incentive Program can cover 20-30% of costs",
    },
    {
      icon: "✓",
      title: "Wildfire Resilience",
      description: "Backup power keeps operations running during PSPS shutoffs",
    },
  ],

  whyThisCompany: {
    title: "Why Sparkle Auto Spa Is the Perfect Partner",
    reasons: [
      {
        icon: "🌎",
        title: "California Market Leader",
        description: "Operating in the most favorable solar + storage market in the US",
      },
      {
        icon: "📈",
        title: "Growth Trajectory",
        description: "4 sites now, 15 sites planned—standardize energy strategy early",
      },
      {
        icon: "💚",
        title: "Brand Alignment",
        description: "California customers value sustainability—make it a competitive advantage",
      },
    ],
  },

  locations: [
    {
      city: "San Diego",
      peak: "265 kW",
      investment: "$515K",
      savings: "$48.2K",
      payback: "5.1yr",
      irr: "21.3%",
    },
    {
      city: "Los Angeles",
      peak: "245 kW",
      investment: "$485K",
      savings: "$44.8K",
      payback: "5.4yr",
      irr: "20.5%",
    },
    {
      city: "Sacramento",
      peak: "215 kW",
      investment: "$425K",
      savings: "$38.1K",
      payback: "5.6yr",
      irr: "19.8%",
    },
    {
      city: "San Jose",
      peak: "235 kW",
      investment: "$465K",
      savings: "$42.2K",
      payback: "5.5yr",
      irr: "20.2%",
    },
  ],

  scenarios: [
    {
      name: "Solar Only",
      investment: "$215K",
      savings: "$19.5K",
      payback: "11.0yr",
      roi: "52%",
      note: "Baseline",
    },
    {
      name: "Solar + BESS",
      investment: "$515K",
      savings: "$48.2K",
      payback: "5.1yr",
      roi: "128%",
      note: "✅ Recommended",
      highlight: true,
    },
    {
      name: "With SGIP Rebate",
      investment: "$410K",
      savings: "$48.2K",
      payback: "4.1yr",
      roi: "156%",
      note: "CA Incentive",
    },
    {
      name: "+ EV Charging",
      investment: "$565K",
      savings: "$88.5K",
      payback: "6.4yr",
      roi: "182%",
      note: "Revenue Add-On",
    },
  ],

  emailSubject: "Sparkle Auto Spa Multi-Site Solar Partnership",
  emailBody:
    "I'd like to discuss a portfolio-wide solar + battery rollout for Sparkle Auto Spa's 4 California locations.",
};

// Example 3: Blank Template (copy this for new car washes)

const TEMPLATE_CONFIG: CampaignConfig = {
  companyName: "[Company Name]",
  companyTagline: "[Brand Positioning]",
  industry: "car_wash",

  heroTitle: "Transform [Company] Into",
  heroSubtitle: "[Investment] → [Savings]/year → [Payback] payback",
  heroHighlight: "[CAMPAIGN THEME]",

  portfolioMetrics: null, // or fill in if multi-site

  featuredLocation: {
    name: "[Location Name]",
    annualSavings: "$XX.XK",
    demandCharges: "$XX.XK",
    energyArbitrage: "$X.XK",
    roi: "XXX%",
    payback: "X.X years",
    irr: "XX.X%",
    investment: "$XXXK",
    npv: "$XXXK",
    netGain: "$XXXK",
    peakLoad: "XXX kW",
    solarSize: "XXX kW",
    solarCoverage: "XX% coverage",
    batteryEnergy: "XXX kWh",
    batteryPower: "XXX kW power",
    duration: "X.X hrs",
    backupTime: "<XXms",
  },

  investmentBreakdown: {
    battery: "$XXX,000",
    solar: "$XXX,000",
    balance: "$XX,000",
    labor: "$XX,000",
  },

  valueProps: [
    { icon: "✓", title: "[Value Prop 1]", description: "[Description]" },
    { icon: "✓", title: "[Value Prop 2]", description: "[Description]" },
    { icon: "✓", title: "[Value Prop 3]", description: "[Description]" },
    { icon: "✓", title: "[Value Prop 4]", description: "[Description]" },
  ],

  whyThisCompany: {
    title: "Why [Company] Makes Sense",
    reasons: [
      { icon: "🎯", title: "[Reason 1]", description: "[Description]" },
      { icon: "💡", title: "[Reason 2]", description: "[Description]" },
      { icon: "⚡", title: "[Reason 3]", description: "[Description]" },
    ],
  },

  locations: null,
  scenarios: null,

  emailSubject: "[Company] Solar + Battery Inquiry",
  emailBody: "I'd like to learn more about solar and battery solutions for [Company].",
};

// Example Usage in a Component:
export default function CleanWaveCarWashLanding() {
  return <CarWashCampaign config={CLEAN_WAVE_CONFIG} />;
}

// Or for Sparkle Auto Spa:
export function SparkleAutoSpaLanding() {
  return <CarWashCampaign config={SPARKLE_AUTO_SPA_CONFIG} />;
}
