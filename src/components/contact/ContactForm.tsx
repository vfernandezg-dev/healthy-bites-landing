import { CircleCheck, LoaderCircle, Mail, Send, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ChangeEvent, type SubmitEvent } from 'react';

import {
  CONTACT_FIELDS,
  CONTACT_LIMITS,
  buildMailtoHref,
  emptyContactForm,
  submitContact,
  validateContact,
  validateField,
  type ContactErrors,
  type ContactFailureReason,
  type ContactField,
  type ContactFormValues,
} from '@/lib/contact';
import { buttonClass, cx } from '@/lib/ui';

interface ContactFormProps {
  apiUrl: string;
  fallbackEmail: string;
  /** Milisegundos antes de avisar que el servidor está tardando (arranque en frío). */
  slowNoticeMs?: number;
}

type Status = 'idle' | 'sending' | 'success' | 'error';

const failureMessages: Record<ContactFailureReason, string> = {
  validation: 'Revisa los datos del formulario e inténtalo otra vez.',
  'rate-limited':
    'Recibimos demasiados mensajes desde tu conexión. Espera unos minutos antes de volver a intentarlo.',
  unavailable: 'Nuestro servicio de mensajes no está disponible en este momento.',
  network: 'No pudimos conectar con el servidor. Revisa tu conexión a internet.',
  timeout: 'El servidor tardó demasiado en responder.',
};

const fieldLabels: Record<ContactField, string> = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  correo: 'Correo electrónico',
  mensaje: 'Mensaje',
};

const inputClass =
  'block w-full rounded-xl border-0 bg-white px-4 py-3 text-ink shadow-xs ring-1 ring-brand-900/15 ring-inset placeholder:text-muted/70 focus:ring-2 focus:ring-brand-600 focus:outline-none aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-600';

