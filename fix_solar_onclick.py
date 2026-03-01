path = "/Users/robertchristopher/merlin3/src/components/wizard/v7/steps/SystemAddOnsCards.tsx"
with open(path, 'r') as f:
    content = f.read()

# Solar standard tier fix
old_solar = '''                      onClick={() => {
                        setSolarTier(k);
                        if (!selectedOptions.has("solar")) {
                          setSelectedOptions((prev) => new Set(prev).add("solar"));
                          setExpandedCards((prev) => new Set(prev).add("solar"));
                        }
                      }}'''

new_solar = '''                      onClick={() => {
                        const tqt = TrueQuoteTemp.get();
                        TrueQuoteTemp.writeAddOns({
                          ...tqt,
                          includeSolar: true,
                          solarKW: o?.sizeKw ?? tqt.solarKW,
                        });
                        setSolarTier(k);
                        if (!selectedOptions.has("solar")) {
                          setSelectedOptions((prev) => new Set(prev).add("solar"));
                          setExpandedCards((prev) => new Set(prev).add("solar"));
                        }
                      }}'''

if old_solar in content:
    content = content.replace(old_solar, new_solar, 1)
    print("Solar standard tier: REPLACED")
else:
    print("Solar standard tier: NOT FOUND")
    idx = content.find('setSolarTier(k);')
    print(repr(content[idx-200:idx+300]))

# Generator tier fix
old_gen = '''                    onClick={() => {
                      setGeneratorTier(k);
                      if (!selectedOptions.has("generator")) {
                        setSelectedOptions((prev) => new Set(prev).add("generator"));
                        setExpandedCards((prev) => new Set(prev).add("generator"));
                      }
                    }}'''

new_gen = '''                    onClick={() => {
                      const tqt = TrueQuoteTemp.get();
                      TrueQuoteTemp.writeAddOns({
                        ...tqt,
                        includeGenerator: true,
                        generatorKW: o?.sizeKw ?? tqt.generatorKW,
                      });
                      setGeneratorTier(k);
                      if (!selectedOptions.has("generator")) {
                        setSelectedOptions((prev) => new Set(prev).add("generator"));
                        setExpandedCards((prev) => new Set(prev).add("generator"));
                      }
                    }}'''

if old_gen in content:
    content = content.replace(old_gen, new_gen, 1)
    print("Generator tier: REPLACED")
else:
    print("Generator tier: NOT FOUND")
    idx = content.find('setGeneratorTier(k);')
    print(repr(content[idx-200:idx+300]))

with open(path, 'w') as f:
    f.write(content)

print("Done.")
