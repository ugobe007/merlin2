#!/usr/bin/env node
/**
 * Remove old inline renewables JSX from AdvancedQuoteBuilder.tsx
 * 
 * This script removes lines 3572-5689 (old renewables implementation)
 * that were extracted to RenewablesSection component.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, 'src/components/AdvancedQuoteBuilder.tsx');

console.log('🔍 Reading AdvancedQuoteBuilder.tsx...');
const content = readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log(`📊 File has ${lines.length} lines`);

// Find the exact boundaries
let componentEndLine = -1;
let proQuoteBadgeLine = -1;

for (let i = 0; i < lines.length; i++) {
  // Find where RenewablesSection component ends
  if (lines[i].includes('durationHours={durationHours}') && 
      i + 1 < lines.length && lines[i + 1].trim() === '/>') {
    componentEndLine = i + 1; // The line with /}
  }
  
  // Find where ProQuote Badge section starts
  if (lines[i].includes('{/* ProQuote™ Badge + Financial Summary */}')) {
    proQuoteBadgeLine = i;
  }
}

if (componentEndLine === -1) {
  console.error('❌ Could not find end of RenewablesSection component!');
  process.exit(1);
}

if (proQuoteBadgeLine === -1) {
  console.error('❌ Could not find ProQuote Badge section!');
  process.exit(1);
}

console.log(`✓ Component ends at line ${componentEndLine + 1} (1-indexed)`);
console.log(`✓ ProQuote Badge starts at line ${proQuoteBadgeLine + 1} (1-indexed)`);

const linesToRemove = proQuoteBadgeLine - componentEndLine - 1;
console.log(`📝 Will remove ${linesToRemove} lines of old renewables JSX`);

if (linesToRemove < 1000 || linesToRemove > 3000) {
  console.error(`⚠️  Unexpected line count: ${linesToRemove}. Expected ~2,100 lines.`);
  console.error('Please review the boundaries before proceeding.');
  process.exit(1);
}

// Create new content: keep lines before componentEndLine, then immediately jump to proQuoteBadgeLine
const newLines = [
  ...lines.slice(0, componentEndLine + 1),  // Everything up to and including component />
  '',  // Blank line for spacing
  ...lines.slice(proQuoteBadgeLine)  // ProQuote Badge section onwards
];

const newContent = newLines.join('\n');

console.log('💾 Writing cleaned file...');
writeFileSync(filePath, newContent, 'utf-8');

const newLineCount = newLines.length;
const linesRemoved = lines.length - newLineCount;

console.log(`✅ Done!`);
console.log(`   Old file: ${lines.length} lines`);
console.log(`   New file: ${newLineCount} lines`);
console.log(`   Removed: ${linesRemoved} lines`);
console.log('');
console.log('🔧 Next steps:');
console.log('   1. Run: npm run build');
console.log('   2. Verify no TypeScript errors');
console.log('   3. Test renewables section in UI');
console.log('   4. Commit changes');
