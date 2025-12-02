/**
 * USE CASE CALCULATION TRACE ROUTES
 * 
 * Purpose: Trace all calculation paths for use cases to identify:
 * 1. Bad lookup tables (hardcoded values not from SSOT)
 * 2. Deprecated service usage
 * 3. Duplicate calculation logic
 * 4. Missing standardization
 * 
 * Run: npx ts-node --esm scripts/trace_use_case_calculations.ts
 */

// ============================================================================
// SINGLE SOURCES OF TRUTH - These are VALID
// ============================================================================
const VALID_SOURCES = {
  powerCalculations: 'useCasePowerCalculations.ts',
  evCalculations: 'evChargingCalculations.ts',
  financialCalculations: 'centralizedCalculations.ts',
  equipmentPricing: 'equipmentCalculations.ts',
  baselineSizing: 'baselineService.ts',
  batteryPricing: 'unifiedPricingService.ts',
  professionalFinance: 'professionalFinancialModel.ts',
};

// ============================================================================
// DEPRECATED SOURCES - These should NOT be used
// ============================================================================
const DEPRECATED_SOURCES = {
  'bessDataService.ts': 'Use centralizedCalculations.ts or baselineService.ts',
  'pricingService.ts': 'Use unifiedPricingService.ts',
  'industryStandardFormulas.ts': 'Use centralizedCalculations.ts',
};

// ============================================================================
// KNOWN LOOKUP TABLES TO AUDIT
// ============================================================================
interface LookupTable {
  name: string;
  file: string;
  status: 'VALID' | 'DEPRECATED' | 'NEEDS_REVIEW';
  reason: string;
}

const LOOKUP_TABLES: LookupTable[] = [
  // VALID - Single Source of Truth
  {
    name: 'POWER_DENSITY_STANDARDS',
    file: 'useCasePowerCalculations.ts',
    status: 'VALID',
    reason: 'SSOT for power density (ASHRAE, CBECS sourced)'
  },
  {
    name: 'EV_CHARGER_TYPES',
    file: 'evChargingCalculations.ts',
    status: 'VALID',
    reason: 'SSOT for EV charger specs (SAE J1772, IEC 61851)'
  },
  {
    name: 'NREL_ATB_PRICING',
    file: 'unifiedPricingService.ts',
    status: 'VALID',
    reason: 'SSOT for battery pricing (NREL ATB 2024)'
  },
  {
    name: 'ITC_RATES',
    file: 'centralizedCalculations.ts',
    status: 'VALID',
    reason: 'SSOT for tax credits (IRA 2022)'
  },
  
  // NEEDS REVIEW - Potential duplicates
  {
    name: 'MALAYSIA_PRICING',
    file: 'pricingService.ts',
    status: 'DEPRECATED',
    reason: 'Hardcoded RM pricing - migrate to unifiedPricingService'
  },
  {
    name: 'marketData.realTimePricing',
    file: 'pricingIntelligence.ts',
    status: 'NEEDS_REVIEW',
    reason: 'May duplicate unifiedPricingService - check if used'
  },
  {
    name: 'AMENITY_LOADS',
    file: 'baselineService.ts',
    status: 'NEEDS_REVIEW',
    reason: 'Hotel amenity power - should reference useCasePowerCalculations'
  },
];

// ============================================================================
// USE CASE ROUTE TRACES
// ============================================================================
interface CalculationRoute {
  useCase: string;
  powerSource: string;
  powerFunction: string;
  financialSource: string;
  equipmentSource: string;
  issues: string[];
}

