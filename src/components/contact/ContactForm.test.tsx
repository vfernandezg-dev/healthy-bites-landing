import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ContactForm from './ContactForm';

const API_URL = 'https://api.example.com/api/v1';

function renderForm() {
  const user = userEvent.setup();
  render(<ContactForm apiUrl={API_URL} fallbackEmail="hola@healthybites.test" />);
  return { user };
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre'), 'Ana');
  await user.type(screen.getByLabelText('Apellido'), 'Torres');
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
  await user.type(screen.getByLabelText('Mensaje'), 'Quisiera más información sobre los planes.');
}

describe('ContactForm', () => {
  it('muestra los errores y enfoca el primer campo inválido al enviar vacío', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    const nombre = screen.getByLabelText('Nombre');
    expect(nombre).toHaveFocus();
    expect(nombre).toHaveAttribute('aria-invalid', 'true');
    expect(nombre).toHaveAccessibleDescription('Ingresa tu nombre.');
    expect(screen.getByLabelText('Correo electrónico')).toHaveAccessibleDescription(
      'Ingresa tu correo electrónico.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('quita el error en cuanto el usuario corrige el campo', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    await user.type(screen.getByLabelText('Nombre'), 'Ana');

    expect(screen.getByLabelText('Nombre')).not.toHaveAttribute('aria-invalid');
  });

  it('envía el mensaje y muestra la confirmación', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const { user } = renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    const heading = await screen.findByRole('heading', { name: '¡Gracias, Ana!' });
    expect(heading).toHaveFocus();
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/contact`, expect.anything());

    await user.click(screen.getByRole('button', { name: 'Enviar otro mensaje' }));
    expect(screen.getByLabelText('Nombre')).toHaveValue('');
  });

  it('ofrece escribir por correo si el servicio no está disponible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    const { user } = renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos enviar tu mensaje.');
    const mailto = screen.getByRole('link', { name: /hola@healthybites\.test/ });
    expect(mailto.getAttribute('href')).toMatch(/^mailto:hola@healthybites\.test\?subject=/);
    // Los datos escritos se conservan para poder reintentar.
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana');
  });

  it('no envía nada adicional mientras hay un envío en curso', async () => {
    let resolveFetch: (response: Response) => void = () => {};
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (resolveFetch = resolve)));
    vi.stubGlobal('fetch', fetchMock);
    const { user } = renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    const sending = screen.getByRole('button', { name: 'Enviando…' });
    expect(sending).toBeDisabled();
    await user.click(sending);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch(new Response(null, { status: 204 }));
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });
});
