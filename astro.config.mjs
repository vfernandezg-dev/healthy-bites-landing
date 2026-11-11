// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// GitHub Pages sirve el sitio como "project page" bajo /healthy-bites-landing/.
// Ambos valores se pueden sobrescribir (p. ej. para un dominio propio) sin tocar el código.
const site = process.env.SITE_URL ?? 'https://vfernandezg-dev.github.io';
const base = process.env.BASE_PATH ?? '/healthy-bites-landing';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
  image: {
    // Imágenes responsivas por defecto: srcset + sizes generados automáticamente.
    layout: 'constrained',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