const USE_CASE_ROUTES: CalculationRoute[] = [
  // ==================== CAR WASH ====================
  {
    useCase: 'car-wash',
    powerSource: 'useCaseTemplates.ts (equipment list)',
    powerFunction: 'baselineService.calculateDatabaseBaseline()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '⚠️ Uses hardcoded equipment list in useCaseTemplates.ts',
      '✅ Financial calculations use SSOT',
    ]
  },
  
  // ==================== EV CHARGING ====================
  {
    useCase: 'ev-charging',
    powerSource: 'evChargingCalculations.ts (SSOT)',
    powerFunction: 'calculateEVChargingBaseline() → calculateEVHubPower()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'evChargingCalculations.calculateEVHubCosts()',
    issues: [
      '✅ Power calculations use SSOT (EV_CHARGER_SPECS)',
      '✅ Financial calculations use SSOT',
      '✅ EV costs use SSOT',
      '✅ calculateEVChargingPower() in useCasePowerCalculations.ts deprecated - delegates to SSOT',
    ]
  },
  
  // ==================== HOTEL ====================
  {
    useCase: 'hotel',
    powerSource: 'useCasePowerCalculations.ts',
    powerFunction: 'calculateHotelPower()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '✅ Power uses SSOT (POWER_DENSITY_STANDARDS.hotelPerRoom)',
      '✅ Amenity loads read from templates (single source of truth)',
      '✅ AMENITY_POWER_STANDARDS available as reference values',
    ]
  },
  
  // ==================== HOSPITAL ====================
  {
    useCase: 'hospital',
    powerSource: 'useCasePowerCalculations.ts',
    powerFunction: 'calculateHospitalPower()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '✅ Power uses SSOT (POWER_DENSITY_STANDARDS.hospitalPerBed)',
      '✅ Financial calculations use SSOT',
    ]
  },
  
  // ==================== DATACENTER ====================
  {
    useCase: 'datacenter',
    powerSource: 'useCasePowerCalculations.ts + baselineService.ts',
    powerFunction: 'calculateDatacenterPower() + calculateDatacenterBaseline()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '✅ baselineService uses DATACENTER_TIER_STANDARDS from useCasePowerCalculations (SSOT)',
      '✅ Tier multipliers (30%/40%/50%/70%) centralized in SSOT',
      '✅ useCasePowerCalculations uses POWER_DENSITY_STANDARDS',
    ]
  },
  
  // ==================== OFFICE ====================
  {
    useCase: 'office',
    powerSource: 'useCasePowerCalculations.ts',
    powerFunction: 'calculateOfficePower()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '✅ Power uses SSOT (POWER_DENSITY_STANDARDS.office = 6.0 W/sqft)',
      '✅ Financial calculations use SSOT',
    ]
  },
  
  // ==================== AIRPORT ====================
  {
    useCase: 'airport',
    powerSource: 'useCasePowerCalculations.ts',
    powerFunction: 'calculateAirportPower()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '✅ Power uses SSOT (POWER_DENSITY_STANDARDS.airportPerMillion)',
      '✅ Financial calculations use SSOT',
    ]
  },
  
  // ==================== MANUFACTURING ====================
  {
    useCase: 'manufacturing',
    powerSource: 'useCasePowerCalculations.ts',
    powerFunction: 'calculateManufacturingPower()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '✅ Power uses SSOT with industry multipliers',
      '⚠️ Industry type multipliers are hardcoded (food: 1.2, auto: 1.5)',
    ]
  },
  
  // ==================== WAREHOUSE ====================
  {
    useCase: 'warehouse',
    powerSource: 'useCasePowerCalculations.ts',
    powerFunction: 'calculateWarehousePower()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '✅ Power uses SSOT (warehouse: 2.0, coldStorage: 8.0 W/sqft)',
      '✅ Financial calculations use SSOT',
    ]
  },
  
  // ==================== RETAIL ====================
  {
    useCase: 'retail',
    powerSource: 'useCasePowerCalculations.ts',
    powerFunction: 'calculateRetailPower()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '✅ Power uses SSOT (POWER_DENSITY_STANDARDS.retail = 8.0 W/sqft)',
      '✅ Financial calculations use SSOT',
    ]
  },
  
  // ==================== SHOPPING CENTER ====================
  {
    useCase: 'shopping-center',
    powerSource: 'useCasePowerCalculations.ts',
    powerFunction: 'calculateShoppingCenterPower()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '✅ Power uses SSOT (POWER_DENSITY_STANDARDS.shoppingCenter = 10.0 W/sqft)',
      '✅ Financial calculations use SSOT',
    ]
  },
  
  // ==================== AGRICULTURE ====================
  {
    useCase: 'agriculture',
    powerSource: 'useCasePowerCalculations.ts + baselineService.ts',
    powerFunction: 'calculateAgriculturePower() + special handling in baselineService',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '⚠️ baselineService has special agriculture handling with hardcoded irrigation',
      '✅ useCasePowerCalculations has farm type multipliers',
      '⚠️ Farm type multipliers hardcoded (dairy: 1.2, greenhouse: 8.0 kW/acre)',
    ]
  },
  
  // ==================== CASINO ====================
  {
    useCase: 'casino',
    powerSource: 'useCasePowerCalculations.ts',
    powerFunction: 'calculateCasinoPower()',
    financialSource: 'centralizedCalculations.calculateFinancialMetrics()',
    equipmentSource: 'equipmentCalculations.ts',
    issues: [
      '✅ Power uses SSOT (POWER_DENSITY_STANDARDS.casino = 18 W/sqft)',
      '✅ Financial calculations use SSOT',
    ]
  },
];

