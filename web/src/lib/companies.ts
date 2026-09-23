// Single source of the CorpSC Group companies. Consumed by the "Empresas del
// Grupo" section (home), the top strip, the navbar and the footer to keep a
// single editable list. Tu Chamba does NOT list itself: each site in the group
// links only to its siblings.

export interface Company {
  slug: string;
  name: string;
  description: string;
  // Short description that goes with the link in the top strip (the long one
  // doesn't fit in the strip).
  tagline: string;
  // Brand accent in the top strip. `background` isn't reused because that
  // color is the screenshot's (almost black for several brands) and the dot
  // wouldn't be visible on the strip's navy blue.
  accent: string;
  url: string;
  // Site screenshot (in /public/empresas). See scripts/capturas.
  image: string;
  // Background color while the image loads (avoids a white flash). In the
  // top strip it serves as the brand's color dot.
  background: string;
}

// CorpSC is the parent company (domain confirmed in the backend's CORS config).
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

// Featured link to the parent company (navbar and footer).
export const CORPSC = COMPANIES[0];
