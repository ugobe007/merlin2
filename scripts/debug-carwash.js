// Debug car wash savings — replicates server/routes/quote.js math
// Run: node scripts/debug-carwash.js

const peakKW = 450;
const monthlyBill = 18000;
const kwhPerMonth = peakKW * 0.40 * 730;
const elecRate = Math.min(0.35, Math.max(0.08, monthlyBill / kwhPerMonth));
console.log('Estimated electricity rate:', elecRate.toFixed(4), '$/kWh');

const BESS_RATIO_PEAK = 0.40;
const TIER_DURATION_REC = 4;
const BESS_COMMERCIAL_FLOOR = 75;
const SOLAR_PR = 0.77;
const BESS_PRICE_PER_KWH = 350;
const BESS_PRICE_PER_KW = 150;
const SOLAR_PRICE_PER_WATT = 1.51;
const SITE_WORK_TOTAL = 25800;
const CONTINGENCY_RATE = 0.075;
const psh = 5.5; // Miami

const bessKW = Math.max(BESS_COMMERCIAL_FLOOR, Math.round(peakKW * BESS_RATIO_PEAK));
const bessKWh = Math.round(bessKW * TIER_DURATION_REC);
console.log('\nBESS sizing (Recommended):');
console.log('  bessKW:', bessKW);
console.log('  bessKWh:', bessKWh, '(', TIER_DURATION_REC, 'hr duration)');

// Solar: car_wash solarCapKW default = 39 (this is NOT overridden by MCP — MCP doesn't send solarCapKW)
const solarCapKW = 39;
const sunFactor = Math.max(0.40, Math.min(1.0, (psh - 2.5) / 2.0));
const solarKW = Math.round(Math.min(solarCapKW * sunFactor * 0.85, solarCapKW));
console.log('\nSolar sizing:');
console.log('  solarCapKW:', solarCapKW, '(car_wash industry default)');
console.log('  sunFactor:', sunFactor.toFixed(2));
console.log('  solarKW:', solarKW);

// Demand charge — car_wash default = $15/kW
const demandCharge = 15;
const demandChargeSavings = bessKW * demandCharge * 12 * 0.75;
const solarKWhProduced = solarKW * psh * 365 * SOLAR_PR;
const solarSavings = solarKWhProduced * elecRate;
const grossSavings = demandChargeSavings + solarSavings;

const reserves = 1250 + solarKW * 1000 * 0.01 + bessKWh * BESS_PRICE_PER_KWH * 0.02;
const netSavings = grossSavings - reserves;

console.log('\nSavings:');
console.log('  Demand charge savings:', Math.round(demandChargeSavings));
console.log('  Solar savings:', Math.round(solarSavings));
console.log('  Gross savings:', Math.round(grossSavings));
console.log('  Annual reserves:', Math.round(reserves));
console.log('  NET annual savings:', Math.round(netSavings));

// Costs
const bessCost = bessKWh * BESS_PRICE_PER_KWH + bessKW * BESS_PRICE_PER_KW;
const solarCost = solarKW * SOLAR_PRICE_PER_WATT * 1000;
const equipTotal = bessCost + solarCost;
const contingency = Math.round((equipTotal + SITE_WORK_TOTAL) * CONTINGENCY_RATE);
const marginRate = equipTotal < 200000 ? 0.20 : equipTotal < 800000 ? 0.14 : 0.13;
const merlinFee = Math.round(equipTotal * marginRate);
const totalInv = equipTotal + SITE_WORK_TOTAL + contingency + merlinFee;
const itc = Math.round((solarCost + bessCost) * 0.30);
const netCost = totalInv - itc;

console.log('\nCosts:');
console.log('  BESS cost:', Math.round(bessCost));
console.log('  Solar cost:', Math.round(solarCost));
console.log('  Equip total:', Math.round(equipTotal));
console.log('  Margin rate:', (marginRate * 100).toFixed(0) + '%');
console.log('  Merlin fee:', Math.round(merlinFee));
console.log('  Total investment:', Math.round(totalInv));
console.log('  ITC (30%):', Math.round(itc));
console.log('  Net cost after ITC:', Math.round(netCost));

const payback = (netCost / netSavings).toFixed(1);
const roi10 = Math.round(((netSavings * 10 - netCost) / netCost) * 100);
let npv = -netCost;
for (let yr = 1; yr <= 25; yr++) npv += netSavings / Math.pow(1.05, yr);

console.log('\nROI:');
console.log('  Payback:', payback, 'yrs');
console.log('  10yr ROI:', roi10 + '%');
console.log('  25yr NPV:', Math.round(npv));

console.log('\n--- ROOT CAUSE DIAGNOSTICS ---');
console.log('Problem 1: solarCapKW=39 is tiny for a 450kW car wash (INDUSTRY DEFAULT is wrong)');
console.log('Problem 2: demandCharge=$15/kW (industry default) vs $18-25 typical for FL/commercial');
console.log('Problem 3: elecRate=', elecRate.toFixed(4), '— is this accurate for FL?');
console.log('Problem 4: reserves eat', Math.round(reserves / grossSavings * 100) + '% of gross savings');

// Show what the numbers SHOULD look like for a real 450kW car wash
console.log('\n--- CORRECTED SCENARIO (450kW car wash, realistic params) ---');
const demandReal = 22; // $22/kW realistic for FL commercial
const solarCapReal = 120; // 450kW car wash = big canopy ~120kW realistic
const solarKWreal = Math.round(Math.min(solarCapReal * sunFactor * 0.85, solarCapReal));
const demandSavingsReal = bessKW * demandReal * 12 * 0.75;
const solarKWhReal = solarKWreal * psh * 365 * SOLAR_PR;
const solarSavReal = solarKWhReal * elecRate;
const grossReal = demandSavingsReal + solarSavReal;
const reservesReal = 1250 + solarKWreal * 1000 * 0.01 + bessKWh * BESS_PRICE_PER_KWH * 0.02;
const netReal = grossReal - reservesReal;
console.log('  solarCapKW corrected to:', solarCapReal, '(realistic for 450kW car wash)');
console.log('  demandCharge corrected to: $' + demandReal + '/kW (FL commercial rate)');
console.log('  Solar kW:', solarKWreal);
console.log('  Demand savings:', Math.round(demandSavingsReal));
console.log('  Solar savings:', Math.round(solarSavReal));
console.log('  NET annual savings:', Math.round(netReal));
console.log('  Payback:', (netCost / netReal).toFixed(1), 'yrs');
let npv2 = -netCost;
for (let yr = 1; yr <= 25; yr++) npv2 += netReal / Math.pow(1.05, yr);
console.log('  25yr NPV:', Math.round(npv2));
