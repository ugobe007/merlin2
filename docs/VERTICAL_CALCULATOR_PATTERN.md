# Vertical Calculator Pattern

**Version:** 1.0  
**Date:** January 21, 2026  
**Applies to:** All vertical-specific wizards (Hotel, Truck Stop, EV Charging, Manufacturing, etc.)

## Overview

This document describes the standardized pattern for implementing **16-Question Energy Intelligence Systems** for Merlin vertical industries. Based on the successful Car Wash 16Q implementation (January 2026), this pattern ensures:

- ✅ **Bottom-up load reconstruction** (equipment → peak demand)
- ✅ **TrueQuote™ source attribution** (every number traceable)
- ✅ **Real-time UI integration** (instant power metrics)
- ✅ **SSOT compliance** (no rogue calculations)
- ✅ **Confidence tracking** (estimate vs verified)
- ✅ **Visual indicators** (warnings, badges, alerts)

---

## 🎯 The 5-Step Implementation Pattern

### Step 1: Design the 16 Questions

**Organize into 7 sections:**

1. **Topology** (2 questions)
   - Industry-specific facility type
   - Scale/size anchor (bays, rooms, chargers, etc.)

2. **Infrastructure** (2 questions)
   - Electrical service size (Amps)
   - Voltage level (for PCS compatibility)

3. **Equipment** (2 questions)
   - Primary equipment list (multi-select with kW values)
   - Largest motor size (for surge modeling)

4. **Operations** (5 questions)
   - Throughput metrics (daily/peak)
   - Operating hours
   - Cycle durations
   - Concurrency factor

5. **Financial** (2 questions)
   - Monthly electricity spend (ROI anchor)
   - Utility rate structure (flat/demand/TOU)

6. **Resilience** (2 questions)
   - Power quality issues (multi-select, optional)
   - Outage sensitivity (backup runtime)

7. **Planning** (1 question)
   - Expansion plans (multi-select, optional)

**Key Principles:**
- Avoid multi-unit bias (default to single unit)
- Use range options (e.g., "75-150" vs exact numbers)
- Include "not_sure" option for confidence tracking
- Progressive disclosure (expand based on answers)

---

### Step 2: Create Database Migration

**File:** `database/migrations/YYYYMMDD_[vertical]_16q.sql`

```sql
-- Delete old questions
DELETE FROM custom_questions 
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = '[vertical-slug]');

-- Insert 16 new questions
INSERT INTO custom_questions (
  use_case_id,
  field_name,
  label,
  question_type,
  section,
  display_order,
  is_required,
  options
) VALUES
-- Q1: Topology anchor
(
  (SELECT id FROM use_cases WHERE slug = '[vertical-slug]'),
  '[vertical]Type',
  'What type of [vertical] facility?',
  'select',
  'Topology',
  1,
  true,
  '[
    {
      "value": "type_a",
      "label": "Type A",
      "description": "Description of Type A",
      "icon": "🏢",
      "kW": 50
    },
    {
      "value": "type_b",
      "label": "Type B",
      "description": "Description of Type B",
      "icon": "🏭",
      "kW": 100
    }
  ]'::jsonb
),
-- Q2-Q16: Add remaining questions...
;

-- Verification
SELECT 
  section,
  COUNT(*) as question_count
FROM custom_questions
WHERE use_case_id = (SELECT id FROM use_cases WHERE slug = '[vertical-slug]')
GROUP BY section
ORDER BY section;
```

**Apply migration:**
```typescript
// scripts/apply-[vertical]-16q-direct.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  const sql = fs.readFileSync('database/migrations/YYYYMMDD_[vertical]_16q.sql', 'utf8');
  
  // Parse SQL and execute via Supabase API
  // (See car wash implementation for full example)
}

applyMigration();
```

---

### Step 3: Implement Calculator

**File:** `src/services/[vertical]16QCalculator.ts`

