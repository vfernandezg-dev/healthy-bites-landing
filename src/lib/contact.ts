/**
 * Lógica del formulario de contacto, independiente de la UI.
 * Las reglas coinciden con ContactMessageDTO en healthy-bites-api: mantenlas sincronizadas.
 */

export const CONTACT_LIMITS = {
  nombre: { min: 2, max: 60 },
  apellido: { min: 2, max: 60 },
  correo: { max: 254 },
  mensaje: { min: 10, max: 2000 },
} as const;

export type ContactField = 'nombre' | 'apellido' | 'correo' | 'mensaje';

export interface ContactFormValues extends Record<ContactField, string> {
  /** Honeypot: los humanos no lo ven; si llega con valor, es un bot. */
  website: string;
}

export type ContactErrors = Partial<Record<ContactField, string>>;

export const emptyContactForm: ContactFormValues = {
  nombre: '',
  apellido: '',
  correo: '',
  mensaje: '',
  website: '',
};

export const CONTACT_FIELDS: readonly ContactField[] = ['nombre', 'apellido', 'correo', 'mensaje'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateLength(
  value: string,
  label: string,
  { min, max }: { min: number; max: number },
): string | undefined {
  if (!value) return `Ingresa tu ${label}.`;
  if (value.length < min) return `Tu ${label} debe tener al menos ${min} caracteres.`;
  if (value.length > max) return `Tu ${label} no puede superar los ${max} caracteres.`;
  return undefined;
}

/** Valida un campo y devuelve el mensaje de error, o undefined si es válido. */
export function validateField(field: ContactField, rawValue: string): string | undefined {
  const value = rawValue.trim();
  switch (field) {
    case 'nombre':
      return validateLength(value, 'nombre', CONTACT_LIMITS.nombre);
    case 'apellido':
      return validateLength(value, 'apellido', CONTACT_LIMITS.apellido);
    case 'correo':
      if (!value) return 'Ingresa tu correo electrónico.';
      if (value.length > CONTACT_LIMITS.correo.max || !EMAIL_PATTERN.test(value)) {
        return 'Ingresa un correo electrónico válido, por ejemplo nombre@correo.com.';
      }
      return undefined;
    case 'mensaje':
      if (!value) return 'Escribe tu mensaje.';
      if (value.length < CONTACT_LIMITS.mensaje.min) {
        return `Tu mensaje debe tener al menos ${CONTACT_LIMITS.mensaje.min} caracteres.`;
      }
      if (value.length > CONTACT_LIMITS.mensaje.max) {
        return `Tu mensaje no puede superar los ${CONTACT_LIMITS.mensaje.max} caracteres.`;
      }
      return undefined;
  }
}

export function validateContact(values: ContactFormValues): ContactErrors {
  const errors: ContactErrors = {};
  for (const field of CONTACT_FIELDS) {
    const error = validateField(field, values[field]);
    if (error) errors[field] = error;
  }
  return errors;
}

export type ContactFailureReason =
  'validation' | 'rate-limited' | 'unavailable' | 'network' | 'timeout';

export type ContactResult = { ok: true } | { ok: false; reason: ContactFailureReason };

export interface SubmitOptions {
  apiUrl: string;
  /** Render (plan gratuito) puede tardar en "despertar"; por eso el margen es amplio. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export const DEFAULT_CONTACT_TIMEOUT_MS = 25_000;

export async function submitContact(
  values: ContactFormValues,
  { apiUrl, timeoutMs = DEFAULT_CONTACT_TIMEOUT_MS, fetchImpl = fetch }: SubmitOptions,
): Promise<ContactResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const payload = {
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim(),
    correo: values.correo.trim(),
    mensaje: values.mensaje.trim(),
    website: values.website,
  };

  try {
    const response = await fetchImpl(`${apiUrl}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.ok) return { ok: true };
    if (response.status === 400 || response.status === 422) {
      return { ok: false, reason: 'validation' };
    }
    if (response.status === 429) return { ok: false, reason: 'rate-limited' };
    return { ok: false, reason: 'unavailable' };
  } catch {
    return { ok: false, reason: controller.signal.aborted ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

/** Enlace mailto prellenado, como alternativa cuando la API no está disponible. */
export function buildMailtoHref(values: ContactFormValues, to: string): string {
  const name = `${values.nombre} ${values.apellido}`.trim();
  const subject = name ? `Contacto desde la landing — ${name}` : 'Contacto desde la landing';
  const lines = [values.mensaje.trim(), '', name, values.correo.trim()].filter(
    (line, index) => index < 2 || line,
  );
  const params = new URLSearchParams({ subject, body: lines.join('\n') });
  // URLSearchParams codifica los espacios como "+", que los clientes de correo no decodifican.
  return `mailto:${to}?${params.toString().replace(/\+/g, '%20')}`;
}
