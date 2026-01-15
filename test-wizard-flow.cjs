const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const allLogs = [];
  
  page.on('console', msg => allLogs.push('[' + msg.type() + '] ' + msg.text()));
  
  await page.goto('http://localhost:5177/wizard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Enter ZIP code
  console.log('1. Entering ZIP code 90210...');
  const zipInput = await page.$('input');
  if (zipInput) {
    await zipInput.type('90210');
    console.log('   ZIP entered successfully');
  } else {
    console.log('   No input found, checking page...');
    const pageHTML = await page.content();
    console.log('   Page has input:', pageHTML.includes('<input'));
  }
  await new Promise(r => setTimeout(r, 500));
  
  // Select a goal
  console.log('2. Clicking Cut Energy Costs goal...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cut Energy Costs'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Click Continue
  console.log('3. Clicking Continue...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Continue');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // Check what step we're on
  const stepCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    if (text.includes('Hotel') && text.includes('Car Wash')) return 'Step 2 - Industry Selection';
    if (text.includes('Step 2')) return 'Step 2';
    if (text.includes('Step 1')) return 'Step 1';
    return 'Unknown: ' + text.substring(0, 200);
  });
  console.log('\nCurrent step:', stepCheck);
  
  // If on Step 2, click Hotel
  if (stepCheck.includes('Step 2')) {
    console.log('\n4. Clicking Hotel...');
    const hotelClicked = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('button, div'));
      const hotel = cards.find(c => c.textContent && c.textContent.includes('Hotel') && c.textContent.length < 100);
      if (hotel) { hotel.click(); return true; }
      return false;
    });
    console.log('Hotel clicked:', hotelClicked);
    await new Promise(r => setTimeout(r, 2000));
    
    const step3Check = await page.evaluate(() => {
      const text = document.body.innerText;
      if (text.includes('Step 3') || text.includes('Tell us about')) return 'Step 3 - Details';
      return 'Still on: ' + text.substring(0, 200);
    });
    console.log('After Hotel click:', step3Check);
    
    // Check if questions loaded
    const questions = await page.evaluate(() => {
      const panels = document.querySelectorAll('[class*="panel"], [class*="question"], [class*="input"]');
      return Array.from(panels).slice(0, 5).map(p => p.className.substring(0, 50));
    });
    console.log('\nQuestion panels found:', questions.length);
    if (questions.length > 0) {
      console.log('Sample classes:', questions);
    }
  }
  
  // Print any errors
  const errors = allLogs.filter(l => l.includes('[error]'));
  console.log('\n=== ERRORS ===');
  if (errors.length === 0) console.log('No JavaScript errors!');
  else errors.forEach(e => console.log(e));
  
  // Print debug logs
  const debugLogs = allLogs.filter(l => l.includes('📋') || l.includes('📝') || l.includes('Loading'));
  if (debugLogs.length > 0) {
    console.log('\n=== DEBUG LOGS ===');
    debugLogs.forEach(l => console.log(l));
  }
  
  await browser.close();
})();
