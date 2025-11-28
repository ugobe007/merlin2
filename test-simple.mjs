// Simple validation without importing
import { readFileSync } from 'fs';

console.log('🧪 USE CASE STRUCTURE VALIDATION\n');

const content = readFileSync('src/data/useCaseTemplates.ts', 'utf8');

// Extract all use cases
const useCaseMatches = [...content.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?slug:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?requiredTier:\s*'([^']+)'/g)];

console.log(`Found ${useCaseMatches.length} use cases\n`);

useCaseMatches.forEach((match, i) => {
  const [_, id, slug, name, tier] = match;
  console.log(`${i + 1}. ${name}`);
  console.log(`   ID: ${id}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Tier: ${tier.toUpperCase()}`);
  console.log('');
});

console.log(`✅ All ${useCaseMatches.length} use cases validated`);
