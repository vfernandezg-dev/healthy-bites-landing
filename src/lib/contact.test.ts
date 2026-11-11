import { describe, expect, it, vi } from 'vitest';

import {
  CONTACT_LIMITS,
  buildMailtoHref,
  emptyContactForm,
  submitContact,
  validateContact,
  validateField,
  type ContactFormValues,
} from './contact';

const validForm: ContactFormValues = {
  nombre: 'Ana',
  apellido: 'Torres',
  correo: 'ana@correo.com',
  mensaje: 'Hola, quisiera más información sobre los planes.',
  website: '',
};

const jsonResponse = (status: number) => new Response(null, { status });

describe('validateField', () => {
  it('acepta valores válidos e ignora espacios alrededor', () => {
    expect(validateField('nombre', '  Ana  ')).toBeUndefined();
    expect(validateField('correo', ' ana@correo.com ')).toBeUndefined();
  });

  it('exige campos obligatorios', () => {
    expect(validateField('nombre', '   ')).toBe('Ingresa tu nombre.');
    expect(validateField('correo', '')).toBe('Ingresa tu correo electrónico.');
    expect(validateField('mensaje', '')).toBe('Escribe tu mensaje.');
  });

  it('aplica los límites de longitud compartidos con el backend', () => {
    expect(validateField('apellido', 'T')).toMatch(/al menos 2/);
    expect(validateField('nombre', 'a'.repeat(CONTACT_LIMITS.nombre.max + 1))).toMatch(/60/);
    expect(validateField('mensaje', 'corto')).toMatch(/al menos 10/);
    expect(validateField('mensaje', 'a'.repeat(CONTACT_LIMITS.mensaje.max + 1))).toMatch(/2000/);
  });

  it('rechaza correos con formato inválido', () => {
    for (const email of ['ana', 'ana@', 'ana@correo', 'ana correo@x.com']) {
      expect(validateField('correo', email)).toMatch(/correo electrónico válido/);
    }
  });
});

describe('validateContact', () => {
  it('no devuelve errores para un formulario válido', () => {
    expect(validateContact(validForm)).toEqual({});
  });

  it('devuelve un error por cada campo inválido', () => {
    expect(Object.keys(validateContact(emptyContactForm))).toEqual([
      'nombre',
      'apellido',
      'correo',
      'mensaje',
    ]);
  });
});

describe('submitContact', () => {
  const apiUrl = 'https://api.example.com/api/v1';

  it('envía el payload normalizado al endpoint /contact', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(204));
    const result = await submitContact({ ...validForm, nombre: '  Ana ' }, { apiUrl, fetchImpl });

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      `${apiUrl}/contact`,
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(fetchImpl.mock.calls[0]![1].body as string);
    expect(body).toEqual({ ...validForm, nombre: 'Ana' });
  });

  it.each([
    [422, 'validation'],
    [400, 'validation'],
    [429, 'rate-limited'],
    [503, 'unavailable'],
    [500, 'unavailable'],
  ] as const)('traduce el estado HTTP %i a "%s"', async (status, reason) => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(status));
    await expect(submitContact(validForm, { apiUrl, fetchImpl })).resolves.toEqual({
      ok: false,
      reason,
    });
  });

  it('reporta error de red cuando fetch falla', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(submitContact(validForm, { apiUrl, fetchImpl })).resolves.toEqual({
      ok: false,
      reason: 'network',
    });
  });

  it('cancela la petición al superar el tiempo límite', async () => {
    const fetchImpl = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError')));
        }),
    );
    await expect(submitContact(validForm, { apiUrl, fetchImpl, timeoutMs: 10 })).resolves.toEqual({
      ok: false,
      reason: 'timeout',
    });
  });
});

describe('buildMailtoHref', () => {
  it('genera un mailto con asunto y cuerpo codificados', () => {
    const href = buildMailtoHref({ ...validForm, mensaje: 'Precio + detalles' }, 'hola@hb.com');
    expect(href.startsWith('mailto:hola@hb.com?')).toBe(true);

    const params = new URLSearchParams(href.split('?')[1]);
    expect(params.get('subject')).toBe('Contacto desde la landing — Ana Torres');
    expect(params.get('body')).toBe('Precio + detalles\n\nAna Torres\nana@correo.com');
    expect(href).not.toContain('+');
  });
});
