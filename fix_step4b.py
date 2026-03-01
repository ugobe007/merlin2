path = "/Users/robertchristopher/merlin3/src/components/wizard/v7/steps/Step4OptionsV7.tsx"
with open(path, 'r') as f:
    c = f.read()

# Fix the import line
c = c.replace(
    'import { SystemAddOnsCards } from "./SystemAddOnsCards";',
    'import { GeneratorCard } from "./GeneratorCard";'
)

# Fix the title in the header comment
c = c.replace(
    'STEP 4: OPTIONS \u2014 System Add-Ons Configuration',
    'STEP 4: BACKUP POWER \u2014 Optional Generator Configuration'
)

with open(path, 'w') as f:
    f.write(c)

print("SystemAddOnsCards remaining:", "SystemAddOnsCards" in c)
print("GeneratorCard present:", "GeneratorCard" in c)
print("Done.")
