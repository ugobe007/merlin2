#!/usr/bin/env node

/**
 * Automated ESLint Error Fixer
 * 
 * This script automatically fixes common ESLint errors:
 * - Unused variables → prefix with _
 * - `any` types → replace with `unknown` or proper types
 * - Unused catch errors → prefix with _
 * - Unused function parameters → prefix with _
 * 
 * Usage: node scripts/fix-lint-errors.js [--dry-run] [--file path/to/file.tsx]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY_RUN = process.argv.includes('--dry-run');
const SPECIFIC_FILE = process.argv.find(arg => arg.startsWith('--file='))?.split('=')[1];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getESLintErrors(filePath) {
  try {
    // Capture both stdout and stderr
    const output = execSync(`npx eslint "${filePath}" --format=json 2>&1`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // ESLint outputs JSON - try to find it in the output
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    
    // Try single object format
    const objMatch = output.match(/\{[\s\S]*\}/);
    if (objMatch) {
      const parsed = JSON.parse(objMatch[0]);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    
    return null;
  } catch (error) {
    // Try to parse from error output
    try {
      const errorOutput = error.stdout || error.stderr || error.message || '';
      const jsonMatch = errorOutput.match(/\[[\s\S]*\]/) || errorOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch {
      // If parsing fails, return null
    }
    return null;
  }
}

function fixUnusedVariable(content, lineNum, varName) {
  const lines = content.split('\n');
  const line = lines[lineNum - 1];
  
  // Skip if already prefixed with _
  if (varName.startsWith('_')) {
    return { content, changed: false };
  }
  
  // Pattern 1: const varName = or let varName = or var varName =
  let newLine = line.replace(
    new RegExp(`\\b(const|let|var)\\s+${varName}\\b`, 'g'),
    `$1 _${varName}`
  );
  
  // Pattern 2: [varName, setVarName] = useState (when varName is unused)
  // Pattern 2a: [varName, setVarName] = useState (when setVarName is unused - most common)
  // Match: [something, setSomething] where setSomething matches varName
  if (varName.startsWith('set') && varName.length > 3) {
    const baseName = varName.charAt(3).toLowerCase() + varName.slice(4);
    const pattern = new RegExp(`\\[([^,\\]]+),\\s*${varName}\\]`, 'g');
    newLine = newLine.replace(pattern, `[$1, _${varName}]`);
  }
  
  // Pattern 2b: [varName, setVarName] = useState (when varName is unused)
  newLine = newLine.replace(
    new RegExp(`\\[${varName}(,\\s*set${varName.charAt(0).toUpperCase() + varName.slice(1)})\\]`, 'g'),
    `[_${varName}$1]`
  );
  
  // Pattern 2c: Handle destructuring where setter is unused: [something, setSomething]
  // This handles cases like: const [status, setStatus] = useState() where setStatus is unused
  const setterPattern = new RegExp(`\\[([^,\\]]+),\\s*${varName}\\]`, 'g');
  if (setterPattern.test(line) && varName.startsWith('set')) {
    newLine = line.replace(setterPattern, `[$1, _${varName}]`);
  }
  
  // Pattern 3: Destructuring: { varName } or { varName: alias }
  newLine = newLine.replace(
    new RegExp(`\\{${varName}(:.*?)?\\}`, 'g'),
    `{_${varName}$1}`
  );
  
  // Pattern 4: Function parameter: (varName) or (varName: type)
  newLine = newLine.replace(
    new RegExp(`\\(${varName}(:\\s*[^)]+)?\\)`, 'g'),
    `(_${varName}$1)`
  );
  
  // Pattern 5: catch (varName)
  newLine = newLine.replace(
    new RegExp(`catch\\s*\\(${varName}\\)`, 'g'),
    `catch (_${varName})`
  );
  
  if (newLine !== line) {
    lines[lineNum - 1] = newLine;
    return { content: lines.join('\n'), changed: true };
  }
  
  return { content, changed: false };
}

function fixAnyType(content, lineNum) {
  const lines = content.split('\n');
  const line = lines[lineNum - 1];
  
  let newLine = line;
  let changed = false;
  
  // Pattern 1: : any) or : any, or : any;
  newLine = newLine.replace(/: any\)/g, ': unknown)');
  newLine = newLine.replace(/: any,/g, ': unknown,');
  newLine = newLine.replace(/: any;/g, ': unknown;');
  newLine = newLine.replace(/: any\s/g, ': unknown ');
  
  // Pattern 2: any[] → unknown[]
  newLine = newLine.replace(/\bany\[\]/g, 'unknown[]');
  
  // Pattern 3: Record<string, any> → Record<string, unknown>
  newLine = newLine.replace(/Record<string,\s*any>/g, 'Record<string, unknown>');
  
  // Pattern 4: as any → as unknown (but be careful with specific cases)
  // Only replace standalone "as any" not "as any[...]"
  newLine = newLine.replace(/\bas any\b(?!\[)/g, 'as unknown');
  
  // Pattern 5: useState<any> → useState<unknown>
  newLine = newLine.replace(/useState<any>/g, 'useState<unknown>');
  
  if (newLine !== line) {
    changed = true;
    lines[lineNum - 1] = newLine;
  }
  
  return { content: lines.join('\n'), changed };
}

function fixFile(filePath) {
  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    log(`❌ File not found: ${filePath}`, 'red');
    return { fixed: 0, errors: 0 };
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const eslintResult = getESLintErrors(fullPath);
  
  if (!eslintResult || !Array.isArray(eslintResult) || eslintResult.length === 0) {
    return { fixed: 0, errors: 0 };
  }
  
  const fileResult = eslintResult.find(r => r.filePath === fullPath) || eslintResult[0];
  if (!fileResult || !fileResult.messages) {
    return { fixed: 0, errors: 0 };
  }
  
  const errors = fileResult.messages.filter(m => m.severity === 2);
  let newContent = content;
  let fixedCount = 0;
  
  // Group errors by type
  const unusedVars = errors.filter(e => 
    e.ruleId === '@typescript-eslint/no-unused-vars' || 
    e.ruleId === 'unused-imports/no-unused-vars'
  );
  
  const anyTypes = errors.filter(e => 
    e.ruleId === '@typescript-eslint/no-explicit-any'
  );
  
  // Fix unused variables
  for (const error of unusedVars) {
    const varName = error.message.match(/'([^']+)'/)?.[1];
    if (varName && !varName.startsWith('_')) {
      const result = fixUnusedVariable(newContent, error.line, varName);
      if (result.changed) {
        newContent = result.content;
        fixedCount++;
        if (!DRY_RUN) {
          log(`  ✓ Fixed unused variable: ${varName} → _${varName}`, 'green');
        }
      }
    }
  }
  
  // Fix any types
  for (const error of anyTypes) {
    const result = fixAnyType(newContent, error.line);
    if (result.changed) {
      newContent = result.content;
      fixedCount++;
      if (!DRY_RUN) {
        log(`  ✓ Fixed any type at line ${error.line}`, 'green');
      }
    }
  }
  
  // Write file if changes were made
  if (fixedCount > 0 && !DRY_RUN) {
    fs.writeFileSync(fullPath, newContent, 'utf-8');
  }
  
  return { fixed: fixedCount, errors: errors.length };
}

function getAllTSFiles() {
  const srcDir = path.resolve('src');
  const files = [];
  
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules, dist, build, etc.
        if (!['node_modules', 'dist', 'build', 'coverage', '.next'].includes(entry.name)) {
          walkDir(fullPath);
        }
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(srcDir);
  return files;
}

function main() {
  log('\n🔧 ESLint Auto-Fixer\n', 'cyan');
  
  if (DRY_RUN) {
    log('⚠️  DRY RUN MODE - No files will be modified\n', 'yellow');
  }
  
  const files = SPECIFIC_FILE 
    ? [path.resolve(SPECIFIC_FILE)]
    : getAllTSFiles();
  
  log(`📁 Processing ${files.length} files...\n`, 'blue');
  
  let totalFixed = 0;
  let totalErrors = 0;
  const fileResults = [];
  
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const result = fixFile(file);
    
    if (result.errors > 0 || result.fixed > 0) {
      fileResults.push({ file: relativePath, ...result });
      totalFixed += result.fixed;
      totalErrors += result.errors;
      
      if (result.fixed > 0) {
        log(`✅ ${relativePath}: Fixed ${result.fixed}/${result.errors} errors`, 'green');
      } else if (result.errors > 0) {
        log(`⚠️  ${relativePath}: ${result.errors} errors (could not auto-fix)`, 'yellow');
      }
    }
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  log(`📊 Summary:`, 'cyan');
  log(`   Total files processed: ${files.length}`, 'blue');
  log(`   Files with errors: ${fileResults.length}`, 'blue');
  log(`   Total errors found: ${totalErrors}`, 'blue');
  log(`   Auto-fixed: ${totalFixed}`, 'green');
  log(`   Remaining: ${totalErrors - totalFixed}`, totalErrors - totalFixed > 0 ? 'yellow' : 'green');
  log('='.repeat(60) + '\n', 'cyan');
  
  if (DRY_RUN && totalFixed > 0) {
    log('💡 Run without --dry-run to apply fixes\n', 'yellow');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fixFile, getAllTSFiles };