```typescript
/**
 * [VERTICAL] 16Q CALCULATOR
 * 
 * 11-Step Calculation Pipeline:
 * 1. Parse inputs & extract numeric values
 * 2. Equipment load reconstruction (bottom-up)
 * 3. Motor surge modeling (IEEE 446-1995)
 * 4. Peak load calculation (constrained by service capacity)
 * 5. Average load & energy throughput
 * 6. BESS sizing (60% peak shaving + backup runtime)
 * 7. Financial metrics (ROI calibration)
 * 8. Resilience assessment (power quality risk)
 * 9. Expansion headroom
 * 10. Confidence assessment (estimate vs verified)
 * 11. TrueQuote™ source attribution
 */

// Define input interface (16 fields matching database)
export interface [Vertical]16QInput {
  // Q1-2: Topology
  [vertical]Type: 'type_a' | 'type_b' | 'not_sure';
  unitCount: '1' | '2-3' | '4-5' | '6-10' | '10+' | 'not_sure';
  
  // Q3-4: Infrastructure
  electricalServiceSize: '200' | '400' | '600' | '800' | '800+' | 'not_sure';
  voltageLevel: '120_208' | '277_480' | '480' | 'not_sure';
  
  // Q5-6: Equipment
  primaryEquipment: string[]; // Multi-select with kW values
  largestMotorSize: '10-25' | '25-50' | '50-100' | '100+' | 'not_sure';
  
  // Q7: Concurrency
  simultaneousEquipment: '1-2' | '3-4' | '5+' | 'not_sure';
  
  // Q8-11: Operations
  averageOperationsPerDay: string;
  peakHourThroughput: string;
  operationDuration: string;
  operatingHours: string;
  
  // Q12-13: Financial
  monthlyElectricitySpend: string;
  utilityRateStructure: 'flat' | 'demand' | 'tou' | 'not_sure';
  
  // Q14-15: Resilience
  powerQualityIssues: string[];
  outageSensitivity: 'not_sensitive' | 'minor_impact' | 'operations_stop' | 'immediate_recovery' | 'critical_operations';
  
  // Q16: Expansion
  expansionPlans: string[];
}

// Define output interface
export interface [Vertical]16QResult {
  // Power Metrics
  peakDemandKW: number;
  dailyEnergyKWh: number;
  monthlyEnergyKWh: number;
  annualEnergyKWh: number;
  
  // Equipment Breakdown
  equipmentLoadKW: number;
  motorSurgeKW: number;
  concurrencyFactor: number;
  
  // Service Capacity
  serviceCapacityKW: number;
  serviceUtilization: number;
  serviceLimitReached: boolean;
  
  // BESS Recommendations
  bessRecommendedKW: number;
  bessRecommendedKWh: number;
  bessDurationHours: number;
  
  // Financial Analysis
  estimatedAnnualCost: number;
  demandChargeSavings: number;
  energyChargeSavings: number;
  totalAnnualSavings: number;
  savingsMultiplier: number;
  
  // Resilience
  backupRuntimeHours: number;
  powerQualityRisk: 'low' | 'medium' | 'high';
  powerQualityIssues: string[];
  
  // Expansion Planning
  expansionHeadroomKW: number;
  futureLoadKW: number;
  
  // Confidence
  confidence: 'estimate' | 'verified';
  uncertaintyCount: number;
  
  // TrueQuote™ Sources
  sources: Array<{
    source: string;
    value: string;
    citation: string;
  }>;
}

// Equipment kW mappings (from industry research)
const EQUIPMENT_KW_MAP: Record<string, number> = {
  equipment_a: 25,
  equipment_b: 50,
  equipment_c: 15,
  // ... all equipment types
  not_sure: 30, // Conservative default
};

// Main calculator function
export function calculate[Vertical]16Q(input: [Vertical]16QInput): [Vertical]16QResult {
  // Step 1: Parse inputs
  const parseRange = (value: string, defaultMid: number): number => {
    if (value === 'not_sure') return defaultMid;
    if (value.includes('+')) return parseFloat(value) * 1.25;
    if (value.includes('-')) {
      const [min, max] = value.split('-').map(Number);
      return (min + max) / 2;
    }
    return parseFloat(value) || defaultMid;
  };
  
  // Step 2: Equipment load reconstruction
  const equipmentLoadKW = input.primaryEquipment.reduce((sum, eq) => {
    return sum + (EQUIPMENT_KW_MAP[eq] || 0);
  }, 0);
  
  // Step 3: Motor surge modeling (IEEE 446-1995)
  const largestMotorHP = parseRange(input.largestMotorSize, 25);
  const motorSurgeKW = largestMotorHP * 0.746 * 1.5; // HP to kW × soft-start factor
  
  // Step 4: Peak load calculation
  const concurrencyFactor = parseRange(input.simultaneousEquipment, 3) / 
                           input.primaryEquipment.length;
  const serviceCapacityKW = parseRange(input.electricalServiceSize, 400) * 0.346;
  
  let peakDemandKW = (equipmentLoadKW * concurrencyFactor) + motorSurgeKW;
  const serviceLimitReached = peakDemandKW > (serviceCapacityKW * 0.95);
  if (serviceLimitReached) {
    peakDemandKW = serviceCapacityKW * 0.95;
  }
  
  // Step 5: Energy throughput
  const operatingHoursPerDay = parseRange(input.operatingHours, 12);
  const utilizationFactor = 0.4; // Industry-specific
  const dailyEnergyKWh = peakDemandKW * operatingHoursPerDay * utilizationFactor;
  
  // Step 6: BESS sizing
  const bessRecommendedKW = peakDemandKW * 0.6; // Peak shaving
  const backupRuntimeHours = input.outageSensitivity === 'critical_operations' ? 4 :
                             input.outageSensitivity === 'immediate_recovery' ? 1 : 0;
  const bessDurationHours = Math.max(2, backupRuntimeHours);
  const bessRecommendedKWh = bessRecommendedKW * bessDurationHours;
  
  // Step 7-11: Financial, resilience, expansion, confidence, sources
  // (See car wash calculator for full implementation)
  
  return {
    peakDemandKW,
    dailyEnergyKWh,
    // ... all other fields
  };
}
```

