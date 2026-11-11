/**
 * Configuración pública de la landing.
 *
 * La autenticación vive en el web-app (Angular), que guarda la sesión en su propio origen.
 * La landing no implementa login: solo enlaza a las rutas de auth del web-app.
 */
const DEFAULT_APP_URL = 'https://healthy-bites-v1.netlify.app';
const DEFAULT_API_URL = 'https://healthybites-api-latest.onrender.com/api/v1';

/** Usa el valor configurado (o el de respaldo) sin barras finales. */
export function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  const candidate = value?.trim() || fallback;
  return candidate.replace(/\/+$/, '');
}

export const config = {
  appUrl: normalizeBaseUrl(import.meta.env.PUBLIC_APP_URL, DEFAULT_APP_URL),
  apiUrl: normalizeBaseUrl(import.meta.env.PUBLIC_API_URL, DEFAULT_API_URL),
} as const;

export const appLinks = {
  login: `${config.appUrl}/auth/login`,
  register: `${config.appUrl}/auth/register`,
} as const;

/** Ruta base del sitio con barra final (p. ej. "/healthy-bites-landing/"). */
export const basePath = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Enlace a una sección de la página principal; funciona también desde otras páginas (404). */
export const sectionHref = (id: string) => `${basePath}#${id}`;
