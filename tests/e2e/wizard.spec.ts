/**
 * MERLIN WIZARD E2E TESTS - PLAYWRIGHT
 * =====================================
 * 
 * End-to-end tests for the industry profile questionnaire wizard.
 * Tests all 10 industry profiles with various user paths.
 * 
 * Run: npx playwright test wizard.spec.ts
 * Debug: npx playwright test wizard.spec.ts --debug
 * UI Mode: npx playwright test wizard.spec.ts --ui
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const BASE_URL = process.env.TEST_URL || process.env.BASE_URL || 'http://localhost:5184';
const WIZARD_PATH = '/wizard';

// Industry test data
const INDUSTRIES = {
  hotel: {
    slug: 'hotel',
    name: 'Hotel / Hospitality',
    displayName: 'Hotel / Hospitality',
    icon: '🏨',
    testData: {
      hotelType: 'fullService',
      roomCount: 150,
      amenities: ['pool', 'restaurant', 'fitness', 'laundry'],
      poolType: 'indoorHeated',
      restaurantSeats: 100,
      hvacType: 'central',
      waterHeatingFuel: 'gas',
      currentBackup: 'partial',
      generatorKw: 200,
      occupancyRate: 75,
      floors: 5,
      monthlyEnergySpend: 25000,
      priorities: ['reduceCosts', 'guestExperience', 'sustainability']
    },
    expectedOutputs: {
      minPeakKw: 200,
      maxPeakKw: 600,
      hasBessRecommendation: true
    }
  },
  
  carWash: {
    slug: 'car_wash',
    name: 'Car Wash',
    displayName: 'Car Wash',
    icon: '🚗',
    testData: {
      washType: 'expressTunnel',
      tunnelLength: 140,
      carsPerDay: 400,
      dryerType: 'highVelocity',
      dryerCount: 6,
      vacuumStations: 12,
      waterHeatingFuel: 'gas',
      waterReclaim: true,
      operatingHours: '14',
      monthlyEnergySpend: 8000,
      currentBackup: 'none',
      priorities: ['reduceCosts', 'stayOpen', 'demandCharges']
    },
    expectedOutputs: {
      minPeakKw: 150,
      maxPeakKw: 400,
      hasBessRecommendation: true
    }
  },
  
  evChargingHub: {
    slug: 'ev_charging',
    name: 'EV Charging Hub',
    displayName: 'EV Charging Hub',
    icon: '⚡',
    testData: {
      hubType: 'urbanHub',
      totalChargingSpaces: 16,
      chargerMix: 'dcfcOnly',
      dcfcCount: 16,
      averageDcfcKw: 150,
      electricalService: 2000,
      gridUpgradeNeeded: true,
      solarPotential: 'moderate',
      priorities: ['avoidGridUpgrade', 'demandCharges', 'revenue']
    },
    expectedOutputs: {
      minPeakKw: 1000,
      maxPeakKw: 3000,
      hasBessRecommendation: true
    }
  },
  
  dataCenter: {
    slug: 'data_center',
    name: 'Data Center',
    displayName: 'Data Center',
    icon: '🖥️',
    testData: {
      facilityType: 'enterprise',
      rackCount: 100,
      workloadType: 'virtualized',
      criticalityLevel: 'missionCritical',
      currentBackup: 'generator',
      generatorCount: 2,
      backupDurationTarget: 4,
      coolingMethod: 'hotColdAisle',
      monthlyEnergySpend: 150000,
      priorities: ['uptime', 'efficiency', 'sustainability']
    },
    expectedOutputs: {
      minPeakKw: 800,
      maxPeakKw: 2000,
      hasBessRecommendation: true
    }
  },
  
  manufacturing: {
    slug: 'manufacturing',
    name: 'Manufacturing',
    displayName: 'Manufacturing',
    icon: '🏭',
    testData: {
      manufacturingType: 'heavyAssembly',
      facilitySqFt: 150000,
      buildingCount: 1,
      productionSchedule: 'doubleShift',
      mainEquipment: ['motors', 'compressedAir', 'hvac'],
      largeLoads: ['largeMotors', 'largeCompressors'],
      electricalService: 2000,
      currentBackup: 'generator',
      outageImpact: 'significantRestart',
      monthlyEnergySpend: 75000,
      priorities: ['reduceCosts', 'reliability', 'demandCharges']
    },
    expectedOutputs: {
      minPeakKw: 1000,
      maxPeakKw: 3000,
      hasBessRecommendation: true
    }
  },
  
  hospital: {
    slug: 'hospital',
    displayName: 'Hospital / Healthcare',
    name: 'Hospital / Healthcare',
    icon: '🏥',
    testData: {
      facilityType: 'regional',
      bedCount: 200,
      facilitySqFt: 300000,
      criticalServices: ['emergencyDept', 'operatingRooms', 'icu', 'mri'],
      highDrawEquipment: ['mri', 'ct'],
      mriCount: 2,
      ctCount: 3,
      currentBackup: ['diesel'],
      generatorCapacityKw: 2000,
      generatorCoverage: 'critical',
      outageFrequency: 'occasionally',
      priorities: ['patientSafety', 'compliance', 'reduceDiesel']
    },
    expectedOutputs: {
      minPeakKw: 1500,
      maxPeakKw: 4000,
      hasBessRecommendation: true
    }
  },
  
  university: {
    slug: 'college',
    name: 'University / Campus',
    displayName: 'College / University',
    icon: '🎓',
    testData: {
      campusType: 'largeState',
      studentCount: 35000,
      campusSqFt: 12000000,
      buildingCount: 150,
      buildingTypes: ['classroom', 'researchLabs', 'residenceHalls', 'library', 'athletic'],
      highImpactFacilities: ['fumeHoods', 'dataCenter', 'stadium'],
      fumeHoodCount: 500,
      dataCenterKw: 2000,
      currentPower: ['gridOnly'],
      currentBackup: ['buildingDiesel'],
      climateCommitments: ['carbonNeutral'],
      commitmentTargetYear: 2035,
      priorities: ['climateCommitments', 'resilience', 'reduceCosts']
    },
    expectedOutputs: {
      minPeakKw: 30000,
      maxPeakKw: 100000,
      hasBessRecommendation: true
    }
  },
  
  retail: {
    slug: 'retail',
    name: 'Retail / Commercial',
    displayName: 'Retail / Commercial',
    icon: '🏬',
    testData: {
      retailType: 'largeGrocery',
      storeSqFt: 55000,
      chainSize: 'mediumChain',
      operatingHours: 'extended',
      refrigerationLevel: 'heavy',
      refrigeratedCaseFeet: 400,
      walkInCooler: true,
      walkInFreezer: true,
      monthlyEnergySpend: 25000,
      currentBackup: 'refrigerationOnly',
      ownershipType: 'own',
      solarPotential: 'largeRoof',
      priorities: ['protectInventory', 'reduceCosts', 'sustainability']
    },
    expectedOutputs: {
      minPeakKw: 300,
      maxPeakKw: 600,
      hasBessRecommendation: true
    }
  },
  
  restaurant: {
    slug: 'restaurant',
    name: 'Restaurant',
    displayName: 'Restaurant',
    icon: '🍽️',
    testData: {
      restaurantType: 'casualDining',
      restaurantSqFt: 5000,
      ownershipType: 'franchiseSingle',
      cookingFuel: 'hybrid',
      kitchenEquipment: ['fryers', 'grillsGriddles', 'ovensStandard'],
      refrigerationEquipment: ['walkInCooler', 'walkInFreezer', 'reachInRefrig'],
      mealPeriods: ['lunch', 'dinner'],
      peakTimes: ['lunchRush', 'dinnerRush'],
      monthlyEnergySpend: 6000,
      currentBackup: 'none',
      priorities: ['reduceCosts', 'protectInventory', 'keepKitchenRunning']
    },
    expectedOutputs: {
      minPeakKw: 100,
      maxPeakKw: 250,
      hasBessRecommendation: true
    }
  },
  
  office: {
    slug: 'office',
    name: 'Office Building',
    displayName: 'Office Building',
    icon: '🏢',
    testData: {
      officeType: 'midRise',
      buildingSqFt: 120000,
      floorCount: 8,
      buildingClass: 'classA',
      tenancy: 'multi',
      hvacSystem: ['centralPlant'],
      chillerTons: 400,
      buildingSystems: ['bms', 'ledLighting', 'elevators', 'emergencyGenerator'],
      elevatorCount: 4,
      generatorKw: 500,
      leasedPercent: 90,
      physicalOccupancy: 55,
      annualEnergySpend: 400000,
      leaseStructure: 'nnnOwnerBills',
      currentBackup: 'lifeSafetyElevators',
      priorities: ['reduceOperatingCosts', 'tenantAttraction', 'sustainability']
    },
    expectedOutputs: {
      minPeakKw: 400,
      maxPeakKw: 1000,
      hasBessRecommendation: true
    }
  },
  
  truckStop: {
    slug: 'heavy_duty_truck_stop',
    name: 'Truck Stop / Travel Center',
    displayName: 'Truck Stop / Travel Center',
    icon: '🚛',
    testData: {
      facilityType: 'fullService',
      fuelDispensers: 8,
      dieselLanes: 4,
      carWashBays: 2,
      restaurantSeats: 100,
      convenienceStoreSqFt: 3000,
      truckParkingSpaces: 50,
      operatingHours: '24/7',
      monthlyEnergySpend: 15000,
      currentBackup: 'partial',
      priorities: ['reduceCosts', 'stayOpen', 'demandCharges']
    },
    expectedOutputs: {
      minPeakKw: 200,
      maxPeakKw: 600,
      hasBessRecommendation: true
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function navigateToWizard(page: Page) {
  await page.goto(`${BASE_URL}${WIZARD_PATH}`);
  // Wait for page to load - look for wizard content
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
}

async function selectIndustry(page: Page, industryInfo: any) {
  // Industry selection uses button text, not data attributes
  // Look for button containing the industry display name or name
  const displayText = industryInfo.displayName || industryInfo.name || '';
  if (!displayText) {
    throw new Error(`Industry object missing displayName or name: ${JSON.stringify(industryInfo)}`);
  }
  const industryButton = page.locator(`button:has-text("${displayText}")`).first();
  
  // Wait for industry selection to be visible (Step 2)
  await industryButton.waitFor({ state: 'visible', timeout: 15000 });
  await industryButton.click();
  
  // Wait for navigation to Step 3 (questions should appear)
  // Look for question container or questionnaire engine
  await page.waitForSelector('.question-container, .questionnaire-engine', { timeout: 15000 });
  // Also wait a bit for questions to fully load
  await page.waitForTimeout(1000);
}

async function fillQuestion(page: Page, questionId: string, value: any, type: string) {
  const questionContainer = page.locator(`[data-question="${questionId}"], [data-testid="question-${questionId}"]`);
  
  switch (type) {
    case 'select':
      await questionContainer.locator('select, [role="combobox"]').click();
      await page.locator(`[data-value="${value}"], option[value="${value}"]`).click();
      break;
      
    case 'slider':
      const slider = questionContainer.locator('input[type="range"]');
      await slider.fill(String(value));
      break;
      
    case 'number':
      const numberInput = questionContainer.locator('input[type="number"]');
      await numberInput.fill(String(value));
      break;
      
    case 'multiselect':
      for (const option of value) {
        await questionContainer.locator(`[data-value="${option}"], input[value="${option}"]`).click();
      }
      break;
      
    case 'boolean':
      if (value) {
        await questionContainer.locator('input[type="checkbox"], [role="switch"]').click();
      }
      break;
      
    case 'ranking':
      for (let i = 0; i < value.length; i++) {
        await questionContainer.locator(`[data-value="${value[i]}"]`).click();
      }
      break;
  }
}

async function submitWizard(page: Page) {
  await page.locator('button[type="submit"], [data-testid="submit-wizard"]').click();
  await page.waitForSelector('[data-testid="results"], .results-section', { timeout: 10000 });
}

async function getResults(page: Page) {
  const peakKwText = await page.locator('[data-testid="peak-kw"]').textContent();
  const bessKwhText = await page.locator('[data-testid="bess-kwh"]').textContent();
  const solarKwText = await page.locator('[data-testid="solar-kw"]').textContent();
  
  return {
    peakKw: parseFloat(peakKwText?.replace(/[^0-9.]/g, '') || '0'),
    bessKwh: parseFloat(bessKwhText?.replace(/[^0-9.]/g, '') || '0'),
    solarKw: parseFloat(solarKwText?.replace(/[^0-9.]/g, '') || '0')
  };
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('Wizard Navigation', () => {
  test('should load wizard page', async ({ page }) => {
    await navigateToWizard(page);
    await expect(page).toHaveURL(/wizard/);
  });
  
  test('should display all 10 industries', async ({ page }) => {
    await navigateToWizard(page);
    
    for (const [id, industry] of Object.entries(INDUSTRIES)) {
      const card = page.locator(`[data-industry="${id}"], [data-testid="industry-${id}"]`);
      await expect(card).toBeVisible();
      await expect(card).toContainText(industry.name);
    }
  });
  
  test('should navigate between steps', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.hotel);
    
    // Check step indicators
    await expect(page.locator('[data-step="1"], .step-1')).toHaveClass(/active|current/);
    
    // Navigate to next step
    await page.locator('button:has-text("Next"), [data-testid="next-step"]').click();
    await expect(page.locator('[data-step="2"], .step-2')).toHaveClass(/active|current/);
    
    // Navigate back
    await page.locator('button:has-text("Back"), [data-testid="prev-step"]').click();
    await expect(page.locator('[data-step="1"], .step-1')).toHaveClass(/active|current/);
  });
});

test.describe('Hotel Industry Flow', () => {
  test('should complete hotel questionnaire', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.hotel);
    
    const data = INDUSTRIES.hotel.testData;
    
    // Section 1: Your Hotel
    await fillQuestion(page, 'hotelType', data.hotelType, 'select');
    await fillQuestion(page, 'roomCount', data.roomCount, 'slider');
    
    // Section 2: Amenities
    await fillQuestion(page, 'amenities', data.amenities, 'multiselect');
    await fillQuestion(page, 'poolType', data.poolType, 'select');
    await fillQuestion(page, 'restaurantSeats', data.restaurantSeats, 'number');
    
    // Section 3: Building Systems
    await fillQuestion(page, 'hvacType', data.hvacType, 'select');
    await fillQuestion(page, 'waterHeatingFuel', data.waterHeatingFuel, 'select');
    await fillQuestion(page, 'currentBackup', data.currentBackup, 'select');
    await fillQuestion(page, 'generatorKw', data.generatorKw, 'number');
    
    // Section 4: Operations
    await fillQuestion(page, 'occupancyRate', data.occupancyRate, 'slider');
    await fillQuestion(page, 'floors', data.floors, 'number');
    
    // Section 5: Current Power
    await fillQuestion(page, 'monthlyEnergySpend', data.monthlyEnergySpend, 'select');
    
    // Section 6: Priorities
    await fillQuestion(page, 'priorities', data.priorities, 'ranking');
    
    // Submit and verify
    await submitWizard(page);
    
    const results = await getResults(page);
    expect(results.peakKw).toBeGreaterThan(INDUSTRIES.hotel.expectedOutputs.minPeakKw);
    expect(results.peakKw).toBeLessThan(INDUSTRIES.hotel.expectedOutputs.maxPeakKw);
    expect(results.bessKwh).toBeGreaterThan(0);
  });
  
  test('should show conditional questions based on amenities', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.hotel);
    
    // Pool question should not be visible initially
    await expect(page.locator('[data-question="poolType"]')).not.toBeVisible();
    
    // Select pool amenity
    await fillQuestion(page, 'amenities', ['pool'], 'multiselect');
    
    // Pool question should now be visible
    await expect(page.locator('[data-question="poolType"]')).toBeVisible();
  });
});

test.describe('Car Wash Industry Flow', () => {
  test('should complete car wash questionnaire', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.carWash);
    
    const data = INDUSTRIES.carWash.testData;
    
    await fillQuestion(page, 'washType', data.washType, 'select');
    await fillQuestion(page, 'tunnelLength', data.tunnelLength, 'slider');
    await fillQuestion(page, 'carsPerDay', data.carsPerDay, 'slider');
    await fillQuestion(page, 'dryerType', data.dryerType, 'select');
    await fillQuestion(page, 'dryerCount', data.dryerCount, 'number');
    await fillQuestion(page, 'vacuumStations', data.vacuumStations, 'number');
    await fillQuestion(page, 'waterHeatingFuel', data.waterHeatingFuel, 'select');
    await fillQuestion(page, 'waterReclaim', data.waterReclaim, 'boolean');
    await fillQuestion(page, 'operatingHours', data.operatingHours, 'select');
    await fillQuestion(page, 'monthlyEnergySpend', data.monthlyEnergySpend, 'select');
    await fillQuestion(page, 'currentBackup', data.currentBackup, 'select');
    await fillQuestion(page, 'priorities', data.priorities, 'ranking');
    
    await submitWizard(page);
    
    const results = await getResults(page);
    expect(results.peakKw).toBeGreaterThan(INDUSTRIES.carWash.expectedOutputs.minPeakKw);
    expect(results.bessKwh).toBeGreaterThan(0);
  });
  
  test('should show tunnel length only for tunnel types', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.carWash);
    
    // Select self-serve (no tunnel)
    await fillQuestion(page, 'washType', 'selfServe', 'select');
    await expect(page.locator('[data-question="tunnelLength"]')).not.toBeVisible();
    
    // Select express tunnel
    await fillQuestion(page, 'washType', 'expressTunnel', 'select');
    await expect(page.locator('[data-question="tunnelLength"]')).toBeVisible();
  });
});

test.describe('Data Center Industry Flow', () => {
  test('should calculate based on rack count and workload', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.dataCenter);
    
    const data = INDUSTRIES.dataCenter.testData;
    
    await fillQuestion(page, 'facilityType', data.facilityType, 'select');
    await fillQuestion(page, 'rackCount', data.rackCount, 'number');
    await fillQuestion(page, 'workloadType', data.workloadType, 'select');
    await fillQuestion(page, 'criticalityLevel', data.criticalityLevel, 'select');
    await fillQuestion(page, 'coolingMethod', data.coolingMethod, 'select');
    await fillQuestion(page, 'priorities', data.priorities, 'ranking');
    
    await submitWizard(page);
    
    const results = await getResults(page);
    // Data center: 100 racks × 10 kW/rack × 1.5 PUE = ~1500 kW
    expect(results.peakKw).toBeGreaterThan(800);
  });
  
  test('should show GPU-specific questions for AI workload', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.dataCenter);
    
    await fillQuestion(page, 'workloadType', 'aiGpu', 'select');
    
    // GPU breakdown question should appear
    await expect(page.locator('[data-question="gpuRackCount"], [data-question="gpuRackPercent"]')).toBeVisible();
  });
});

test.describe('Hospital Industry Flow', () => {
  test('should calculate critical load tiers', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.hospital);
    
    const data = INDUSTRIES.hospital.testData;
    
    await fillQuestion(page, 'facilityType', data.facilityType, 'select');
    await fillQuestion(page, 'bedCount', data.bedCount, 'slider');
    await fillQuestion(page, 'facilitySqFt', data.facilitySqFt, 'slider');
    await fillQuestion(page, 'criticalServices', data.criticalServices, 'multiselect');
    await fillQuestion(page, 'highDrawEquipment', data.highDrawEquipment, 'multiselect');
    await fillQuestion(page, 'mriCount', data.mriCount, 'number');
    await fillQuestion(page, 'ctCount', data.ctCount, 'number');
    await fillQuestion(page, 'currentBackup', data.currentBackup, 'multiselect');
    await fillQuestion(page, 'generatorCapacityKw', data.generatorCapacityKw, 'number');
    await fillQuestion(page, 'priorities', data.priorities, 'ranking');
    
    await submitWizard(page);
    
    const results = await getResults(page);
    expect(results.peakKw).toBeGreaterThan(1500);
    expect(results.bessKwh).toBeGreaterThan(0);
    
    // Should show critical load breakdown
    await expect(page.locator('[data-testid="life-safety-kw"]')).toBeVisible();
    await expect(page.locator('[data-testid="critical-branch-kw"]')).toBeVisible();
  });
});

test.describe('All Industries - Smoke Tests', () => {
  for (const [industryId, industry] of Object.entries(INDUSTRIES)) {
    test(`should complete ${industry.name} flow`, async ({ page }) => {
      await navigateToWizard(page);
      await selectIndustry(page, industry);
      
      // Verify questions load
      await expect(page.locator('[data-testid="question-form"], .question-section')).toBeVisible();
      
      // Check first question is visible
      await expect(page.locator('.question-item, [data-question]').first()).toBeVisible();
    });
  }
});

test.describe('Validation', () => {
  test('should show validation errors for required fields', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.hotel);
    
    // Try to submit without filling required fields
    await page.locator('button[type="submit"], [data-testid="submit-wizard"]').click();
    
    // Should show validation errors
    await expect(page.locator('.error-message, [data-testid="validation-error"]')).toBeVisible();
  });
  
  test('should validate number ranges', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.hotel);
    
    // Try to enter invalid room count
    await fillQuestion(page, 'roomCount', -10, 'slider');
    
    // Should show range error or clamp to min
    const sliderValue = await page.locator('[data-question="roomCount"] input[type="range"]').inputValue();
    expect(parseInt(sliderValue)).toBeGreaterThanOrEqual(10);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToWizard(page);
    
    // Industry selection should still work
    await expect(page.locator('[data-industry="hotel"]')).toBeVisible();
    await selectIndustry(page, INDUSTRIES.hotel);
    
    // Questions should be visible
    await expect(page.locator('[data-question="hotelType"]')).toBeVisible();
  });
  
  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.carWash);
    
    await expect(page.locator('[data-question="washType"]')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load wizard within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await navigateToWizard(page);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('should calculate results within 1 second', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, INDUSTRIES.hotel);
    
    // Fill minimal required data
    await fillQuestion(page, 'hotelType', 'limitedService', 'select');
    await fillQuestion(page, 'roomCount', 100, 'slider');
    await fillQuestion(page, 'priorities', ['reduceCosts'], 'ranking');
    
    const startTime = Date.now();
    await submitWizard(page);
    const calcTime = Date.now() - startTime;
    
    expect(calcTime).toBeLessThan(1000);
  });
});
