// Fuente única de las empresas del Grupo CorpSC. Se consume desde la sección
// "Empresas del Grupo" (home), el navbar y el footer para mantener una sola
// lista editable. Ajustar aquí URLs/descripciones cuando se confirmen.

export interface Company {
  slug: string;
  name: string;
  description: string;
  url: string;
  // Captura del sitio (en /public/empresas). Ver scripts/capturas.
  image: string;
  // Color de fondo mientras carga la imagen (evita un flash en blanco).
  background: string;
}

// CorpSC es la matriz (dominio confirmado en la config de CORS del backend).
export const COMPANIES: Company[] = [
  {
    slug: 'corpsc',
    name: 'CorpSC',
    description:
      'Estudio de software boliviano: plataformas web, apps móviles y SaaS a medida.',
    url: 'https://corpsc.com',
    image: '/empresas/corpsc-destacada.jpg',
    background: '#102136',
  },
  {
    slug: 'dando-muela',
    name: 'Dando Muela',
    description:
      'App boliviana para conectar con personas. Descárgala y empieza a chatear.',
    url: 'https://dandomuela.com',
    image: '/empresas/dando-muela-destacada.jpg',
    background: '#111827',
  },
  {
    slug: 'iris-natural',
    name: 'Iris Natural',
    description:
      'Cosmética natural hecha en Santa Cruz de la Sierra para cuidar tu piel.',
    url: 'https://irisnatural.corpsc.com',
    image: '/empresas/iris-natural-destacada.jpg',
    background: '#fce7f3',
  },
];

// Acceso destacado a la matriz (navbar y footer).
export const CORPSC = COMPANIES[0];
