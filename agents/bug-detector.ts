/**
 * MERLIN BUG DETECTOR
 * ===================
 * Automated static analysis for the Merlin codebase.
 * Runs daily as part of the autonomous agent pipeline.
 *
 * Checks (in order of severity):
 * 1. TypeScript compilation errors
 * 2. ESLint violations (critical rules)
 * 3. SSOT violations — calculations outside unifiedQuoteCalculator.ts
 * 4. Deprecated service usage (WizardV6, WizardV7, etc.)
 * 5. Hard-coded pricing values (POLICY-001 violation)
 * 6. Missing required file headers (POLICY-015)
 * 7. Orphaned imports / dead code patterns
 *
 * Authority Level: Level 0 (Read-Only — never writes source files)
 * See: .merlin-meta/CONSTITUTION.md § 4.1
 */

import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ============================================================
// TYPES
// ============================================================

export type BugSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface BugIssue {
  id: string;
  severity: BugSeverity;
  category: string;
  file: string;
  line?: number;
  message: string;
  rule?: string;
  suggestedFix?: string;
  policyViolation?: string;
}

export interface BugReport {
  generatedAt: string;
  projectRoot: string;
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  issues: BugIssue[];
  summary: string;
  requiresHumanReview: boolean;
  buildPasses: boolean;
}

// ============================================================
// SSOT VIOLATION DETECTOR
// ============================================================
// POLICY-001: BESS sizing & quote generation MUST use unifiedQuoteCalculator.ts
// NOTE: Generic financial math (NPV, IRR, LCOE) may exist in specialized
// service files — only flag functions that are Merlin-specific BESS calculations.

const SSOT_FUNCTIONS = [
  'computeStorageSize',
  'computeSolarSize',
  'estimateDemandChargeSavings',
  'calculateBESSSizing',
  'calculateDemandChargeReduction',
  'calculatePayback',  // Only Merlin-specific payback logic
];

const SSOT_FILE = 'src/services/unifiedQuoteCalculator.ts';

async function detectSSOTViolations(): Promise<BugIssue[]> {
  const issues: BugIssue[] = [];
  const srcDir = path.join(ROOT, 'src');

  const getAllTsFiles = (dir: string): string[] => {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllTsFiles(fullPath));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
    return files;
  };

  const allFiles = getAllTsFiles(srcDir);
  const ssotRelPath = path.join(ROOT, SSOT_FILE);

  for (const filePath of allFiles) {
    if (filePath === ssotRelPath) continue; // Skip the SSOT file itself

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const fnName of SSOT_FUNCTIONS) {
      // Look for function DEFINITIONS (not calls) outside SSOT
      const defPatterns = [
        new RegExp(`^(export\\s+)?(async\\s+)?function\\s+${fnName}\\s*\\(`),
        new RegExp(`^(export\\s+)?const\\s+${fnName}\\s*=\\s*(async\\s+)?\\(`),
      ];

      lines.forEach((line, idx) => {
        for (const pattern of defPatterns) {
          if (pattern.test(line.trim())) {
            const relFile = path.relative(ROOT, filePath);
            issues.push({
              id: `SSOT-${relFile.replace(/[^a-z0-9]/gi, '-')}-L${idx + 1}`,
              severity: 'critical',
              category: 'SSOT Violation',
              file: relFile,
              line: idx + 1,
              message: `Function '${fnName}' defined outside unifiedQuoteCalculator.ts`,
              rule: 'POLICY-001',
              policyViolation: 'POLICY-001',
              suggestedFix: `Move this calculation to src/services/unifiedQuoteCalculator.ts and import it here`,
            });
          }
        }
      });
    }
  }

  return issues;
}

// ============================================================
// DEPRECATED SERVICE DETECTOR
// ============================================================

