#!/usr/bin/env node
/**
 * ============================================================================
 * UNUSED IMPORT REMOVER
 * ============================================================================
 * Removes unused imports from TypeScript/React files
 * 
 * Usage:
 *   node scripts/remove-unused-imports.js
 *   node scripts/remove-unused-imports.js --dry-run
 *   node scripts/remove-unused-imports.js src/components/BessQuoteBuilder.tsx
 * 
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIG
// ============================================================================

const DRY_RUN = process.argv.includes('--dry-run');
const SPECIFIC_FILE = process.argv.find(arg => arg.endsWith('.tsx') || arg.endsWith('.ts'));
const SRC_DIR = SPECIFIC_FILE ? path.dirname(SPECIFIC_FILE) : './src';

// Files to skip
const SKIP_FILES = [
  'types.ts',
  'index.ts', 
  'constants.ts',
  '.d.ts',
  '.test.ts',
  '.test.tsx',
];

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n🧹 UNUSED IMPORT REMOVER');
  console.log('━'.repeat(50));
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  // Get ESLint output
  let eslintOutput;
  try {
    eslintOutput = execSync(
      `npx eslint ${SPECIFIC_FILE || 'src'} --ext .ts,.tsx --format json 2>/dev/null`,
      { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
    );
  } catch (e) {
    eslintOutput = e.stdout || '[]';
  }

  const results = JSON.parse(eslintOutput);
  
  // Group unused vars by file
  const fileIssues = {};
  
  results.forEach(result => {
    const unusedVars = result.messages.filter(m => 
      m.ruleId === '@typescript-eslint/no-unused-vars'
    );
    
    if (unusedVars.length > 0) {
      fileIssues[result.filePath] = unusedVars.map(m => ({
        line: m.line,
        column: m.column,
        name: extractVarName(m.message),
        message: m.message
      }));
    }
  });

  const fileCount = Object.keys(fileIssues).length;
  console.log(`Found ${fileCount} files with unused imports/variables\n`);

  if (fileCount === 0) {
    console.log('✅ No unused imports found!');
    return;
  }

  let totalFixed = 0;
  let totalSkipped = 0;

  // Process each file
  for (const [filePath, issues] of Object.entries(fileIssues)) {
    // Skip certain files
    if (SKIP_FILES.some(skip => filePath.includes(skip))) {
      continue;
    }

    const relativePath = path.relative(process.cwd(), filePath);
    const unusedImports = issues.filter(i => i.message.includes('defined but never used'));
    
    if (unusedImports.length === 0) continue;

    console.log(`\n📄 ${relativePath}`);
    console.log(`   ${unusedImports.length} unused import(s)`);

    if (DRY_RUN) {
      unusedImports.forEach(i => {
        console.log(`   - Line ${i.line}: ${i.name}`);
      });
      totalSkipped += unusedImports.length;
      continue;
    }

    // Read file
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let fixedCount = 0;

    // Get unique unused names
    const unusedNames = [...new Set(unusedImports.map(i => i.name))];

    // Process imports
    unusedNames.forEach(name => {
      // Pattern 1: Named import - import { X, Y, Z } from '...'
      // Remove just the unused name from the list
      const namedImportRegex = new RegExp(
        `(import\\s*\\{[^}]*?)\\b${name}\\b\\s*,?\\s*([^}]*\\}\\s*from)`,
        'g'
      );
      
      const beforeNamed = content;
      content = content.replace(namedImportRegex, (match, before, after) => {
        // Clean up the result
        let result = before + after;
        // Remove trailing comma before }
        result = result.replace(/,\s*\}/, ' }');
        // Remove leading comma after {
        result = result.replace(/\{\s*,/, '{ ');
        // Clean up multiple spaces
        result = result.replace(/\s+/g, ' ');
        return result;
      });
      
      if (content !== beforeNamed) {
        fixedCount++;
        console.log(`   ✅ Removed '${name}' from named import`);
      }

      // Pattern 2: Default import - import X from '...'
      const defaultImportRegex = new RegExp(
        `^import\\s+${name}\\s+from\\s+['"][^'"]+['"];?\\s*\\n`,
        'gm'
      );
      
      const beforeDefault = content;
      content = content.replace(defaultImportRegex, '');
      
      if (content !== beforeDefault) {
        fixedCount++;
        console.log(`   ✅ Removed default import '${name}'`);
      }

      // Pattern 3: Type import - import type { X } from '...'
      const typeImportRegex = new RegExp(
        `(import\\s+type\\s*\\{[^}]*?)\\b${name}\\b\\s*,?\\s*([^}]*\\}\\s*from)`,
        'g'
      );
      
      const beforeType = content;
      content = content.replace(typeImportRegex, (match, before, after) => {
        let result = before + after;
        result = result.replace(/,\s*\}/, ' }');
        result = result.replace(/\{\s*,/, '{ ');
        result = result.replace(/\s+/g, ' ');
        return result;
      });
      
      if (content !== beforeType) {
        fixedCount++;
        console.log(`   ✅ Removed '${name}' from type import`);
      }
    });

    // Clean up empty imports: import { } from '...'
    content = content.replace(/import\s*\{\s*\}\s*from\s*['"][^'"]+['"];?\s*\n/g, '');
    content = content.replace(/import\s+type\s*\{\s*\}\s*from\s*['"][^'"]+['"];?\s*\n/g, '');

    // Write file if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      totalFixed += fixedCount;
      console.log(`   📝 Saved (${fixedCount} fixes)`);
    }
  }

  // Summary
  console.log('\n' + '━'.repeat(50));
  console.log('📊 SUMMARY');
  console.log('━'.repeat(50));
  
  if (DRY_RUN) {
    console.log(`Would fix: ${totalSkipped} unused imports`);
    console.log('\nRun without --dry-run to apply fixes');
  } else {
    console.log(`Fixed: ${totalFixed} unused imports`);
    console.log('\n✅ Done! Run npm run lint to verify.');
  }
}

// Extract variable name from ESLint message
function extractVarName(message) {
  // "'X' is defined but never used"
  const match = message.match(/'([^']+)'/);
  return match ? match[1] : '';
}

// Run
main().catch(console.error);
