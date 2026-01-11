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

const BASE_URL = process.env.TEST_URL || process.env.BASE_URL || 'http://localhost:5182';
const WIZARD_PATH = '/wizard';

// Industry test data
const INDUSTRIES = {
  hotel: {
    name: 'Hotel / Hospitality',
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
  
  car_wash: {
    name: 'Car Wash',
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
  
  ev_charging: {
    name: 'EV Charging Hub',
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
  
  data_center: {
    name: 'Data Center',
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
    name: 'Manufacturing',
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
    name: 'University / Campus',
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
    name: 'Retail / Commercial',
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
    name: 'Restaurant',
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
    name: 'Office Building',
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
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function navigateToWizard(page: Page) {
  await page.goto(`${BASE_URL}${WIZARD_PATH}`);
  await expect(page.locator('h1, h2').first()).toBeVisible();
}

// Industry slug mapping (test IDs -> actual database slugs)
const INDUSTRY_SLUG_MAP: Record<string, string> = {
  'hotel': 'hotel',
  'carWash': 'car_wash',
  'evChargingHub': 'ev_charging',
  'dataCenter': 'data_center',
  'manufacturing': 'manufacturing',
  'hospital': 'hospital',
  'retail': 'retail',
  'office': 'office',
  'university': 'college',
  'college': 'college',
  'warehouse': 'warehouse',
  'restaurant': 'restaurant'
};

async function selectIndustry(page: Page, industryId: string) {
  // Map test ID to actual slug
  const actualSlug = INDUSTRY_SLUG_MAP[industryId] || industryId.replace(/-/g, '_').toLowerCase();
  const industryName = INDUSTRIES[industryId as keyof typeof INDUSTRIES]?.name;
  
  // Wait for Step 2 to be visible (industry selection page)
  await page.waitForSelector('h1:has-text("Select"), h1:has-text("Industry"), [data-industry], button:has-text("Hotel"), button:has-text("Car Wash")', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Try multiple selector strategies in order of preference
  const selectors = [
    `[data-industry="${actualSlug}"]`,
    `[data-testid="industry-${actualSlug}"]`,
    industryName ? `button:has-text("${industryName}")` : null,
    `button:has-text("${actualSlug.replace(/_/g, ' ')}")`,
    // Fallback: try partial text match
    industryName ? `button:has-text("${industryName.split(' ')[0]}")` : null
  ].filter(Boolean) as string[];
  
  // Try each selector until one works
  let clicked = false;
  let lastError: Error | null = null;
  
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      // Wait for element to be visible and enabled
      await element.waitFor({ state: 'visible', timeout: 5000 });
      const isEnabled = await element.isEnabled();
      if (isEnabled) {
        // Scroll element into view and use force click to bypass overlays
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500); // Wait for scroll to complete
        await element.click({ force: true, timeout: 5000 });
        clicked = true;
        console.log(`✅ Successfully clicked industry using selector: ${selector}`);
        break;
      }
    } catch (error) {
      lastError = error as Error;
      console.log(`⚠️ Selector failed: ${selector} - ${(error as Error).message}`);
      // Continue to next selector
    }
  }
  
  if (!clicked) {
    // Debug: Take a screenshot and log available buttons
    const allButtons = await page.locator('button').all();
    const buttonTexts = await Promise.all(allButtons.map(async (btn) => {
      try {
        return await btn.textContent();
      } catch {
        return null;
      }
    }));
    console.log('Available buttons on page:', buttonTexts.filter(Boolean));
    
    throw new Error(`Could not find industry selector for: ${industryId} -> ${actualSlug} (tried: ${selectors.join(', ')}). Last error: ${lastError?.message}`);
  }
  
  // Wait for visual confirmation that industry was selected
  // Look for the selected checkmark or confirmation message
  try {
    await page.waitForSelector('text=/Selected/, text=/✓/, [data-industry].ring-4, .ring-4.ring-purple-500', { timeout: 5000 });
    console.log('✅ Industry selection confirmed visually');
  } catch {
    console.log('⚠️ No visual confirmation found, but continuing...');
  }
  
  // Wait for React state to update (React batches state updates)
  await page.waitForTimeout(1500);
  
  // After selecting industry, need to click Continue to advance to Step 3
  // Find the Continue button in the footer (not header)
  const continueButton = page.locator('footer button:has-text("Continue"), footer button:has-text("Next"), button:has-text("Continue"):not(header button)').first();
  
  // Wait for button to become enabled (React state update)
  await continueButton.waitFor({ state: 'visible', timeout: 5000 });
  
  // Poll for button to become enabled (up to 5 seconds)
  let buttonEnabled = false;
  for (let i = 0; i < 10; i++) {
    const isEnabled = await continueButton.isEnabled();
    const isDisabled = await continueButton.getAttribute('disabled') !== null;
    const classes = await continueButton.getAttribute('class') || '';
    
    // Button is enabled if not disabled AND doesn't have disabled classes
    buttonEnabled = isEnabled && !isDisabled && !classes.includes('cursor-not-allowed');
    
    if (buttonEnabled) {
      console.log(`✅ Continue button enabled after ${i * 500}ms`);
      break;
    }
    
    if (i < 9) {
      await page.waitForTimeout(500);
    }
  }
  
  if (buttonEnabled) {
    await continueButton.click({ force: true });
    await page.waitForTimeout(1000);
    console.log('✅ Clicked Continue button to advance to Step 3');
  } else {
    // Last resort: force click and see what happens
    console.log('⚠️ Button still disabled, attempting force click...');
    await continueButton.click({ force: true });
    await page.waitForTimeout(1000);
  }
  
  // Wait for Step 3 questions to load
  try {
    await page.waitForSelector('[data-question], [data-testid^="question-"], .question-container, .step3-details', { timeout: 15000 });
    console.log('✅ Step 3 questions loaded successfully');
  } catch (error) {
    // Check if we're on Step 4 (premature navigation bug)
    const step4Indicators = [
      page.locator('h1:has-text("BOOST")'),
      page.locator('h1:has-text("Options")'),
      page.locator('text=/Step 4/')
    ];
    
    for (const indicator of step4Indicators) {
      if (await indicator.count() > 0 && await indicator.first().isVisible({ timeout: 2000 })) {
        const pageTitle = await page.locator('h1').first().textContent();
        throw new Error(`❌ BUG DETECTED: Premature navigation to Step 4 after selecting industry "${industryId}". Step 3 questions were skipped! Current page: ${pageTitle}`);
      }
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: `test-results/debug-step3-${industryId}.png`, fullPage: true });
    
    // Check what's actually on the page
    const allHeadings = await page.locator('h1, h2, h3').allTextContents();
    console.log('Page headings:', allHeadings);
    
    throw new Error(`Step 3 questions did not load after selecting "${industryId}". Page content: ${allHeadings.join(', ')}`);
  }
  
  await page.waitForTimeout(1000); // Give UI time to settle
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
    
    // Step 1: Fill location (ZIP code)
    const zipInput = page.locator('input[type="text"][inputmode="numeric"], input[placeholder*="ZIP"], input[placeholder*="zip"]').first();
    if (await zipInput.isVisible({ timeout: 5000 })) {
      await zipInput.fill('89052');
      await page.waitForTimeout(500);
    }
    
    // Navigate to Step 2 (Industry Selection)
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueBtn.isVisible({ timeout: 5000 })) {
      await continueBtn.click();
      await page.waitForTimeout(2000); // Wait for Step 2 to load
    }
    
    // Now select industry on Step 2
    await selectIndustry(page, 'hotel');
    
    // Should now be on Step 3 (questions)
    await expect(page.locator('[data-question], .question-container').first()).toBeVisible({ timeout: 15000 });
    
    // Navigate back
    await page.locator('button:has-text("Back"), [data-testid="prev-step"]').click();
    await expect(page.locator('[data-step="1"], .step-1')).toHaveClass(/active|current/);
  });
});

