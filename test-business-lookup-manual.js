// MANUAL BUSINESS LOOKUP TEST (Run in Browser Console)
// This simulates what happens when you type a business name and press Enter

console.log("🧪 TESTING BUSINESS LOOKUP FLOW...\n");

// Step 1: Find the business input
const inputs = Array.from(document.querySelectorAll('input'));
const businessInput = inputs.find(input => 
  input.placeholder?.toLowerCase().includes('business') ||
  input.placeholder?.toLowerCase().includes('facility')
);

if (!businessInput) {
  console.error("❌ Business input not found - scroll down!");
} else {
  console.log("✅ Found business input:", businessInput.placeholder);
  console.log("📍 Current value:", businessInput.value);
  
  // Step 2: Type "Holiday Inn"
  businessInput.value = "WOW Car Wash";
  businessInput.dispatchEvent(new Event('input', { bubbles: true }));
  console.log("📝 Set value to: WOW Car Wash");
  
  // Step 3: Simulate Enter key
  const enterEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    bubbles: true
  });
  businessInput.dispatchEvent(enterEvent);
  console.log("⌨️  Simulated Enter key press");
  
  // Step 4: Wait and check for API call
  console.log("\n⏳ Waiting for API call...");
  console.log("🔍 Check Network tab for:");
  console.log("   - Google Places API request");
  console.log("   - /api/google-places/* request");
  console.log("\n👀 Watch console for:");
  console.log("   - 'persisted business to wizard state' log");
  console.log("   - Any errors from googlePlacesService");
  
  // Step 5: Check wizard state after 2 seconds
  setTimeout(() => {
    console.log("\n📊 CHECKING WIZARD STATE...");
    
    // Try to find state in React DevTools
    const stateLog = "⚠️  Can't access React state from console.";
    console.log(stateLog);
    console.log("👉 Open React DevTools → Select Step1AdvisorLed component → Check 'state.businessName'");
    
    // Check for Business Identity Card in DOM
    const hasCard = document.querySelector('.text-emerald-400, .text-emerald-500');
    if (hasCard) {
      console.log("✅ Business Identity Card found in DOM!");
    } else {
      console.log("❌ Business Identity Card NOT in DOM");
      console.log("   Possible reasons:");
      console.log("   1. Google Places API key not configured (.env file)");
      console.log("   2. API call failed (check Network tab)");
      console.log("   3. State not updated (check React DevTools)");
      console.log("   4. Component didn't re-render");
    }
  }, 2000);
}