export default function ContactForm({
  apiUrl,
  fallbackEmail,
  slowNoticeMs = 5000,
}: ContactFormProps) {
  const formId = useId();
  const [values, setValues] = useState<ContactFormValues>(emptyContactForm);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [failure, setFailure] = useState<ContactFailureReason | null>(null);
  const [isSlow, setIsSlow] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

  const fieldRefs = useRef<Partial<Record<ContactField, HTMLInputElement | HTMLTextAreaElement>>>(
    {},
  );
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== 'sending') return;
    const timer = setTimeout(() => setIsSlow(true), slowNoticeMs);
    return () => clearTimeout(timer);
  }, [status, slowNoticeMs]);

  useEffect(() => {
    if (status === 'success') successHeadingRef.current?.focus();
    if (status === 'error') errorRef.current?.focus();
  }, [status]);

  const id = (field: string) => `${formId}-${field}`;

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    // Si el campo ya mostraba un error, se revalida mientras el usuario corrige.
    if (name in errors) {
      setErrors((current) => ({ ...current, [name]: validateField(name as ContactField, value) }));
    }
  }

  function handleBlur(field: ContactField) {
    if (!values[field]) return; // No se marca error en campos que el usuario aún no llenó.
    setErrors((current) => ({ ...current, [field]: validateField(field, values[field]) }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;

    const validation = validateContact(values);
    setErrors(validation);
    const firstInvalid = CONTACT_FIELDS.find((field) => validation[field]);
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    setStatus('sending');
    setFailure(null);
    setIsSlow(false);

    const result = await submitContact(values, { apiUrl });
    if (result.ok) {
      setSubmittedName(values.nombre.trim());
      setValues(emptyContactForm);
      setStatus('success');
    } else {
      setFailure(result.reason);
      setStatus('error');
    }
  }

  function resetForm() {
    setStatus('idle');
    setFailure(null);
    setErrors({});
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-3xl bg-white p-8 text-center shadow-card ring-1 ring-brand-900/5 sm:p-12"
      >
        <CircleCheck aria-hidden="true" className="mx-auto size-14 text-brand-600" />
        <h3
          ref={successHeadingRef}
          tabIndex={-1}
          className="mt-5 text-2xl font-bold text-ink focus:outline-none"
        >
          ¡Gracias{submittedName ? `, ${submittedName}` : ''}!
        </h3>
        <p className="mt-3 text-muted">
          Recibimos tu mensaje. Te responderemos al correo que nos dejaste.
        </p>
        <button type="button" onClick={resetForm} className={cx(buttonClass('secondary'), 'mt-8')}>
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  const isSending = status === 'sending';
  const messageLength = values.mensaje.trim().length;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-describedby={id('hint')}
      className="relative rounded-3xl bg-white p-6 shadow-card ring-1 ring-brand-900/5 sm:p-10"
    >
      <p id={id('hint')} className="text-sm text-muted">
        Todos los campos son obligatorios.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {(['nombre', 'apellido'] as const).map((field) => (
          <div key={field}>
            <label htmlFor={id(field)} className="block text-sm font-semibold text-ink">
              {fieldLabels[field]}
            </label>
            <input
              ref={(element) => {
                if (element) fieldRefs.current[field] = element;
              }}
              id={id(field)}
              name={field}
              type="text"
              autoComplete={field === 'nombre' ? 'given-name' : 'family-name'}
              required
              maxLength={CONTACT_LIMITS[field].max}
              value={values[field]}
              onChange={handleChange}
              onBlur={() => handleBlur(field)}
              aria-invalid={errors[field] ? true : undefined}
              aria-describedby={errors[field] ? id(`${field}-error`) : undefined}
              className={cx(inputClass, 'mt-2')}
            />
            <FieldError id={id(`${field}-error`)} message={errors[field]} />
          </div>
        ))}

        <div className="sm:col-span-2">
          <label htmlFor={id('correo')} className="block text-sm font-semibold text-ink">
            {fieldLabels.correo}
          </label>
          <input
            ref={(element) => {
              if (element) fieldRefs.current.correo = element;
            }}
            id={id('correo')}
            name="correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={CONTACT_LIMITS.correo.max}
            placeholder="nombre@correo.com"
            value={values.correo}
            onChange={handleChange}
            onBlur={() => handleBlur('correo')}
            aria-invalid={errors.correo ? true : undefined}
            aria-describedby={errors.correo ? id('correo-error') : undefined}
            className={cx(inputClass, 'mt-2')}
          />
          <FieldError id={id('correo-error')} message={errors.correo} />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={id('mensaje')} className="block text-sm font-semibold text-ink">
              {fieldLabels.mensaje}
            </label>
            <span id={id('mensaje-count')} className="text-xs text-muted">
              {messageLength}/{CONTACT_LIMITS.mensaje.max}
            </span>
          </div>
          <textarea
            ref={(element) => {
              if (element) fieldRefs.current.mensaje = element;
            }}
            id={id('mensaje')}
            name="mensaje"
            rows={5}
            required
            maxLength={CONTACT_LIMITS.mensaje.max}
            value={values.mensaje}
            onChange={handleChange}
            onBlur={() => handleBlur('mensaje')}
            aria-invalid={errors.mensaje ? true : undefined}
            aria-describedby={cx(
              id('mensaje-count'),
              errors.mensaje ? id('mensaje-error') : undefined,
            )}
            className={cx(inputClass, 'mt-2 resize-y')}
          />
          <FieldError id={id('mensaje-error')} message={errors.mensaje} />
        </div>
      </div>

      {/* Honeypot: invisible para personas y lectores de pantalla; los bots suelen llenarlo. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id('website')}>No llenes este campo</label>
        <input
          id={id('website')}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={handleChange}
        />
      </div>

      {status === 'error' && failure && (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="mt-6 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-200 focus:outline-none"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold">No pudimos enviar tu mensaje.</p>
            <p className="mt-1">{failureMessages[failure]}</p>
            {failure !== 'validation' && (
              <p className="mt-2">
                Puedes intentarlo de nuevo o{' '}
                <a
                  href={buildMailtoHref(values, fallbackEmail)}
                  className="inline-flex items-center gap-1 font-semibold text-red-900 underline underline-offset-2"
                >
                  <Mail aria-hidden="true" className="size-4" />
                  escribirnos directamente a {fallbackEmail}
                </a>
                .
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSending}
          className={cx(buttonClass('primary', 'lg'), 'w-full sm:w-auto')}
        >
          {isSending ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Send aria-hidden="true" className="size-5" />
              Enviar mensaje
            </>
          )}
        </button>
        <p aria-live="polite" className="text-sm text-muted">
          {isSending && isSlow
            ? 'El servidor se está activando; puede tardar unos segundos más.'
            : ''}
        </p>
      </div>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm font-medium text-red-700">
      {message}
    </p>
  );
}