test.describe('Hotel Industry Flow', () => {
  test('should complete hotel questionnaire', async ({ page }) => {
    await navigateToWizard(page);
    await selectIndustry(page, 'hotel');
    
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
    await selectIndustry(page, 'hotel');
    
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
    
    // Navigate to Step 2 if needed
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await selectIndustry(page, 'carWash');
    
    // Wait for Step 3 to fully load
    await page.waitForSelector('[data-question], .question-container', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
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
    await selectIndustry(page, 'carWash');
    
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
    
    // Navigate to Step 2 if needed
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await selectIndustry(page, 'dataCenter');
    
    // Wait for Step 3 to fully load
    await page.waitForSelector('[data-question], .question-container', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
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
    await selectIndustry(page, 'dataCenter');
    
    await fillQuestion(page, 'workloadType', 'aiGpu', 'select');
    
    // GPU breakdown question should appear
    await expect(page.locator('[data-question="gpuRackCount"], [data-question="gpuRackPercent"]')).toBeVisible();
  });
});

test.describe('Hospital Industry Flow', () => {
  test('should calculate critical load tiers', async ({ page }) => {
    await navigateToWizard(page);
    
    // Navigate to Step 2 if needed
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await selectIndustry(page, 'hospital');
    
    // Wait for Step 3 to fully load
    await page.waitForSelector('[data-question], .question-container', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
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
      
      // Navigate to Step 2 if needed
      const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
      if (await continueBtn.isVisible({ timeout: 2000 })) {
        await continueBtn.click();
        await page.waitForTimeout(1000);
      }
      
      await selectIndustry(page, industryId);
      
      // Verify questions load (Step 3)
      await expect(page.locator('[data-question], [data-testid^="question-"], .question-container').first()).toBeVisible({ timeout: 15000 });
    });
  }
});

test.describe('Validation', () => {
  test('should show validation errors for required fields', async ({ page }) => {
    await navigateToWizard(page);
    
    // Navigate to Step 2 if needed
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await selectIndustry(page, 'hotel');
    
    // Wait for questions to load
    await page.waitForSelector('[data-question], .question-container', { timeout: 15000 });
    
    // Try to advance without filling required fields
    const continueButton = page.locator('button:has-text("Continue")').first();
    if (await continueButton.isVisible({ timeout: 5000 })) {
      // Button should be disabled if validation fails
      const isDisabled = await continueButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
  
  test('should validate number ranges', async ({ page }) => {
    await navigateToWizard(page);
    
    // Navigate to Step 2 if needed
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await selectIndustry(page, 'hotel');
    
    // Wait for questions to load
    await page.waitForSelector('[data-question], .question-container', { timeout: 15000 });
    
    // Try to find a slider question and test range validation
    const slider = page.locator('[data-question] input[type="range"]').first();
    if (await slider.count() > 0) {
      const minValue = await slider.getAttribute('min');
      const maxValue = await slider.getAttribute('max');
      expect(minValue).toBeTruthy();
      expect(maxValue).toBeTruthy();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToWizard(page);
    
    // Navigate to Step 2 if needed
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Industry selection should still work
    await expect(page.locator('[data-industry="hotel"], [data-testid="industry-hotel"]').first()).toBeVisible({ timeout: 10000 });
    await selectIndustry(page, 'hotel');
    
    // Questions should be visible
    await expect(page.locator('[data-question], .question-container').first()).toBeVisible({ timeout: 15000 });
  });
  
  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await navigateToWizard(page);
    
    // Navigate to Step 2 if needed
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await selectIndustry(page, 'carWash');
    
    await expect(page.locator('[data-question], .question-container').first()).toBeVisible({ timeout: 15000 });
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
    
    // Navigate to Step 2 if needed
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueBtn.isVisible({ timeout: 2000 })) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await selectIndustry(page, 'hotel');
    
    // Wait for questions to load
    await page.waitForSelector('[data-question], .question-container', { timeout: 15000 });
    
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
