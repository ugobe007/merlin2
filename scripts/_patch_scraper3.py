#!/usr/bin/env python3
"""
Comprehensive fix:
1. Extend TRAILING_VERBS → TRAILING_NOISE (also strips prepositions: "to", "in for", etc.)
2. Add country/state names to junk filter
3. Add modal verbs + headline verbs + fragment starters to isJunk
4. Update extractRawCandidate to use TRAILING_NOISE
"""

filepath = '/Users/robertchristopher/merlin2/server/services/opportunity-scraper.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# ── Fix 1: Replace TRAILING_VERBS with TRAILING_NOISE (adds prepositions) ───
OLD1 = r"""const TRAILING_VERBS = /\s+(?:opens?|announces?|starts?|expands?|builds?|acquires?|launches?|plans?|seeks?|proposes?|vows?|brings?|inaugurates?|completes?|celebrates?|unveils?|selects?|awards?|breaks|signs?|closes?|reaches?|secures?|wins?|gets?|reveals?|receives?)\s*$/i;"""

NEW1 = r"""const TRAILING_NOISE = /\s+(?:opens?|announces?|starts?|expands?|builds?|acquires?|launches?|plans?|seeks?|proposes?|vows?|brings?|inaugurates?|completes?|celebrates?|unveils?|selects?|awards?|breaks|signs?|closes?|reaches?|secures?|wins?|gets?|reveals?|receives?|to|in|for|by|at|of|the|a|an|and|or|is|are|has|have|was|were|will|set|said|plans?|said?)\s*$/i;
// Keep TRAILING_VERBS as alias for isJunk checks
const TRAILING_VERBS = TRAILING_NOISE;"""

assert OLD1 in content, "Fix 1 target (TRAILING_VERBS) not found"
content = content.replace(OLD1, NEW1, 1)
print("Fix 1: TRAILING_NOISE replaces TRAILING_VERBS")

# ── Fix 2: Add JUNK_WORDS set (countries, states, headline starters) ─────────
OLD2 = r"""const SHORT_KNOWN = new Set(['PECO', 'AES', 'ABB', 'GE', 'GM', 'IBM', 'CPS', 'Xcel', 'BYD']);"""

NEW2 = r"""const SHORT_KNOWN = new Set(['PECO', 'AES', 'ABB', 'GE', 'GM', 'IBM', 'CPS', 'Xcel', 'BYD']);

const JUNK_SINGLE_WORDS = new Set([
  // Countries / territories
  'china', 'india', 'usa', 'uk', 'germany', 'france', 'italy', 'spain',
  'japan', 'korea', 'australia', 'canada', 'mexico', 'brazil', 'russia',
  'oman', 'uae', 'saudiarabia', 'europe', 'africa', 'asia',
  // US States
  'ohio', 'texas', 'california', 'florida', 'nevada', 'arizona', 'georgia',
  'virginia', 'carolina', 'michigan', 'illinois', 'indiana', 'kentucky',
  // Generic nouns / sentence starters
  'commentary', 'construction', 'groundbreaking', 'expansion', 'opening',
  'analysis', 'report', 'update', 'alert', 'study', 'research', 'news',
]);"""

assert OLD2 in content, "Fix 2 target (SHORT_KNOWN) not found"
content = content.replace(OLD2, NEW2, 1)
print("Fix 2: JUNK_SINGLE_WORDS set added")

# ── Fix 3: Update extractRawCandidate to use TRAILING_NOISE ─────────────────
OLD3 = '      const stripped = match[1].replace(TRAILING_VERBS, \'\').trim();\n      return stripped || match[1].trim();'
NEW3 = '      const stripped = match[1].replace(TRAILING_NOISE, \'\').trim();\n      return stripped || match[1].trim();'
assert OLD3 in content, "Fix 3 target (TRAILING_VERBS in extractRawCandidate) not found"
content = content.replace(OLD3, NEW3, 1)
print("Fix 3: extractRawCandidate uses TRAILING_NOISE")

# ── Fix 4: Update isJunk's TRAILING_VERBS reference → TRAILING_NOISE ────────
OLD4 = '  if (TRAILING_VERBS.test(t)) return true;'
NEW4 = '  if (TRAILING_NOISE.test(t)) return true;'
assert OLD4 in content, "Fix 4 target (TRAILING_VERBS in isJunk) not found"
content = content.replace(OLD4, NEW4, 1)
print("Fix 4: isJunk uses TRAILING_NOISE")

# ── Fix 5: Add new junk checks to isJunk ────────────────────────────────────
# Insert after the existing TRAILING_NOISE.test(t) line
OLD5 = '  if (TRAILING_NOISE.test(t)) return true;\n  if (/^new\\s+/i.test(t)'

NEW5 = r"""  if (TRAILING_NOISE.test(t)) return true;
  // Single word: only allow if known entity or SHORT_KNOWN
  if (t.split(/\s+/).length === 1 && !SHORT_KNOWN.has(t)) {
    if (JUNK_SINGLE_WORDS.has(t.toLowerCase())) return true;
  }
  // Modal verbs → headline fragment, not a company name
  if (/\b(?:would|could|should|will|may|might|must|shall)\b/i.test(t)) return true;
  // Headline-style verbs that signal the text is a sentence, not a company
  if (/\b(?:sees|gaining|gaining from|surging|threatens|threaten|targets?|warns?|weighs?|mulls?|nears?|paves?|spurs?)\b/i.test(t)) return true;
  // "and" joining two names → not a single company
  if (/\s+and\s+/i.test(t)) return true;
  // Starts with article/construction fragment words
  if (/^(?:construction|groundbreaking|expansion|opening|massive|huge|enormous|record)\s/i.test(t)) return true;
  if (/^new\s+/i.test(t)"""

assert OLD5 in content, "Fix 5 target not found"
content = content.replace(OLD5, NEW5, 1)
print("Fix 5: extra junk checks added to isJunk")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("\nAll fixes applied.")

# Quick verify
for sym in ['TRAILING_NOISE', 'JUNK_SINGLE_WORDS', 'extractRawCandidate', 'isJunk', 'detectSignals']:
    assert sym in content, f"MISSING: {sym}"
    print(f"  ✓ {sym} present")