**Export from SSOT:**
```typescript
// src/services/useCasePowerCalculations.ts (bottom of file)
export { 
  calculate[Vertical]16Q,
  type [Vertical]16QInput,
  type [Vertical]16QResult
} from './[vertical]16QCalculator';
```

---

### Step 4: Create Integration Layer

**File:** `src/components/wizard/[vertical]Integration.ts`

```typescript
import { calculate[Vertical]16Q, type [Vertical]16QInput, type [Vertical]16QResult } from '@/services/[vertical]16QCalculator';

export function mapAnswersTo[Vertical]16QInput(
  answers: Record<string, unknown>
): [Vertical]16QInput {
  // Map database field names to calculator input
  // (See car wash integration for full example)
}

export function calculate[Vertical]Metrics(
  answers: Record<string, unknown>
): [Vertical]16QResult | null {
  try {
    const input = mapAnswersTo[Vertical]16QInput(answers);
    const result = calculate[Vertical]16Q(input);
    console.log('✅ [Vertical] Calculator Result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error calculating [vertical] metrics:', error);
    return null;
  }
}
```

**Wire into Step3Integration.tsx:**
```typescript
// Add import
import { calculate[Vertical]Metrics } from './[vertical]Integration';

// In useEffect (after carWashMetrics):
let [vertical]Metrics = null;
if (industry === '[vertical-slug]' && Object.keys(answers).length > 0) {
  [vertical]Metrics = calculate[Vertical]Metrics(answers);
  if ([vertical]Metrics) {
    console.log('✅ [Vertical] Power Metrics Updated:', [vertical]Metrics);
  }
}

// Update state
updateState({
  useCaseData: {
    ...state.useCaseData,
    inputs: { ...answers },
    carWashMetrics: carWashMetrics || undefined,
    [vertical]Metrics: [vertical]Metrics || undefined,
  },
});
```

---

### Step 5: Create Visual Indicators

**File:** `src/components/wizard/[Vertical]16QVisuals.tsx`