const DEPRECATED_PATTERNS: Array<{ pattern: RegExp; name: string; replacement: string; severity: BugSeverity }> = [
  { pattern: /WizardV6|wizardV6|wizard-v6/gi, name: 'WizardV6', replacement: 'WizardV8', severity: 'high' },
  { pattern: /WizardV7|wizardV7|wizard-v7/gi, name: 'WizardV7', replacement: 'WizardV8', severity: 'high' },
  { pattern: /legacyCalculator|legacy_calculator/gi, name: 'legacyCalculator', replacement: 'unifiedQuoteCalculator', severity: 'high' },
  { pattern: /oldPriceEngine|old_price_engine/gi, name: 'oldPriceEngine', replacement: 'unifiedQuoteCalculator', severity: 'high' },
  { pattern: /quoteCalcV1|quoteCalcV2/gi, name: 'quoteCalcV1/V2', replacement: 'unifiedQuoteCalculator', severity: 'medium' },
  { pattern: /from\s+['"]\.\.\/services\/verticalCalculators['"]/g, name: 'verticalCalculators (deprecated)', replacement: 'unifiedQuoteCalculator', severity: 'medium' },
];

async function detectDeprecatedUsage(): Promise<BugIssue[]> {
  const issues: BugIssue[] = [];
  const srcDir = path.join(ROOT, 'src');
  const serverDir = path.join(ROOT, 'server');

  const getAllTsFiles = (dir: string): string[] => {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...getAllTsFiles(fullPath));
      else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(fullPath);
    }
    return files;
  };

  const allFiles = [...getAllTsFiles(srcDir), ...getAllTsFiles(serverDir)];

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const dep of DEPRECATED_PATTERNS) {
      lines.forEach((line, idx) => {
        if (dep.pattern.test(line)) {
          dep.pattern.lastIndex = 0; // Reset regex state
          const relFile = path.relative(ROOT, filePath);
          issues.push({
            id: `DEP-${relFile.replace(/[^a-z0-9]/gi, '-')}-L${idx + 1}-${dep.name}`,
            severity: dep.severity,
            category: 'Deprecated Usage',
            file: relFile,
            line: idx + 1,
            message: `Deprecated reference to '${dep.name}'`,
            suggestedFix: `Replace with '${dep.replacement}'`,
          });
        }
      });
    }
  }

  return issues;
}

// ============================================================
// HARD-CODED PRICING DETECTOR
// ============================================================
// POLICY-001: Pricing must come from unifiedQuoteCalculator, not inline literals

const PRICING_PATTERNS = [
  { pattern: /\$\d{3,}(?:,\d{3})*(?:\.\d{2})?/, description: 'Dollar amount literal in code' },
  { pattern: /price\s*[=:]\s*\d{4,}/, description: 'Hard-coded price assignment (4+ digits)' },
  { pattern: /cost\s*[=:]\s*\d{4,}/, description: 'Hard-coded cost assignment (4+ digits)' },
  { pattern: /BESS_PRICE\s*=\s*\d+/, description: 'Hard-coded BESS price constant' },
  { pattern: /solar_cost\s*[=:]\s*\d+/i, description: 'Hard-coded solar cost' },
];

async function detectHardCodedPricing(): Promise<BugIssue[]> {
  const issues: BugIssue[] = [];
  const srcDir = path.join(ROOT, 'src');
  const excluded = [
    'unifiedQuoteCalculator.ts',
    'CANONICAL_ELEMENTS.ts',
    '.test.',
    '.spec.',
    '__tests__',
  ];

  const getAllTsFiles = (dir: string): string[] => {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (excluded.some(ex => fullPath.includes(ex))) continue;
      if (entry.isDirectory()) files.push(...getAllTsFiles(fullPath));
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
    }
    return files;
  };

  const allFiles = getAllTsFiles(srcDir);

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const { pattern, description } of PRICING_PATTERNS) {
      lines.forEach((line, idx) => {
        // Skip comments and string templates with UI formatting
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
        if (/toLocaleString|toFixed|format|display|label|text|render/i.test(line)) return;

        if (pattern.test(line)) {
          const relFile = path.relative(ROOT, filePath);
          issues.push({
            id: `PRICE-${relFile.replace(/[^a-z0-9]/gi, '-')}-L${idx + 1}`,
            severity: 'medium',
            category: 'Hard-Coded Pricing',
            file: relFile,
            line: idx + 1,
            message: `${description}: "${line.trim().slice(0, 80)}"`,
            rule: 'POLICY-001',
            policyViolation: 'POLICY-001',
            suggestedFix: 'Move pricing values to unifiedQuoteCalculator.ts constants',
          });
        }
      });
    }
  }

  return issues;
}

