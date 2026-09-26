import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2020',
    lib: { entry: resolve('src/app.js'), name: 'ElmHomepage', formats: ['iife'], fileName: () => 'app.js' },
    minify: true,
    reportCompressedSize: true,
  },
});
