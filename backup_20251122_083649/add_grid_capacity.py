#!/usr/bin/env python3
"""
Add gridCapacity question after gridConnection in all templates
"""

import re

# Question to add after gridConnection
GRID_CAPACITY_QUESTION = '''      },
      {
        id: 'gridCapacity',
        question: 'Grid connection capacity (if limited)',
        type: 'number',
        default: 0,
        unit: 'MW',
        impactType: 'factor',
        helpText: 'If limited grid: Enter max capacity from utility. If 0, we assume unlimited grid.',
        required: false'''

# Read file
with open('src/data/useCaseTemplates.ts', 'r') as f:
    content = f.read()

# Find all gridConnection questions and add gridCapacity after them
# Pattern: find gridConnection closing brace
pattern = r"(id: 'gridConnection',[\s\S]*?required: true\n      })"

def add_capacity_question(match):
    grid_connection_block = match.group(1)
    return grid_connection_block + GRID_CAPACITY_QUESTION

new_content = re.sub(pattern, add_capacity_question, content)

# Write back
with open('src/data/useCaseTemplates.ts', 'w') as f:
    f.write(new_content)

print("✅ Added gridCapacity question after all gridConnection questions!")
