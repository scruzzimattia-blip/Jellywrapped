import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/recharts')) {
            return 'recharts';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          if (id.includes('node_modules/html2canvas')) {
            return 'html2canvas';
          }
        },
      },
    },
  },
});
