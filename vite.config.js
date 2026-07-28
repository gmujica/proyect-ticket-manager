import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` only matters for the gh-pages build, where the app is served from
// https://gmujica.github.io/proyect-ticket-manager/. In dev it stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/proyect-ticket-manager/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
}));