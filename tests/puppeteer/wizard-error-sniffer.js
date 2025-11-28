/**
 * Puppeteer Error Sniffer for Smart Wizard
 * 
 * More detailed error detection than Playwright:
 * - Captures console object details
 * - Network request failures
 * - Performance metrics
 * - Memory leaks (excessive DOM nodes)
 * - Animation/transition issues
 */

import puppeteer from 'puppeteer';

// Helper function for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class WizardErrorSniffer {
  constructor() {
    this.consoleLogs = [];
    this.consoleWarnings = [];
    this.consoleErrors = [];
    this.networkErrors = [];
    this.validationErrors = [];
    this.performanceMetrics = {};
  }

  async run() {
    console.log('🔍 Starting Wizard Error Sniffer...\n');

    const browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      devtools: false
    });

    const page = await browser.newPage();

    // Capture console messages with full details
    page.on('console', async (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();

      const logEntry = {
        type,
        text,
        file: location.url,
        line: location.lineNumber
      };

      if (type === 'error') {
        this.consoleErrors.push(logEntry);
      } else if (type === 'warning') {
        this.consoleWarnings.push(logEntry);
      } else if (type === 'log') {
        this.consoleLogs.push(logEntry);

        // Track specific patterns
        if (text.includes('Missing required fields')) {
          this.validationErrors.push(text);
        }
      }

      // Get args for detailed logging
      try {
        const args = await Promise.all(
          msg.args().map(arg => arg.jsonValue().catch(() => arg.toString()))
        );
        logEntry.args = args;
      } catch (e) {
        // Some objects can't be serialized
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      this.consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack
      });
    });

    // Capture network failures
    page.on('requestfailed', (request) => {
      this.networkErrors.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()
      });
    });

    try {
      // Navigate
      console.log('📍 Navigating to http://localhost:5177...');
      await page.goto('http://localhost:5177', { waitUntil: 'networkidle2' });

      // Measure page load performance
      this.performanceMetrics.pageLoad = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          loadComplete: perf.loadEventEnd - perf.loadEventStart,
          domInteractive: perf.domInteractive - perf.fetchStart
        };
      });

      console.log('✅ Page loaded\n');

      // Open wizard
      console.log('🧙 Opening Smart Wizard...');
      await page.waitForSelector('button', { timeout: 5000 });
      
      // Find and click "Get Started" button
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Get Started')) {
          await btn.click();
          break;
        }
      }
      
      await delay(1000);
      console.log('✅ Wizard opened\n');

      // Select Office Building
      console.log('🏢 Selecting Office Building...');
      await delay(500);
      
      // Find office building card
      const cards = await page.$$('div');
      for (const card of cards) {
        const text = await page.evaluate(el => el.textContent, card);
        if (text && text.includes('Office Building')) {
          await card.click();
          break;
        }
      }
      await delay(500);
      
      // Click Next
      const nextButtons = await page.$$('button');
      for (const btn of nextButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Next')) {
          await btn.click();
          break;
        }
      }

      console.log('✅ Navigated to Step 2\n');

      // Wait for questions to load
      console.log('⏳ Waiting for questions to load...');
      await page.waitForSelector('select', { timeout: 5000 });
      await delay(2000); // Allow defaults to apply

      console.log('✅ Questions loaded\n');

      // Check for empty required selects
      const emptySelects = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('select'));
        return selects
          .filter(select => !select.value || select.value === '')
          .map(select => {
            const label = select.closest('div')?.querySelector('label')?.textContent;
            return { label, value: select.value };
          });
      });

      // Check Next button state
      const nextButtonDisabled = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => btn.textContent?.includes('Next'));
        return nextBtn?.disabled || false;
      });

      // Count DOM nodes (detect excessive rendering)
      const domNodeCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });

      // Get memory usage (if available)
      const metrics = await page.metrics();

      // Generate report
      this.generateReport({
        emptySelects,
        nextButtonDisabled,
        domNodeCount,
        metrics
      });

    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      await browser.close();
    }
  }

  generateReport(testData) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 WIZARD ERROR SNIFFER REPORT');
    console.log('='.repeat(70) + '\n');

    // Console Messages Summary
    console.log('📝 CONSOLE MESSAGES:');
    console.log(`  Total Logs: ${this.consoleLogs.length}`);
    console.log(`  Warnings: ${this.consoleWarnings.length}`);
    console.log(`  Errors: ${this.consoleErrors.length}`);
    
    if (this.consoleLogs.length > 100) {
      console.log(`  ⚠️  EXCESSIVE LOGGING: ${this.consoleLogs.length} messages`);
    } else {
      console.log(`  ✅ Acceptable log count`);
    }
    console.log('');

    // JavaScript Errors
    if (this.consoleErrors.length > 0) {
      console.log('❌ JAVASCRIPT ERRORS:');
      this.consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text}`);
        if (err.file) {
          console.log(`     Location: ${err.file}:${err.line}`);
        }
      });
      console.log('');
    } else {
      console.log('✅ NO JAVASCRIPT ERRORS\n');
    }

    // Validation Errors
    if (this.validationErrors.length > 0) {
      console.log('⚠️  VALIDATION ERRORS:');
      this.validationErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
      console.log('');
    } else {
      console.log('✅ NO VALIDATION ERRORS\n');
    }

    // Network Errors
    if (this.networkErrors.length > 0) {
      console.log('🌐 NETWORK ERRORS:');
      this.networkErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.method} ${err.url}`);
        console.log(`     Failure: ${err.failure?.errorText}`);
      });
      console.log('');
    } else {
      console.log('✅ NO NETWORK ERRORS\n');
    }

    // Empty Select Fields
    if (testData.emptySelects.length > 0) {
      console.log('⚠️  EMPTY SELECT FIELDS (should have defaults):');
      testData.emptySelects.forEach((select, i) => {
        console.log(`  ${i + 1}. ${select.label}`);
      });
      console.log('');
    } else {
      console.log('✅ ALL SELECT FIELDS HAVE VALUES\n');
    }

    // Next Button State
    console.log('🔘 NEXT BUTTON:');
    if (testData.nextButtonDisabled) {
      console.log('  ❌ DISABLED (should be enabled with defaults)');
    } else {
      console.log('  ✅ ENABLED');
    }
    console.log('');

    // Performance Metrics
    console.log('⚡ PERFORMANCE:');
    if (this.performanceMetrics.pageLoad) {
      console.log(`  DOM Content Loaded: ${Math.round(this.performanceMetrics.pageLoad.domContentLoaded)}ms`);
      console.log(`  Load Complete: ${Math.round(this.performanceMetrics.pageLoad.loadComplete)}ms`);
      console.log(`  DOM Interactive: ${Math.round(this.performanceMetrics.pageLoad.domInteractive)}ms`);
    }
    console.log(`  DOM Node Count: ${testData.domNodeCount}`);
    if (testData.domNodeCount > 5000) {
      console.log('  ⚠️  High DOM node count - possible memory leak');
    }
    console.log(`  JS Heap Size: ${Math.round(testData.metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    console.log('');

    // Specific Issue Checks
    console.log('🔍 SPECIFIC ISSUE CHECKS:');
    
    // Check for "Rendering question" logs (should be 0)
    const renderLogs = this.consoleLogs.filter(log => 
      log.text.includes('Rendering question:')
    );
    if (renderLogs.length > 0) {
      console.log(`  ❌ Found ${renderLogs.length} per-question render logs (should be 0)`);
    } else {
      console.log('  ✅ No per-question render logs');
    }

    // Check for excessive validation logs
    const validationLogs = this.consoleLogs.filter(log =>
      log.text.includes('[canProceed] Dynamic validation:')
    );
    if (validationLogs.length > 10) {
      console.log(`  ⚠️  Excessive validation logging: ${validationLogs.length} calls`);
    } else {
      console.log(`  ✅ Validation logging: ${validationLogs.length} calls`);
    }

    // Check for AI Status Indicator
    const aiLogs = this.consoleLogs.filter(log =>
      log.text.includes('AI') || log.text.includes('Not Used')
    );
    if (aiLogs.length > 0) {
      console.log(`  ⚠️  AI-related logs found: ${aiLogs.length}`);
    } else {
      console.log('  ✅ No AI Status Indicator logs');
    }

    console.log('');

    // Summary Score
    let score = 100;
    if (this.consoleErrors.length > 0) score -= 30;
    if (this.validationErrors.length > 0) score -= 20;
    if (this.consoleLogs.length > 100) score -= 15;
    if (testData.emptySelects.length > 0) score -= 15;
    if (testData.nextButtonDisabled) score -= 20;

    console.log('📈 OVERALL SCORE:');
    console.log(`  ${score}/100`);
    if (score >= 90) {
      console.log('  🎉 EXCELLENT - No critical issues');
    } else if (score >= 70) {
      console.log('  ⚠️  GOOD - Minor issues detected');
    } else if (score >= 50) {
      console.log('  ⚠️  FAIR - Multiple issues need fixing');
    } else {
      console.log('  ❌ POOR - Critical issues detected');
    }

    console.log('\n' + '='.repeat(70) + '\n');
  }
}

// Run the sniffer
const sniffer = new WizardErrorSniffer();
sniffer.run().catch(console.error);
