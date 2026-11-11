/**
 * Navegación entre secciones sin "#…" en la URL.
 *
 * - Clic en un enlace a una sección de esta misma página: desplazamiento suave hasta ella
 *   sin modificar la URL ni el historial. El foco se mueve a la sección, como haría la
 *   navegación nativa por ancla, para que el teclado y los lectores de pantalla continúen ahí.
 * - Llegada con "#…" (enlace compartido o desde la página 404): el navegador desplaza la página
 *   a la sección de forma nativa y, al terminar la carga, se limpia la URL.
 *
 * Los enlaces abiertos con Ctrl/Cmd/Shift/Alt, el botón central o en otra pestaña conservan el
 * comportamiento nativo.
 */

function sectionFromHash(doc: Document, hash: string): HTMLElement | null {
  if (hash.length < 2) return null;
  return doc.getElementById(decodeURIComponent(hash.slice(1)));
}

function scrollToSection(target: HTMLElement, win: Window): void {
  const reduceMotion = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

export function initCleanAnchors(doc: Document = document): () => void {
  const win = doc.defaultView;
  if (!win) return () => {};

  const onClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;

    const url = new URL(link.href, win.location.href);
    const samePage =
      url.origin === win.location.origin &&
      url.pathname === win.location.pathname &&
      url.search === win.location.search;
    if (!samePage) return; // Otra página (p. ej. desde la 404): navegación normal.

    const target = sectionFromHash(doc, url.hash);
    if (!target) return;

    event.preventDefault();
    scrollToSection(target, win);
  };

  doc.addEventListener('click', onClick);

  // Llegada con "#…": el navegador desplaza la página hasta la sección mientras carga (y la
  // reajusta si cambia el layout). Por eso la URL se limpia solo cuando la carga terminó:
  // hacerlo antes cancelaría ese desplazamiento nativo.
  if (sectionFromHash(doc, win.location.hash)) {
    const cleanUrl = () =>
      win.history.replaceState(win.history.state, '', win.location.pathname + win.location.search);
    if (doc.readyState === 'complete') cleanUrl();
    else win.addEventListener('load', cleanUrl, { once: true });
  }

  return () => doc.removeEventListener('click', onClick);
}
