// Fuente única de las empresas del Grupo CorpSC. Se consume desde la sección
// "Empresas del Grupo" (dashboard), el sidebar y el footer del panel admin.
// Debe mantenerse en paralelo con web/src/lib/companies.ts (el monorepo no
// tiene un paquete compartido; cada app replica su propia copia por diseño).

export interface Company {
  slug: string;
  name: string;
  description: string;
  url: string;
  // Captura del sitio (en /public/empresas).
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
    image: '/empresas/corpsc.jpg',
    background: '#102136',
  },
  {
    slug: 'dando-muela',
    name: 'Dando Muela',
    description:
      'App boliviana para conectar con personas. Descárgala y empieza a chatear.',
    url: 'https://dandomuela.com',
    image: '/empresas/dando-muela.jpg',
    background: '#111827',
  },
  {
    slug: 'iris-natural',
    name: 'Iris Natural',
    description:
      'Cosmética natural hecha en Santa Cruz de la Sierra para cuidar tu piel.',
    url: 'https://irisnatural.corpsc.com',
    image: '/empresas/iris-natural.jpg',
    background: '#fce7f3',
  },
];

// Acceso destacado a la matriz (sidebar y footer).
export const CORPSC = COMPANIES[0];
