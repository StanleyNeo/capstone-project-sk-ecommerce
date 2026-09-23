import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,                                  // same port as CRA — CORS & habits unchanged
    proxy: { '/api': 'http://localhost:5000' }   // replaces CRA's package.json "proxy"
  }
});