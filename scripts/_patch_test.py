#!/usr/bin/env python3
"""Apply the same two fixes to the test file's inline function copies."""

filepath = '/Users/robertchristopher/merlin2/scripts/_test_extraction.mjs'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

OLD1 = r"""  const words = cleanedTitle.split(/\s+/);
  for (let n = 3; n >= 1; n--) {
    const candidate = words.slice(0, n).join(' ');
    if (KNOWN_ENTITIES.has(candidate)) return candidate;
    if ([...COMPANY_SUFFIXES].some((s) => candidate.endsWith(s))) return candidate;
  }
  return null;"""

NEW1 = r"""  const words = cleanedTitle.split(/\s+/);
  for (let n = 3; n >= 2; n--) {
    const candidate = words.slice(0, n).join(' ');
    if (KNOWN_ENTITIES.has(candidate)) return candidate;
    if ([...COMPANY_SUFFIXES].some((s) => candidate.endsWith(s))) return candidate;
  }
  if (words.length >= 1 && KNOWN_ENTITIES.has(words[0])) return words[0];
  return null;"""

assert OLD1 in content, "Fix 1 target not found in test file"
content = content.replace(OLD1, NEW1, 1)

OLD2 = r"""  if (/\b(?:alert|advocate|boom|companies|process|project|policymakers|lawmakers)\b/i.test(t)) return true;"""

NEW2 = r"""  if (/\b(?:alert|advocate|boom|companies|process|project|policymakers|lawmakers)\b/i.test(t)) return true;
  if (/\b(?:developer|developers|provider|providers|player|operator|operators)\b/i.test(t)) return true;"""

assert OLD2 in content, "Fix 2 target not found in test file"
content = content.replace(OLD2, NEW2, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Test file updated.")
