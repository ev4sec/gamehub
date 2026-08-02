import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  /**
   * The site is served from a project path, github.io/gamehub, not from a
   * domain root, so built asset URLs have to carry that prefix or every script
   * and stylesheet 404s. Only applied to the build: the dev server keeps
   * serving from `/` so the local URL stays what it has always been.
   */
  base: command === 'build' ? '/gamehub/' : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));
