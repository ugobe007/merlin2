import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Read QuestionIconMap to extract all mapped keys
const iconMapPath = join(process.cwd(), 'src/components/wizard/QuestionIconMap.ts');
const iconMapContent = readFileSync(iconMapPath, 'utf-8');

// Extract all keys from QUESTION_ICON_MAP using regex
const keys = new Set();
const keyRegex = /'([^']+)'\s*:/g;
let match;
while ((match = keyRegex.exec(iconMapContent)) !== null) {
  keys.add(match[1]);
}
console.log(`✅ Found ${keys.size} icon mappings in QuestionIconMap.ts\n`);

// Scan migration files for field_name values
const migrationsDir = join(process.cwd(), 'database/migrations');
const fieldNames = new Set();
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  const content = readFileSync(join(migrationsDir, file), 'utf-8');
  // Match field_name patterns
  const fieldRegex = /field_name\s*['"]([^'"]+)['"]/gi;
  let fieldMatch;
  while ((fieldMatch = fieldRegex.exec(content)) !== null) {
    const field = fieldMatch[1];
    fieldNames.add(field);
    // Add variations
    fieldNames.add(field.toLowerCase());
    if (field.includes('_')) {
      fieldNames.add(field.replace(/_([a-z])/g, (_, l) => l.toUpperCase()));
    }
    if (field.match(/[A-Z]/)) {
      fieldNames.add(field.replace(/([A-Z])/g, '_$1').toLowerCase());
    }
  }
}
console.log(`📋 Found ${fieldNames.size} unique field names in migrations\n`);

// Find missing
const missing = [];
for (const field of fieldNames) {
  const lower = field.toLowerCase();
  let found = false;
  
  // Direct match
  if (keys.has(lower) || keys.has(field)) {
    found = true;
  }
  
  // Partial match
  if (!found) {
    for (const key of keys) {
      if (lower.includes(key) || key.includes(lower)) {
        found = true;
        break;
      }
    }
  }
  
  if (!found && !missing.includes(field)) {
    missing.push(field);
  }
}

console.log(`❌ Missing icons for ${missing.length} fields:\n`);
missing.slice(0, 50).forEach(f => console.log(`  - ${f}`));
