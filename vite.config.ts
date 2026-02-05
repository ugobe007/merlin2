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
          'vendor-ui': ['lucide-react'],
          
          // App chunks - split by functionality
          'wizard': [
            './src/components/wizard/v6/WizardV6.tsx',
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
