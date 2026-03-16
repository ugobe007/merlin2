# El Car Wash → Generic Car Wash Campaign Template

## What Changed

**Before**: ElCarWashLanding.tsx was hardcoded with El Car Wash data (760 lines)

**After**:

- **CarWashCampaign.tsx** - Generic, configurable template component
- **ElCarWashLanding.tsx** - Now just imports the config and renders the template
- **CarWashCampaignExamples.tsx** - 2 example configs showing how to adapt for other car washes

## Benefits

1. **Reusable** - Create new car wash campaigns in ~10 minutes by copying a config
2. **El Car Wash as Example** - Keep El Car Wash as the flagship/showcase, but clearly position it as one of many
3. **Consistent** - All car wash campaigns use the same design system and components
4. **Maintainable** - Fix a bug once, all campaigns benefit

## Quick Usage

To create a new car wash campaign:

```tsx
import CarWashCampaign, { type CampaignConfig } from "./CarWashCampaign";

const ACME_CAR_WASH_CONFIG: CampaignConfig = {
  companyName: "ACME Car Wash",
  companyTagline: "Texas' Greenest Car Wash",
  industry: "car_wash",
  // ... fill in the rest with real quote data
};

export default function AcmeCarWashLanding() {
  return <CarWashCampaign config={ACME_CAR_WASH_CONFIG} />;
}
```

## What's Preserved

✅ All El Car Wash content intact (just moved to EL_CAR_WASH_CONFIG)  
✅ MiniWizardV8 integration  
✅ Supabase design system styling  
✅ Hero ROI numbers  
✅ All CTAs and email links

## Documentation

See `/docs/CAR_WASH_CAMPAIGNS.md` for complete guide
