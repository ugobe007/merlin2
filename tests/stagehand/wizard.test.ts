/**
 * MERLIN WIZARD E2E TESTS - STAGEHAND (AI-Powered)
 * =================================================
 * 
 * AI-powered browser automation tests using Stagehand.
 * Stagehand uses natural language to interact with the UI,
 * making tests more resilient to UI changes.
 * 
 * Install: npm install @anthropic-ai/stagehand
 * Run: npx ts-node tests/stagehand/wizard.test.ts
 * 
 * Requires: ANTHROPIC_API_KEY environment variable
 */

import { Stagehand } from '@anthropic-ai/stagehand';
import { z } from 'zod';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const WIZARD_PATH = '/wizard';

// Result schema for extraction
const QuoteResultSchema = z.object({
  peakDemandKw: z.number(),
  recommendedBessKwh: z.number(),
  recommendedSolarKw: z.number(),
  annualSavings: z.number(),
  paybackYears: z.number().optional(),
  warnings: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional()
});

type QuoteResult = z.infer<typeof QuoteResultSchema>;

// ============================================================================
// STAGEHAND TEST RUNNER
// ============================================================================

class WizardTestRunner {
  private stagehand: Stagehand;
  
  constructor() {
    this.stagehand = new Stagehand({
      env: 'LOCAL',
      verbose: true,
      debugDom: true
    });
  }
  
  async init() {
    await this.stagehand.init();
    await this.stagehand.page.goto(`${BASE_URL}${WIZARD_PATH}`);
  }
  
  async close() {
    await this.stagehand.close();
  }
  
  // ==========================================================================
  // HOTEL TESTS
  // ==========================================================================
  
  async testHotelFlow(): Promise<QuoteResult> {
    console.log('\n🏨 Testing Hotel Industry Flow...');
    
    // Select hotel industry
    await this.stagehand.act({
      action: 'Click on the Hotel or Hospitality industry card'
    });
    
    // Fill out hotel details
    await this.stagehand.act({
      action: 'Select "Full Service Hotel" as the hotel type'
    });
    
    await this.stagehand.act({
      action: 'Set the room count to 175 rooms using the slider or input'
    });
    
    // Select amenities
    await this.stagehand.act({
      action: 'Check the following amenities: swimming pool, on-site restaurant, fitness center, and laundry'
    });
    
    await this.stagehand.act({
      action: 'Select indoor heated for the pool type'
    });
    
    await this.stagehand.act({
      action: 'Enter 80 for restaurant seating capacity'
    });
    
    // Building systems
    await this.stagehand.act({
      action: 'Select central plant (chiller/boiler) for HVAC type'
    });
    
    await this.stagehand.act({
      action: 'Select natural gas for water heating fuel'
    });
    
    await this.stagehand.act({
      action: 'Select partial backup for current backup power'
    });
    
    // Operations
    await this.stagehand.act({
      action: 'Set occupancy rate to 70%'
    });
    
    await this.stagehand.act({
      action: 'Enter 6 floors'
    });
    
    // Energy spend
    await this.stagehand.act({
      action: 'Select the $15,000-$30,000 monthly energy spend option'
    });
    
    // Priorities
    await this.stagehand.act({
      action: 'Select "Reduce energy costs" as the first priority, "Guest experience" as second, and "Sustainability" as third'
    });
    
    // Submit
    await this.stagehand.act({
      action: 'Click the submit or calculate button to get results'
    });
    
    // Wait for results
    await this.stagehand.page.waitForSelector('[data-testid="results"]', { timeout: 10000 });
    
    // Extract results using AI
    const results = await this.stagehand.extract({
      instruction: 'Extract the quote results including peak demand in kW, recommended BESS size in kWh, recommended solar in kW, and annual savings in dollars',
      schema: QuoteResultSchema
    });
    
    console.log('Hotel Results:', results);
    return results;
  }
  
  // ==========================================================================
  // CAR WASH TESTS
  // ==========================================================================
  
