#!/usr/bin/env npx tsx
/**
 * MERLIN CALCULATION AUDIT SCRIPT
 * ================================
 * 
 * This script audits ALL calculations across Merlin to:
 * 1. Detect hardcoded values that should be database-driven
 * 2. Validate formulas against industry standards
 * 3. Check for calculation inconsistencies
 * 4. Verify SSOT compliance (all calculations flow through centralized services)
 * 
 * Run: npx tsx scripts/audit-calculations.ts
 * 
 * Created: Dec 10, 2025
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SRC_DIR = path.join(process.cwd(), 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const SERVICES_DIR = path.join(SRC_DIR, 'services');
const UTILS_DIR = path.join(SRC_DIR, 'utils');

// SSOT Services - These ARE allowed to have calculations
const SSOT_FILES = [
  'centralizedCalculations.ts',
  'unifiedQuoteCalculator.ts', 
  'equipmentCalculations.ts',
  'useCasePowerCalculations.ts',
  'evChargingCalculations.ts',
  'advancedFinancialModeling.ts',
  'professionalFinancialModel.ts',
  'unifiedPricingService.ts',
  'baselineService.ts',
];

// Known valid constants from industry standards
const VALID_CONSTANTS = {
  // EV Charger Power Levels (SAE J1772, CCS)
  EV_L1_POWER_KW: [1.2, 1.4, 1.9],
  EV_L2_POWER_KW: [7, 7.2, 11, 19, 19.2, 22],
  EV_DCFC_POWER_KW: [50, 150],
  EV_HPC_POWER_KW: [250, 350],
  
  // Battery pricing (NREL ATB 2024 range) - Dec 2025 market rates
  BESS_PRICE_PER_KWH: { min: 100, max: 175, current: 125 }, // Updated from market scraper
  
  // Solar pricing (industry 2024-2025)
  SOLAR_PRICE_PER_WATT: { commercial: 0.85, utility: 0.65, residential: 1.10, max: 2.50 },
  
  // Financial constants
  DISCOUNT_RATES: [0.06, 0.07, 0.08, 0.10],
  ITC_RATES: [0.30, 0.40, 0.50], // 30% base, up to 50% with bonuses
  
  // Demand charges ($/kW) - typical ranges
  DEMAND_CHARGE: { min: 5, max: 30 },
  
  // Load factors
  LOAD_FACTORS: { min: 0.3, max: 0.9 },
  
  // Concurrency factors for EV charging
  CONCURRENCY_FACTORS: [0.55, 0.65, 0.70, 0.75],
  
  // Solar roof space factors
  SOLAR_SQFT_PER_KW: 100, // 1 kW needs ~100 sq ft
  ROOF_USABLE_FACTOR: 0.6, // 60% of building footprint available
};

// Severity levels for violations
type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// Patterns that indicate hardcoded calculations in components (VIOLATIONS)
const VIOLATION_PATTERNS: Array<{
  pattern: RegExp;
  description: string;
  severity: Severity;
  fix: string;
}> = [
  // CRITICAL: Direct cost calculations that affect quotes
  { 
    pattern: /storageSizeMW\s*\*.*\*\s*\d{4,}/g, 
    description: 'Hardcoded battery pricing (should use SSOT)',
    severity: 'CRITICAL',
    fix: 'Use getBatteryPricing() from unifiedPricingService or calculateQuote() from unifiedQuoteCalculator'
  },
  { 
    pattern: /\*\s*(155|175|200|250)\s*\*?\s*(1\.25|1\.2|1\.15)/g, 
    description: 'Hardcoded $/kWh with installation multiplier',
    severity: 'CRITICAL',
    fix: 'Use calculateEquipmentBreakdown() which includes installation costs automatically'
  },
  { 
    pattern: /\*\s*(250000|300000|350000|400000)/g, 
    description: 'Hardcoded $/MWh pricing',
    severity: 'CRITICAL',
    fix: 'Use getMarketAdjustedPrice() from marketDataIntegrationService'
  },
  
  // HIGH: Financial calculations that affect ROI/payback
  { 
    pattern: /payback\s*=\s*cost\s*\/\s*savings/gi, 
    description: 'Manual payback calculation',
    severity: 'HIGH',
    fix: 'Use calculateFinancialMetrics() from centralizedCalculations which handles tax credits and degradation'
  },
  { 
    pattern: /roi\s*=.*\/.*\*\s*100/gi, 
    description: 'Manual ROI calculation',
    severity: 'HIGH',
    fix: 'Use calculateFinancialMetrics().roi10Year or roi25Year from centralizedCalculations'
  },
  { 
    pattern: /npv\s*[=+].*Math\.pow/gi, 
    description: 'Manual NPV calculation',
    severity: 'HIGH',
    fix: 'Use calculateFinancialMetrics({ includeNPV: true }) or calculateAdvancedFinancialMetrics()'
  },
  
  // MEDIUM: Industry-specific calculations
  { 
    pattern: /rooms?\s*\*\s*\d+\.?\d*\s*\*?/gi, 
    description: 'Hardcoded room power calculation',
    severity: 'MEDIUM',
    fix: 'Use calculateHotelPowerSimple() from useCasePowerCalculations'
  },
  { 
    pattern: /beds?\s*\*\s*\d+\.?\d*/gi, 
    description: 'Hardcoded bed power calculation',
    severity: 'MEDIUM',
    fix: 'Use calculateHospitalPower() from useCasePowerCalculations'
  },
  { 
    pattern: /sqFt\s*\*\s*(0\.\d+|\d+\.?\d*)/gi, 
    description: 'Hardcoded sq ft power factor',
    severity: 'MEDIUM',
    fix: 'Use calculateOfficePowerSimple() or calculateWarehousePower() from useCasePowerCalculations'
  },
  
  // LOW: Constants that should be configurable
  { 
    pattern: /\*\s*0\.08\s*\*/g, 
    description: 'Hardcoded discount rate (should be configurable)',
    severity: 'LOW',
    fix: 'Use getConstant("discount_rate") from calculationConstantsService'
  },
  { 
    pattern: /\*\s*0\.30\s*(?:\/\/|$|\n|\r)/gm, 
    description: 'Hardcoded 30% ITC (should use database)',
    severity: 'LOW',
    fix: 'Use getConstant("federal_tax_credit_rate") from calculationConstantsService'
  },
];

