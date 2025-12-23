import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  // GitHub Pages deployment base path (set to repo name for production)
  base: process.env.GITHUB_PAGES ? '/shaadi-partner-search/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],
          // UI components
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
            '@radix-ui/react-slot',
          ],
          // Icons
          'icons': ['@phosphor-icons/react', 'lucide-react'],
          // Charts and visualization
          'charts': ['recharts', 'd3'],
          // Animation
          'animation': ['framer-motion'],
          // Forms
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Utilities
          'utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          // Azure Core
          'azure-core': ['@azure/core-rest-pipeline', '@azure/core-auth', '@azure/core-util', '@azure/core-client'],
          // Azure Individual Services (split for better caching)
          'azure-cosmos': ['@azure/cosmos'],
          'azure-identity': ['@azure/identity'],
          'azure-keyvault': ['@azure/keyvault-secrets'],
          'azure-storage': ['@azure/storage-blob'],
          // React day picker for calendar
          'calendar': ['react-day-picker'],
          // QR code
          'qrcode': ['qrcode'],
          // Sonner toast
          'sonner': ['sonner'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
