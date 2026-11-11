// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// El sitio se publica en la raíz de su subdominio (GitHub Pages con dominio propio).
// Ambos valores se pueden sobrescribir con variables de entorno sin tocar el código.
const site = process.env.SITE_URL ?? 'https://healthybites.vfernandezg.dev';
const base = process.env.BASE_PATH ?? '/';

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
