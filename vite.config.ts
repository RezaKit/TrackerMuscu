import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Manual chunks split heavy third-party libs from app code so the
        // critical-path bundle (Dashboard, Auth, Onboarding) stays small and
        // routes loaded later (Coach, Analytics, Calendar) reuse cached vendor
        // chunks across releases.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('@supabase'))       return 'vendor-supabase';
            if (id.includes('dexie'))           return 'vendor-dexie';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('jspdf'))           return 'vendor-pdf';
            if (id.includes('papaparse'))       return 'vendor-papaparse';
            if (id.includes('zustand'))         return 'vendor-zustand';
            if (id.includes('date-fns'))        return 'vendor-datefns';
            return 'vendor';
          }
        },
      },
    },
  },
})