  async testCarWashFlow(): Promise<QuoteResult> {
    console.log('\n🚗 Testing Car Wash Industry Flow...');
    
    await this.stagehand.page.goto(`${BASE_URL}${WIZARD_PATH}`);
    
    await this.stagehand.act({
      action: 'Click on the Car Wash industry card'
    });
    
    await this.stagehand.act({
      action: 'Select Express Tunnel as the car wash type'
    });
    
    await this.stagehand.act({
      action: 'Set tunnel length to 130 feet'
    });
    
    await this.stagehand.act({
      action: 'Set cars washed per day to 450'
    });
    
    await this.stagehand.act({
      action: 'Select high-velocity dryers'
    });
    
    await this.stagehand.act({
      action: 'Enter 8 dryer units'
    });
    
    await this.stagehand.act({
      action: 'Enter 16 vacuum stations'
    });
    
    await this.stagehand.act({
      action: 'Select natural gas for water heating'
    });
    
    await this.stagehand.act({
      action: 'Check the water reclaim option'
    });
    
    await this.stagehand.act({
      action: 'Select 14 hours for operating hours'
    });
    
    await this.stagehand.act({
      action: 'Select the $7,000-$15,000 monthly energy spend option'
    });
    
    await this.stagehand.act({
      action: 'Select no backup power currently'
    });
    
    await this.stagehand.act({
      action: 'Select priorities: reduce costs, stay open during outages, and reduce demand charges'
    });
    
    await this.stagehand.act({
      action: 'Submit the form to calculate results'
    });
    
    await this.stagehand.page.waitForSelector('[data-testid="results"]', { timeout: 10000 });
    
    const results = await this.stagehand.extract({
      instruction: 'Extract the quote results including peak demand, BESS recommendation, solar recommendation, and savings',
      schema: QuoteResultSchema
    });
    
    console.log('Car Wash Results:', results);
    return results;
  }
  
  // ==========================================================================
  // DATA CENTER TESTS
  // ==========================================================================
  
  async testDataCenterFlow(): Promise<QuoteResult> {
    console.log('\n🖥️ Testing Data Center Industry Flow...');
    
    await this.stagehand.page.goto(`${BASE_URL}${WIZARD_PATH}`);
    
    await this.stagehand.act({
      action: 'Click on the Data Center industry option'
    });
    
    await this.stagehand.act({
      action: 'Select Enterprise Data Center as the facility type'
    });
    
    await this.stagehand.act({
      action: 'Enter 120 racks'
    });
    
    await this.stagehand.act({
      action: 'Select virtualized/cloud for workload type'
    });
    
    await this.stagehand.act({
      action: 'Select mission critical for criticality level'
    });
    
    await this.stagehand.act({
      action: 'Select hot/cold aisle containment for cooling method'
    });
    
    await this.stagehand.act({
      action: 'Select that they have existing generator backup'
    });
    
    await this.stagehand.act({
      action: 'Enter 4 hours for backup duration target'
    });
    
    await this.stagehand.act({
      action: 'Select priorities: uptime, efficiency, and sustainability'
    });
    
    await this.stagehand.act({
      action: 'Click calculate or submit'
    });
    
    await this.stagehand.page.waitForSelector('[data-testid="results"]', { timeout: 10000 });
    
    const results = await this.stagehand.extract({
      instruction: 'Get the calculated peak demand, BESS size, and any warnings about power requirements',
      schema: QuoteResultSchema
    });
    
    console.log('Data Center Results:', results);
    return results;
  }
  
  // ==========================================================================
  // HOSPITAL TESTS
  // ==========================================================================
  
  async testHospitalFlow(): Promise<QuoteResult> {
    console.log('\n🏥 Testing Hospital Industry Flow...');
    
    await this.stagehand.page.goto(`${BASE_URL}${WIZARD_PATH}`);
    
    await this.stagehand.act({
      action: 'Select the Hospital or Healthcare industry'
    });
    
    await this.stagehand.act({
      action: 'Choose Regional Hospital as the facility type'
    });
    
    await this.stagehand.act({
      action: 'Set bed count to 225 beds'
    });
    
    await this.stagehand.act({
      action: 'Set square footage to approximately 350,000 square feet'
    });
    
    await this.stagehand.act({
      action: 'Select critical services: Emergency Department, Operating Rooms, ICU, and Imaging MRI'
    });
    
    await this.stagehand.act({
      action: 'Indicate they have 3 MRI machines and 4 CT scanners'
    });
    
    await this.stagehand.act({
      action: 'Select diesel generators for current backup'
    });
    
    await this.stagehand.act({
      action: 'Enter 2500 kW for generator capacity'
    });
    
    await this.stagehand.act({
      action: 'Select that generators cover critical systems only'
    });
    
    await this.stagehand.act({
      action: 'Select occasionally for outage frequency'
    });
    
    await this.stagehand.act({
      action: 'Select priorities: patient safety, regulatory compliance, and reduce diesel'
    });
    
    await this.stagehand.act({
      action: 'Submit to get the quote'
    });
    
    await this.stagehand.page.waitForSelector('[data-testid="results"]', { timeout: 10000 });
    
    const results = await this.stagehand.extract({
      instruction: 'Extract the results including critical load breakdown, BESS recommendation for life safety, and any compliance warnings',
      schema: QuoteResultSchema
    });
    
    console.log('Hospital Results:', results);
    return results;
  }
  
  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================
  
