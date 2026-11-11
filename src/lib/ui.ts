/** Une clases condicionales ignorando valores falsy. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'outlineInverse';
type ButtonSize = 'md' | 'lg';

const base =
  'group inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[color,background-color,box-shadow,translate] duration-300 ease-out-expo focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70';

const sizes: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

// Elevación sutil al pasar el cursor. La clase `group` del botón permite animar iconos internos
// (p. ej. la flecha con group-hover:translate-x-1).
const lift = 'hover:-translate-y-0.5 disabled:hover:translate-y-0';

const variants: Record<ButtonVariant, string> = {
  primary: cx(
    lift,
    'bg-brand-700 text-white shadow-sm hover:bg-brand-800 hover:shadow-lg hover:shadow-brand-700/25 focus-visible:outline-brand-700',
  ),
  secondary: cx(
    lift,
    'bg-white text-brand-800 ring-1 ring-brand-900/15 ring-inset hover:bg-brand-50 hover:ring-brand-900/25',
  ),
  ghost: 'text-brand-800 hover:bg-brand-50',
  inverse: cx(lift, 'bg-white text-brand-900 hover:bg-mint focus-visible:outline-white'),
  outlineInverse: cx(
    lift,
    'text-white ring-1 ring-white/40 ring-inset hover:bg-white/10 focus-visible:outline-white',
  ),
};

/** Clases de botón compartidas por componentes Astro y React (enlaces o <button>). */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cx(base, sizes[size], variants[variant]);
}
