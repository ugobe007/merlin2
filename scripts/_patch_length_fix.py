#!/usr/bin/env python3
"""Fix: length check should exempt SHORT_KNOWN entries (AES, GE, etc.)"""

filepath = '/Users/robertchristopher/merlin2/server/services/opportunity-scraper.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

OLD = '  if (t.length < 4) return true;\n'
NEW = '  if (t.length < 4 && !SHORT_KNOWN.has(t)) return true;\n'

assert OLD in content, f"Target not found"
content = content.replace(OLD, NEW, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed: SHORT_KNOWN exempted from length < 4 check")

# Verify
assert NEW in content
print("Verified.")
