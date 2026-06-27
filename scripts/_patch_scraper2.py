#!/usr/bin/env python3
"""Two targeted fixes for the junk-filter edge cases."""

filepath = '/Users/robertchristopher/merlin2/server/services/opportunity-scraper.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Fallback in extractRawCandidate — require 2+ words for suffix match,
# add separate single-word KNOWN_ENTITIES check after the loop.
OLD1 = r"""  // Fallback: first 1-3 words of title if they contain a known suffix or entity
  const words = cleanedTitle.split(/\s+/);
  for (let n = 3; n >= 1; n--) {
    const candidate = words.slice(0, n).join(' ');
    if (KNOWN_ENTITIES.has(candidate)) return candidate;
    if ([...COMPANY_SUFFIXES].some((s) => candidate.endsWith(s))) return candidate;
  }

  return null;"""

NEW1 = r"""  // Fallback: first 1-3 words of title if they contain a known suffix or entity
  const words = cleanedTitle.split(/\s+/);
  // Require 2+ words for suffix match (prevents bare "Energy", "Solar", etc.)
  for (let n = 3; n >= 2; n--) {
    const candidate = words.slice(0, n).join(' ');
    if (KNOWN_ENTITIES.has(candidate)) return candidate;
    if ([...COMPANY_SUFFIXES].some((s) => candidate.endsWith(s))) return candidate;
  }
  // Single-word only if it's a known proper entity (e.g. "Amazon", "Tesla")
  if (words.length >= 1 && KNOWN_ENTITIES.has(words[0])) return words[0];

  return null;"""

assert OLD1 in content, "Fix 1 target not found"
content = content.replace(OLD1, NEW1, 1)
print("Fix 1 applied: fallback now requires 2+ words for suffix match")

# Fix 2: isJunk — add generic-role words (developer, provider, player, operator)
# that never appear in real company names but do appear in junk fragments.
OLD2 = r"""  if (/\b(?:alert|advocate|boom|companies|process|project|policymakers|lawmakers)\b/i.test(t)) return true;"""

NEW2 = r"""  if (/\b(?:alert|advocate|boom|companies|process|project|policymakers|lawmakers)\b/i.test(t)) return true;
  if (/\b(?:developer|developers|provider|providers|player|operator|operators)\b/i.test(t)) return true;"""

assert OLD2 in content, "Fix 2 target not found"
content = content.replace(OLD2, NEW2, 1)
print("Fix 2 applied: generic-role words added to junk filter")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
