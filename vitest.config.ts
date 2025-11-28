import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global setup
    globals: true,
    
    // Setup files
    setupFiles: ['./test-setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test-setup.ts',
        '*.config.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    },
    
    // Test file patterns
    include: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx'
    ],
    
    // Performance monitoring
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporters
    reporters: ['verbose', 'json', 'html'],
    
    // Watch options
    watch: false,
    
    // Parallel execution
    maxConcurrency: 5,
    
    // Mock options
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
