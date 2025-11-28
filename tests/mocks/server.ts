/**
 * MSW SERVER SETUP
 * 
 * Mock Service Worker server configuration for testing
 * Install with: npm install -D msw
 */

import { setupServer } from 'msw/node';
import { baselineHandlers } from './handlers/baseline.handlers';

// Setup requests interceptor with handlers
export const server = setupServer(...baselineHandlers);

// Start server before all tests
export const startMockServer = () => {
  server.listen({ onUnhandledRequest: 'warn' });
};

// Reset handlers after each test
export const resetMockServer = () => {
  server.resetHandlers();
};

// Close server after all tests
export const closeMockServer = () => {
  server.close();
};
