/**
 * COMPONENT RENDER BENCHMARKS
 * 
 * Benchmark tests for component rendering performance
 */

import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock components for benchmarking
const MockQuoteBuilder = () => <div>Quote Builder</div>;
const MockSmartWizard = () => <div>Smart Wizard</div>;

describe('Component Render Benchmarks', () => {
  bench('render QuoteBuilder', () => {
    render(
      <BrowserRouter>
        <MockQuoteBuilder />
      </BrowserRouter>
    );
  });

  bench('render SmartWizard', () => {
    render(
      <BrowserRouter>
        <MockSmartWizard />
      </BrowserRouter>
    );
  });

  bench('render and unmount 100 times', () => {
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<MockQuoteBuilder />);
      unmount();
    }
  });
});
