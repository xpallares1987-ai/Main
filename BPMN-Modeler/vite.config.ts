import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/Control-Tower/BPMN-Modeler/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('bpmn-js') || id.includes('diagram-js') || id.includes('@bpmn-io/properties-panel')) {
              return 'bpmn-vendor';
            }
          }
          return null;
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
