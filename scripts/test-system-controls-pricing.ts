#!/usr/bin/env npx tsx

/**
 * SYSTEM CONTROLS PRICING TEST
 * =============================
 * 
 * Tests that system controls pricing database integration works correctly
 * 
 * Run: npx tsx scripts/test-system-controls-pricing.ts
 */

// Load environment variables
import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import { getSystemControlsPricingService } from '../src/services/systemControlsPricingService';

// Create Supabase client directly (bypasses import.meta.env issue in Node.js)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSystemControlsPricing() {
  console.log('🧪 Testing System Controls Pricing Integration\n');
  console.log('═'.repeat(70));
  console.log('');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Database Configuration Exists
  console.log('📊 Test 1: Database Configuration Exists');
  console.log('─'.repeat(50));
  try {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .select('*')
      .eq('config_key', 'system_controls_pricing')
      .eq('is_active', true)
      .single();

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('Configuration not found in database');
    }

    console.log(`✅ Configuration found: ${data.config_key}`);
    console.log(`   Description: ${data.description}`);
    console.log(`   Version: ${data.version}`);
    console.log(`   Source: ${data.data_source || 'N/A'}`);
    console.log(`   Active: ${data.is_active}`);
    console.log('');
    testsPassed++;
  } catch (error: any) {
    console.error(`❌ Test 1 failed: ${error.message}`);
    console.log('');
    testsFailed++;
  }

  // Test 2: Service Loads Configuration
  console.log('📊 Test 2: Service Loads Configuration from Database');
  console.log('─'.repeat(50));
  try {
    const config = getSystemControlsPricingService().getConfiguration();
    
    if (!config || !config.controllers || config.controllers.length === 0) {
      throw new Error('Configuration not loaded');
    }

    console.log(`✅ Configuration loaded: ${config.controllers.length} controllers`);
    console.log(`   SCADA systems: ${config.scadaSystems?.length || 0}`);
    console.log(`   EMS systems: ${config.energyManagementSystems?.length || 0}`);
    
    // Check if pricing values are present
    const firstController = config.controllers[0];
    if (!firstController.pricePerUnit || firstController.pricePerUnit <= 0) {
      throw new Error('Controller pricing not loaded correctly');
    }
    
    console.log(`   First controller: ${firstController.manufacturer} ${firstController.model} - $${firstController.pricePerUnit}/unit`);
    console.log('');
    testsPassed++;
  } catch (error: any) {
    console.error(`❌ Test 2 failed: ${error.message}`);
    console.log('');
    testsFailed++;
  }

  // Test 3: Controller Pricing Calculation
  console.log('📊 Test 3: Controller Pricing Calculation');
  console.log('─'.repeat(50));
  try {
    const result = getSystemControlsPricingService().calculateControllerSystemCost(
      'deepsea-dse8610',
      2,  // quantity
      true,  // includeInstallation
      true   // includeIntegration
    );

    if (!result.controller) {
      throw new Error('Controller not found');
    }

    if (result.totalCost <= 0) {
      throw new Error('Total cost calculation failed');
    }

    console.log(`✅ Controller: ${result.controller.manufacturer} ${result.controller.model}`);
    console.log(`   Equipment cost: $${result.equipmentCost.toLocaleString()}`);
    console.log(`   Installation cost: $${result.installationCost.toLocaleString()}`);
    console.log(`   Integration cost: $${result.integrationCost.toLocaleString()}`);
    console.log(`   Total cost: $${result.totalCost.toLocaleString()}`);
    console.log('');
    testsPassed++;
  } catch (error: any) {
    console.error(`❌ Test 3 failed: ${error.message}`);
    console.log('');
    testsFailed++;
  }

  // Test 4: SCADA System Pricing
  console.log('📊 Test 4: SCADA System Pricing');
  console.log('─'.repeat(50));
  try {
    const result = getSystemControlsPricingService().calculateScadaSystemCost(
      'wonderware-system-platform',
      true,  // includeInstallation
      40     // customizationHours
    );

    if (!result.scadaSystem) {
      throw new Error('SCADA system not found');
    }

    if (result.totalCost <= 0) {
      throw new Error('Total cost calculation failed');
    }

    console.log(`✅ SCADA System: ${result.scadaSystem.manufacturer} ${result.scadaSystem.model}`);
    console.log(`   Software cost: $${result.softwareCost.toLocaleString()}`);
    console.log(`   Hardware cost: $${result.hardwareCost.toLocaleString()}`);
    console.log(`   Installation cost: $${result.installationCost.toLocaleString()}`);
    console.log(`   Customization cost: $${result.customizationCost.toLocaleString()}`);
    console.log(`   Total cost: $${result.totalCost.toLocaleString()}`);
    console.log(`   Annual maintenance: $${result.annualMaintenanceCost.toLocaleString()}`);
    console.log('');
    testsPassed++;
  } catch (error: any) {
    console.error(`❌ Test 4 failed: ${error.message}`);
    console.log('');
    testsFailed++;
  }

  // Test 5: EMS System Pricing
  console.log('📊 Test 5: EMS System Pricing');
  console.log('─'.repeat(50));
  try {
    const result = getSystemControlsPricingService().calculateEMSCost(
      'schneider-ecostruxure-microgrid',
      1,    // sitesCount
      5.0,  // totalCapacityMW
      6     // implementationMonths
    );

    if (!result.ems) {
      throw new Error('EMS system not found');
    }

    if (result.totalInitialCost <= 0) {
      throw new Error('Total cost calculation failed');
    }

    console.log(`✅ EMS System: ${result.ems.manufacturer} ${result.ems.model}`);
    console.log(`   Setup fee: $${result.setupCost.toLocaleString()}`);
    console.log(`   Capacity cost (${5.0} MW): $${result.capacityCost.toLocaleString()}`);
    console.log(`   Implementation cost: $${result.implementationCost.toLocaleString()}`);
    console.log(`   Total initial cost: $${result.totalInitialCost.toLocaleString()}`);
    console.log(`   Monthly operating cost: $${result.monthlyOperatingCost.toLocaleString()}`);
    console.log(`   Annual operating cost: $${result.annualOperatingCost.toLocaleString()}`);
    console.log('');
    testsPassed++;
  } catch (error: any) {
    console.error(`❌ Test 5 failed: ${error.message}`);
    console.log('');
    testsFailed++;
  }

  // Test 6: Database Config Data Structure
  console.log('📊 Test 6: Database Config Data Structure');
  console.log('─'.repeat(50));
  try {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .select('config_data')
      .eq('config_key', 'system_controls_pricing')
      .single();

    if (error || !data) {
      throw new Error('Failed to fetch config data');
    }

    const configData = data.config_data as any;

    // Check required top-level keys
    const requiredKeys = ['controllers', 'scadaSystems', 'energyManagementSystems', 'installationCosts', 'integrationCosts', 'maintenanceContracts'];
    const missingKeys = requiredKeys.filter(key => !(key in configData));

    if (missingKeys.length > 0) {
      throw new Error(`Missing required keys: ${missingKeys.join(', ')}`);
    }

    // Check controllers array
    if (!Array.isArray(configData.controllers) || configData.controllers.length === 0) {
      throw new Error('Controllers array is missing or empty');
    }

    // Check first controller has required fields
    const firstController = configData.controllers[0];
    if (!firstController.id || !firstController.pricePerUnit) {
      throw new Error('Controller missing required fields (id, pricePerUnit)');
    }

    console.log(`✅ Config data structure valid`);
    console.log(`   Controllers: ${configData.controllers.length}`);
    console.log(`   SCADA systems: ${configData.scadaSystems?.length || 0}`);
    console.log(`   EMS systems: ${configData.energyManagementSystems?.length || 0}`);
    console.log(`   Installation costs: ${configData.installationCosts ? 'Present' : 'Missing'}`);
    console.log(`   Integration costs: ${configData.integrationCosts ? 'Present' : 'Missing'}`);
    console.log(`   Maintenance contracts: ${configData.maintenanceContracts ? 'Present' : 'Missing'}`);
    console.log('');
    testsPassed++;
  } catch (error: any) {
    console.error(`❌ Test 6 failed: ${error.message}`);
    console.log('');
    testsFailed++;
  }

  // Test 7: Refresh from Database
  console.log('📊 Test 7: Refresh from Database');
  console.log('─'.repeat(50));
  try {
    await getSystemControlsPricingService().refreshFromDatabase();
    const config = getSystemControlsPricingService().getConfiguration();
    
    if (!config || !config.controllers || config.controllers.length === 0) {
      throw new Error('Configuration not refreshed');
    }

    console.log(`✅ Configuration refreshed successfully`);
    console.log(`   Controllers loaded: ${config.controllers.length}`);
    console.log('');
    testsPassed++;
  } catch (error: any) {
    console.error(`❌ Test 7 failed: ${error.message}`);
    console.log('');
    testsFailed++;
  }

  // Summary
  console.log('═'.repeat(70));
  console.log('');
  console.log(`📊 Test Summary:`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   Total: ${testsPassed + testsFailed}`);
  console.log('');

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! System Controls pricing is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
testSystemControlsPricing().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
