import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          network: ['peerjs', 'qrcode.react'],
          wordbank: [
            './src/data/packs/classicPacks.ts',
            './src/data/packs/mediaPacks.ts',
            './src/data/packs/lifestylePacks.ts',
            './src/data/packs/classifiedPacks.ts',
          ],
        },
      },
    },
  },
});
