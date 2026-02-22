#!/usr/bin/env python3
"""Op1b: Extract useWizardStep3 - Python approach for precision"""

import re

FILE = "src/wizard/v7/hooks/useWizardV7.ts"

with open(FILE, 'r') as f:
    lines = f.readlines()

# Step 1: Add import after useWizardLocation (around line 30)
for i, line in enumerate(lines):
    if 'import { useWizardLocation }' in line:
        lines.insert(i + 1, 'import { useWizardStep3 } from "./useWizardStep3";\n')
        print(f"✅ Added import at line {i+2}")
        break

# Step 2: Remove Step 3 callbacks (lines 2523-2702)
# Remove: setStep3Answer through getDefaultForQuestion
# Keep: generateRequestKey (line 2732) and everything after
del lines[2522:2702]  # 0-indexed, so 2523-2702 becomes 2522:2702
print(f"✅ Removed lines 2523-2702 (180 lines)")

# Step 3: Remove submitStep3 and submitStep3Partial
# After deletion, line numbers shift by 180
# Original 3374 → 3374-180 = 3194
# Original 3697 → 3697-180 = 3517
del lines[3193:3517]  # Remove submitStep3 and submitStep3Partial
print(f"✅ Removed submitStep3/submitStep3Partial (324 lines)")

# Step 4: Add hook invocation before goToStep
# Find "// Optional: hard jump with gate checks"
for i, line in enumerate(lines):
    if '// Optional: hard jump with gate checks' in line:
        hook_code = """
  // ============================================================
  // Step 3: Hook Invocation (Op1b - Feb 22, 2026)
  // ============================================================
  const step3Actions = useWizardStep3({
    state: {
      step: state.step,
      industry: state.industry,
      step3Answers: state.step3Answers,
      step3AnswersMeta: state.step3AnswersMeta,
      step3Template: state.step3Template || undefined,
      step3DefaultsAppliedParts: state.step3DefaultsAppliedParts,
      locationIntel: state.locationIntel || undefined,
      businessCard: state.businessCard || undefined,
      location: state.location || undefined,
      locationConfirmed: state.locationConfirmed,
      goalsConfirmed: state.goalsConfirmed,
      step3Complete: state.step3Complete,
      pricingStatus: state.pricingStatus,
      step4AddOns: state.step4AddOns,
    },
    dispatch: dispatch as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    api,
    clearError,
    setError,
    abortOngoing,
    setStep,
    runPricingSafe,
    buildMinimalLocationFromZip,
  });

"""
        lines.insert(i, hook_code)
        print(f"✅ Added hook invocation at line {i+1}")
        break

# Step 5: Update return statement - remove old Step 3 exports
in_return = False
return_start = None
exports_to_remove = [
    'setStep3Answer',
    'setStep3Answers',
    'applyIntelPatch',
    'resetToDefaults',
    'submitStep3',
    'submitStep3Partial',
    'markDefaultsApplied',
    'hasDefaultsApplied',
    'goToNextPart',
    'goToPrevPart',
    'setPartIndex',
    'partHasAnyDefaults',
    'canApplyDefaults',
    'canResetToDefaults',
    'getDefaultForQuestion',
]

# Find return statement and mark lines to delete
lines_to_delete = []
for i, line in enumerate(lines):
    if '  return {' in line and 'state,' in lines[i+1]:
        in_return = True
        return_start = i
        continue
    
    if in_return:
        # Check if this line exports a Step 3 function
        for export in exports_to_remove:
            if export in line and (',' in line or '//' in line):
                lines_to_delete.append(i)
                break
        
        # End of return statement
        if line.strip() == '};':
            break

# Delete marked lines in reverse to preserve indices
for i in reversed(lines_to_delete):
    del lines[i]

print(f"✅ Removed {len(lines_to_delete)} old Step 3 exports from return")

# Step 6: Add ...step3Actions spread in return statement
for i, line in enumerate(lines):
    if '  return {' in line and 'state,' in lines[i+1]:
        # Find where to insert (after selectIndustry)
        for j in range(i, min(i+50, len(lines))):
            if 'selectIndustry,' in lines[j]:
                lines.insert(j+1, '\n')
                lines.insert(j+2, '    // step 3 (extracted to useWizardStep3 hook - Op1b Feb 22, 2026)\n')
                lines.insert(j+3, '    ...step3Actions,\n')
                print(f"✅ Added ...step3Actions spread at line {j+3}")
                break
        break

# Write back
with open(FILE, 'w') as f:
    f.writelines(lines)

print(f"\n📊 Final line count:")
import subprocess
subprocess.run(['wc', '-l', FILE])