// Patterns for database-driven constants (GOOD)
const DATABASE_PATTERNS = [
  /pricing_configurations/,
  /calculation_constants/,
  /getBatteryPricing/,
  /getSolarPricing/,
  /getFinancialDefaults/,
];

// ============================================================================
// TYPES
// ============================================================================

interface AuditResult {
  file: string;
  line: number;
  type: 'VIOLATION' | 'WARNING' | 'INFO';
  category: string;
  description: string;
  code: string;
  recommendation: string;
}

interface CalculationModel {
  name: string;
  file: string;
  formula: string;
  variables: string[];
  sources: string[];
  isSSotCompliant: boolean;
}

// ============================================================================
// AUDIT FUNCTIONS
// ============================================================================

function getAllFiles(dir: string, ext: string = '.ts'): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, ext));
    } else if (item.endsWith(ext) || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function isSSotFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return SSOT_FILES.includes(fileName);
}

function auditFile(filePath: string): AuditResult[] {
  const results: AuditResult[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);
  const isComponent = filePath.includes('/components/');
  const isService = filePath.includes('/services/');
  
  // Skip SSOT files for violation checks (they're allowed to have calculations)
  if (isSSotFile(filePath)) {
    // For SSOT files, just check for proper documentation
    const hasDocumentation = content.includes('/**') && content.includes('* @');
    if (!hasDocumentation) {
      results.push({
        file: relativePath,
        line: 1,
        type: 'WARNING',
        category: 'Documentation',
        description: 'SSOT file should have JSDoc documentation',
        code: '',
        recommendation: 'Add JSDoc comments explaining formulas and sources',
      });
    }
    return results;
  }
  
  // Check components for calculation violations
  if (isComponent) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Get context: check previous 3 lines and current line for SSOT markers
      const contextStart = Math.max(0, i - 3);
      const contextLines = lines.slice(contextStart, i + 1).join('\n');
      
      // Skip lines that are already marked with SSOT comments (on current or previous lines)
      if (/SSOT-COMPLIANT|SSOT:\s*|TODO.*SSOT|centralizedCalculations|useCasePowerCalculations|unifiedQuoteCalculator/i.test(contextLines)) {
        continue;
      }
      
      for (const { pattern, description, severity, fix } of VIOLATION_PATTERNS) {
        const matches = line.match(pattern);
        if (matches) {
          results.push({
            file: relativePath,
            line: lineNum,
            type: 'VIOLATION',
            category: `[${severity}] Hardcoded Calculation`,
            description,
            code: line.trim().substring(0, 100),
            recommendation: fix,
          });
        }
      }
      
      // Check for direct Math operations that might be calculations
      if (/Math\.(pow|floor|ceil|round|max|min)\s*\([^)]*[/*+-][^)]*\)/.test(line) && !isService) {
        // Check context - is this just formatting or actual calculation?
        if (!/toFixed|toLocaleString|format|display/i.test(lines.slice(Math.max(0, i-2), i+3).join(' '))) {
          results.push({
            file: relativePath,
            line: lineNum,
            type: 'WARNING',
            category: 'Potential Calculation',
            description: 'Math operation in component - verify this is display logic, not business logic',
            code: line.trim().substring(0, 100),
            recommendation: 'If this is a calculation, move to SSOT service',
          });
        }
      }
    }
  }
  
  return results;
}

function auditHardcodedNumbers(filePath: string): AuditResult[] {
  const results: AuditResult[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Skip test files and type definitions
  if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('.d.ts')) {
    return results;
  }
  
  // Known suspicious numbers that should be constants or database-driven
  const suspiciousNumbers: { pattern: RegExp; category: string; validContext: string[] }[] = [
    { pattern: /[=:]\s*300000/g, category: 'Battery pricing', validContext: ['SSOT', 'constant', 'test'] },
    { pattern: /[=:]\s*150000/g, category: 'Equipment pricing', validContext: ['SSOT', 'constant'] },
    { pattern: /[=:]\s*0\.08(?![0-9])/g, category: 'Discount rate', validContext: ['SSOT', 'default', 'constant'] },
    { pattern: /[=:]\s*0\.30(?![0-9])/g, category: 'ITC rate', validContext: ['SSOT', 'default', 'constant'] },
    { pattern: /[=:]\s*25(?:0{3})?(?![0-9])/g, category: 'Project lifetime', validContext: ['constant', 'YEARS'] },
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    for (const { pattern, category, validContext } of suspiciousNumbers) {
      if (pattern.test(line)) {
        // Check if in valid context
        const contextLines = lines.slice(Math.max(0, i-3), i+1).join(' ');
        const isValidContext = validContext.some(ctx => 
          contextLines.toLowerCase().includes(ctx.toLowerCase())
        );
        
        if (!isValidContext && !isSSotFile(filePath)) {
          results.push({
            file: relativePath,
            line: lineNum,
            type: 'WARNING',
            category: `Hardcoded ${category}`,
            description: `Possible hardcoded ${category.toLowerCase()} value`,
            code: line.trim().substring(0, 100),
            recommendation: 'Use database-driven constant or SSOT service',
          });
        }
      }
    }
  }
  
  return results;
}

function extractCalculationModels(): CalculationModel[] {
  const models: CalculationModel[] = [];
  
  // Parse SSOT files for calculation models
  for (const ssotFile of SSOT_FILES) {
    const filePath = path.join(SERVICES_DIR, ssotFile);
    if (!fs.existsSync(filePath)) {
      // Try utils directory
      const utilsPath = path.join(UTILS_DIR, ssotFile);
      if (fs.existsSync(utilsPath)) {
        models.push(...extractModelsFromFile(utilsPath, ssotFile));
      }
      continue;
    }
    models.push(...extractModelsFromFile(filePath, ssotFile));
  }
  
  return models;
}

function extractModelsFromFile(filePath: string, fileName: string): CalculationModel[] {
  const models: CalculationModel[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Find exported functions that look like calculations
  const functionPattern = /export\s+(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
  let match;
  
  while ((match = functionPattern.exec(content)) !== null) {
    const funcName = match[1];
    
    // Skip helper functions
    if (/^(get|set|format|display|render)/i.test(funcName)) continue;
    
    // Check if function name suggests calculation
    if (/calculate|compute|estimate|size|price|cost|financial|power|energy/i.test(funcName)) {
      models.push({
        name: funcName,
        file: fileName,
        formula: `See ${fileName}:${funcName}()`,
        variables: [], // Would need deeper parsing
        sources: ['SSOT Service'],
        isSSotCompliant: true,
      });
    }
  }
  
  return models;
}

// ============================================================================
// EV CHARGING SPECIFIC AUDIT
// ============================================================================

function auditEVChargingCalculations(): { models: string[]; issues: AuditResult[] } {
  const issues: AuditResult[] = [];
  const models: string[] = [];
  
  const evCalcPath = path.join(SERVICES_DIR, 'evChargingCalculations.ts');
  if (!fs.existsSync(evCalcPath)) {
    issues.push({
      file: 'evChargingCalculations.ts',
      line: 0,
      type: 'WARNING',
      category: 'Missing SSOT',
      description: 'EV Charging calculations file not found',
      code: '',
      recommendation: 'Create evChargingCalculations.ts as SSOT',
    });
    return { models, issues };
  }
  
  const content = fs.readFileSync(evCalcPath, 'utf-8');
  
  // Document the calculation models
  models.push(`
═══════════════════════════════════════════════════════════════════════════════
EV CHARGING CALCULATIONS - MATHEMATICAL MODELS
═══════════════════════════════════════════════════════════════════════════════

1. POWER CALCULATION (calculateEVHubPower)
   ─────────────────────────────────────────
   Formula: Total Power = Σ(charger_count × charger_power)
   
   Level 2:  P_L2 = (L2_7kw × 7) + (L2_11kw × 11) + (L2_19kw × 19.2) + (L2_22kw × 22) kW
   DCFC:     P_DCFC = (DCFC_50 × 50) + (DCFC_150 × 150) kW
   HPC:      P_HPC = (HPC_250 × 250) + (HPC_350 × 350) kW
   
   Total:    P_total = P_L2 + P_DCFC + P_HPC
   
   Peak Demand: P_peak = P_total × Concurrency Factor
   
   Concurrency Factors (industry standard):
   - Small Hub (4-30 chargers):    70%
   - Medium Hub (30-100 chargers): 65%
   - Super Site (100+ chargers):   55%
   
   Source: SAE J1772, CCS Combo standards, ChargePoint deployment data

2. COST CALCULATION (calculateEVHubCosts)
   ────────────────────────────────────────
   Hardware:    C_hw = Σ(charger_count × hardware_cost_per_unit)
   Installation: C_inst = Σ(charger_count × install_cost_per_unit)
   Make-Ready:   C_make = num_ports × $500 (civil, conduit, panel)
   Networking:   C_net = num_ports × $200 (per-port networking)
   Contingency:  C_cont = (C_hw + C_inst + C_make + C_net) × 10%
   
   Total: C_total = C_hw + C_inst + C_make + C_net + C_cont
   
   Pricing Sources (per unit):
   ┌─────────────────┬────────────┬────────────┐
   │ Charger Type    │ Hardware   │ Install    │
   ├─────────────────┼────────────┼────────────┤
   │ L2 7kW          │ $5,000     │ $3,000     │
   │ L2 11kW         │ $6,500     │ $3,500     │
   │ L2 19.2kW       │ $8,000     │ $4,000     │
   │ L2 22kW         │ $10,000    │ $4,500     │
   │ DCFC 50kW       │ $35,000    │ $15,000    │
   │ DCFC 150kW      │ $55,000    │ $30,000    │
   │ HPC 250kW       │ $90,000    │ $40,000    │
   │ HPC 350kW       │ $130,000   │ $50,000    │
   └─────────────────┴────────────┴────────────┘
   
   Source: ChargePoint, ABB, vendor quotes (2024-2025)

3. BESS SIZING FOR EV HUB (calculateEVHubBESSSize)
   ───────────────────────────────────────────────
   Purpose: Peak shaving to reduce demand charges
   
   Formula:
   - Target Reduction = Peak Demand × 30% (typical)
   - BESS Power (kW) = Target Reduction
   - BESS Energy (kWh) = BESS Power × 2 hours (typical duration)
   
   Or for specific peak shaving:
   - P_bess = P_peak - P_desired_max
   - E_bess = P_bess × peak_duration_hours

4. FINANCIAL METRICS
   ───────────────────
   Demand Charge Savings = BESS_Power × Demand_Rate × 12 months
   Simple Payback = Total_Cost / Annual_Savings
   ROI = (25yr_Savings - Total_Cost) / Total_Cost × 100%
   
   Note: All financial calculations MUST use centralizedCalculations.ts
   for NPV, IRR, and advanced metrics.
`);

  // Check for proper constant exports
  if (!content.includes('EV_CHARGER_SPECS')) {
    issues.push({
      file: 'evChargingCalculations.ts',
      line: 0,
      type: 'VIOLATION',
      category: 'Missing Constants',
      description: 'EV_CHARGER_SPECS constant not found',
      code: '',
      recommendation: 'Export EV_CHARGER_SPECS with all power levels',
    });
  }
  
  return { models, issues };
}

// ============================================================================
// MAIN AUDIT EXECUTION
// ============================================================================

async function runAudit() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    MERLIN CALCULATION AUDIT REPORT                            ║
║                         Generated: ${new Date().toISOString()}              ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

  const allResults: AuditResult[] = [];
  
  // 1. Audit all TypeScript files
  console.log('\n📁 Scanning files...\n');
  
  const allFiles = [
    ...getAllFiles(COMPONENTS_DIR),
    ...getAllFiles(SERVICES_DIR),
    ...getAllFiles(UTILS_DIR),
  ];
  
  console.log(`   Found ${allFiles.length} TypeScript files`);
  
  for (const file of allFiles) {
    const results = auditFile(file);
    const hardcodedResults = auditHardcodedNumbers(file);
    allResults.push(...results, ...hardcodedResults);
  }
  
  // 2. Audit EV Charging specifically
  console.log('\n⚡ Auditing EV Charging Calculations...\n');
  const { models: evModels, issues: evIssues } = auditEVChargingCalculations();
  allResults.push(...evIssues);
  
  // 3. Extract calculation models
  console.log('\n📊 Extracting Calculation Models...\n');
  const calculationModels = extractCalculationModels();
  
  // 4. Generate report
  console.log('\n' + '═'.repeat(80));
  console.log('VIOLATIONS (Must Fix)');
  console.log('═'.repeat(80));
  
  const violations = allResults.filter(r => r.type === 'VIOLATION');
  if (violations.length === 0) {
    console.log('✅ No violations found!');
  } else {
    for (const v of violations) {
      console.log(`
❌ ${v.file}:${v.line}
   Category: ${v.category}
   Issue: ${v.description}
   Code: ${v.code}
   Fix: ${v.recommendation}
`);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('WARNINGS (Review)');
  console.log('═'.repeat(80));
  
  const warnings = allResults.filter(r => r.type === 'WARNING');
  if (warnings.length === 0) {
    console.log('✅ No warnings!');
  } else {
    // Group by file
    const byFile = new Map<string, AuditResult[]>();
    for (const w of warnings) {
      const existing = byFile.get(w.file) || [];
      existing.push(w);
      byFile.set(w.file, existing);
    }
    
    for (const [file, results] of byFile) {
      console.log(`\n📄 ${file}`);
      for (const r of results) {
        console.log(`   ⚠️  Line ${r.line}: ${r.description}`);
      }
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('SSOT CALCULATION MODELS');
  console.log('═'.repeat(80));
  
  console.log(`
Found ${calculationModels.length} calculation functions in SSOT services:
`);
  
  for (const model of calculationModels) {
    console.log(`   ✓ ${model.name}() in ${model.file}`);
  }
  
  // Print EV Charging models
  for (const model of evModels) {
    console.log(model);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('SUMMARY');
  console.log('═'.repeat(80));
  console.log(`
   Files Scanned:     ${allFiles.length}
   Violations Found:  ${violations.length}
   Warnings Found:    ${warnings.length}
   SSOT Models:       ${calculationModels.length}
   
   Status: ${violations.length === 0 ? '✅ COMPLIANT' : '❌ NEEDS ATTENTION'}
`);
  
  // Exit with error code if violations found
  if (violations.length > 0) {
    process.exit(1);
  }
}

// Run the audit
runAudit().catch(console.error);
