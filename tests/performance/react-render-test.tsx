/**
 * React Component Render Performance Test
 * ========================================
 * Uses React Testing Library to measure actual render times
 */

import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';
import React from 'react';

interface RenderResult {
  componentName: string;
  firstRender: number;
  reRender: number;
  status: 'FAST' | 'SLOW' | 'CRITICAL';
}

class ReactPerformanceTester {
  private results: RenderResult[] = [];
  
  async measureRender(
    componentName: string,
    Component: React.ComponentType<any>,
    props: any,
    fastThreshold: number = 50,
    slowThreshold: number = 150
  ): Promise<RenderResult> {
    // First render
    const start1 = performance.now();
    const { rerender } = render(<Component {...props} />);
    const firstRender = Math.round((performance.now() - start1) * 100) / 100;
    
    // Re-render with same props
    const start2 = performance.now();
    rerender(<Component {...props} />);
    const reRender = Math.round((performance.now() - start2) * 100) / 100;
    
    const avgTime = (firstRender + reRender) / 2;
    const status = avgTime < fastThreshold ? 'FAST' :
                   avgTime < slowThreshold ? 'SLOW' : 'CRITICAL';
    
    const result: RenderResult = {
      componentName,
      firstRender,
      reRender,
      status
    };
    
    this.results.push(result);
    return result;
  }
  
  printReport() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           REACT COMPONENT RENDER REPORT                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    this.results.forEach((result, index) => {
      const icon = result.status === 'FAST' ? '⚡' :
                   result.status === 'SLOW' ? '⏱️' : '🐌';
      
      console.log(`${icon} Component ${index + 1}: ${result.componentName}`);
      console.log(`   First Render: ${result.firstRender}ms | Re-render: ${result.reRender}ms`);
      console.log(`   Status: ${result.status}`);
      console.log('');
    });
    
    const critical = this.results.filter(r => r.status === 'CRITICAL');
    if (critical.length > 0) {
      console.log('🐌 SLOW COMPONENTS FOUND:');
      critical.forEach(r => console.log(`   - ${r.componentName}: ${r.firstRender}ms`));
      console.log('');
    }
    
    console.log('═════════════════════════════════════════════════════════════\n');
  }
}

export { ReactPerformanceTester };
