import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5177,
    watch: {
      usePolling: true,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - external dependencies
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['lucide-react'],
          
          // App chunks - split by functionality
          'wizard': [
            './src/components/wizard/StreamlinedWizard.tsx',
            './src/components/wizard/InteractiveConfigDashboard.tsx',
          ],
          'modals': [
            './src/components/wizard/FinancingOptionsModal.tsx',
            './src/components/wizard/InstallerDirectoryModal.tsx',
            './src/components/wizard/IncentivesGuideModal.tsx',
          ],
          'services': [
            './src/services/centralizedCalculations.ts',
            './src/services/baselineService.ts',
            './src/services/useCaseService.ts',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit slightly (from 500KB default)
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
  },
})
