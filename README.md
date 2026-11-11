# Healthy Bites · Landing page (legacy)

> **Rama histórica, solo de referencia.** La landing actual (Astro + React + TypeScript) está en
> [`main`](https://github.com/vfernandezg-dev/healthy-bites-landing) y se publica en
> https://vfernandezg-dev.github.io/healthy-bites-landing/.

Primera versión de la landing de Healthy Bites (noviembre de 2024), una plataforma para acceder a
planes alimenticios y contenido nutricional. Proyecto académico.

## Stack

- HTML estático con [Bootstrap 5.3](https://getbootstrap.com) y [Font Awesome 6](https://fontawesome.com), ambos por CDN.
- Estilos propios en [`css/style.css`](css/style.css).
- Sin build ni dependencias: basta con abrir `index.html` en el navegador.

## Estructura

```
index.html        # Página única: navbar, hero, nosotros, servicios, testimonios, equipo, contacto, footer
css/style.css     # Estilos personalizados
assets/images/    # Logo, favicon, imágenes de secciones, equipo y testimonios
```

## Por qué se reemplazó

La versión actual corrige los problemas de esta: formulario de contacto sin envío, enlaces vacíos,
imágenes sin texto alternativo ni optimización, contenido del equipo visible solo con _hover_ y
dependencias externas por CDN. Además agrega SEO técnico, accesibilidad WCAG 2.2 AA, tests y despliegue
automatizado.
