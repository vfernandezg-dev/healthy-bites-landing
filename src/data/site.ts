/**
 * Contenido de la landing: única fuente de verdad para textos y datos.
 * Los componentes solo presentan esta información.
 *
 * Las funcionalidades descritas aquí existen en healthy-bites-api; si cambian,
 * actualiza este archivo para no prometer algo que la plataforma no hace.
 */
import type { ImageMetadata } from 'astro';
import {
  BookOpen,
  CalendarCheck,
  Flame,
  HeartHandshake,
  Leaf,
  Salad,
  SlidersHorizontal,
  Target,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';

import alessiaAguilar from '@/assets/team/alessia-aguilar.jpeg';
import camilaMoreno from '@/assets/team/camila-moreno.jpg';
import jhonattanChavez from '@/assets/team/jhonattan-chavez.jpg';
import renzoLavado from '@/assets/team/renzo-lavado.jpg';
import valentinFernandez from '@/assets/team/valentin-fernandez.png';

export const site = {
  name: 'Healthy Bites',
  title: 'Healthy Bites · Nutrición, hábitos y comunidad en un solo lugar',
  description:
    'Planes alimenticios creados por nutricionistas, contenido confiable y seguimiento de hábitos para que comas mejor y avances a tu ritmo.',
  locale: 'es_PE',
  email: 'healtybite3@gmail.com',
  location: 'Trujillo, Perú',
} as const;

export const repositories = [
  { label: 'Landing page', href: 'https://github.com/vfernandezg-dev/healthy-bites-landing' },
  { label: 'Aplicación web', href: 'https://github.com/vfernandezg-dev/healthy-web-app' },
  { label: 'API REST', href: 'https://github.com/vfernandezg-dev/healthy-bites-api' },
] as const;

export interface NavLink {
  id: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { id: 'funciones', label: 'Funciones' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'equipo', label: 'Equipo' },
  { id: 'faq', label: 'Preguntas' },
  { id: 'contacto', label: 'Contacto' },
];

export const heroHighlights = [
  'Plan Básico gratuito',
  'Planes creados por nutricionistas',
  'Seguimiento diario de hábitos',
] as const;

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    icon: BookOpen,
    title: 'Contenido de expertos',
    description:
      'Videos, artículos y guías de nutrición elaborados por nutricionistas para que decidas con información confiable.',
  },
  {
    icon: Salad,
    title: 'Planes alimenticios',
    description:
      'Planes con comidas organizadas por día según tu objetivo: déficit calórico, mantener tu peso o ganar masa muscular.',
  },
  {
    icon: CalendarCheck,
    title: 'Seguimiento de hábitos',
    description:
      'Registra tu hidratación, alimentación, ejercicio y calidad de sueño, y descubre cómo evolucionan tus rutinas.',
  },
  {
    icon: Target,
    title: 'Metas y progreso',
    description:
      'Define tu peso objetivo, registra tus avances y mantén a la vista lo que has logrado.',
  },
  {
    icon: Flame,
    title: 'Rachas y recompensas',
    description:
      'Cada día que registras tus hábitos suma a tu racha y te acerca a desbloquear contenido y planes exclusivos.',
  },
  {
    icon: Users,
    title: 'Comunidad',
    description:
      'Únete a grupos de interés, comparte publicaciones y comenta los avances de otras personas con tus mismas metas.',
  },
];

export interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const steps: Step[] = [
  {
    icon: UserPlus,
    title: 'Crea tu cuenta',
    description: 'Regístrate gratis en minutos y empieza con el plan Básico.',
  },
  {
    icon: Target,
    title: 'Define tu objetivo',
    description:
      'Elige un plan alimenticio según tu meta y configura los hábitos que quieres mejorar.',
  },
  {
    icon: Flame,
    title: 'Registra y avanza',
    description:
      'Marca tus hábitos cada día, sigue tu progreso y desbloquea recompensas con tus rachas.',
  },
];