```typescript
import React from 'react';
import type { [Vertical]16QResult } from '@/services/[vertical]16QCalculator';

// Confidence Badge
export function ConfidenceBadge({ confidence, uncertaintyCount }: { ... }) {
  // Red badge for "estimate", green badge for "verified"
}

// Service Utilization Warning
export function ServiceUtilizationWarning({ serviceUtilization, ... }: { ... }) {
  // Red warning if > 90%, amber if > 75%, green otherwise
}

// Expansion Headroom Alert
export function ExpansionHeadroomAlert({ expansionHeadroomKW, ... }: { ... }) {
  // Blue alert showing future load projection
}

// Power Quality Risk Indicator
export function PowerQualityRiskIndicator({ powerQualityRisk, ... }: { ... }) {
  // Red/amber alert for medium/high risk
}

// Backup Runtime Display
export function BackupRuntimeDisplay({ backupRuntimeHours, ... }: { ... }) {
  // Show hours with battery icon
}

// Complete Metrics Card
export function [Vertical]MetricsCard({ result }: { result: [Vertical]16QResult }) {
  return (
    <div className="space-y-4">
      {/* Confidence Badge */}
      <ConfidenceBadge confidence={result.confidence} uncertaintyCount={result.uncertaintyCount} />
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>Peak Demand: {result.peakDemandKW.toFixed(0)} kW</div>
        <div>BESS: {result.bessRecommendedKW.toFixed(0)} kW / {result.bessRecommendedKWh.toFixed(0)} kWh</div>
        <div>Annual Savings: ${result.totalAnnualSavings.toLocaleString()}</div>
        <div>Daily Energy: {result.dailyEnergyKWh.toFixed(0)} kWh</div>
      </div>
      
      {/* Visual Indicators */}
      <ServiceUtilizationWarning {...result} />
      <ExpansionHeadroomAlert {...result} />
      <PowerQualityRiskIndicator {...result} />
      <BackupRuntimeDisplay {...result} />
    </div>
  );
}
```

**Display in wizard:**
```tsx
// In WizardV6.tsx or CompleteStep3Component.tsx
import { [Vertical]MetricsCard } from './[Vertical]16QVisuals';

{state.useCaseData.[vertical]Metrics && (
  <[Vertical]MetricsCard result={state.useCaseData.[vertical]Metrics} />
)}
```

---

## 🧪 Testing Pattern

**File:** `src/services/__tests__/[vertical]16QCalculator.test.ts`

```typescript
import { calculate[Vertical]16Q, type [Vertical]16QInput } from '../[vertical]16QCalculator';

describe('[Vertical] 16Q Calculator', () => {
  
  // Test Scenario 1: Small facility
  describe('Small [Vertical] Facility', () => {
    it('should calculate correct peak demand', () => {
      const input: [Vertical]16QInput = { /* minimal config */ };
      const result = calculate[Vertical]16Q(input);
      
      expect(result.peakDemandKW).toBeGreaterThan(50);
      expect(result.peakDemandKW).toBeLessThan(100);
    });
  });
  
  // Test Scenario 2: Medium facility
  describe('Medium [Vertical] Facility', () => {
    it('should recommend appropriate BESS sizing', () => {
      const input: [Vertical]16QInput = { /* standard config */ };
      const result = calculate[Vertical]16Q(input);
      
      expect(result.bessRecommendedKW).toBeGreaterThan(100);
      expect(result.confidence).toBe('verified');
    });
  });
  
  // Test Scenario 3: Large facility
  describe('Large [Vertical] Facility', () => {
    it('should calculate substantial annual savings', () => {
      const input: [Vertical]16QInput = { /* large config */ };
      const result = calculate[Vertical]16Q(input);
      
      expect(result.totalAnnualSavings).toBeGreaterThan(50000);
    });
  });
  
  // Test Scenario 4: Service capacity edge case
  describe('Service Capacity Edge Case', () => {
    it('should constrain peak to 95% of service capacity', () => {
      const input: [Vertical]16QInput = { 
        electricalServiceSize: '200', // Too small
        /* ... large equipment list */
      };
      const result = calculate[Vertical]16Q(input);
      
      expect(result.serviceLimitReached).toBe(true);
      expect(result.serviceUtilization).toBeGreaterThan(0.90);
    });
  });
  
  // Test Scenario 5: Confidence tracking
  describe('Confidence Assessment', () => {
    it('should report "estimate" with "not_sure" answers', () => {
      const input: [Vertical]16QInput = {
        [vertical]Type: 'not_sure',
        electricalServiceSize: 'not_sure',
        /* ... */
      };
      const result = calculate[Vertical]16Q(input);
      
      expect(result.confidence).toBe('estimate');
      expect(result.uncertaintyCount).toBeGreaterThan(0);
    });
  });
  
  // Test Scenario 6: TrueQuote™ sources
  describe('TrueQuote™ Source Attribution', () => {
    it('should include authoritative sources', () => {
      const input: [Vertical]16QInput = { /* ... */ };
      const result = calculate[Vertical]16Q(input);
      
      expect(result.sources).toBeDefined();
      expect(result.sources.length).toBeGreaterThan(0);
      
      const sourceNames = result.sources.map(s => s.source);
      expect(sourceNames).toContain('NREL ATB 2024');
      expect(sourceNames).toContain('IEEE 446-1995 (Orange Book)');
    });
  });
});
```

