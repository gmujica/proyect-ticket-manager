// `defineConfig` comes from vitest/config rather than vite: it is the same
// helper, extended so the `test` block below is recognised.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base` only matters for the gh-pages build, where the app is served from
// https://gmujica.github.io/proyect-ticket-manager/. In dev it stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/proyect-ticket-manager/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  test: {
    // `describe`/`it`/`expect` without importing them in every file
    globals: true,
    // Held at jsdom 29 on purpose. jsdom 30 rewrote getComputedStyle and throws
    // on `calc()` with a percentage, which MUI's Dialog emits as
    // `max-height: calc(100% - 64px)`. Testing Library calls getComputedStyle on
    // every element during role queries, so every such query would crash.
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  }
}));