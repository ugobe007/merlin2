#!/usr/bin/env python3
"""Add Philippines + more missing countries to JUNK_SINGLE_WORDS in scraper."""

filepath = '/Users/robertchristopher/merlin2/server/services/opportunity-scraper.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

OLD = "  'oman', 'uae', 'saudiarabia', 'europe', 'africa', 'asia',"
NEW = "  'oman', 'uae', 'saudiarabia', 'europe', 'africa', 'asia',\n  'philippines', 'indonesia', 'vietnam', 'thailand', 'malaysia', 'singapore',\n  'kuwait', 'qatar', 'bahrain', 'jordan', 'egypt', 'nigeria', 'ghana',\n  'pakistan', 'bangladesh', 'srilanka', 'nepal', 'turkey', 'israel',\n  'sweden', 'norway', 'denmark', 'finland', 'netherlands', 'belgium',\n  'switzerland', 'austria', 'poland', 'czechia', 'portugal', 'greece',"

assert OLD in content, "Target not found"
content = content.replace(OLD, NEW, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Countries added to JUNK_SINGLE_WORDS in scraper.")

# Same fix for purge script
purge_path = '/Users/robertchristopher/merlin2/scripts/purge-junk-opportunities.ts'
with open(purge_path, 'r', encoding='utf-8') as f:
    purge = f.read()

OLD2 = "  'oman', 'uae', 'saudiarabia', 'europe', 'africa', 'asia',"
NEW2 = "  'oman', 'uae', 'saudiarabia', 'europe', 'africa', 'asia',\n  'philippines', 'indonesia', 'vietnam', 'thailand', 'malaysia', 'singapore',\n  'kuwait', 'qatar', 'bahrain', 'jordan', 'egypt', 'nigeria', 'ghana',\n  'pakistan', 'bangladesh', 'srilanka', 'nepal', 'turkey', 'israel',\n  'sweden', 'norway', 'denmark', 'finland', 'netherlands', 'belgium',\n  'switzerland', 'austria', 'poland', 'czechia', 'portugal', 'greece',"

assert OLD2 in purge, "Target not found in purge script"
purge = purge.replace(OLD2, NEW2, 1)

with open(purge_path, 'w', encoding='utf-8') as f:
    f.write(purge)

print("Countries added to purge script.")
