/**
 * Global Test Setup for BESS Quote Builder
 * Runs before all tests to configure the testing environment
 */

import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// ==========================================
// GLOBAL SETUP
// ==========================================

beforeAll(() => {
  // Suppress console warnings during tests (optional)
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    // Filter out known Vite warnings
    if (
      args[0]?.includes('Module') ||
      args[0]?.includes('externalized for browser compatibility')
    ) {
      return;
    }
    originalWarn(...args);
  };
});

// ==========================================
// CLEANUP
// ==========================================

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ==========================================
// GLOBAL MOCKS
// ==========================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.sessionStorage = sessionStorageMock as any;

// Mock fetch
global.fetch = vi.fn();

// Mock console methods for testing
export const mockConsole = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {}),
};

// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================

process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_API_URL = 'http://localhost:3000';

// ==========================================
// CUSTOM MATCHERS
// ==========================================

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHaveBeenCalledWithMatch(received: any, expected: any) {
    const calls = received.mock.calls;
    const pass = calls.some((call: any[]) => {
      return call.some(arg => {
        if (typeof expected === 'object') {
          return Object.keys(expected).every(key => arg[key] === expected[key]);
        }
        return arg === expected;
      });
    });
    
    if (pass) {
      return {
        message: () => `expected function not to have been called with matching arguments`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected function to have been called with matching arguments`,
        pass: false,
      };
    }
  }
});

// ==========================================
// TYPE DECLARATIONS
// ==========================================

declare global {
  namespace Vi {
    interface Matchers<R = any> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveBeenCalledWithMatch(expected: any): R;
    }
  }
}