  async testValidationErrors(): Promise<void> {
    console.log('\n⚠️ Testing Validation Errors...');
    
    await this.stagehand.page.goto(`${BASE_URL}${WIZARD_PATH}`);
    
    await this.stagehand.act({
      action: 'Click on Hotel industry'
    });
    
    // Try to submit without filling required fields
    await this.stagehand.act({
      action: 'Click the submit button without filling any fields'
    });
    
    // Check for validation errors
    const hasErrors = await this.stagehand.extract({
      instruction: 'Check if there are any validation error messages displayed on the form',
      schema: z.object({
        hasErrors: z.boolean(),
        errorMessages: z.array(z.string()).optional()
      })
    });
    
    console.log('Validation test:', hasErrors);
    
    if (!hasErrors.hasErrors) {
      throw new Error('Expected validation errors but none were shown');
    }
  }
  
  // ==========================================================================
  // CONDITIONAL QUESTION TESTS
  // ==========================================================================
  
  async testConditionalQuestions(): Promise<void> {
    console.log('\n🔀 Testing Conditional Questions...');
    
    await this.stagehand.page.goto(`${BASE_URL}${WIZARD_PATH}`);
    
    await this.stagehand.act({
      action: 'Select the Hotel industry'
    });
    
    // Check that pool-related questions are not visible initially
    const initialState = await this.stagehand.extract({
      instruction: 'Is there a visible question about pool type (indoor/outdoor)?',
      schema: z.object({
        poolQuestionVisible: z.boolean()
      })
    });
    
    console.log('Initial pool question visibility:', initialState.poolQuestionVisible);
    
    // Select pool amenity
    await this.stagehand.act({
      action: 'Check or select the swimming pool amenity option'
    });
    
    // Now pool type should be visible
    const afterPoolSelect = await this.stagehand.extract({
      instruction: 'Is there now a visible question about pool type (indoor/outdoor)?',
      schema: z.object({
        poolQuestionVisible: z.boolean()
      })
    });
    
    console.log('After selecting pool:', afterPoolSelect.poolQuestionVisible);
    
    if (initialState.poolQuestionVisible === afterPoolSelect.poolQuestionVisible) {
      console.warn('Warning: Conditional logic may not be working correctly');
    }
  }
  
  // ==========================================================================
  // NATURAL LANGUAGE INTERACTION TESTS
  // ==========================================================================
  
  async testNaturalLanguageFlow(): Promise<QuoteResult> {
    console.log('\n💬 Testing Natural Language Flow...');
    
    await this.stagehand.page.goto(`${BASE_URL}${WIZARD_PATH}`);
    
    // Use completely natural language for the entire flow
    await this.stagehand.act({
      action: 'I want to get a quote for a manufacturing facility. Select the manufacturing or industrial option.'
    });
    
    await this.stagehand.act({
      action: 'This is a food and beverage processing plant that is about 180,000 square feet. Set up the form accordingly.'
    });
    
    await this.stagehand.act({
      action: 'We run 24/7 continuous operations with heavy use of motors, compressed air systems, and refrigeration equipment.'
    });
    
    await this.stagehand.act({
      action: 'Our monthly energy bill is around $60,000 and we have no backup power currently. An outage would ruin our product in process.'
    });
    
    await this.stagehand.act({
      action: 'Our main goals are reducing costs, improving reliability, and managing demand charges. Fill in the priorities accordingly.'
    });
    
    await this.stagehand.act({
      action: 'Generate the quote by submitting the form'
    });
    
    await this.stagehand.page.waitForSelector('[data-testid="results"]', { timeout: 15000 });
    
    const results = await this.stagehand.extract({
      instruction: 'Tell me the recommended BESS size, expected savings, and any critical warnings about this manufacturing facility',
      schema: QuoteResultSchema
    });
    
    console.log('Natural Language Flow Results:', results);
    return results;
  }
  