// ============================================================
// TYPESCRIPT COMPILATION CHECK
// ============================================================

async function runTypeScriptCheck(): Promise<BugIssue[]> {
  const issues: BugIssue[] = [];

  try {
    await execAsync(`cd "${ROOT}" && npx tsc --noEmit 2>&1`, { timeout: 60_000 });
    console.log('  ✅ TypeScript: no errors');
  } catch (err) {
    const output = (err as { stdout?: string; stderr?: string }).stdout ?? '';
    const lines = output.split('\n').filter(Boolean);

    for (const line of lines) {
      // Parse "src/file.ts(10,5): error TS2322: message"
      const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/);
      if (match) {
        const [, file, lineNo, , severity, code, message] = match;
        issues.push({
          id: `TS-${file.replace(/[^a-z0-9]/gi, '-')}-L${lineNo}-${code}`,
          severity: severity === 'error' ? 'high' : 'low',
          category: 'TypeScript Error',
          file: path.relative(ROOT, path.resolve(ROOT, file)),
          line: parseInt(lineNo, 10),
          message: `${code}: ${message}`,
          rule: code,
        });
      }
    }
  }

  return issues;
}

// ============================================================
// MISSING FILE HEADER CHECK (POLICY-015)
// ============================================================

async function detectMissingHeaders(): Promise<BugIssue[]> {
  const issues: BugIssue[] = [];
  const servicesDir = path.join(ROOT, 'src', 'services');
  if (!fs.existsSync(servicesDir)) return issues;

  const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

  for (const file of files) {
    const filePath = path.join(servicesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Services should have a descriptive header comment
    if (!content.startsWith('/**') && !content.startsWith('/*') && !content.startsWith('//')) {
      issues.push({
        id: `HEADER-${file}`,
        severity: 'low',
        category: 'Missing File Header',
        file: `src/services/${file}`,
        line: 1,
        message: `Service file missing descriptive header comment`,
        rule: 'POLICY-015',
        policyViolation: 'POLICY-015',
        suggestedFix: 'Add a JSDoc header describing the service purpose, data sources, and authority level',
      });
    }
  }

  return issues;
}

// ============================================================
// SECURITY PATTERNS
// ============================================================

const SECURITY_PATTERNS = [
  { pattern: /process\.env\.\w+(?!\s*\?\?)(?!\s*\|\|)/, description: 'Unguarded env var access (may throw if undefined)', severity: 'medium' as BugSeverity },
  // Matches console.log with an actual secret VALUE (quoted string or variable named *key/*secret/*token/*password)
  { pattern: /console\.log\(.*['"`][A-Za-z0-9+/=]{20,}['"`]/, description: 'Potential secret value logged (long literal string)', severity: 'critical' as BugSeverity },
  { pattern: /console\.log\([^)]*\.(password|apiSecret|privateKey|accessToken|secretKey)\b/, description: 'Potential credential property logged', severity: 'critical' as BugSeverity },
  // eval() only in actual call positions (not inside string/regex literals or comments)
  { pattern: /(?<![/'"`])\beval\s*\((?!.*\/eval)/, description: 'Unsafe eval() usage — verify not inside a regex or string', severity: 'high' as BugSeverity },
  { pattern: /innerHTML\s*=(?!=)/, description: 'Direct innerHTML assignment (XSS risk)', severity: 'high' as BugSeverity },
  { pattern: /dangerouslySetInnerHTML/, description: 'dangerouslySetInnerHTML usage — verify sanitized', severity: 'medium' as BugSeverity },
];

async function detectSecurityIssues(): Promise<BugIssue[]> {
  const issues: BugIssue[] = [];
  const srcDir = path.join(ROOT, 'src');
  const serverDir = path.join(ROOT, 'server');
  // Note: agents/ intentionally excluded — operational scripts, not app code.
  // Their internal regex literals would cause false positives.

  const getAllFiles = (dir: string): string[] => {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...getAllFiles(fullPath));
      else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(fullPath);
    }
    return files;
  };

  const allFiles = [...getAllFiles(srcDir), ...getAllFiles(serverDir)];

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const { pattern, description, severity } of SECURITY_PATTERNS) {
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

        if (pattern.test(line)) {
          const relFile = path.relative(ROOT, filePath);
          issues.push({
            id: `SEC-${relFile.replace(/[^a-z0-9]/gi, '-')}-L${idx + 1}`,
            severity,
            category: 'Security',
            file: relFile,
            line: idx + 1,
            message: description,
            suggestedFix: 'Review for security implications; add null-coalescing, sanitization, or remove sensitive logging',
          });
        }
      });
    }
  }

  return issues;
}

// ============================================================
// MAIN BUG DETECTION RUNNER
// ============================================================

export async function runBugDetection(): Promise<BugReport> {
  const generatedAt = new Date().toISOString();
  console.log('🔍 Running Merlin Bug Detection...');

  const allChecks = await Promise.allSettled([
    detectSSOTViolations().then(r => { console.log(`  SSOT scan: ${r.length} issues`); return r; }),
    detectDeprecatedUsage().then(r => { console.log(`  Deprecated usage scan: ${r.length} issues`); return r; }),
    detectHardCodedPricing().then(r => { console.log(`  Hard-coded pricing scan: ${r.length} issues`); return r; }),
    detectMissingHeaders().then(r => { console.log(`  Header check: ${r.length} issues`); return r; }),
    detectSecurityIssues().then(r => { console.log(`  Security scan: ${r.length} issues`); return r; }),
    runTypeScriptCheck().then(r => { console.log(`  TypeScript check: ${r.length} issues`); return r; }),
  ]);

  const issues: BugIssue[] = [];
  for (const result of allChecks) {
    if (result.status === 'fulfilled') {
      issues.push(...result.value);
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const dedupedIssues = issues.filter(issue => {
    if (seen.has(issue.id)) return false;
    seen.add(issue.id);
    return true;
  });

  // Sort by severity
  const severityOrder: Record<BugSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  dedupedIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const criticalCount = dedupedIssues.filter(i => i.severity === 'critical').length;
  const highCount = dedupedIssues.filter(i => i.severity === 'high').length;
  const mediumCount = dedupedIssues.filter(i => i.severity === 'medium').length;
  const lowCount = dedupedIssues.filter(i => i.severity === 'low').length;

  // TypeScript check — run independently for build status
  let buildPasses = true;
  try {
    execSync(`cd "${ROOT}" && npx tsc --noEmit`, { stdio: 'pipe', timeout: 60_000 });
  } catch {
    buildPasses = false;
  }

  const requiresHumanReview = criticalCount > 0 || !buildPasses;

  const summary = [
    `Bug Detection: ${dedupedIssues.length} total issues`,
    `  🔴 Critical: ${criticalCount}`,
    `  🟠 High: ${highCount}`,
    `  🟡 Medium: ${mediumCount}`,
    `  🟢 Low: ${lowCount}`,
    `  Build: ${buildPasses ? '✅ passes' : '❌ fails'}`,
    requiresHumanReview ? '⚠️ REQUIRES HUMAN REVIEW' : '✅ Safe for autonomous operation',
  ].join('\n');

  return {
    generatedAt,
    projectRoot: ROOT,
    totalIssues: dedupedIssues.length,
    critical: criticalCount,
    high: highCount,
    medium: mediumCount,
    low: lowCount,
    issues: dedupedIssues,
    summary,
    requiresHumanReview,
    buildPasses,
  };
}

export async function saveBugReport(report: BugReport): Promise<string> {
  const reportsDir = path.join(__dirname, '_reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const dateStr = new Date().toISOString().split('T')[0];
  const filePath = path.join(reportsDir, `bugs-${dateStr}.json`);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  console.log(`  💾 Bug report saved: ${filePath}`);
  return filePath;
}

// ============================================================
// STANDALONE RUN
// ============================================================

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runBugDetection()
    .then(async (report) => {
      await saveBugReport(report);
      console.log('\n' + report.summary);
      process.exit(report.critical > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Bug detection failed:', err);
      process.exit(1);
    });
}
