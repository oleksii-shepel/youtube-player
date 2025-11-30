import { defineConfig } from 'vite';
import json from '@rollup/plugin-json';

export default defineConfig({
  build: {
    rollupOptions: {
      plugins: [
        json({
          compact: true,
          preferConst: true
        })
      ]
    }
  }
});

