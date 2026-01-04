/**
 * WIZARD ARCHITECTURE ANALYZER
 * 
 * This script analyzes the current wizard implementation to:
 * 1. Map all imports/exports and dependencies
 * 2. Identify calculation functions that should use new architecture
 * 3. Find SSOT violations (duplicate calculations, hardcoded values)
 * 4. Generate migration plan
 * 
 * Run: npx ts-node scripts/analyze-wizard-architecture.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const WIZARD_DIR = 'src/components/wizard/v6';
const SERVICES_DIR = 'src/services';

interface FileAnalysis {
  file: string;
  imports: ImportInfo[];
  exports: string[];
  calculations: CalculationInfo[];
  hardcodedValues: HardcodedValue[];
  stateUsage: string[];
  ssotViolations: SSOTViolation[];
}

interface ImportInfo {
  source: string;
  items: string[];
  isService: boolean;
  isCalculation: boolean;
}

interface CalculationInfo {
  name: string;
  line: number;
  type: 'inline' | 'function' | 'service-call';
  shouldMigrate: boolean;
  reason?: string;
}

interface HardcodedValue {
  value: string | number;
  line: number;
  context: string;
  category: 'cost' | 'rate' | 'sizing' | 'financial' | 'other';
}

interface SSOTViolation {
  type: 'duplicate-calc' | 'hardcoded-constant' | 'local-override' | 'inconsistent-source';
  description: string;
  file: string;
  line: number;
  recommendation: string;
}

// Patterns to detect
const PATTERNS = {
  // Import patterns
  import: /^import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/gm,
  
  // Calculation patterns
  calculation: /(?:const|let)\s+(\w+)\s*=\s*(?:.*(?:Math\.|calculate|\*|\/|\+|-)\s*[\d\w]+)/g,
  
  // Hardcoded values that should be constants
  hardcodedCost: /(?:cost|price|rate)\s*[=:]\s*(\d+(?:\.\d+)?)/gi,
  hardcodedPercent: /(\d+(?:\.\d+)?)\s*(?:\*\s*)?(?:0\.\d+|percent|%)/gi,
  hardcodedKw: /(\d+)\s*(?:kW|kWh|MW|MWh)/gi,
  
  // State access patterns
  stateAccess: /state\.(\w+)/g,
  wizardState: /WizardState/g,
  
  // Service imports
  serviceImport: /from\s+['"](?:@\/services|\.\.\/.*services)\/([^'"]+)['"]/g,
  
  // TrueQuote usage
  trueQuoteCall: /calculateTrueQuote|TrueQuoteEngine|trueQuoteResult/g,
  
  // Magic Fit usage  
  magicFitCall: /MagicFit|magicFit|generateOptions/gi,
};

function analyzeFile(filePath: string): FileAnalysis {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileName = path.basename(filePath);
  
  const analysis: FileAnalysis = {
    file: fileName,
    imports: [],
    exports: [],
    calculations: [],
    hardcodedValues: [],
    stateUsage: [],
    ssotViolations: [],
  };

  // Analyze imports
  const importMatches = content.matchAll(/^import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/gm);
  for (const match of importMatches) {
    const items = (match[1] || match[2] || '').split(',').map(s => s.trim()).filter(Boolean);
    const source = match[3];
    const isService = source.includes('services') || source.includes('Service');
    const isCalculation = source.toLowerCase().includes('calc') || 
                          source.toLowerCase().includes('engine') ||
                          items.some(i => i.toLowerCase().includes('calc'));
    
    analysis.imports.push({ source, items, isService, isCalculation });
  }

  // Analyze exports
  const exportMatches = content.matchAll(/export\s+(?:function|const|interface|type)\s+(\w+)/g);
  for (const match of exportMatches) {
    analysis.exports.push(match[1]);
  }

  // Find hardcoded values
  lines.forEach((line, idx) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    
    // Cost/price patterns
    const costMatch = line.match(/(?:cost|price|Cost|Price)\s*[=:]\s*(\d+)/);
    if (costMatch) {
      analysis.hardcodedValues.push({
        value: parseInt(costMatch[1]),
        line: idx + 1,
        context: line.trim().substring(0, 80),
        category: 'cost',
      });
    }
    
    // Rate patterns (0.xx or percentage)
    const rateMatch = line.match(/(?:rate|Rate|ITC|itc)\s*[=:]\s*(0\.\d+)/);
    if (rateMatch) {
      analysis.hardcodedValues.push({
        value: parseFloat(rateMatch[1]),
        line: idx + 1,
        context: line.trim().substring(0, 80),
        category: 'rate',
      });
    }
    
    // kW/kWh patterns
    const kwMatch = line.match(/(\d+)\s*(?:\*\s*)?(?:kW|kWh)/);
    if (kwMatch && parseInt(kwMatch[1]) > 10) {
      analysis.hardcodedValues.push({
        value: parseInt(kwMatch[1]),
        line: idx + 1,
        context: line.trim().substring(0, 80),
        category: 'sizing',
      });
    }
  });

  // Find state usage
  const stateMatches = content.matchAll(/state\.(\w+)/g);
  const stateFields = new Set<string>();
  for (const match of stateMatches) {
    stateFields.add(match[1]);
  }
  analysis.stateUsage = Array.from(stateFields);

  // Find calculations
  lines.forEach((line, idx) => {
    if (line.includes('calculateTrueQuote') || line.includes('TrueQuoteEngine')) {
      analysis.calculations.push({
        name: 'TrueQuote call',
        line: idx + 1,
        type: 'service-call',
        shouldMigrate: true,
        reason: 'Should use TrueQuoteEngineV2 via MerlinOrchestrator',
      });
    }
    
    // Inline financial calculations
    if (line.match(/(?:savings|cost|roi|payback)\s*[=:]/i) && line.match(/[\*\/\+\-]\s*\d/)) {
      analysis.calculations.push({
        name: 'Inline financial calc',
        line: idx + 1,
        type: 'inline',
        shouldMigrate: true,
        reason: 'Should use financialCalculator',
      });
    }
  });

  // Detect SSOT violations
  if (analysis.hardcodedValues.length > 0) {
    analysis.hardcodedValues.forEach(hv => {
      if (hv.category === 'cost' || hv.category === 'rate') {
        analysis.ssotViolations.push({
          type: 'hardcoded-constant',
          description: `Hardcoded ${hv.category}: ${hv.value}`,
          file: fileName,
          line: hv.line,
          recommendation: `Import from @/services/data/constants or calculationConstantsService`,
        });
      }
    });
  }

  // Check for duplicate TrueQuote calculations
  const trueQuoteCalls = (content.match(/calculateTrueQuote/g) || []).length;
  if (trueQuoteCalls > 1) {
    analysis.ssotViolations.push({
      type: 'duplicate-calc',
      description: `Multiple TrueQuote calls (${trueQuoteCalls}x)`,
      file: fileName,
      line: 0,
      recommendation: 'Consolidate to single call via MerlinOrchestrator',
    });
  }

  return analysis;
}

function analyzeDirectory(dir: string): FileAnalysis[] {
  const results: FileAnalysis[] = [];
  
  function walkDir(currentDir: string) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(analyzeFile(filePath));
      }
    }
  }
  
  walkDir(dir);
  return results;
}

function generateReport(analyses: FileAnalysis[]): string {
  let report = '';
  
  report += '═══════════════════════════════════════════════════════════════════\n';
  report += '           WIZARD ARCHITECTURE ANALYSIS REPORT\n';
  report += '═══════════════════════════════════════════════════════════════════\n\n';

  // Summary
  const totalViolations = analyses.reduce((sum, a) => sum + a.ssotViolations.length, 0);
  const totalCalculations = analyses.reduce((sum, a) => sum + a.calculations.filter(c => c.shouldMigrate).length, 0);
  const totalHardcoded = analyses.reduce((sum, a) => sum + a.hardcodedValues.length, 0);

  report += '📊 SUMMARY\n';
  report += '─────────────────────────────────────────────────────────────────\n';
  report += `   Files analyzed: ${analyses.length}\n`;
  report += `   SSOT violations: ${totalViolations}\n`;
  report += `   Calculations to migrate: ${totalCalculations}\n`;
  report += `   Hardcoded values found: ${totalHardcoded}\n\n`;

  // SSOT Violations (Priority)
  report += '🚨 SSOT VIOLATIONS (Fix These First)\n';
  report += '─────────────────────────────────────────────────────────────────\n';
  
  for (const analysis of analyses) {
    if (analysis.ssotViolations.length > 0) {
      report += `\n📄 ${analysis.file}\n`;
      for (const violation of analysis.ssotViolations) {
        report += `   Line ${violation.line}: ${violation.type}\n`;
        report += `      ${violation.description}\n`;
        report += `      → ${violation.recommendation}\n`;
      }
    }
  }

  // Service Dependencies
  report += '\n\n📦 SERVICE DEPENDENCIES\n';
  report += '─────────────────────────────────────────────────────────────────\n';
  
  const serviceDeps = new Map<string, string[]>();
  for (const analysis of analyses) {
    const services = analysis.imports.filter(i => i.isService).map(i => i.source);
    if (services.length > 0) {
      serviceDeps.set(analysis.file, services);
    }
  }
  
  for (const [file, services] of serviceDeps) {
    report += `\n${file}:\n`;
    services.forEach(s => report += `   └── ${s}\n`);
  }

  // State Field Usage
  report += '\n\n📋 WIZARD STATE FIELDS USED\n';
  report += '─────────────────────────────────────────────────────────────────\n';
  
  const allStateFields = new Set<string>();
  for (const analysis of analyses) {
    analysis.stateUsage.forEach(f => allStateFields.add(f));
  }
  
  const sortedFields = Array.from(allStateFields).sort();
  report += sortedFields.map(f => `   • ${f}`).join('\n');

  // Migration Checklist
  report += '\n\n\n✅ MIGRATION CHECKLIST\n';
  report += '─────────────────────────────────────────────────────────────────\n';
  report += `
   [ ] 1. Replace TrueQuoteEngine imports with MerlinOrchestrator
   [ ] 2. Replace calculateTrueQuote() with generateQuote()
   [ ] 3. Update state handling to use MerlinRequest format
   [ ] 4. Replace hardcoded constants with imports from data/constants
   [ ] 5. Remove inline calculations, use calculator modules
   [ ] 6. Update Step5MagicFit to use MagicFit.ts results
   [ ] 7. Update Step6Quote to use TrueQuoteAuthenticatedResult
   [ ] 8. Test all wizard flows end-to-end
   [ ] 9. Deprecate old TrueQuoteEngine.ts
   [ ] 10. Remove Step5MagicFit.tsx inline calculations
`;

  // Files to Modify
  report += '\n\n📝 FILES TO MODIFY (Priority Order)\n';
  report += '─────────────────────────────────────────────────────────────────\n';
  
  const filesByViolations = analyses
    .filter(a => a.ssotViolations.length > 0 || a.calculations.some(c => c.shouldMigrate))
    .sort((a, b) => b.ssotViolations.length - a.ssotViolations.length);
  
  filesByViolations.forEach((analysis, idx) => {
    const violations = analysis.ssotViolations.length;
    const calcs = analysis.calculations.filter(c => c.shouldMigrate).length;
    report += `   ${idx + 1}. ${analysis.file} (${violations} violations, ${calcs} calcs)\n`;
  });

  report += '\n═══════════════════════════════════════════════════════════════════\n';
  
  return report;
}

// Main execution
console.log('Analyzing wizard architecture...\n');

const wizardAnalyses = analyzeDirectory(WIZARD_DIR);
const report = generateReport(wizardAnalyses);

console.log(report);

// Save report
const reportPath = 'scripts/wizard-analysis-report.txt';
fs.writeFileSync(reportPath, report);
console.log(`\n📄 Report saved to: ${reportPath}`);

// Also output JSON for programmatic use
const jsonPath = 'scripts/wizard-analysis.json';
fs.writeFileSync(jsonPath, JSON.stringify(wizardAnalyses, null, 2));
console.log(`📄 JSON data saved to: ${jsonPath}`);
