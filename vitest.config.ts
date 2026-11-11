/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig reutiliza la configuración de Astro (alias "@/", JSX de React, variables de entorno).
export default getViteConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