**Run tests:**
```bash
npm test -- carWash16QCalculator.test.ts
npm test -- [vertical]16QCalculator.test.ts
```

---

## 📋 Implementation Checklist

Use this checklist for each vertical:

### Phase 1: Design & Database
- [ ] Design 16 questions (7 sections)
- [ ] Create database migration SQL file
- [ ] Apply migration to Supabase
- [ ] Verify questions in database (query by use_case_id)
- [ ] Test questions display in CompleteStep3Component

### Phase 2: Calculator
- [ ] Create `[vertical]16QCalculator.ts`
- [ ] Define input interface (16 fields)
- [ ] Define output interface (all metrics)
- [ ] Implement 11-step calculation pipeline
- [ ] Add TrueQuote™ source attribution
- [ ] Export from `useCasePowerCalculations.ts`
- [ ] TypeScript build passes

### Phase 3: Integration
- [ ] Create `[vertical]Integration.ts`
- [ ] Implement `mapAnswersTo[Vertical]16QInput()`
- [ ] Implement `calculate[Vertical]Metrics()`
- [ ] Wire into `Step3Integration.tsx`
- [ ] Test in WizardV6 (check console logs)
- [ ] Verify metrics update in real-time

### Phase 4: UI & Testing
- [ ] Create `[Vertical]16QVisuals.tsx`
- [ ] Implement confidence badge
- [ ] Implement service utilization warning
- [ ] Implement expansion headroom alert
- [ ] Implement power quality indicator
- [ ] Implement backup runtime display
- [ ] Create test suite with 6 scenarios
- [ ] All tests pass

### Phase 5: Documentation & Commit
- [ ] Create `docs/[VERTICAL]_16Q_IMPLEMENTATION.md`
- [ ] Document all 16 questions
- [ ] Document calculator logic
- [ ] Document example calculation
- [ ] Add to SSOT_COMPLIANCE tracking
- [ ] Git commit all files
- [ ] Update this pattern doc with lessons learned

---

## 🎯 Target Verticals (Priority Order)

Based on market opportunity and data availability:

1. **Hotel** (COMPLETE Car Wash) ✅
2. **Truck Stop / Travel Center** (high ROI potential)
3. **EV Charging Hub** (rapid growth market)
4. **Manufacturing Facility** (large energy users)
5. **Cold Storage / Warehouse** (demand charge reduction)
6. **Indoor Farm / Vertical Agriculture** (24/7 operations)
7. **Data Center** (mission-critical power)
8. **Hospital** (resilience focus)
9. **Airport** (complex operations)
10. **Shopping Mall / Retail Center** (peak shaving)

---

## 🚀 Next Steps

After implementing Car Wash 16Q (January 2026):

1. **Test in production** - Deploy to 5 car wash prospects
2. **Gather feedback** - Validate accuracy of recommendations
3. **Refine constants** - Adjust equipment kW values if needed
4. **Apply to Hotel** - Next vertical (large market)
5. **Standardize template** - Create boilerplate generator
6. **Scale to all 21 verticals** - Complete by Q2 2026

---

## 📚 Reference Files

**Car Wash 16Q Implementation (January 2026):**
- `database/migrations/20260121_carwash_16q_v3.sql`
- `src/services/carWash16QCalculator.ts`
- `src/components/wizard/carWashIntegration.ts`
- `src/components/wizard/CarWash16QVisuals.tsx`
- `src/components/wizard/Step3Integration.tsx` (lines 60-85)
- `src/services/__tests__/carWash16QCalculator.test.ts`
- `docs/CAR_WASH_16Q_IMPLEMENTATION.md`

**SSOT Architecture:**
- `.github/copilot-instructions.md` (lines 1-500 - SSOT section)
- `docs/CALCULATION_FILES_AUDIT.md`
- `docs/SERVICES_ARCHITECTURE.md`
- `docs/ARCHITECTURE_GUIDE.md`

---

**Version History:**
- v1.0 - January 21, 2026 - Initial pattern based on Car Wash 16Q