// ============================================================================
// AUDIT RESULTS
// ============================================================================
function runAudit() {
  console.log('=' .repeat(80));
  console.log('USE CASE CALCULATION ROUTE TRACE - AUDIT REPORT');
  console.log('Generated:', new Date().toISOString());
  console.log('=' .repeat(80));
  console.log();
  
  // 1. Lookup Table Status
  console.log('📊 LOOKUP TABLE STATUS');
  console.log('-'.repeat(80));
  
  const validTables = LOOKUP_TABLES.filter(t => t.status === 'VALID');
  const deprecatedTables = LOOKUP_TABLES.filter(t => t.status === 'DEPRECATED');
  const reviewTables = LOOKUP_TABLES.filter(t => t.status === 'NEEDS_REVIEW');
  
  console.log(`✅ Valid (SSOT): ${validTables.length}`);
  validTables.forEach(t => console.log(`   - ${t.name} (${t.file})`));
  
  console.log(`\n❌ Deprecated: ${deprecatedTables.length}`);
  deprecatedTables.forEach(t => console.log(`   - ${t.name} (${t.file}): ${t.reason}`));
  
  console.log(`\n⚠️  Needs Review: ${reviewTables.length}`);
  reviewTables.forEach(t => console.log(`   - ${t.name} (${t.file}): ${t.reason}`));
  
  // 2. Use Case Routes
  console.log('\n\n📍 USE CASE CALCULATION ROUTES');
  console.log('-'.repeat(80));
  
  let totalIssues = 0;
  let criticalIssues = 0;
  
  USE_CASE_ROUTES.forEach(route => {
    const warnings = route.issues.filter(i => i.startsWith('⚠️'));
    const errors = route.issues.filter(i => i.startsWith('❌'));
    const ok = route.issues.filter(i => i.startsWith('✅'));
    
    totalIssues += warnings.length + errors.length;
    criticalIssues += errors.length;
    
    console.log(`\n🏷️  ${route.useCase.toUpperCase()}`);
    console.log(`   Power: ${route.powerSource}`);
    console.log(`   Function: ${route.powerFunction}`);
    console.log(`   Financial: ${route.financialSource}`);
    console.log(`   Issues:`);
    route.issues.forEach(issue => console.log(`      ${issue}`));
  });
  
  // 3. Summary
  console.log('\n\n📋 SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Total Use Cases Traced: ${USE_CASE_ROUTES.length}`);
  console.log(`Total Issues Found: ${totalIssues}`);
  console.log(`Critical Issues: ${criticalIssues}`);
  console.log(`Deprecated Tables: ${deprecatedTables.length}`);
  console.log(`Tables Needing Review: ${reviewTables.length}`);
  
  // 4. Recommendations
  console.log('\n\n🔧 RECOMMENDED FIXES');
  console.log('-'.repeat(80));
  console.log(`
✅ COMPLETED - EV CHARGING CALCULATIONS
   - calculateEVChargingPower() deprecated - delegates to evChargingCalculations.ts
   - All EV calculations now use evChargingCalculations.ts SSOT

✅ COMPLETED - DATACENTER CALCULATIONS  
   - DATACENTER_TIER_STANDARDS added to useCasePowerCalculations.ts
   - baselineService.ts now imports and uses DATACENTER_TIER_STANDARDS

✅ COMPLETED - HOTEL/AMENITY CALCULATIONS
   - AMENITY_POWER_STANDARDS added to useCasePowerCalculations.ts
   - Templates define context-specific amenity loads (hotel pool > apartment pool)
   - baselineService reads from templates (SSOT for that use case)

REMAINING ITEMS:

1. REMOVE DEPRECATED SOURCES
   - Delete or fully deprecate pricingService.ts (Malaysia RM pricing)
   - Migrate any remaining bessDataService.ts usage

2. MOVE HARDCODED MULTIPLIERS TO LOOKUP TABLES
   - Manufacturing industry multipliers
   - Agriculture farm type multipliers
   - Create INDUSTRY_MULTIPLIERS constant in useCasePowerCalculations.ts
  `);
  
  // 5. Files to check
  console.log('\n\n📁 FILES TO CHECK');
  console.log('-'.repeat(80));
  console.log(`
grep "hardcode|HARDCODE" src/services/*.ts
grep "= [0-9]+" src/services/baselineService.ts | head -30
grep "kW.*=" src/services/baselineService.ts | head -30
grep "POWER_DENSITY" src/services/*.ts
  `);
}

runAudit();
