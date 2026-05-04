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
        // Manual chunks: groupe React + TOUS ses consommateurs pour éviter
        // les imports circulaires entre chunks. zustand, use-sync-external-store,
        // et tout ce qui utilise les hooks de React doivent vivre dans le même chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Tout l'écosystème React (react, react-dom, scheduler, hooks shims, zustand)
          // doit rester ensemble pour éviter "Cannot read properties of undefined".
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('/use-sync-external-store/') ||
            id.includes('/zustand/')
          ) return 'vendor-react';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('/dexie/'))   return 'vendor-dexie';
          if (id.includes('/papaparse/')) return 'vendor-papaparse';
          // Tout le reste dans un chunk générique
          return 'vendor';
        },
      },
    },
  },
})
