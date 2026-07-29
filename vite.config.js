// `defineConfig` comes from vitest/config rather than vite: it is the same
// helper, extended so the `test` block below is recognised.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The app is served from the domain root everywhere except gh-pages, which puts
// it under /proyect-ticket-manager/. Root is therefore the default and gh-pages
// is the exception, opted into by `npm run deploy` via `--mode ghpages`; a host
// like Cloudflare Pages needs no configuration at all.
export default defineConfig(({ mode }) => ({
  base: mode === 'ghpages' ? '/proyect-ticket-manager/' : '/',
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
    setupFiles: './src/test/setup.js',
    // Rendering the whole board through MUI is not fast; the 5s default leaves
    // no headroom on a shared CI runner.
    testTimeout: 15000
  }
}));