import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['i18n-iso-countries/langs/en.json']
  }
})


