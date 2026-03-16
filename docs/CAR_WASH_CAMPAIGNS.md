# Car Wash Campaign Landing Pages

## Overview

We've created a **generic, reusable template** for car wash landing pages. The `CarWashCampaign` component can be configured with different data to create branded pages for any car wash chain.

## Files

- **`CarWashCampaign.tsx`** - The main reusable component
- **`ElCarWashLanding.tsx`** - El Car Wash implementation (uses EL_CAR_WASH_CONFIG)
- **`CarWashCampaignExamples.tsx`** - Example configs for other car washes

## Features

### Configurable Elements

- Company name & tagline
- Hero section with custom messaging
- Portfolio metrics (optional, for multi-site chains)
- Featured location showcase with live quote
- Investment breakdown
- Custom value propositions
- Multiple locations (optional)
- Scenario comparisons (optional)
- Email CTAs & download links

### Built-In Components

- ✅ MiniWizardV8 integration (launches inline quote tool)
- ✅ Supabase design system styling
- ✅ Responsive layout
- ✅ Hero-style ROI numbers
- ✅ TrueQuote™ branding

## How to Create a New Car Wash Campaign

### Option 1: Simple Single-Location Campaign

```tsx
import CarWashCampaign, { type CampaignConfig } from "./CarWashCampaign";

const MY_CAR_WASH_CONFIG: CampaignConfig = {
  companyName: "Suds & Shine",
  companyTagline: "Texas' Cleanest Car Wash",
  industry: "car_wash",

  heroTitle: "Solar Power for",
  heroSubtitle: "$425K investment → $38K/year savings → 5.6yr payback",
  heroHighlight: "ENERGY INDEPENDENCE FOR CAR WASHES",

  portfolioMetrics: null, // Hide for single location

  featuredLocation: {
    name: "Dallas Location",
    annualSavings: "$38.2K",
    demandCharges: "$28.5K",
    energyArbitrage: "$9.7K",
    roi: "112%",
    payback: "5.6 years",
    irr: "18.9%",
    investment: "$425K",
    npv: "$592K",
    netGain: "$167K",
    peakLoad: "200 kW",
    solarSize: "155 kW",
    solarCoverage: "70% coverage",
    batteryEnergy: "385 kWh",
    batteryPower: "125 kW power",
    duration: "3.1 hrs",
    backupTime: "<16ms",
  },

  // ... rest of config
};

export default function SudsAndShineLanding() {
  return <CarWashCampaign config={MY_CAR_WASH_CONFIG} />;
}
```

### Option 2: Multi-Location Chain

See `SPARKLE_AUTO_SPA_CONFIG` in `CarWashCampaignExamples.tsx` for a full example with:

- Portfolio metrics header
- Multiple locations grid
- Scenario comparisons
- State-specific incentives (SGIP, etc.)

## Configuration Reference

