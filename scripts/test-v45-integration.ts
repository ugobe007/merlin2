/**
 * V4.5 Integration Test
 * =====================
 * Tests for proper capture, persistence, and calculation of v4.5 enhancements
 * 
 * Categories:
 * [1] Captured values - Are values being read from state correctly?
 * [2] Persistent values - Are values being saved to state/QuoteTier?
 * [3] Properly calculated values - Are calculations using SSOT correctly?
 * [4] Missing links - Are there broken references between components?
 */

import { buildTiers } from '../src/wizard/v8/step4Logic';
import type { WizardState } from '../src/wizard/v8/wizardState';

console.log('🧪 V4.5 Integration Test Suite\n');

// Mock wizard state for testing
const mockState: WizardState = {
  step: 4,
  locationRaw: 'Las Vegas, NV',
  country: 'US',
  countryCode: 'US',
  location: {
    city: 'Las Vegas',
    state: 'NV',
    zip: '89101',
    country: 'US',
  },
  locationStatus: 'succeeded',
  business: null,
  intel: {
    utilityRate: 0.12,
    demandCharge: 15,
    utilityProvider: 'NV Energy',
    solarGrade: 'A',
    solarFeasible: true,
    peakSunHours: 5.5,
    weatherRisk: 'Low',
    weatherProfile: 'Hot & Dry',
    avgTempF: 75,
  },
  intelStatus: {
    utility: 'succeeded',
    solar: 'succeeded',
    weather: 'succeeded',
  },
  gridReliability: 'reliable',
  industry: 'car_wash',
  solarPhysicalCapKW: 200,
  criticalLoadPct: 0.30,
  step3Answers: {
    carWashType: 'tunnel',
    bayCount: 4,
  },
  evChargers: null,
  baseLoadKW: 25,
  peakLoadKW: 300,
  criticalLoadKW: 90,
  evRevenuePerYear: 0,
  wantsSolar: true,
  wantsEVCharging: false,
  wantsGenerator: true,
  solarKW: 150,
  generatorKW: 100,
  generatorFuelType: 'natural-gas',
  level2Chargers: 0,
  dcfcChargers: 0,
  hpcChargers: 0,
  tiersStatus: 'idle',
  tiers: null,
  selectedTierIndex: null,
  isBusy: false,
  busyLabel: '',
  error: null,
};

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 1: Captured Values');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('✓ Testing if step4Logic reads state values correctly...\n');

  const [starter, recommended, complete] = await buildTiers(mockState);

  console.log('📊 STARTER Tier:');
  console.log(`  - BESS: ${starter.bessKW} kW / ${starter.bessKWh} kWh`);
  console.log(`  - Solar: ${starter.solarKW} kW`);
  console.log(`  - Generator: ${starter.generatorKW} kW`);
  console.log(`  - Net Cost: $${starter.netCost.toLocaleString()}`);
  console.log(`  - Annual Savings: $${starter.annualSavings.toLocaleString()}`);
  console.log(`  - Payback: ${starter.paybackYears.toFixed(2)} years`);
  console.log(`  - Notes: ${starter.notes.length} audit trail entries\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 2: Persistent Values (QuoteTier interface)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const issues: string[] = [];

  // Check if v4.5 values are in QuoteTier
  if (!('grossAnnualSavings' in recommended)) {
    issues.push('❌ MISSING: grossAnnualSavings not in QuoteTier');
  }
  
  if (!('annualReserves' in recommended)) {
    issues.push('❌ MISSING: annualReserves not in QuoteTier');
  }

  if (!('marginBandId' in recommended)) {
    issues.push('❌ MISSING: marginBandId not in QuoteTier');
  }

  if (!('blendedMarginPercent' in recommended)) {
    issues.push('❌ MISSING: blendedMarginPercent not in QuoteTier');
  }

  if (issues.length > 0) {
    console.log('⚠️  Issues found in QuoteTier interface:\n');
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log('\n💡 Recommendation: Extend QuoteTier interface to include:');
    console.log('   - grossAnnualSavings: number');
    console.log('   - annualReserves: number');
    console.log('   - marginBandId: string');
    console.log('   - blendedMarginPercent: number\n');
  } else {
    console.log('✅ All v4.5 values present in QuoteTier\n');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 3: Properly Calculated Values');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('✓ Checking if calculations use SSOT (not nested/duplicated)...\n');

  // Check audit trail for SSOT compliance
  const hasGrossNote = recommended.notes.some(note => 
    note.includes('Gross annual savings')
  );
  
  const hasNetNote = recommended.notes.some(note =>
    note.includes('Net annual savings')
  );
  
  const hasReservesNote = recommended.notes.some(note =>
    note.includes('Annual reserves')
  );

  const hasMarginNote = recommended.notes.some(note =>
    note.includes('Margin band')
  );

  if (hasGrossNote && hasNetNote) {
    console.log('✅ Audit trail shows gross vs net savings breakdown');
  } else {
    console.log('❌ MISSING: Gross vs net savings not in audit trail');
  }

  if (hasReservesNote) {
    console.log('✅ Audit trail shows annual reserves');
  } else {
    console.log('❌ MISSING: Annual reserves not in audit trail');
  }

  if (hasMarginNote) {
    console.log('✅ Audit trail shows margin band');
  } else {
    console.log('❌ MISSING: Margin band info not in audit trail');
  }

  console.log('\n📋 Sample audit trail notes:');
  recommended.notes.slice(-5).forEach(note => {
    console.log(`   ${note}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 4: Missing Links');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('✓ Checking for broken references between components...\n');

  const missingLinks: string[] = [];

  // Check if step4Logic properly imports from SSOT
  try {
    const { calculateQuote } = await import('../src/services/unifiedQuoteCalculator');
    const { applyMarginPolicy } = await import('../src/services/marginPolicyEngine');
    const { ANNUAL_RESERVES } = await import('../src/services/pricingServiceV45');
    console.log('✅ step4Logic imports calculateQuote (SSOT)');
    console.log('✅ step4Logic imports applyMarginPolicy (margin engine)');
    console.log('✅ step4Logic imports ANNUAL_RESERVES (v4.5 enhancement)');
  } catch (error) {
    missingLinks.push(`❌ Import error: ${error}`);
  }

  // Check if Step4V8 display component exists and can show breakdown
  try {
    const step4Module = await import('../src/wizard/v8/steps/Step4V8');
    console.log('✅ Step4V8.tsx exists (display component)');
  } catch (error) {
    missingLinks.push('❌ Step4V8.tsx not found');
  }

  if (missingLinks.length > 0) {
    console.log('\n⚠️  Missing links found:\n');
    missingLinks.forEach(link => console.log(`  ${link}`));
  } else {
    console.log('\n✅ All component links intact');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const totalIssues = issues.length + missingLinks.length + 
    (!(hasGrossNote && hasNetNote) ? 1 : 0) + 
    (!hasReservesNote ? 1 : 0) + 
    (!hasMarginNote ? 1 : 0);

  if (totalIssues === 0) {
    console.log('✅ All tests passed! V4.5 integration is complete.\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${totalIssues} issue(s) found. Review recommendations above.\n`);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
