#!/usr/bin/env python3
"""
Script to add universal questions (facilitySize, operatingHours, peakLoad, gridConnection)
to all use case templates that don't already have them.
"""

import re

# Universal questions to add
UNIVERSAL_QUESTIONS = '''      {
        id: 'facilitySize',
        question: 'Facility size (sq ft)',
        type: 'number',
        default: 10000,
        unit: 'sq ft',
        impactType: 'factor',
        helpText: 'Total building/facility square footage',
        required: false
      },
      {
        id: 'operatingHours',
        question: 'Daily operating hours',
        type: 'number',
        default: 12,
        unit: 'hours',
        impactType: 'factor',
        helpText: 'Hours per day the facility operates',
        required: true
      },
      {
        id: 'peakLoad',
        question: 'Peak power demand (if known)',
        type: 'number',
        default: 0,
        unit: 'MW',
        impactType: 'none',
        helpText: 'Optional: Actual peak load from utility bill (leave 0 for auto-calculation)',
        required: false
      },
      {
        id: 'gridConnection',
        question: 'Grid connection quality',
        type: 'select',
        default: 'reliable',
        options: [
          { value: 'reliable', label: 'Reliable Grid - Stable power, rare outages' },
          { value: 'unreliable', label: 'Unreliable Grid - Frequent outages' },
          { value: 'limited', label: 'Limited Capacity - Grid undersized for facility' },
          { value: 'off_grid', label: 'Off-Grid - No grid connection' },
          { value: 'microgrid', label: 'Microgrid - Independent power system' }
        ],
        impactType: 'factor',
        helpText: 'Grid quality affects backup requirements and generation needs',
        required: true
      }'''

# Read the file
with open('src/data/useCaseTemplates.ts', 'r') as f:
    content = f.read()

# Find all customQuestions arrays and check if they have the universal questions
# Pattern: find closing of customQuestions array
pattern = r'(    customQuestions: \[[\s\S]*?)(    \]\n  },)'

def add_questions_if_missing(match):
    questions_block = match.group(1)
    closing = match.group(2)
    
    # Check if already has the universal questions
    if 'gridConnection' in questions_block:
        return match.group(0)  # Already has them, skip
    
    # Add comma after last question if needed
    questions_block = questions_block.rstrip()
    if not questions_block.endswith(','):
        questions_block += ','
    
    # Add the universal questions
    return questions_block + '\n' + UNIVERSAL_QUESTIONS + '\n' + closing

# Apply the transformation
new_content = re.sub(pattern, add_questions_if_missing, content)

# Write back
with open('src/data/useCaseTemplates.ts', 'w') as f:
    f.write(new_content)

print("✅ Added universal questions to all templates!")
