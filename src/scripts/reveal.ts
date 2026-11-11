/**
 * Aparición progresiva de los bloques marcados con [data-reveal] (estilos en global.css).
 * La clase .reveal-ready se añade aquí: si este script no se ejecuta, nada queda oculto.
 */
export function initReveal(root: Document = document): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};

  root.documentElement.classList.add('reveal-ready');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  root.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
  return () => observer.disconnect();
}
