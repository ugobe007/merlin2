import sys, os
os.chdir('/Users/robertchristopher/merlin3')

path = 'src/services/calculationValidator.ts'
txt = open(path, encoding='utf-8').read()

old1 = 'if (bessPricePerKWh > 0) {\n      const typicalPrice = BENCHMARK_BOUNDS.bess.typical;\n      const deviation = Math.abs((bessPricePerKWh - typicalPrice) / typicalPrice) * 100;\n\n      // TRUEQUOTE SYSTEMATIC POLICY: Flag 3%+ deviation from benchmark\n      if (deviation >= 3) {\n        warnings.push({\n          code: "BESS_PRICE_DEVIATION_3PERCENT",\n          field: "bessPricing",\n          message: `BESS price ($${bessPricePerKWh.toFixed(0)}/kWh) deviates ${deviation.toFixed(1)}% from benchmark ($${typicalPrice}/kWh). TrueQuote validation failed.`,\n          severity: "error",\n          expectedRange: {\n            min: BENCHMARK_BOUNDS.bess.min,\n            max: BENCHMARK_BOUNDS.bess.max,\n          },\n          actualValue: bessPricePerKWh,\n          benchmark: BENCHMARK_BOUNDS.bess.source,\n        });\n      } else if (bessPricePerKWh < BENCHMARK_BOUNDS'
new1 = 'if (bessPricePerKWh > 0) {\n      // Guardrail bounds check: BESS pack $/kWh vs [quoteFloor, ceiling] from DEFAULT_PRICE_GUARDS.\n      // Outside bounds => score drops below 90 => all equipment pricing reviewed.\n      if (bessPricePerKWh < BENCHMARK_BOUNDS'

old2 = 'if (solarPricePerW > 0) {\n        const typicalPrice = BENCHMARK_BOUNDS.solar.typical;\n        const deviation = Math.abs((solarPricePerW - typicalPrice) / typicalPrice) * 100;\n\n        // TRUEQUOTE SYSTEMATIC POLICY: Flag 3%+ deviation from benchmark\n        if (deviation >= 3) {\n          warnings.push({\n            code: "SOLAR_PRICE_DEVIATION_3PERCENT",\n            field: "solarPricing",\n            message: `Solar price ($${solarPricePerW.toFixed(2)}/W) deviates ${deviation.toFixed(1)}% from benchmark ($${typicalPrice}/W). TrueQuote validation failed.`,\n            severity: "error",\n            expectedRange: {\n              min: BENCHMARK_BOUNDS.solar.min,\n              max: BENCHMARK_BOUNDS.solar.max,\n            },\n            actualValue: solarPricePerW,\n            benchmark: BENCHMARK_BOUNDS.solar.source,\n          });\n        } else if (solarPricePerW < BENCHMARK_BOUNDS'
new2 = 'if (solarPricePerW > 0) {\n        // Guardrail bounds check: solar $/W vs [quoteFloor, ceiling] from DEFAULT_PRICE_GUARDS.\n        if (solarPricePerW < BENCHMARK_BOUNDS'

old3 = 'const typicalRatio = BENCHMARK_BOUNDS.installation.typical;\n      const deviation = Math.abs((installationRatio - typicalRatio) / typicalRatio) * 100;\n\n      // TRUEQUOTE SYSTEMATIC POLICY: Flag 3%+ deviation from benchmark\n      if (deviation >= 3) {\n        warnings.push({\n          code: "INSTALLATION_DEVIATION_3PERCENT",\n          field: "installationCost",\n          message: `Installation ratio (${(installationRatio * 100).toFixed(0)}%) deviates ${deviation.toFixed(1)}% from benchmark (${(typicalRatio * 100).toFixed(0)}%). TrueQuote validation failed.`,\n          severity: "error",\n          expectedRange: {\n            min: BENCHMARK_BOUNDS.installation.min * 100,\n            max: BENCHMARK_BOUNDS.installation.max * 100,\n          },\n          actualValue: installationRatio * 100,\n          benchmark: BENCHMARK_BOUNDS.installation.source,\n        });\n      } else if (installationRatio < BENCHMARK_BOUNDS'
new3 = '// Guardrail bounds check: installation ratio must be within expected range.\n      if (installationRatio < BENCHMARK_BOUNDS'

checks = [(old1, new1, 'BESS'), (old2, new2, 'Solar'), (old3, new3, 'Install')]
for old, new, name in checks:
    if old not in txt:
        print(f'ERROR: {name} block not found')
        sys.exit(1)
    txt = txt.replace(old, new, 1)
    print(f'{name}: deviation check removed.')

open(path, 'w', encoding='utf-8').write(txt)
print('All done.')