```typescript
interface CampaignConfig {
  // Basic Info
  companyName: string; // "El Car Wash"
  companyTagline: string; // "America's Most Sustainable..."
  industry: "car_wash";

  // Hero
  heroTitle: string; // "Transform El Car Wash Into"
  heroSubtitle: string; // Investment & savings summary
  heroHighlight: string; // Badge text at top

  // Portfolio (optional - null to hide)
  portfolioMetrics: {
    totalInvestment: string; // "$2.1M"
    investmentNote: string; // "5 Florida Sites"
    annualSavings: string; // "$180K"
    savingsNote: string; // "Year 1"
    payback: string; // "5.8yr"
    paybackNote: string; // "Simple Payback"
    roi: string; // "110%"
    roiNote: string; // "Base Case"
  } | null;

  // Featured Location
  featuredLocation: {
    name: string; // "Miami Flagship Location"
    annualSavings: string; // "$38.5K"
    demandCharges: string; // "$29.3K"
    energyArbitrage: string; // "$9.2K"
    roi: string; // "116%"
    payback: string; // "5.8 years"
    irr: string; // "19.4%"
    investment: string; // "$448K"
    npv: string; // "$627K"
    netGain: string; // "$179K"
    peakLoad: string; // "220 kW"
    solarSize: string; // "165 kW"
    solarCoverage: string; // "75% coverage"
    batteryEnergy: string; // "413 kWh"
    batteryPower: string; // "132 kW power"
    duration: string; // "3.1 hrs"
    backupTime: string; // "<16ms"
  };

  // Investment Breakdown
  investmentBreakdown: {
    battery: string; // "$172,000"
    solar: string; // "$140,000"
    balance: string; // "$59,000"
    labor: string; // "$77,000"
  };

  // Value Props (4 shown in grid)
  valueProps: Array<{
    icon: string; // "✓"
    title: string; // "Solar Carport = Free Real Estate"
    description: string; // Long description
  }>;

  // Why This Company
  whyThisCompany: {
    title: string; // "Why El Car Wash Is Perfect"
    reasons: Array<{
      icon: string; // "💼"
      title: string; // "PE-Backed Speed & Scale"
      description: string; // Full description
    }>;
  };

  // Multiple Locations (optional - null to hide)
  locations: Array<{
    city: string;
    peak: string;
    investment: string;
    savings: string;
    payback: string;
    irr: string;
  }> | null;

  // Scenarios (optional - null to hide)
  scenarios: Array<{
    name: string;
    investment: string;
    savings: string;
    payback: string;
    roi: string;
    note: string;
    highlight?: boolean; // Adds green border
  }> | null;

  // CTAs
  emailSubject: string; // Email subject line
  emailBody: string; // Email body text
  downloadQuoteUrl?: string; // Optional download link
}
```

## Routing

Add new routes in your router configuration:

```tsx
// In App.tsx or routing file
<Route path="/el-car-wash" element={<ElCarWashLanding />} />
<Route path="/clean-wave" element={<CleanWaveCarWashLanding />} />
<Route path="/sparkle-auto-spa" element={<SparkleAutoSpaLanding />} />
```

## Workflow for New Customer

1. **Run the wizard** for their location to get real numbers
2. **Copy the TEMPLATE_CONFIG** from `CarWashCampaignExamples.tsx`
3. **Fill in the real quote data** (investment, savings, ROI, etc.)
4. **Customize value props** for their specific situation:
   - Geographic advantages (Arizona solar, California incentives, etc.)
   - Competitive positioning (eco-friendly brand, etc.)
   - Operational benefits (backup power, demand reduction, etc.)
5. **Add locations** if they have multiple sites
6. **Add scenarios** if showing multiple configurations
7. **Create the route** and deploy

## Example Use Cases

### El Car Wash (Current)

- **Profile**: PE-backed chain, 5 Florida locations
- **Focus**: Portfolio-wide transformation, fast decisions, scalability
- **Highlights**: Hurricane resilience, Florida solar ROI, carport strategy

### Clean Wave (Example)

- **Profile**: Single location, Phoenix AZ
- **Focus**: Single-site demo, Arizona solar advantages
- **Highlights**: 300+ sunny days, monsoon backup power, eco-branding

### Sparkle Auto Spa (Example)

- **Profile**: Growing chain, 4 California sites
- **Focus**: Multi-site rollout, CA incentives (SGIP)
- **Highlights**: PSPS resilience, wildfire prep, CA mandates

## Deployment

After creating a new campaign:

1. Test locally: `npm run dev`
2. Check wizard integration works
3. Test all CTAs (email links, download buttons)
4. Commit changes
5. Deploy: `fly deploy -a merlin2`

## Notes

- **El Car Wash remains the default** example when no config is passed
- All configs are exported for reuse
- The MiniWizardV8 pre-populates with `industry: "car_wash"` and the company name
- All Supabase design system styles are built in (stroke-only buttons, cyan/emerald/orange colors)
