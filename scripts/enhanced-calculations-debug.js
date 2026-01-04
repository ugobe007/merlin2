/**
 * ============================================================================
 * ENHANCED MERLIN CALCULATIONS DEBUG TOOL
 * ============================================================================
 * 
 * Run this in the browser console to inspect wizard calculations
 * 
 * Usage:
 *   Copy and paste this entire script into the browser console
 *   Or load via: import('./scripts/enhanced-calculations-debug.js')
 * 
 * ============================================================================
 */

(function() {
  'use strict';
  
  console.clear();
  console.log('%c🧙 MERLIN CALCULATIONS DEBUG TOOL', 'font-size:20px;font-weight:bold;color:#8B5CF6;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#8B5CF6;');
  
  // Helper to find React Fiber nodes
  function findReactFiber(element) {
    const keys = Object.keys(element).filter(k => 
      k.startsWith('__reactFiber$') || 
      k.startsWith('__reactInternalInstance$') ||
      k.startsWith('__reactContainer$')
    );
    return keys.length > 0 ? element[keys[0]] : null;
  }
  
  // Traverse React Fiber tree to find state/props with calculations
  function findCalculationsInFiber(fiber, depth = 0, maxDepth = 50) {
    if (!fiber || depth > maxDepth) return null;
    
    // Check memoizedState
    let state = fiber.memoizedState;
    while (state) {
      if (state.memoizedState && typeof state.memoizedState === 'object') {
        const calc = state.memoizedState.calculations || state.memoizedState.calc;
        if (calc && Array.isArray(calc)) return calc;
        if (calc && typeof calc === 'object' && calc.bessKW !== undefined) return calc;
      }
      if (state.queue) {
        const queueState = state.queue.baseState || state.queue.memoizedState;
        if (queueState && typeof queueState === 'object') {
          const calc = queueState.calculations || queueState.calc;
          if (calc && Array.isArray(calc)) return calc;
          if (calc && typeof calc === 'object' && calc.bessKW !== undefined) return calc;
        }
      }
      state = state.next;
    }
    
    // Check stateNode
    if (fiber.stateNode) {
      const node = fiber.stateNode;
      if (node.state) {
        const calc = node.state.calculations || node.state.calc;
        if (calc && Array.isArray(calc)) return calc;
        if (calc && typeof calc === 'object' && calc.bessKW !== undefined) return calc;
      }
      if (node.props) {
        const calc = node.props.calculations || node.props.calc;
        if (calc && Array.isArray(calc)) return calc;
        if (calc && typeof calc === 'object' && calc.bessKW !== undefined) return calc;
      }
    }
    
    // Check memoizedProps
    if (fiber.memoizedProps) {
      const calc = fiber.memoizedProps.calculations || fiber.memoizedProps.calc;
      if (calc && Array.isArray(calc)) return calc;
      if (calc && typeof calc === 'object' && calc.bessKW !== undefined) return calc;
    }
    
    // Recursively check children
    const children = [];
    if (fiber.child) children.push(fiber.child);
    if (fiber.sibling) children.push(fiber.sibling);
    
    for (const child of children) {
      const result = findCalculationsInFiber(child, depth + 1, maxDepth);
      if (result) return result;
    }
    
    return null;
  }
  
  // Find calculations from multiple sources
  function findCalculations() {
    const sources = [];
    
    // 1. Check window.__MERLIN_STATE__
    if (window.__MERLIN_STATE__) {
      const state = window.__MERLIN_STATE__;
      if (state.calculations) {
        sources.push({
          source: 'window.__MERLIN_STATE__.calculations',
          data: state.calculations,
          type: Array.isArray(state.calculations) ? 'array' : 'object'
        });
      }
    }
    
    // 2. Check DOM elements with grid-cols classes (Step 5 cards)
    const gridElements = document.querySelectorAll('[class*="grid-cols"]');
    for (const el of gridElements) {
      const fiber = findReactFiber(el);
      if (fiber) {
        const calc = findCalculationsInFiber(fiber);
        if (calc) {
          sources.push({
            source: `DOM: ${el.className.substring(0, 50)}...`,
            data: calc,
            type: Array.isArray(calc) ? 'array' : 'object'
          });
        }
      }
    }
    
    // 3. Check all elements with "Magic Fit" or "Step 5" text
    const step5Elements = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent || '';
      return text.includes('Magic Fit') || text.includes('PERFECT FIT') || text.includes('BEAST MODE');
    });
    
    for (const el of step5Elements) {
      const fiber = findReactFiber(el);
      if (fiber) {
        const calc = findCalculationsInFiber(fiber);
        if (calc) {
          sources.push({
            source: `Step 5 Element: ${el.tagName}`,
            data: calc,
            type: Array.isArray(calc) ? 'array' : 'object'
          });
        }
      }
    }
    
    return sources;
  }
  
  // Format calculations for display
  function formatCalculations(calc) {
    if (Array.isArray(calc)) {
      return calc.map((c, i) => ({
        index: i,
        bessKW: c.bessKW || 0,
        bessKWh: c.bessKWh || 0,
        solarKW: c.solarKW || 0,
        generatorKW: c.generatorKW || 0,
        evPowerKW: c.evPowerKW || 0,
        totalInvestment: c.totalInvestment || 0,
        annualSavings: c.annualSavings || 0,
        paybackYears: c.paybackYears || 0
      }));
    } else if (calc && typeof calc === 'object') {
      return {
        bessKW: calc.bessKW || 0,
        bessKWh: calc.bessKWh || 0,
        solarKW: calc.solarKW || 0,
        generatorKW: calc.generatorKW || 0,
        evPowerKW: calc.evPowerKW || 0,
        totalInvestment: calc.totalInvestment || 0,
        annualSavings: calc.annualSavings || 0,
        paybackYears: calc.paybackYears || 0
      };
    }
    return null;
  }
  
  // Main execution
  const sources = findCalculations();
  
  if (sources.length === 0) {
    console.log('%c❌ No calculations found!', 'color:#EF4444;font-weight:bold;');
    console.log('%c   Make sure you are on Step 5 (Magic Fit) of the wizard', 'color:#9CA3AF;');
    console.log('%c   Or check: window.__MERLIN_STATE__.calculations', 'color:#3B82F6;');
    return;
  }
  
  console.log(`%c✅ Found ${sources.length} calculation source(s)\n`, 'color:#10B981;font-weight:bold;');
  
  sources.forEach((source, idx) => {
    console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color:#8B5CF6;');
    console.log(`%cSource ${idx + 1}: ${source.source}`, 'font-weight:bold;color:#F59E0B;');
    console.log(`%cType: ${source.type}`, 'color:#9CA3AF;font-size:11px;');
    
    const formatted = formatCalculations(source.data);
    if (formatted) {
      console.table(formatted);
      
      // Additional details
      if (Array.isArray(source.data)) {
        console.log(`%cArray length: ${source.data.length}`, 'color:#9CA3AF;');
        source.data.forEach((item, i) => {
          if (item && typeof item === 'object') {
            console.log(`\n%cCard ${i + 1}:`, 'font-weight:bold;color:#8B5CF6;');
            console.log(`   BESS: ${item.bessKW || 0} kW / ${item.bessKWh || 0} kWh`);
            console.log(`   Solar: ${item.solarKW || 0} kW`);
            console.log(`   Generator: ${item.generatorKW || 0} kW`);
            console.log(`   EV: ${item.evPowerKW || 0} kW`);
            console.log(`   Investment: $${(item.totalInvestment || 0).toLocaleString()}`);
            console.log(`   Savings: $${(item.annualSavings || 0).toLocaleString()}/yr`);
          }
        });
      } else {
        console.log(`\n%cCalculations Object:`, 'font-weight:bold;color:#8B5CF6;');
        console.log(`   BESS: ${formatted.bessKW} kW / ${formatted.bessKWh} kWh`);
        console.log(`   Solar: ${formatted.solarKW} kW`);
        console.log(`   Generator: ${formatted.generatorKW} kW`);
        console.log(`   EV: ${formatted.evPowerKW} kW`);
        console.log(`   Investment: $${formatted.totalInvestment.toLocaleString()}`);
        console.log(`   Savings: $${formatted.annualSavings.toLocaleString()}/yr`);
        console.log(`   Payback: ${formatted.paybackYears} years`);
      }
    }
  });
  
  // Save to window for easy access
  window.__MERLIN_CALCULATIONS__ = sources.length > 0 ? sources[0].data : null;
  window.__MERLIN_CALCULATIONS_SOURCES__ = sources;
  
  console.log(`\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color:#8B5CF6;');
  console.log(`%c💾 Calculations saved to:`, 'font-weight:bold;');
  console.log(`   window.__MERLIN_CALCULATIONS__`);
  console.log(`   window.__MERLIN_CALCULATIONS_SOURCES__`);
  console.log(`\n%c💡 Tip: Access calculations directly:`, 'color:#3B82F6;');
  console.log(`   window.__MERLIN_CALCULATIONS__`);
  console.log(`   window.__MERLIN_STATE__.calculations`);
  
})();
