#!/bin/bash

# ============================================================================
# 🔥 V6 SAVAGE PLAN - Component Extraction Script
# ============================================================================

set -e

MERLIN_ROOT="$HOME/merlin2"
SAVAGE_ROOT="$MERLIN_ROOT/src/v6-savage"

echo ""
echo "🔥 V6 SAVAGE PLAN - EXTRACTION"
echo ""

# CREATE DIRECTORY STRUCTURE
echo "📁 Creating V6 SAVAGE directory structure..."
mkdir -p "$SAVAGE_ROOT"/{components,services,data,ui,types}
mkdir -p "$SAVAGE_ROOT"/components/{badges,displays,modals,wizard}
mkdir -p "$SAVAGE_ROOT"/ui/{progress,profiles,widgets}
echo "   ✅ Directory structure created"

# MUST KEEP - Core Components
echo "🌟 Extracting MUST KEEP components..."

cp "$MERLIN_ROOT/src/components/wizard/v5/components/RAVSDisplay.tsx" "$SAVAGE_ROOT/components/displays/" 2>/dev/null && echo "   ✅ RAVSDisplay.tsx"
cp "$MERLIN_ROOT/src/components/shared/TrueQuoteBadge.tsx" "$SAVAGE_ROOT/components/badges/" 2>/dev/null && echo "   ✅ TrueQuoteBadge.tsx"
cp "$MERLIN_ROOT/src/components/shared/TrueQuoteModal.tsx" "$SAVAGE_ROOT/components/modals/" 2>/dev/null && echo "   ✅ TrueQuoteModal.tsx"
cp "$MERLIN_ROOT/src/components/wizard/legacy/v4-active/shared/ProgressRing.tsx" "$SAVAGE_ROOT/ui/progress/" 2>/dev/null && echo "   ✅ ProgressRing.tsx"
cp "$MERLIN_ROOT/src/components/wizard/legacy/v4-active/shared/WizardPowerProfile.tsx" "$SAVAGE_ROOT/ui/profiles/" 2>/dev/null && echo "   ✅ WizardPowerProfile.tsx"
cp "$MERLIN_ROOT/src/components/wizard/legacy/v4-active/shared/MerlinGreeting.tsx" "$SAVAGE_ROOT/components/wizard/" 2>/dev/null && echo "   ✅ MerlinGreeting.tsx"
cp "$MERLIN_ROOT/src/components/EnergyNewsTicker.tsx" "$SAVAGE_ROOT/ui/widgets/" 2>/dev/null && echo "   ✅ EnergyNewsTicker.tsx"
cp "$MERLIN_ROOT/src/components/shared/IndustryComplianceBadges.tsx" "$SAVAGE_ROOT/components/badges/" 2>/dev/null && echo "   ✅ IndustryComplianceBadges.tsx"

# SERVICES
echo "🔧 Extracting SERVICES..."
cp "$MERLIN_ROOT/src/services/baselineService.ts" "$SAVAGE_ROOT/services/" 2>/dev/null && echo "   ✅ baselineService.ts (83KB)"
cp "$MERLIN_ROOT/src/services/ravsService.ts" "$SAVAGE_ROOT/services/" 2>/dev/null && echo "   ✅ ravsService.ts"
cp "$MERLIN_ROOT/src/services/evChargingCalculations.ts" "$SAVAGE_ROOT/services/" 2>/dev/null && echo "   ✅ evChargingCalculations.ts"
cp "$MERLIN_ROOT/src/services/magicFitScenarios.ts" "$SAVAGE_ROOT/services/" 2>/dev/null && echo "   ✅ magicFitScenarios.ts"
cp "$MERLIN_ROOT/src/services/scenarioGenerator.ts" "$SAVAGE_ROOT/services/" 2>/dev/null && echo "   ✅ scenarioGenerator.ts"
cp "$MERLIN_ROOT/src/core/calculations/QuoteEngine.ts" "$SAVAGE_ROOT/services/" 2>/dev/null && echo "   ✅ QuoteEngine.ts"
cp "$MERLIN_ROOT/src/services/calculationConstantsService.ts" "$SAVAGE_ROOT/services/" 2>/dev/null && echo "   ✅ calculationConstantsService.ts"
cp "$MERLIN_ROOT/src/services/benchmarkSources.ts" "$SAVAGE_ROOT/services/" 2>/dev/null && echo "   ✅ benchmarkSources.ts"