export const aboutPillars: Feature[] = [
  {
    icon: Leaf,
    title: 'Nutrición con fundamento',
    description: 'Contenido y planes elaborados por nutricionistas, no por tendencias.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Hecho a tu medida',
    description: 'Planes según tu objetivo y seguimiento de tus propios hábitos y metas.',
  },
  {
    icon: HeartHandshake,
    title: 'Comunidad que motiva',
    description: 'Grupos donde compartir avances y apoyarse en el camino.',
  },
];

/** Datos verificables de la plataforma (no son métricas de marketing). */
export const platformFacts = [
  { value: '3', label: 'objetivos de plan alimenticio' },
  { value: '4', label: 'hábitos diarios que puedes medir' },
  { value: '3', label: 'formatos de contenido: video, artículo y guía' },
] as const;

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

/** Testimonios ilustrativos: la página lo indica explícitamente (proyecto académico). */
export const testimonials: Testimonial[] = [
  {
    quote:
      'Gracias a Healthy Bites aprendí a llevar una alimentación balanceada que de verdad se adapta a mi estilo de vida. El plan es fácil de seguir.',
    name: 'Juan Martínez',
    role: 'Cliente',
  },
  {
    quote:
      'Puedo publicar mis planes alimenticios y mi contenido en un solo lugar, y ver cómo las personas los aprovechan día a día.',
    name: 'Mariana Torres',
    role: 'Nutricionista',
  },
  {
    quote:
      'Unirme a un grupo de interés fue la mejor motivación. Compartir avances con personas con las mismas metas me mantiene constante.',
    name: 'Carlos Méndez',
    role: 'Cliente',
  },
];

export interface TeamMember {
  name: string;
  role: string;
  focus: string;
  photo: ImageMetadata;
}

export const team: TeamMember[] = [
  {
    name: 'Valentin Fernandez',
    role: 'Full Stack Developer',
    focus: 'Backend, frontend y funcionalidades principales.',
    photo: valentinFernandez,
  },
  {
    name: 'Camila Moreno',
    role: 'UI/UX Designer',
    focus: 'Prototipos de interfaces y apoyo en frontend.',
    photo: camilaMoreno,
  },
  {
    name: 'Alessia Aguilar',
    role: 'Backend Developer',
    focus: 'Validación de funcionalidades.',
    photo: alessiaAguilar,
  },
  {
    name: 'Jhonattan Chavez',
    role: 'UI Designer',
    focus: 'Diseño de interfaces.',
    photo: jhonattanChavez,
  },
  {
    name: 'Renzo Lavado',
    role: 'UI Designer',
    focus: 'Diseño de la landing page.',
    photo: renzoLavado,
  },
];

export interface Faq {
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    question: '¿Healthy Bites es gratis?',
    answer:
      'Sí. Puedes crear tu cuenta y usar el plan Básico sin costo, con acceso al contenido gratuito. Los planes Premium y VIP desbloquean contenido y planes alimenticios exclusivos.',
  },
  {
    question: '¿Quién crea los planes alimenticios y el contenido?',
    answer:
      'Nutricionistas registrados en la plataforma. Cada plan está pensado para un objetivo concreto: déficit calórico, mantenimiento de peso o aumento de masa muscular.',
  },
  {
    question: '¿Necesito instalar algo?',
    answer:
      'No. Healthy Bites es una aplicación web: entras desde el navegador de tu computadora o de tu celular.',
  },
  {
    question: '¿Qué puedo registrar en la plataforma?',
    answer:
      'Tus hábitos diarios (hidratación, alimentación, ejercicio y calidad de sueño), tus metas de peso y el seguimiento de tu progreso.',
  },
  {
    question: '¿Cómo funcionan las rachas y recompensas?',
    answer:
      'Eliges una recompensa y registras tus hábitos cada día para sumar a tu racha. Cuando completas los días requeridos, la recompensa se desbloquea: puede ser contenido o un plan alimenticio exclusivo.',
  },
  {
    question: '¿Cómo se pagan las suscripciones?',
    answer:
      'Los pagos de los planes Premium y VIP se procesan de forma segura con PayPal, directamente desde tu perfil en la aplicación.',
  },
];
