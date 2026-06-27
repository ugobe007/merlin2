#!/usr/bin/env python3
"""
Final structural isJunk fix:
- 4+ word names not ending in a COMPANY_SUFFIX word are sentence fragments.
- Also adds 'requests' to junk verb list.
"""

filepath = '/Users/robertchristopher/merlin2/server/services/opportunity-scraper.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add 'requests' to the junk verb check
OLD1 = r"  if (/\b(?:seeks?|seeking|denies?|says?|files?|halts?|rewrites?|pledges?|responds?|aims?|forces?|push|probe|protects?|proposes?|vows?|grew|grow|grown|selling)\b/i.test(t)) return true;"
NEW1 = r"  if (/\b(?:seeks?|seeking|requests?|denies?|says?|files?|halts?|rewrites?|pledges?|responds?|aims?|forces?|push|probe|protects?|proposes?|vows?|grew|grow|grown|selling)\b/i.test(t)) return true;"

assert OLD1 in content, "Fix 1 target not found"
content = content.replace(OLD1, NEW1, 1)
print("Fix 1: 'requests' added to junk verb list")

# Insert structural word-count + suffix check before the final `return false`
OLD2 = "\n  return false;\n}\n\n// ── Stage 5:"
NEW2 = r"""
  // Structural: 4+ word name not ending in a recognized corporate suffix → sentence fragment
  const words = t.split(/\s+/);
  if (words.length >= 4) {
    const lastWord = words[words.length - 1];
    const CORP_SUFFIX_RE = /^(?:Inc|LLC|Ltd|Corp|Corporation|Company|Co|Group|Industries|International|Solutions|Services|Technologies|Tech|Energy|Power|Utilities|Utility|Solar|Battery|Storage|Logistics|Automotive|Manufacturing|Partners|Holdings|Ventures|Capital|Associates|Enterprises)\.?$/i;
    if (!CORP_SUFFIX_RE.test(lastWord)) return true;
  }

  return false;
}

// ── Stage 5:"""

assert OLD2 in content, "Fix 2 target not found"
content = content.replace(OLD2, NEW2, 1)
print("Fix 2: structural 4+-word / no-suffix check added to isJunk")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")

# Verify
for sym in ['requests?', 'CORP_SUFFIX_RE', 'detectSignals']:
    assert sym in content, f"MISSING: {sym}"
    print(f"  ✓ {sym}")
