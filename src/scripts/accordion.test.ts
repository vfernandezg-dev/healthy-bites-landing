import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { initAccordion } from './accordion';

/** Animación simulada: jsdom no implementa la Web Animations API. */
interface FakeAnimation {
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null;
  onfinish: ((this: Animation, ev: AnimationPlaybackEvent) => unknown) | null;
  cancel: ReturnType<typeof vi.fn>;
  finish: () => void;
}

const markup = `
  <details data-accordion-item>
    <summary>¿Healthy Bites es gratis?</summary>
    <div data-accordion-content><p>Sí, con el plan Básico.</p></div>
  </details>
`;

function setReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

describe('initAccordion', () => {
  let details: HTMLDetailsElement;
  let summary: HTMLElement;
  let animations: FakeAnimation[];
  let destroy: () => void;

  beforeEach(() => {
    animations = [];
    Element.prototype.animate = vi.fn(function (keyframes) {
      const animation: FakeAnimation = {
        keyframes,
        onfinish: null,
        cancel: vi.fn(),
        finish() {
          this.onfinish?.call(this as unknown as Animation, {} as AnimationPlaybackEvent);
        },
      };
      animations.push(animation);
      return animation as unknown as Animation;
    }) as unknown as Element['animate'];

    document.body.innerHTML = markup;
    details = document.querySelector('details')!;
    summary = details.querySelector('summary')!;
    const content = details.querySelector<HTMLElement>('[data-accordion-content]')!;
    // jsdom no calcula layout: se fijan alturas conocidas.
    Object.defineProperty(summary, 'offsetHeight', { configurable: true, get: () => 64 });
    Object.defineProperty(content, 'offsetHeight', { configurable: true, get: () => 96 });
    Object.defineProperty(details, 'offsetHeight', {
      configurable: true,
      get: () => (details.open ? 160 : 64),
    });

    setReducedMotion(false);
    destroy = initAccordion(details);
  });

  afterEach(() => {
    destroy();
    // @ts-expect-error limpieza del mock
    delete Element.prototype.animate;
    document.body.innerHTML = '';
  });

  const heightAnimation = () => animations.find((a) => 'height' in (a.keyframes ?? {}))!;

  it('abre con una animación de altura desde la pregunta hasta pregunta + respuesta', () => {
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    summary.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(details.open).toBe(true);
    expect(heightAnimation().keyframes).toEqual({ height: ['64px', '160px'] });
    expect(details.style.overflow).toBe('hidden');

    heightAnimation().finish();
    expect(details.open).toBe(true);
    expect(details.style.height).toBe('');
    expect(details.style.overflow).toBe('');
  });

  it('cierra animando y solo quita "open" al terminar', () => {
    details.open = true;
    summary.click();

    expect(details.dataset.closing).toBe('');
    expect(details.open).toBe(true);
    expect(heightAnimation().keyframes).toEqual({ height: ['160px', '64px'] });

    heightAnimation().finish();
    expect(details.open).toBe(false);
    expect(details.dataset.closing).toBeUndefined();
  });

  it('revierte un cierre en curso si se vuelve a hacer clic', () => {
    details.open = true;
    summary.click(); // empieza a cerrar
    const closing = heightAnimation();
    summary.click(); // se arrepiente: vuelve a abrir

    expect(closing.cancel).toHaveBeenCalled();
    expect(details.dataset.closing).toBeUndefined();
    expect(details.open).toBe(true);

    // La animación cancelada ya no puede cerrar el acordeón.
    closing.finish();
    expect(details.open).toBe(true);
  });

  it('usa el comportamiento nativo si el usuario pidió menos movimiento', () => {
    setReducedMotion(true);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    summary.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    expect(animations).toHaveLength(0);
  });

  it('usa el comportamiento nativo si el navegador no soporta element.animate', () => {
    // @ts-expect-error simula un navegador sin Web Animations API
    delete Element.prototype.animate;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    summary.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
  });
});
