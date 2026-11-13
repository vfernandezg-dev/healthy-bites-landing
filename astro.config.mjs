// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// El sitio se publica en la raíz de su subdominio (GitHub Pages con dominio propio).
// Ambos valores se pueden sobrescribir con variables de entorno sin tocar el código.
const site = process.env.SITE_URL ?? 'https://healthybites.vfernandezg.dev';
const base = process.env.BASE_PATH ?? '/';
// Origen de la API (formulario de contacto), el mismo respaldo que src/lib/config.ts.
const apiOrigin = new URL(
  process.env.PUBLIC_API_URL ?? 'https://api-healthybites.vfernandezg.dev/api/v1',
).origin;

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
    // Las fuentes siempre como archivo: Vite incrusta en base64 (data:) los menores de 4 kB, y la CSP solo admite
    // fuentes del propio sitio.
    build: {
      assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
    },
  },
  // Política de seguridad de contenidos en un <meta> de cada página (GitHub Pages no permite cabeceras propias).
  // Astro añade los hashes de sus scripts y estilos en línea; el resto solo puede venir del propio sitio, salvo las
  // peticiones del formulario de contacto a la API. Los atributos style (retardos de las animaciones) se permiten
  // aparte, sin abrir los bloques <style>.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        `connect-src 'self' ${apiOrigin}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        'upgrade-insecure-requests',
      ],
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
    },
  },
});