# NICE TO HAVE
echo "✨ Extracting NICE TO HAVE..."
cp "$MERLIN_ROOT/src/components/wizard/FloatingWidgets.tsx" "$SAVAGE_ROOT/ui/widgets/" 2>/dev/null && echo "   ✅ FloatingWidgets.tsx"
cp "$MERLIN_ROOT/src/components/MerlinAssistant.tsx" "$SAVAGE_ROOT/ui/widgets/" 2>/dev/null && echo "   ✅ MerlinAssistant.tsx"
cp "$MERLIN_ROOT/src/components/wizard/v5/steps/Step4MagicFit.tsx" "$SAVAGE_ROOT/components/wizard/Step4MagicFit.reference.tsx" 2>/dev/null && echo "   ✅ Step4MagicFit.tsx (reference)"
cp "$MERLIN_ROOT/src/components/wizard/v5/components/SolarConfigModal.tsx" "$SAVAGE_ROOT/components/modals/" 2>/dev/null && echo "   ✅ SolarConfigModal.tsx"
cp "$MERLIN_ROOT/src/components/wizard/v5/components/EVChargingConfigModal.tsx" "$SAVAGE_ROOT/components/modals/" 2>/dev/null && echo "   ✅ EVChargingConfigModal.tsx"
cp "$MERLIN_ROOT/src/components/wizard/v5/design-system.ts" "$SAVAGE_ROOT/" 2>/dev/null && echo "   ✅ design-system.ts"

# CREATE DATA FILES
echo "📊 Creating DATA files..."

cat > "$SAVAGE_ROOT/data/solarData.ts" << 'EOF'
export interface StateSolarData {
  sunHours: number;
  rating: 'Excellent' | 'Very Good' | 'Good' | 'Moderate' | 'Limited';
}

export const SOLAR_DATA: Record<string, StateSolarData> = {
  'Nevada': { sunHours: 6.4, rating: 'Excellent' },
  'Arizona': { sunHours: 6.5, rating: 'Excellent' },
  'California': { sunHours: 5.8, rating: 'Excellent' },
  'New Mexico': { sunHours: 6.2, rating: 'Excellent' },
  'Utah': { sunHours: 5.8, rating: 'Excellent' },
  'Colorado': { sunHours: 5.5, rating: 'Excellent' },
  'Texas': { sunHours: 5.3, rating: 'Very Good' },
  'Florida': { sunHours: 5.2, rating: 'Very Good' },
  'Hawaii': { sunHours: 5.4, rating: 'Very Good' },
  'Oregon': { sunHours: 3.5, rating: 'Limited' },
  'Washington': { sunHours: 3.3, rating: 'Limited' },
};

export function getSolarRating(state: string): StateSolarData | null {
  return SOLAR_DATA[state] || null;
}
EOF
echo "   ✅ solarData.ts"

cat > "$SAVAGE_ROOT/data/evData.ts" << 'EOF'
export const EV_ADOPTION_RATES: Record<string, number> = {
  'California': 18.2,
  'Washington': 12.4,
  'Oregon': 10.8,
  'Colorado': 10.2,
  'Hawaii': 11.5,
  'Nevada': 8.2,
  'Arizona': 7.5,
  'Texas': 4.8,
  'Florida': 5.8,
  'New York': 6.5,
};

export function getEVAdoptionRate(state: string): number {
  return EV_ADOPTION_RATES[state] || 3.0;
}
EOF
echo "   ✅ evData.ts"

# CREATE README
cat > "$SAVAGE_ROOT/README.md" << 'EOF'
# 🔥 V6 SAVAGE - Salvaged Components

> "We're not just salvaging. We're going SAVAGE."

## Structure
- components/ - UI components (badges, displays, modals)
- services/ - Calculation logic
- data/ - State data (solar, EV)
- ui/ - Progress, profiles, widgets

Extracted: December 28, 2025
EOF
echo "   ✅ README.md"

echo ""
echo "🔥 V6 SAVAGE EXTRACTION COMPLETE!"
echo "📁 Location: $SAVAGE_ROOT"
echo ""
ls -la "$SAVAGE_ROOT"