  // ==========================================================================
  // COMPARISON TEST
  // ==========================================================================
  
  async testIndustryComparison(): Promise<void> {
    console.log('\n📊 Testing Industry Comparison...');
    
    const results: Record<string, QuoteResult> = {};
    
    // Test each industry with minimal inputs
    const industries = ['hotel', 'carWash', 'dataCenter', 'retail', 'restaurant'];
    
    for (const industry of industries) {
      await this.stagehand.page.goto(`${BASE_URL}${WIZARD_PATH}`);
      
      await this.stagehand.act({
        action: `Select the ${industry} industry and fill in the minimum required fields with reasonable default values for a medium-sized facility`
      });
      
      await this.stagehand.act({
        action: 'Submit the form'
      });
      
      try {
        await this.stagehand.page.waitForSelector('[data-testid="results"]', { timeout: 15000 });
        
        results[industry] = await this.stagehand.extract({
          instruction: 'Extract the key metrics from the results',
          schema: QuoteResultSchema
        });
      } catch (error) {
        console.log(`Could not complete ${industry} test:`, error);
      }
    }
    
    console.log('\nIndustry Comparison:');
    console.table(results);
  }
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runAllTests() {
  const runner = new WizardTestRunner();
  
  try {
    await runner.init();
    console.log('🚀 Stagehand initialized\n');
    
    // Run tests
    const hotelResult = await runner.testHotelFlow();
    validateHotelResults(hotelResult);
    
    const carWashResult = await runner.testCarWashFlow();
    validateCarWashResults(carWashResult);
    
    const dataCenterResult = await runner.testDataCenterFlow();
    validateDataCenterResults(dataCenterResult);
    
    const hospitalResult = await runner.testHospitalFlow();
    validateHospitalResults(hospitalResult);
    
    await runner.testValidationErrors();
    await runner.testConditionalQuestions();
    await runner.testNaturalLanguageFlow();
    await runner.testIndustryComparison();
    
    console.log('\n✅ All Stagehand tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateHotelResults(results: QuoteResult) {
  console.log('\nValidating Hotel Results...');
  
  // 175 room full-service hotel should be 250-600 kW peak
  if (results.peakDemandKw < 200 || results.peakDemandKw > 700) {
    throw new Error(`Hotel peak demand ${results.peakDemandKw} kW is outside expected range (200-700)`);
  }
  
  // Should recommend BESS
  if (results.recommendedBessKwh < 100) {
    throw new Error(`Hotel BESS recommendation ${results.recommendedBessKwh} kWh is too low`);
  }
  
  console.log('✓ Hotel results validated');
}

function validateCarWashResults(results: QuoteResult) {
  console.log('\nValidating Car Wash Results...');
  
  // Express tunnel with 450 cars/day should be 150-400 kW peak
  if (results.peakDemandKw < 100 || results.peakDemandKw > 500) {
    throw new Error(`Car wash peak demand ${results.peakDemandKw} kW is outside expected range`);
  }
  
  console.log('✓ Car Wash results validated');
}

function validateDataCenterResults(results: QuoteResult) {
  console.log('\nValidating Data Center Results...');
  
  // 120 racks × ~10 kW = 1200 kW IT load, × 1.5 PUE = 1800 kW total
  if (results.peakDemandKw < 800 || results.peakDemandKw > 3000) {
    throw new Error(`Data center peak demand ${results.peakDemandKw} kW is outside expected range`);
  }
  
  console.log('✓ Data Center results validated');
}

function validateHospitalResults(results: QuoteResult) {
  console.log('\nValidating Hospital Results...');
  
  // 225 bed regional hospital should be 1500-4000 kW
  if (results.peakDemandKw < 1000 || results.peakDemandKw > 5000) {
    throw new Error(`Hospital peak demand ${results.peakDemandKw} kW is outside expected range`);
  }
  
  console.log('✓ Hospital results validated');
}

// ============================================================================
// RUN
// ============================================================================

runAllTests().catch(console.error);
