// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Static site (no server adapter). Vercel serves the built `dist/`.
// `cleanUrls` + the CORS/content-type headers live in vercel.json.
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
