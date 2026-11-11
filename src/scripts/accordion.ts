/**
 * Acordeón animado sobre <details>/<summary> nativos.
 *
 * Abre y cierra con una transición de altura (Web Animations API) mientras la respuesta aparece
 * con un fundido. Es una mejora progresiva: sin JavaScript, sin soporte de `element.animate` o con
 * `prefers-reduced-motion: reduce`, se usa el comportamiento nativo (instantáneo) de <details>.
 *
 * Marcado esperado:
 *   <details data-accordion-item>
 *     <summary>Pregunta</summary>
 *     <div data-accordion-content>Respuesta</div>
 *   </details>
 *
 * Mientras se cierra, <details> conserva `open` (para que el contenido siga visible) y recibe
 * `data-closing`, de modo que los estilos (p. ej. el ícono) pueden reaccionar de inmediato.
 */

/** Apertura deliberadamente pausada; el cierre es algo más rápido para no hacer esperar. */
export const ACCORDION_OPEN_MS = 600;
export const ACCORDION_CLOSE_MS = 450;
/** Acelera y frena con suavidad (ease-in-out): el cambio de altura se percibe fluido. */
const HEIGHT_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';
/** La respuesta entra con una desaceleración larga, ya con el espacio abierto. */
const CONTENT_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function initAccordion(details: HTMLDetailsElement, win: Window = window): () => void {
  const summary = details.querySelector('summary');
  const content = details.querySelector<HTMLElement>('[data-accordion-content]');
  if (!summary || !content) return () => {};

  let heightAnimation: Animation | null = null;
  let contentAnimation: Animation | null = null;

  const canAnimate = () =>
    typeof details.animate === 'function' &&
    !win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const cancelRunning = () => {
    heightAnimation?.cancel();
    contentAnimation?.cancel();
    heightAnimation = null;
    contentAnimation = null;
  };

  const settle = (open: boolean) => {
    details.open = open;
    delete details.dataset.closing;
    details.style.height = '';
    details.style.overflow = '';
    cancelRunning();
  };

  const animate = (fromPx: number, toPx: number, opening: boolean) => {
    cancelRunning();
    details.style.overflow = 'hidden';

    heightAnimation = details.animate(
      { height: [`${fromPx}px`, `${toPx}px`] },
      { duration: opening ? ACCORDION_OPEN_MS : ACCORDION_CLOSE_MS, easing: HEIGHT_EASING },
    );
    contentAnimation = content.animate(
      opening
        ? { opacity: [0, 1], transform: ['translateY(-8px)', 'none'] }
        : { opacity: [1, 0], transform: ['none', 'translateY(-4px)'] },
      {
        duration: opening ? 520 : 260,
        delay: opening ? 140 : 0,
        easing: CONTENT_EASING,
        fill: 'both',
      },
    );

    const current = heightAnimation;
    current.onfinish = () => {
      // Ignora animaciones que fueron reemplazadas por un clic posterior.
      if (heightAnimation === current) settle(opening);
    };
  };

  const onClick = (event: Event) => {
    if (!canAnimate()) return; // Comportamiento nativo.
    event.preventDefault();

    const startHeight = details.offsetHeight;
    const isClosing = details.dataset.closing !== undefined;

    if (details.open && !isClosing) {
      details.dataset.closing = '';
      animate(startHeight, summary.offsetHeight, false);
      return;
    }

    // Abrir (o revertir un cierre en curso): se fija la altura actual, se abre y se anima
    // hasta la altura natural de pregunta + respuesta.
    delete details.dataset.closing;
    details.style.height = `${startHeight}px`;
    details.open = true;
    animate(startHeight, summary.offsetHeight + content.offsetHeight, true);
  };

  summary.addEventListener('click', onClick);
  return () => {
    summary.removeEventListener('click', onClick);
    cancelRunning();
  };
}

export function initAccordions(root: ParentNode = document): () => void {
  const cleanups = Array.from(
    root.querySelectorAll<HTMLDetailsElement>('details[data-accordion-item]'),
  ).map((details) => initAccordion(details));
  return () => cleanups.forEach((cleanup) => cleanup());
}
