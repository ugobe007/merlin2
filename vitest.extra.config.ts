import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test-setup.vitest.ts'],
    include: [
      'src/tests/**/*.test.ts',
      'src/services/__tests__/**/*.test.ts',
      'src/utils/__tests__/**/*.test.ts',
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
    ],
    exclude: [
      'node_modules/**',
      'tests/e2e/**',
      'tests/puppeteer/**',
      'tests/stagehand/**',
      'tests/smoke/**',
      'tests/visual/**',
      'tests/integration/**',
      '**/*.example.test.ts',
      '**/*.example.test.tsx',
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
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
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
