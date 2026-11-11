# Healthy Bites · Landing page

[![CI](https://github.com/vfernandezg-dev/healthy-bites-landing/actions/workflows/ci.yml/badge.svg)](https://github.com/vfernandezg-dev/healthy-bites-landing/actions/workflows/ci.yml)
[![Deploy](https://github.com/vfernandezg-dev/healthy-bites-landing/actions/workflows/deploy.yml/badge.svg)](https://github.com/vfernandezg-dev/healthy-bites-landing/actions/workflows/deploy.yml)

Sitio público de **Healthy Bites**, una plataforma de nutrición con planes alimenticios creados por
nutricionistas, contenido educativo, seguimiento de hábitos, rachas con recompensas y comunidad.

**Sitio:** https://vfernandezg-dev.github.io/healthy-bites-landing/

> Proyecto académico. Forma parte de un sistema de tres repositorios:
>
> | Repositorio                                                                       | Rol                                                    |
> | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
> | [healthy-bites-landing](https://github.com/vfernandezg-dev/healthy-bites-landing) | Landing page (este repo)                               |
> | [healthy-web-app](https://github.com/vfernandezg-dev/healthy-web-app)             | Aplicación web (Angular): registro, login y uso diario |
> | [healthy-bites-api](https://github.com/vfernandezg-dev/healthy-bites-api)         | API REST (Spring Boot + PostgreSQL)                    |

## Stack

- [Astro 7](https://astro.build) con generación estática y arquitectura de islas.
- [React 19](https://react.dev) solo donde hay estado real: el formulario de contacto, que se hidrata al entrar en pantalla (`client:visible`).
- TypeScript estricto y [Tailwind CSS 4](https://tailwindcss.com).
- Imágenes optimizadas con `astro:assets` (AVIF/WebP, `srcset`) e iconos SVG de [Lucide](https://lucide.dev).
- Calidad: ESLint (con reglas de accesibilidad), Prettier, Vitest + Testing Library y Playwright + axe.

## Decisiones de arquitectura

- **La landing no implementa autenticación.** El login y el registro viven en el web-app, que guarda
  la sesión (JWT) en su propio origen. La landing solo enlaza a `PUBLIC_APP_URL/auth/login` y
  `/auth/register`. Así se evita duplicar la lógica de auth o pasar tokens entre dominios.
- **Cero JS por defecto.** Todas las secciones se renderizan a HTML en el build. El header (menú móvil y
  _scroll-spy_) y la animación de aparición son scripts pequeños sin framework. React solo se descarga
  cuando el usuario llega al formulario de contacto.
- **Contenido separado de la presentación.** Todos los textos y datos están en
  [`src/data/site.ts`](src/data/site.ts). Las funcionalidades que se describen existen en la API; si
  cambian, actualiza ese archivo.
- **Contacto:** el formulario envía `POST {PUBLIC_API_URL}/contact` (endpoint de `healthy-bites-api`).
  Valida con las mismas reglas que el backend ([`src/lib/contact.ts`](src/lib/contact.ts)). Si la API no
  responde, ofrece un enlace `mailto:` con el mensaje ya escrito.

## Estructura

```
src/
├── assets/            # Imágenes procesadas en el build (logo, hero, equipo)
├── components/
│   ├── contact/       # ContactForm (isla React) + tests
│   ├── layout/        # Header y Footer
│   ├── sections/      # Secciones de la página (Hero, Features, FAQ…)
│   └── ui/            # Componentes de presentación reutilizables
├── data/site.ts       # Contenido de la landing
├── layouts/           # BaseLayout: <head>, SEO, Open Graph, JSON-LD
├── lib/               # Configuración, lógica del formulario y utilidades de UI
├── pages/             # index, 404 y robots.txt
├── scripts/           # Comportamiento del header y animaciones (TS sin framework)
└── styles/global.css  # Tokens de diseño (Tailwind @theme)
e2e/                   # Pruebas end-to-end y de accesibilidad
scripts/               # Generación de assets de marca (favicon, OG image, logo)
```

## Desarrollo

Requisitos:

- **Node.js 24 LTS** (ver [`.nvmrc`](.nvmrc)).
- **pnpm**. La versión exacta está fijada en `package.json` (`packageManager`), y pnpm la usa
  automáticamente dentro del proyecto. Este proyecto no admite npm ni yarn: `npm install` falla a propósito.

```bash
pnpm install
cp .env.example .env   # opcional: apunta a una API o web-app local
pnpm dev               # http://localhost:4321/healthy-bites-landing/
```

| Script              | Descripción                                                 |
| ------------------- | ----------------------------------------------------------- |
| `pnpm dev`          | Servidor de desarrollo                                      |
| `pnpm build`        | Build estático en `dist/`                                   |
| `pnpm preview`      | Sirve el build localmente                                   |
| `pnpm lint`         | ESLint (TypeScript, Astro, React Hooks, accesibilidad)      |
| `pnpm format`       | Formatea con Prettier                                       |
| `pnpm check`        | Chequeo de tipos de Astro y TypeScript                      |
| `pnpm test`         | Tests unitarios y de componentes (Vitest)                   |
| `pnpm test:e2e`     | Tests E2E y de accesibilidad WCAG 2.2 AA (requiere `build`) |
| `pnpm verify`       | Lint + formato + tipos + tests + build                      |
| `pnpm brand:assets` | Regenera logo transparente, favicon, iconos e imagen OG     |

La primera vez que ejecutes los tests E2E, instala el navegador con `pnpm exec playwright install chromium`.

## Versión anterior

El sitio original (HTML + Bootstrap) se conserva en la rama
[`legacy`](https://github.com/vfernandezg-dev/healthy-bites-landing/tree/legacy), solo como referencia.

### Variables de entorno

| Variable         | Por defecto                                           | Uso                                    |
| ---------------- | ----------------------------------------------------- | -------------------------------------- |
| `PUBLIC_APP_URL` | `https://healthy-bites-v1.netlify.app`                | Enlaces a login y registro del web-app |
| `PUBLIC_API_URL` | `https://healthybites-api-latest.onrender.com/api/v1` | Endpoint del formulario de contacto    |
| `SITE_URL`       | `https://vfernandezg-dev.github.io`                   | URL canónica, sitemap y Open Graph     |
| `BASE_PATH`      | `/healthy-bites-landing`                              | Ruta base (GitHub Pages de proyecto)   |

En desarrollo contra el backend local usa `PUBLIC_API_URL=http://localhost:8090/api/v1`.

## Despliegue

Cada push a `main` ejecuta [`deploy.yml`](.github/workflows/deploy.yml), que construye el sitio y lo
publica en GitHub Pages (fuente: _GitHub Actions_). Las URLs de producción se configuran como
_variables_ del repositorio (`Settings → Secrets and variables → Actions → Variables`):
`PUBLIC_APP_URL` y `PUBLIC_API_URL`.

Cada pull request pasa por [`ci.yml`](.github/workflows/ci.yml): lint, formato, tipos, tests
unitarios, build y tests E2E con auditoría de accesibilidad.

## Equipo

| Integrante         | Rol                                                          |
| ------------------ | ------------------------------------------------------------ |
| Valentin Fernandez | Full Stack Developer: backend, frontend y funcionalidades    |
| Camila Moreno      | UI/UX Designer: prototipos de interfaces y apoyo en frontend |
| Alessia Aguilar    | Backend Developer: validación de funcionalidades             |
| Jhonattan Chavez   | UI Designer: diseño de interfaces                            |
| Renzo Lavado       | UI Designer: diseño de la landing page                       |
