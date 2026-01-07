
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths for GitHub Pages sub-directories
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
