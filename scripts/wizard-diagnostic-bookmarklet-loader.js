/**
 * ============================================================================
 * MERLIN WIZARD DIAGNOSTIC - BOOKMARKLET LOADER (Alternative)
 * ============================================================================
 * 
 * This version loads the diagnostic script from a URL instead of embedding it.
 * Use this if the full bookmarklet is too long for your browser.
 * 
 * HOW TO USE:
 * 1. Host wizard-diagnostic-enhanced.js on a web server (or use raw GitHub URL)
 * 2. Update the SCRIPT_URL below
 * 3. Create bookmark with this code
 * 
 * ============================================================================
 */

// Update this URL to point to your hosted script
const SCRIPT_URL = 'https://your-domain.com/scripts/wizard-diagnostic-enhanced.js';

// Bookmarklet code (copy this):
(function(){const s=document.createElement('script');s.src='SCRIPT_URL_HERE';s.onload=function(){console.log('✅ Diagnostic script loaded');};s.onerror=function(){console.error('❌ Failed to load script. Check URL.');};document.head.appendChild(s);})();

// Instructions:
// 1. Replace SCRIPT_URL_HERE with your actual script URL
// 2. Copy the entire javascript: line
// 3. Create bookmark with that URL
