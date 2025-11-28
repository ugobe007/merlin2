/**
 * BROWSER CONSOLE TEST SCRIPT
 * Copy and paste this into browser console when app is running
 * 
 * Tests all use cases: car wash, apartment, university, office, EV charging,
 * shopping center, indoor farm, casino, government, retail, logistics, warehouse, manufacturing
 */

(async function testAllUseCases() {
  // Import the function (assumes app is loaded)
  const { calculateDatabaseBaseline } = await import('./services/baselineService');
  
  console.log('🧪 COMPREHENSIVE USE CASE TESTING');
  console.log('='.repeat(80));
  console.log('\n');

  const testCases = [
    // 1. CAR WASH
    {
      name: 'Car Wash - 4 bay with heated water',
      template: 'car-wash',
      scale: 4,
      data: { numBays: 4, heatedWater: 'yes', gridConnection: 'reliable' },
      expectedRange: [0.15, 0.25]
    },
    
    // 2. APARTMENT
    {
      name: 'Apartment - 200 units',
      template: 'apartment',
      scale: 2,
      data: { numUnits: 200, buildingType: 'mid-rise' },
      expectedRange: [0.8, 1.5]
    },
    
    // 3. UNIVERSITY
    {
      name: 'University - 10,000 students',
      template: 'college',
      scale: 10,
      data: { enrollment: 10000, campusSize: 'large' },
      expectedRange: [4, 8]
    },
    
    // 4. OFFICE - Small
    {
      name: 'Office - 50,000 sq ft',
      template: 'office',
      scale: 1,
      data: { squareFootage: 50000, buildingClass: 'class-a' },
      expectedRange: [0.25, 0.4]
    },
    
    // 5. OFFICE - Large
    {
      name: 'Office - 250,000 sq ft',
      template: 'office',
      scale: 5,
      data: { squareFootage: 250000 },
      expectedRange: [1.0, 2.0]
    },
    
    // 6. EV CHARGING - Urban
    {
      name: 'EV Charging - Urban (10 L2 + 4 DC)',
      template: 'ev-charging',
      scale: 1,
      data: {
        level2Chargers: 10,
        level2Power: 7,
        dcFastChargers: 4,
        dcFastPower: 150,
        gridConnection: 'limited',
        gridCapacity: 0.5
      },
      expectedRange: [0.4, 0.8]
    },
    
    // 7. EV CHARGING - Highway
    {
      name: 'EV Charging - Highway (20 DC Fast)',
      template: 'ev-charging',
      scale: 1,
      data: {
        dcFastChargers: 20,
        dcFastPower: 150,
        stationType: 'highway'
      },
      expectedRange: [1.5, 2.5]
    },
    
    // 8. SHOPPING CENTER
    {
      name: 'Shopping Center - 150,000 sq ft',
      template: 'shopping-center',
      scale: 1,
      data: { squareFootage: 150000, storeCount: 25 },
      expectedRange: [1.2, 2.0]
    },
    
    // 9. INDOOR FARM
    {
      name: 'Indoor Farm - 50,000 sq ft',
      template: 'indoor-farm',
      scale: 5,
      data: { cultivationArea: 50000, cropType: 'leafy-greens' },
      expectedRange: [1.5, 2.5]
    },
    
    // 10. CASINO
    {
      name: 'Casino - 80,000 sq ft gaming',
      template: 'tribal-casino',
      scale: 1.6,
      data: { gamingFloorSize: 80000, hotelRooms: 200 },
      expectedRange: [2.0, 3.5]
    },
    
    // 11. GOVERNMENT
    {
      name: 'Government - 100,000 sq ft municipal',
      template: 'office',
      scale: 2,
      data: { squareFootage: 100000, buildingType: 'government' },
      expectedRange: [0.5, 0.8]
    },
    
    // 12. RETAIL
    {
      name: 'Retail - 50,000 sq ft big box',
      template: 'retail',
      scale: 5,
      data: { storeSize: 50000, storeType: 'big-box' },
      expectedRange: [0.4, 0.8]
    },
    
    // 13. LOGISTICS
    {
      name: 'Logistics - 500,000 sq ft fulfillment',
      template: 'logistics-center',
      scale: 5,
      data: { facilitySize: 500000, automationLevel: 'high' },
      expectedRange: [2.5, 4.0]
    },
    
    // 14. WAREHOUSE (Cold Storage)
    {
      name: 'Warehouse - 300,000 sq ft cold storage',
      template: 'warehouse',
      scale: 3,
      data: { facilitySize: 300000, warehouseType: 'cold-storage' },
      expectedRange: [3.0, 5.0]
    },
    
    // 15. MANUFACTURING - Light
    {
      name: 'Manufacturing - 200,000 sq ft assembly',
      template: 'manufacturing',
      scale: 1,
      data: { facilitySize: 200000, productionLines: 3 },
      expectedRange: [2.0, 4.0]
    },
    
    // 16. MANUFACTURING - Heavy
    {
      name: 'Manufacturing - 400,000 sq ft heavy industry',
      template: 'manufacturing',
      scale: 2,
      data: {
        facilitySize: 400000,
        productionLines: 5,
        gridConnection: 'limited',
        gridCapacity: 5
      },
      expectedRange: [4.0, 8.0]
    },
    
    // 17. DATA CENTER (user's test)
    {
      name: 'Data Center - 250 MW Tier 3',
      template: 'datacenter',
      scale: 250,
      data: {
        capacity: 250,
        tier: 'tier3',
        gridConnection: 'limited',
        gridCapacity: 50
      },
      expectedRange: [140, 160]
    },
    
    // 18. HOTEL (user's test)
    {
      name: 'Hotel - 500 rooms + 12 EV',
      template: 'hotel',
      scale: 5,
      data: {
        numRooms: 500,
        numberOfRooms: 500,
        amenities: ['pool', 'restaurant'],
        evChargingPorts: 12,
        gridConnection: 'limited',
        gridCapacity: 15
      },
      expectedRange: [1.4, 1.8]
    }
  ];

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`\n📋 ${test.name}`);
    console.log(`   Template: ${test.template}, Scale: ${test.scale}`);
    
    try {
      const result = await calculateDatabaseBaseline(test.template, test.scale, test.data);
      
      const inRange = result.powerMW >= test.expectedRange[0] && result.powerMW <= test.expectedRange[1];
      const status = inRange ? '✅ PASS' : '⚠️ OUT OF RANGE';
      
      if (inRange) passed++;
      else failed++;
      
      console.log(`   Power: ${result.powerMW.toFixed(2)} MW (expected ${test.expectedRange[0]}-${test.expectedRange[1]})`);
      console.log(`   Duration: ${result.durationHrs} hr`);
      console.log(`   Energy: ${(result.powerMW * result.durationHrs).toFixed(2)} MWh`);
      console.log(`   ${status}`);
      
      results.push({
        name: test.name,
        power: result.powerMW,
        duration: result.durationHrs,
        status: inRange ? 'PASS' : 'FAIL'
      });
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
      results.push({ name: test.name, status: 'ERROR', error: error.message });
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total: ${testCases.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed/testCases.length)*100).toFixed(1)}%`);
  
  console.table(results);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Ready for customer demos.');
  }
  
  return results;
})();
