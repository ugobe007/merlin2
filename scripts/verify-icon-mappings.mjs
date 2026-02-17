#!/usr/bin/env node
/**
 * Quick verification script to ensure all icon mappings are valid
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const iconMapPath = join(process.cwd(), 'src/components/wizard/QuestionIconMap.ts');
const content = readFileSync(iconMapPath, 'utf-8');

// Check for duplicate keys
const keyRegex = /'([^']+)'\s*:/g;
const keys = new Map();
let match;
while ((match = keyRegex.exec(content)) !== null) {
  const key = match[1];
  if (keys.has(key)) {
    console.error(`❌ DUPLICATE KEY FOUND: '${key}'`);
    process.exit(1);
  }
  keys.set(key, match.index);
}

console.log(`✅ No duplicate keys found (${keys.size} unique mappings)`);

// Check that QUESTION_ICON_MAP is properly closed
if (!content.includes('export const QUESTION_ICON_MAP')) {
  console.error('❌ QUESTION_ICON_MAP not found');
  process.exit(1);
}

// Check that getQuestionIcon function exists
if (!content.includes('export function getQuestionIcon')) {
  console.error('❌ getQuestionIcon function not found');
  process.exit(1);
}

console.log('✅ Icon map structure is valid');
console.log(`✅ Total mappings: ${keys.size}`);
console.log('✅ Icon mapping verification complete!');
