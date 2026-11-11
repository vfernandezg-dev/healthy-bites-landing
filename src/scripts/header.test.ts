import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { initHeader } from './header';

const markup = `
  <header data-site-header>
    <a href="/#funciones" data-nav-link="funciones">Funciones</a>
    <button type="button" data-menu-toggle aria-expanded="false" aria-controls="menu">Menú</button>
    <div id="menu" data-menu-panel hidden>
      <a href="/#funciones" data-nav-link="funciones">Funciones</a>
      <a href="/#contacto" data-nav-link="contacto">Contacto</a>
    </div>
  </header>
  <main>
    <section id="funciones"></section>
    <section id="contacto"></section>
  </main>
`;

describe('initHeader', () => {
  let header: HTMLElement;
  let toggle: HTMLButtonElement;
  let panel: HTMLElement;
  let destroy: () => void;

  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    document.body.innerHTML = markup;
    header = document.querySelector('[data-site-header]')!;
    toggle = header.querySelector('[data-menu-toggle]')!;
    panel = header.querySelector('[data-menu-panel]')!;
    destroy = initHeader(header);
  });

  afterEach(() => {
    destroy();
    document.body.innerHTML = '';
  });

  it('abre el menú, actualiza aria-expanded y enfoca el primer enlace', () => {
    toggle.click();

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel.hidden).toBe(false);
    expect(panel.querySelector('a')).toHaveFocus();
    expect(header.dataset.solid).toBe('true');
  });

  it('cierra con Escape y devuelve el foco al botón', () => {
    toggle.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel.hidden).toBe(true);
    expect(toggle).toHaveFocus();
  });

  it('cierra el menú al elegir una sección', () => {
    toggle.click();
    panel.querySelector<HTMLAnchorElement>('[data-nav-link="contacto"]')!.click();

    expect(panel.hidden).toBe(true);
  });

  it('cierra el menú al hacer clic fuera del header', () => {
    toggle.click();
    document.querySelector('main')!.click();

    expect(panel.hidden).toBe(true);
  });

  it('el header es transparente arriba de la página', () => {
    expect(header.dataset.solid).toBe('false');
  });
});
