// vite.config.ts
import { defineConfig } from "file:///Users/robertchristopher/merlin2/node_modules/vite/dist/node/index.js";
import react from "file:///Users/robertchristopher/merlin2/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/Users/robertchristopher/merlin2";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 5177,
    watch: {
      usePolling: true
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - external dependencies
          "vendor-react": ["react", "react-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui": ["lucide-react"],
          // App chunks - split by functionality
          "wizard": [
            "./src/components/wizard/SmartWizardV2.tsx",
            "./src/components/wizard/InteractiveConfigDashboard.tsx"
          ],
          "modals": [
            "./src/components/wizard/FinancingOptionsModal.tsx",
            "./src/components/wizard/InstallerDirectoryModal.tsx",
            "./src/components/wizard/IncentivesGuideModal.tsx"
          ],
          "services": [
            "./src/services/centralizedCalculations.ts",
            "./src/services/baselineService.ts",
            "./src/services/useCaseService.ts"
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600,
    // Increase limit slightly (from 500KB default)
    sourcemap: false
    // Disable sourcemaps in production for smaller bundle
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcm9iZXJ0Y2hyaXN0b3BoZXIvbWVybGluMlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3JvYmVydGNocmlzdG9waGVyL21lcmxpbjIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3JvYmVydGNocmlzdG9waGVyL21lcmxpbjIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTc3LFxuICAgIHdhdGNoOiB7XG4gICAgICB1c2VQb2xsaW5nOiB0cnVlLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIFZlbmRvciBjaHVuayAtIGV4dGVybmFsIGRlcGVuZGVuY2llc1xuICAgICAgICAgICd2ZW5kb3ItcmVhY3QnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgICd2ZW5kb3Itc3VwYWJhc2UnOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxuICAgICAgICAgICd2ZW5kb3ItdWknOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFwcCBjaHVua3MgLSBzcGxpdCBieSBmdW5jdGlvbmFsaXR5XG4gICAgICAgICAgJ3dpemFyZCc6IFtcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL3dpemFyZC9TbWFydFdpemFyZFYyLnRzeCcsXG4gICAgICAgICAgICAnLi9zcmMvY29tcG9uZW50cy93aXphcmQvSW50ZXJhY3RpdmVDb25maWdEYXNoYm9hcmQudHN4JyxcbiAgICAgICAgICBdLFxuICAgICAgICAgICdtb2RhbHMnOiBbXG4gICAgICAgICAgICAnLi9zcmMvY29tcG9uZW50cy93aXphcmQvRmluYW5jaW5nT3B0aW9uc01vZGFsLnRzeCcsXG4gICAgICAgICAgICAnLi9zcmMvY29tcG9uZW50cy93aXphcmQvSW5zdGFsbGVyRGlyZWN0b3J5TW9kYWwudHN4JyxcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL3dpemFyZC9JbmNlbnRpdmVzR3VpZGVNb2RhbC50c3gnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgJ3NlcnZpY2VzJzogW1xuICAgICAgICAgICAgJy4vc3JjL3NlcnZpY2VzL2NlbnRyYWxpemVkQ2FsY3VsYXRpb25zLnRzJyxcbiAgICAgICAgICAgICcuL3NyYy9zZXJ2aWNlcy9iYXNlbGluZVNlcnZpY2UudHMnLFxuICAgICAgICAgICAgJy4vc3JjL3NlcnZpY2VzL3VzZUNhc2VTZXJ2aWNlLnRzJyxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNjAwLCAvLyBJbmNyZWFzZSBsaW1pdCBzbGlnaHRseSAoZnJvbSA1MDBLQiBkZWZhdWx0KVxuICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIERpc2FibGUgc291cmNlbWFwcyBpbiBwcm9kdWN0aW9uIGZvciBzbWFsbGVyIGJ1bmRsZVxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1IsU0FBUyxvQkFBb0I7QUFDL1MsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsWUFBWTtBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLGdCQUFnQixDQUFDLFNBQVMsV0FBVztBQUFBLFVBQ3JDLG1CQUFtQixDQUFDLHVCQUF1QjtBQUFBLFVBQzNDLGFBQWEsQ0FBQyxjQUFjO0FBQUE7QUFBQSxVQUc1QixVQUFVO0FBQUEsWUFDUjtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxVQUFVO0FBQUEsWUFDUjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsWUFBWTtBQUFBLFlBQ1Y7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBO0FBQUEsSUFDdkIsV0FBVztBQUFBO0FBQUEsRUFDYjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
