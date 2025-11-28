#!/usr/bin/env python3
"""Fix missing ] before template closing"""
import re

with open('src/data/useCaseTemplates.ts', 'r') as f:
    content = f.read()

# Pattern: gridCapacity question ending, then closing }, but missing ]
pattern = r"(id: 'gridCapacity',[\s\S]*?required: false\n      }\n)(  },)"

def add_closing_bracket(match):
    question_end = match.group(1)
    template_end = match.group(2)
    return question_end + "    ]\n" + template_end

content = re.sub(pattern, add_closing_bracket, content)

with open('src/data/useCaseTemplates.ts', 'w') as f:
    f.write(content)

print("✅ Fixed missing ] before template closing!")
