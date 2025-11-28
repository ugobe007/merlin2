#!/usr/bin/env python3
"""Fix gridCapacity closing brackets"""
import re

with open('src/data/useCaseTemplates.ts', 'r') as f:
    content = f.read()

# Fix pattern: gridCapacity question ending with ]  instead of }
# Pattern: finds gridCapacity block ending with required: false, then looks for wrong bracket
pattern = r"(id: 'gridCapacity',[\s\S]*?required: false\n)(    \])"

def fix_bracket(match):
    question_block = match.group(1)
    return question_block + "      }"

content = re.sub(pattern, fix_bracket, content)

with open('src/data/useCaseTemplates.ts', 'w') as f:
    f.write(content)

print("✅ Fixed gridCapacity closing brackets!")
