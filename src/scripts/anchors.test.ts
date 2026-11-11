import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { initCleanAnchors } from './anchors';

const markup = `
  <nav>
    <a id="interno" href="/#faq">Preguntas</a>
    <a id="relativo" href="#faq">Preguntas (relativo)</a>
    <a id="otra-pagina" href="/otra/#faq">Otra página</a>
    <a id="externo" href="https://example.com/#faq">Externo</a>
    <a id="nueva-pestana" href="/#faq" target="_blank">Nueva pestaña</a>
    <a id="sin-destino" href="/#no-existe">Sin destino</a>
  </nav>
  <section id="faq"><h2>Preguntas frecuentes</h2></section>
`;

function click(id: string, init: MouseEventInit = {}) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  document.getElementById(id)!.dispatchEvent(event);
  return event;
}

describe('initCleanAnchors', () => {
  let scrollIntoView: ReturnType<typeof vi.fn>;
  let destroy: () => void;

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView as unknown as Element['scrollIntoView'];
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    document.body.innerHTML = markup;
  });

  afterEach(() => {
    destroy?.();
    document.body.innerHTML = '';
  });

  it('desplaza a la sección sin añadir "#" a la URL y mueve el foco', () => {
    destroy = initCleanAnchors();
    const event = click('interno');

    expect(event.defaultPrevented).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(window.location.hash).toBe('');
    expect(document.getElementById('faq')).toHaveFocus();
  });

  it('también funciona con enlaces relativos (#faq)', () => {
    destroy = initCleanAnchors();
    expect(click('relativo').defaultPrevented).toBe(true);
  });

  it('respeta prefers-reduced-motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    destroy = initCleanAnchors();
    click('interno');

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  /** Cancela la navegación real después de nuestro listener (jsdom no puede cambiar de documento). */
  function blockNavigation() {
    let handledByAnchors = false;
    window.addEventListener(
      'click',
      (event) => {
        handledByAnchors = event.defaultPrevented;
        event.preventDefault();
      },
      { once: true },
    );
    return () => handledByAnchors;
  }

  it.each(['otra-pagina', 'externo', 'nueva-pestana', 'sin-destino'])(
    'no intercepta el enlace "%s"',
    (id) => {
      destroy = initCleanAnchors();
      const wasHandled = blockNavigation();
      click(id);

      expect(wasHandled()).toBe(false);
      expect(scrollIntoView).not.toHaveBeenCalled();
    },
  );

  it('no intercepta clics con teclas modificadoras (abrir en otra pestaña)', () => {
    destroy = initCleanAnchors();
    const wasHandled = blockNavigation();
    click('interno', { ctrlKey: true });

    expect(wasHandled()).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('limpia la URL al llegar con "#seccion"', () => {
    window.history.replaceState(null, '', '/#faq');
    destroy = initCleanAnchors();

    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/');
  });

  it('no toca la URL si el "#" no corresponde a una sección', () => {
    window.history.replaceState(null, '', '/#otra-cosa');
    destroy = initCleanAnchors();

    expect(window.location.hash).toBe('#otra-cosa');
  });
});
