path = "/Users/robertchristopher/merlin3/src/components/wizard/v7/steps/Step4OptionsV7.tsx"
with open(path, 'r') as f:
    content = f.read()

# Fix the header comment + imports
old_header = '''/**
 * STEP 4: OPTIONS — System Add-Ons Configuration
 * ================================================
 * User configures solar, generators, EV chargers before MagicFit.
 * Thin wrapper around SystemAddOnsCards with clear navigation.
 *
 * Flow: Step 3 (Profile) → Step 4 (Options) → Step 5 (MagicFit)
 *
 * Updated Feb 11, 2026:
 * - Pulls all data from Merlin Memory (not state.quote file paths)
 * - Supabase-style inline intro text at top
 * - Cards render in full expanded display by default
 */'''

new_header = '''/**
 * STEP 4: BACKUP POWER — Optional Generator Configuration
 * =========================================================
 * BESS quote is built from Steps 1-3. Step 4 lets the user optionally add
 * a backup generator to the core quote (affects total cost + resilience).
 *
 * Solar, Wind, EV Chargers are post-quote add-ons shown in Step 6
 * ("Maximize Your Savings") AFTER the user sees their BESS savings.
 *
 * Flow: Step 3 (Profile) → Step 4 (Backup Power) → Step 5 (MagicFit) → Step 6 (Quote + Upgrades)
 */'''

if old_header in content:
    content = content.replace(old_header, new_header, 1)
    print("Header: REPLACED")
else:
    print("Header: NOT FOUND")

# Replace SystemAddOnsCards import with GeneratorCard
old_import = 'import { SystemAddOnsCards } from "./SystemAddOnsCards";'
new_import = 'import { GeneratorCard } from "./GeneratorCard";'
if old_import in content:
    content = content.replace(old_import, new_import, 1)
    print("Import: REPLACED")
else:
    print("Import: NOT FOUND")

# Replace the SystemAddOnsCards JSX with GeneratorCard
# Need to handle the line-wrapped content in the file
import re

# Find and replace the System Add-Ons Cards section
# Pattern: from the comment through the closing />
old_cards_pattern = re.compile(
    r'\s*\{/\* System Add-Ons Cards.*?\*/\}\s*\n\s*<SystemAddOnsCards\s*\n\s*state=\{state\}\s*\n\s*currentAddOns=\{state\.step4AddOns \?\? DEFAULT_ADD_ONS\}\s*\n\s*onRecalculate=\{handleAddOnsConfirmed\}\s*\n\s*pricingStatus=\{pricingStatus\}\s*\n\s*showGenerateButton=\{false\}\s*\n\s*merlinData=\{data\}\s*\n\s*/>',
    re.DOTALL
)

new_cards = '''
      {/* Generator — optional backup power, included in core quote */}
      <GeneratorCard
        state={state}
        peakLoadKW={peakKW}
        currentAddOns={state.step4AddOns ?? DEFAULT_ADD_ONS}
        onRecalculate={handleAddOnsConfirmed}
      />'''

new_content, count = old_cards_pattern.subn(new_cards, content, count=1)
if count:
    print(f"SystemAddOnsCards JSX: REPLACED ({count})")
    content = new_content
else:
    print("SystemAddOnsCards JSX: NOT FOUND via regex")
    idx = content.find('SystemAddOnsCards')
    if idx >= 0:
        print(repr(content[idx-100:idx+300]))

# Update the intro text
old_intro = '''      {/* ── Inline guidance ── */}
      <div className="space-y-2.5">
        <p className="text-sm leading-relaxed text-slate-400">
          Optional add-ons for your{" "}
          <span className="text-slate-200 font-medium">{industryLabel}</span> si
te
          {peakKW > 0 && (
            <span className="text-slate-500">{" "}· {Math.round(peakKW)} kW peak
</span>
          )}
          {data.peakSunHours > 0 && (
            <span className="text-slate-500">{" "}· {data.peakSunHours} sun hrs/
day</span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          Toggle any card to include it, choose a tier, or skip to continue.
        </p>
      </div>'''

new_intro = '''      {/* ── Intro ── */}
      <div className="space-y-2.5">
        <p className="text-sm leading-relaxed text-slate-400">
          Your <span className="text-slate-200 font-medium">{industryLabel}</span> BESS quote
          {peakKW > 0 && (
            <span className="text-slate-500">{" "}· {Math.round(peakKW)} kW peak</span>
          )}
          {" "}is ready. Add a backup generator if you need power during outages.
        </p>
        <p className="text-xs text-slate-500">
          Skip this step if BESS alone meets your needs. Solar and EV add-ons are available after you see your quote.
        </p>
      </div>'''

if old_intro in content:
    content = content.replace(old_intro, new_intro, 1)
    print("Intro: REPLACED")
else:
    print("Intro: NOT FOUND (trying regex)")
    # Use regex for line-wrapped version
    intro_pattern = re.compile(
        r'\s*\{/\* ── Inline guidance ── \*/\}\s*\n\s*<div className="space-y-2\.5">'
        r'.*?</div>',
        re.DOTALL
    )
    # Find where the intro section ends (before pricing status)
    idx = content.find('{/* Pricing status indicator */')
    if idx > 0:
        intro_start = content.rfind('      {/* ── Inline guidance ──', 0, idx)
        if intro_start > 0:
            old_block = content[intro_start:idx]
            print(f"Found intro block at {intro_start}:{idx}")
            print(repr(old_block[:200]))
            content = content[:intro_start] + new_intro + '\n\n' + content[idx:]
            print("Intro: REPLACED via position")

with open(path, 'w') as f:
    f.write(content)

print("Done.")
