# Design Archive

This folder contains legacy UI components that were removed from production but preserved for reference. These files contain useful design patterns, styling, and code that can be reused in future features.

## Files

### HeroSection-legacy.tsx (523 lines)
**Removed:** November 28, 2025

Contains:
- Beautiful benefit cards with gradient themes (Cost Savings, Revenue Generation, Sustainability)
- Animated gradient overlays with hover effects
- Corner glow decorative elements
- Modal management with `openModal()` pattern
- UseCaseROI integration with auto-rotate carousel
- Quote preview modal with lazy loading

**Useful patterns:**
- Gradient card designs: `bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100`
- Hover animations: `hover:scale-105 hover:-translate-y-2 transition-all duration-300`
- Decorative corner glows: `absolute -top-10 -left-10 w-40 h-40 bg-amber-400/30 rounded-full blur-3xl`
- Animated overlays: `group-hover:from-amber-400/20 transition-all duration-500`

---

### AdvancedQuoteBuilderSection-legacy.tsx (341 lines)
**Removed:** November 28, 2025

Contains:
- Complete system configuration form (Power MW, Duration, Grid Mode, Generator, Solar, Wind)
- PricingConfigurationPanel integration
- FinancialSummaryPanel integration  
- SystemDetailsPanel integration
- Two-column responsive layout

**Useful patterns:**
- Form layout with labels and inputs
- Duration selector with practical descriptions
- Solar acreage warning calculation
- Integration pattern for pricing/financial panels

---

### AdvancedQuoteBuilderView-legacy.tsx (149 lines)
**Removed:** November 28, 2025

Contains:
- View wrapper with gradient header
- "Power User Mode" badge styling
- Navigation buttons (Smart Wizard, Back to Home)
- Dark theme gradient background

**Useful patterns:**
- Header gradient: `bg-gradient-to-r from-orange-600 to-red-600`
- Badge styling: `bg-white/20 px-3 py-1 rounded-full text-sm`
- Full-page dark gradient: `bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900`

---

## Usage

These files are NOT imported anywhere - they're reference only. To use code from these files:

1. Copy the relevant component/styling to your active component
2. Update imports as needed
3. Test thoroughly before deploying

## Why Archived?

These components were superseded by:
- `sections/HeroSection.tsx` - Active hero section
- `InteractiveConfigDashboard.tsx` - System configuration
- `SmartWizardV2.tsx` - Guided wizard experience
- Modal-based workflow in `BessQuoteBuilder.tsx`
