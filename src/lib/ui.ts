/** Une clases condicionales ignorando valores falsy. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'outlineInverse';
type ButtonSize = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70';

const sizes: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 focus-visible:outline-brand-700',
  secondary:
    'bg-white text-brand-800 ring-1 ring-brand-900/15 ring-inset hover:bg-brand-50 hover:ring-brand-900/25',
  ghost: 'text-brand-800 hover:bg-brand-50',
  inverse: 'bg-white text-brand-900 hover:bg-mint focus-visible:outline-white',
  outlineInverse:
    'text-white ring-1 ring-white/40 ring-inset hover:bg-white/10 focus-visible:outline-white',
};

/** Clases de botón compartidas por componentes Astro y React (enlaces o <button>). */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cx(base, sizes[size], variants[variant]);
}
