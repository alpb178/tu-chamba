// Fuente única de las empresas del Grupo CorpSC. Se consume desde la sección
// "Empresas del Grupo" (dashboard), el sidebar y el footer del panel admin.
// Debe mantenerse en paralelo con web/src/lib/empresas.ts (el monorepo no
// tiene un paquete compartido; cada app replica su propia copia por diseño).

export interface Empresa {
  slug: string;
  nombre: string;
  descripcion: string;
  url: string;
  // Captura del sitio (en /public/empresas).
  imagen: string;
  // Color de fondo mientras carga la imagen (evita un flash en blanco).
  fondo: string;
}

// CorpSC es la matriz (dominio confirmado en la config de CORS del backend).
export const EMPRESAS: Empresa[] = [
  {
    slug: 'corpsc',
    nombre: 'CorpSC',
    descripcion:
      'Estudio de software boliviano: plataformas web, apps móviles y SaaS a medida.',
    url: 'https://corpsc.com',
    imagen: '/empresas/corpsc.jpg',
    fondo: '#102136',
  },
  {
    slug: 'dando-muela',
    nombre: 'Dando Muela',
    descripcion:
      'App boliviana para conectar con personas. Descárgala y empieza a chatear.',
    url: 'https://dandomuela.com',
    imagen: '/empresas/dando-muela.jpg',
    fondo: '#111827',
  },
  {
    slug: 'iris-natural',
    nombre: 'Iris Natural',
    descripcion:
      'Cosmética natural hecha en Santa Cruz de la Sierra para cuidar tu piel.',
    url: 'https://irisnatural.corpsc.com',
    imagen: '/empresas/iris-natural.jpg',
    fondo: '#fce7f3',
  },
];

// Acceso destacado a la matriz (sidebar y footer).
export const CORPSC = EMPRESAS[0];
