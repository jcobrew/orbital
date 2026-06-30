// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Static site (no server adapter). Vercel serves the built `dist/`.
// `cleanUrls` + the CORS/content-type headers live in vercel.json.
export default defineConfig({
  integrations: [react()],
  // The Countries directory is soft-hidden for now (the pages aren't
  // production-ready). Keep the route alive by redirecting it home; country
  // data still surfaces via the globe's info drawer and /api/countries.json.
  redirects: {
    '/countries': '/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
