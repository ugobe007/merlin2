// Size-Weighted BESS Pricing Demo
// Demonstrates the new pricing algorithm based on energy capacity (MWh)

function calculateSizeWeightedPricing(energyCapacityMWh) {
  // Configuration based on the new system
  const smallSystemPrice = 155; // $/kWh for 2 MWh
  const largeSystemFloor = 105; // $/kWh for 15+ MWh
  const smallSystemSize = 2; // MWh
  const largeSystemSize = 15; // MWh
  
  // Apply floor pricing for large systems
  if (energyCapacityMWh >= largeSystemSize) {
    return largeSystemFloor;
  }
  
  // Apply small system pricing for small systems
  if (energyCapacityMWh <= smallSystemSize) {
    return smallSystemPrice;
  }
  
  // Linear interpolation for mid-range systems
  const sizeDelta = largeSystemSize - smallSystemSize; // 13 MWh
  const priceDelta = smallSystemPrice - largeSystemFloor; // $50/kWh
  
  const capacityRatio = (energyCapacityMWh - smallSystemSize) / sizeDelta;
  const interpolatedPrice = smallSystemPrice - (priceDelta * capacityRatio);
  
  return Math.max(interpolatedPrice, largeSystemFloor);
}

function calculateProjectCost(energyCapacityMWh) {
  const pricePerKWh = calculateSizeWeightedPricing(energyCapacityMWh);
  const energyCapacityKWh = energyCapacityMWh * 1000;
  const batteryCost = energyCapacityKWh * pricePerKWh;
  
  return {
    energyCapacityMWh,
    energyCapacityKWh,
    pricePerKWh: Math.round(pricePerKWh),
    batteryCost: Math.round(batteryCost),
    costPerMWh: Math.round(batteryCost / energyCapacityMWh)
  };
}

console.log("=== SIZE-WEIGHTED BESS PRICING DEMONSTRATION ===\n");
console.log("New pricing model: $155/kWh @ 2MWh → $105/kWh @ 15+MWh\n");

// Test various system sizes
const testSizes = [1, 2, 4, 6, 8, 10, 12, 15, 20, 25];

console.log("System Size  | $/kWh | Battery Cost  | $/MWh     | Notes");
console.log("-------------|-------|---------------|-----------|------------------");

testSizes.forEach(size => {
  const result = calculateProjectCost(size);
  
  let notes = "";
  if (size <= 2) notes = "Small system pricing";
  else if (size >= 15) notes = "Large system floor";
  else notes = "Interpolated pricing";
  
  console.log(
    `${size.toString().padEnd(11)} | $${result.pricePerKWh.toString().padStart(4)} | $${(result.batteryCost/1000000).toFixed(2).padStart(10)}M | $${(result.costPerMWh/1000000).toFixed(2).padStart(6)}M | ${notes}`
  );
});

console.log("\n=== COMPARISON WITH MAINSPRING DATA ===\n");

// Compare with Mainspring proposal data
const mainspringSystems = [
  { name: "Option A (1.25 MWh)", capacity: 1.25, actualCost: 206250 },
  { name: "Option B (1.25 MWh)", capacity: 1.25, actualCost: 206250 },
  { name: "Option C (1.5 MWh)", capacity: 1.5, actualCost: 247500 }
];

console.log("Mainspring System    | Our Model | Mainspring | Difference");
console.log("---------------------|-----------|------------|------------");

mainspringSystems.forEach(system => {
  const ourResult = calculateProjectCost(system.capacity);
  const actualPricePerKWh = system.actualCost / (system.capacity * 1000);
  const difference = ((actualPricePerKWh - ourResult.pricePerKWh) / ourResult.pricePerKWh * 100);
  
  console.log(
    `${system.name.padEnd(20)} | $${ourResult.pricePerKWh.toString().padStart(6)}/kWh | $${Math.round(actualPricePerKWh).toString().padStart(6)}/kWh | ${difference > 0 ? '+' : ''}${difference.toFixed(1)}%`
  );
});

console.log("\n=== PRICING INSIGHTS ===\n");
console.log("✓ Floor pricing of $105/kWh protects against underpricing large projects");
console.log("✓ Small system premium reflects integration complexity and economies of scale");
console.log("✓ Linear interpolation provides smooth pricing transition");
console.log("✓ Mainspring data validates our small system pricing (~$155-165/kWh)");
console.log("✓ Energy-based sizing (MWh) is more accurate than power-based (MW) for pricing");

console.log("\n=== ADMIN PANEL BENEFITS ===\n");
console.log("• Real-time visualization of how pricing scales with system size");
console.log("• Ability to adjust floor ($105/kWh) and ceiling ($155/kWh) pricing");
console.log("• Configurable size thresholds (2 MWh small, 15 MWh large)");
console.log("• Live price calculations for any system size");
console.log("• Integration with vendor quote validation and daily market checks");