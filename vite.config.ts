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
        manualChunks: (id) => {
          // Core React - small, frequently cached
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor'
          }
          
          // Radix UI components - common across all pages
          if (id.includes('@radix-ui/')) {
            return 'radix-ui'
          }
          
          // Icons - large but cacheable
          if (id.includes('@phosphor-icons/') || id.includes('lucide-react')) {
            return 'icons'
          }
          
          // Charts and visualization
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts'
          }
          
          // Animation
          if (id.includes('framer-motion')) {
            return 'animation'
          }
          
          // Forms
          if (id.includes('react-hook-form') || id.includes('@hookform/') || id.includes('zod')) {
            return 'forms'
          }
          
          // Utilities
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
            return 'utils'
          }
          
          // Azure Core
          if (id.includes('@azure/core-')) {
            return 'azure-core'
          }
          
          // Azure Cosmos - large, separate chunk
          if (id.includes('@azure/cosmos')) {
            return 'azure-cosmos'
          }
          
          // Azure Identity
          if (id.includes('@azure/identity')) {
            return 'azure-identity'
          }
          
          // Azure KeyVault
          if (id.includes('@azure/keyvault-')) {
            return 'azure-keyvault'
          }
          
          // Azure Storage
          if (id.includes('@azure/storage-')) {
            return 'azure-storage'
          }
          
          // Calendar
          if (id.includes('react-day-picker')) {
            return 'calendar'
          }
          
          // QR code
          if (id.includes('qrcode')) {
            return 'qrcode'
          }
          
          // Sonner toast
          if (id.includes('sonner')) {
            return 'sonner'
          }
          
          // Readiness components - lazy loaded feature
          if (id.includes('/components/readiness/')) {
            return 'readiness'
          }
          
          // Admin components - only loaded for admins
          if (id.includes('AdminPanel') || id.includes('AdminLogin')) {
            return 'admin'
          }
          
          // Chat components
          if (id.includes('/Chat.tsx') || id.includes('/Inbox.tsx')) {
            return 'messaging'
          }
          
          // Wedding services
          if (id.includes('WeddingServices') || id.includes('BiodataGenerator')) {
            return 'services'
          }
        },
      },
    },
    // Increase the warning limit since we've split chunks well
    chunkSizeWarningLimit: 600,
  },
});
