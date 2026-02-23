import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5184,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Force clean build - remove dist before building
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
        manualChunks: {
          // Vendor chunk - external dependencies
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          // Note: lucide-react NOT chunked manually — tree-shaking only
          // bundles actually-used icons into each lazy chunk

          // wizard-v7 chunk — V7 hook + calculator registry
          'wizard-v7': [
            './src/wizard/v7/hooks/useWizardV7.ts',
            './src/wizard/v7/calculators/registry.ts',
            './src/wizard/v7/pricing/pricingBridge.ts',
          ],
          // Shared services chunk — used by many pages/chunks
          'services': [
            './src/services/centralizedCalculations.ts',
            './src/services/baselineService.ts',
            './src/services/useCaseService.ts',
            './src/services/useCasePowerCalculations.ts',
            './src/utils/equipmentCalculations.ts',
          ],
          // NOTE: WizardV6 intentionally NOT in manualChunks — it is React.lazy()
          // so Rollup creates a tree-shaken async chunk. Pinning it caused a
          // 2.5 MB monolith chunk (fixed Feb 23 2026).
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit slightly (from 500KB default)
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
  },
})
