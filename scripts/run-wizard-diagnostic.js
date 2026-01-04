#!/usr/bin/env node

/**
 * Run Wizard Diagnostic Script
 * 
 * This script runs the wizard diagnostic in a headless browser
 * and outputs the results to the console.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runDiagnostic() {
  try {
    // Try to use Playwright if available
    let playwright;
    try {
      playwright = await import('playwright');
    } catch (e) {
      console.error('❌ Playwright not found. Please install it:');
      console.error('   npm install --save-dev playwright');
      console.error('\nAlternatively, run the diagnostic manually:');
      console.error('   1. Start dev server: npm run dev');
      console.error('   2. Open http://localhost:5173 in browser');
      console.error('   3. Navigate to wizard Step 5 or 6');
      console.error('   4. Open DevTools console');
      console.error('   5. Copy contents of scripts/wizard-diagnostic-enhanced.js');
      console.error('   6. Paste into console and press Enter');
      process.exit(1);
    }

    const browser = await playwright.chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Read the diagnostic script
    const diagnosticScript = readFileSync(
      join(__dirname, 'wizard-diagnostic-enhanced.js'),
      'utf-8'
    );
    
    console.log('🌐 Opening browser...');
    console.log('📍 Navigate to the wizard and complete to Step 5 or 6');
    console.log('⏳ Waiting for wizard state...\n');
    
    // Navigate to local dev server
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Wait a bit for React to initialize
    await page.waitForTimeout(2000);
    
    // Inject and run the diagnostic script
    const results = await page.evaluate((script) => {
      // Create a function that will capture console output
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '));
        originalLog.apply(console, args);
      };
      
      // Run the diagnostic script
      try {
        eval(script);
      } catch (e) {
        return { error: e.message, logs };
      }
      
      // Get the results
      const state = window.__MERLIN_DEBUG_STATE__;
      const results = window.__MERLIN_DEBUG_RESULTS__;
      
      return { state, results, logs };
    }, diagnosticScript);
    
    // Output results
    if (results.error) {
      console.error('❌ Error running diagnostic:', results.error);
      console.log('\nConsole output:');
      results.logs.forEach(log => console.log(log));
    } else if (results.results) {
      console.log('\n' + '='.repeat(60));
      console.log('📊 DIAGNOSTIC RESULTS');
      console.log('='.repeat(60));
      
      // Print summary
      const criticalIssues = Object.entries(results.results)
        .filter(([_, r]) => r.status === '❌')
        .map(([k, r]) => ({ step: k, issues: r.issues }));
      
      const warnings = Object.entries(results.results)
        .filter(([_, r]) => r.warnings && r.warnings.length > 0)
        .map(([k, r]) => ({ step: k, warnings: r.warnings }));
      
      console.log('\n📋 Summary:');
      if (criticalIssues.length === 0) {
        console.log('   ✅ All critical checks passed!');
      } else {
        console.log(`   ❌ ${criticalIssues.length} critical issue(s) found:`);
        criticalIssues.forEach(({ step, issues }) => {
          issues.forEach(i => console.log(`      • [${step}] ${i}`));
        });
      }
      
      if (warnings.length > 0) {
        console.log(`\n   ⚠️  ${warnings.reduce((sum, w) => sum + w.warnings.length, 0)} warning(s):`);
        warnings.forEach(({ step, warnings: ws }) => {
          ws.forEach(w => console.log(`      • [${step}] ${w}`));
        });
      }
      
      // Print step statuses
      console.log('\n📊 Step Status:');
      Object.entries(results.results).forEach(([step, result]) => {
        console.log(`   ${result.status} ${step}`);
      });
      
      // Print calculations if available
      if (results.state?.calculations) {
        const calc = results.state.calculations;
        console.log('\n🔋 BESS Calculations:');
        console.log(`   Power:  ${calc.bessKW || 0} kW`);
        console.log(`   Energy: ${calc.bessKWh || 0} kWh`);
        console.log(`   Investment: $${(calc.totalInvestment || 0).toLocaleString()}`);
        console.log(`   Savings: $${(calc.annualSavings || 0).toLocaleString()}/yr`);
      }
      
      // Export option
      console.log('\n💾 Full results available in browser console:');
      console.log('   window.__MERLIN_DEBUG_STATE__');
      console.log('   window.__MERLIN_DEBUG_RESULTS__');
      console.log('   Run: exportDiagnosticJSON() to download JSON');
      
    } else {
      console.log('⚠️  Diagnostic ran but no results found.');
      console.log('   Make sure you are on Step 5 or 6 of the wizard.');
      console.log('\nConsole output:');
      results.logs?.slice(-20).forEach(log => console.log(log));
    }
    
    console.log('\n⏸️  Browser will stay open. Close it when done.');
    console.log('   Press Ctrl+C to exit this script.\n');
    
    // Keep browser open for inspection
    // await browser.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n📝 Manual Instructions:');
    console.error('   1. Start dev server: npm run dev');
    console.error('   2. Open http://localhost:5173 in browser');
    console.error('   3. Navigate to wizard Step 5 or 6');
    console.error('   4. Open DevTools console (F12)');
    console.error('   5. Copy contents of scripts/wizard-diagnostic-enhanced.js');
    console.error('   6. Paste into console and press Enter');
    process.exit(1);
  }
}

// Check if dev server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:5173');
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Main
console.log('🧙 Merlin Wizard Diagnostic Runner\n');

const serverRunning = await checkServer();
if (!serverRunning) {
  console.log('⚠️  Dev server not detected on http://localhost:5173');
  console.log('   Starting dev server in background...\n');
  console.log('   Please run: npm run dev');
  console.log('   Then run this script again, or follow manual instructions below.\n');
}

await runDiagnostic();
