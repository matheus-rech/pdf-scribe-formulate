import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI component libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],

          // PDF processing libraries (large bundle)
          'pdf-vendor': [
            'pdfjs-dist',
            'pdf-lib',
            '@react-pdf-viewer/core',
            '@react-pdf-viewer/default-layout',
          ],

          // Data processing libraries
          'data-vendor': [
            'xlsx',
            'jszip',
            'recharts',
          ],

          // Canvas and drawing
          'canvas-vendor': ['fabric'],

          // Form and validation
          'form-vendor': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
          ],

          // State management and utilities
          'utils-vendor': [
            '@tanstack/react-query',
            '@supabase/supabase-js',
            'date-fns',
            'fuse.js',
          ],
        },
      },
    },
    // Increase chunk size warning limit since we're splitting chunks
    chunkSizeWarningLimit: 1000,
    // Enable source maps for easier debugging
    sourcemap: mode === 'development',
  },
}));
