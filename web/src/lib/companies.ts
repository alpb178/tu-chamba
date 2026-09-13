// Fuente única de las empresas del Grupo CorpSC. Se consume desde la sección
// "Empresas del Grupo" (home), el cintillo superior, el navbar y el footer para
// mantener una sola lista editable. Tu Chamba NO se lista a sí misma: cada
// sitio del grupo enlaza solo a sus hermanos.

export interface Company {
  slug: string;
  name: string;
  description: string;
  // Descripción corta que acompaña al enlace en el cintillo (la larga no
  // entra en la franja).
  tagline: string;
  // Acento de la marca en el cintillo. No se reutiliza `background` porque
  // ese color es el de la captura (casi negro en varias marcas) y sobre el
  // azul marino de la franja el punto no se vería.
  accent: string;
  url: string;
  // Captura del sitio (en /public/empresas). Ver scripts/capturas.
  image: string;
  // Color de fondo mientras carga la imagen (evita un flash en blanco). En el
  // cintillo hace de punto de color de la marca.
  background: string;
}

// CorpSC es la matriz (dominio confirmado en la config de CORS del backend).
export const COMPANIES: Company[] = [
  {
    slug: 'corpsc',
    name: 'CorpSC',
    description:
      '¿Quieres crear tu web, aplicación o plataforma? La hacemos a tu medida.',
    tagline: 'Convertimos tus ideas en productos digitales',
    accent: '#1668e3',
    url: 'https://corpsc.com',
    image: '/empresas/corpsc-destacada.jpg',
    background: '#102136',
  },
  {
    slug: 'dando-muela',
    name: 'Dando Muela',
    description:
      'App para conectar con personas. Descárgala y empieza a chatear.',
    tagline: 'Conoce gente y chatea',
    accent: '#a78bfa',
    url: 'https://dandomuela.com',
    image: '/empresas/dando-muela-destacada.jpg',
    background: '#111827',
  },
  {
    slug: 'iris-natural',
    name: 'Iris Natural',
    description: 'Tienda de productos naturales.',
    tagline: 'Productos naturales',
    accent: '#f9a8d4',
    url: 'https://irisnatural.corpsc.com',
    image: '/empresas/iris-natural-destacada.jpg',
    background: '#fce7f3',
  },
  {
    slug: 'invoices',
    name: 'Invoices',
    description:
      'Portal para generar y gestionar tus facturas de forma rápida y sencilla.',
    tagline: 'Factura en PDF en minutos',
    accent: '#2dd4bf',
    url: 'https://invoices.corpsc.com/',
    image: '/empresas/invoices-destacada.png',
    background: '#0f766e',
  },
];

// Acceso destacado a la matriz (navbar y footer).
export const CORPSC = COMPANIES[0];
