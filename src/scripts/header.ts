/**
 * Comportamiento del header (sin framework, ~2 KB):
 * - fondo sólido al hacer scroll o con el menú abierto,
 * - menú móvil accesible (aria-expanded, Escape, foco, cierre al pasar a escritorio),
 * - scroll-spy: marca con aria-current la sección visible.
 */

const DESKTOP_QUERY = '(min-width: 1024px)';
const SOLID_SCROLL_OFFSET = 8;

export function initHeader(header: HTMLElement, win: Window = window): () => void {
  const doc = win.document;
  const toggle = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = header.querySelector<HTMLElement>('[data-menu-panel]');
  const navLinks = Array.from(header.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
  const cleanups: Array<() => void> = [];
  let isOpen = false;

  const listen = (
    target: Window | Document | HTMLElement | MediaQueryList,
    type: string,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions,
  ) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };

  const updateSolid = () => {
    header.dataset.solid = String(isOpen || win.scrollY > SOLID_SCROLL_OFFSET);
  };

  const setOpen = (open: boolean, { returnFocus = false } = {}) => {
    if (!toggle || !panel) return;
    isOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    updateSolid();
    if (open) panel.querySelector<HTMLElement>('a, button')?.focus();
    else if (returnFocus) toggle.focus();
  };

  if (toggle && panel) {
    listen(toggle, 'click', () => setOpen(!isOpen));
    listen(panel, 'click', (event) => {
      if ((event.target as Element | null)?.closest('a')) setOpen(false);
    });
    listen(doc, 'keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Escape' && isOpen)
        setOpen(false, { returnFocus: true });
    });
    listen(doc, 'click', (event) => {
      if (isOpen && !header.contains(event.target as Node)) setOpen(false);
    });
    const desktop = win.matchMedia(DESKTOP_QUERY);
    listen(desktop, 'change', (event) => {
      if ((event as MediaQueryListEvent).matches && isOpen) setOpen(false);
    });
  }

  listen(win, 'scroll', updateSolid, { passive: true });
  updateSolid();

  // Scroll-spy
  const setActive = (id: string | null) => {
    for (const link of navLinks) {
      if (link.dataset.navLink === id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  };

  const ids = [...new Set(navLinks.map((link) => link.dataset.navLink))];
  const sections = ids
    .map((id) => (id ? doc.getElementById(id) : null))
    .filter((section): section is HTMLElement => section !== null);

  if (sections.length > 0 && typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      // Una sección está activa cuando cruza la franja central de la ventana.
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    cleanups.push(() => observer.disconnect());

    // Por encima de la primera sección (hero) ningún enlace queda activo.
    const firstSection = sections[0]!;
    listen(
      win,
      'scroll',
      () => {
        if (win.scrollY + win.innerHeight * 0.5 < firstSection.offsetTop) setActive(null);
      },
      { passive: true },
    );
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}
