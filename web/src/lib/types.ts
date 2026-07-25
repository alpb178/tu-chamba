export type JobType =
  | 'DIARIA'
  | 'TIEMPO_COMPLETO'
  | 'MEDIA_JORNADA'
  | 'POR_CONTRATO'
  | 'PASANTIA'
  | 'FREELANCE'
  | 'A_CONVENIR';

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  DIARIA: 'Diaria',
  TIEMPO_COMPLETO: 'Tiempo completo',
  MEDIA_JORNADA: 'Media jornada',
  POR_CONTRATO: 'Por contrato',
  PASANTIA: 'Pasantía',
  FREELANCE: 'Freelance',
  A_CONVENIR: 'A convenir',
};

export type Department =
  | 'LA_PAZ'
  | 'SANTA_CRUZ'
  | 'COCHABAMBA'
  | 'ORURO'
  | 'POTOSI'
  | 'CHUQUISACA'
  | 'TARIJA'
  | 'BENI'
  | 'PANDO';

export const DEPARTMENT_LABEL: Record<Department, string> = {
  LA_PAZ: 'La Paz',
  SANTA_CRUZ: 'Santa Cruz',
  COCHABAMBA: 'Cochabamba',
  ORURO: 'Oruro',
  POTOSI: 'Potosí',
  CHUQUISACA: 'Chuquisaca',
  TARIJA: 'Tarija',
  BENI: 'Beni',
  PANDO: 'Pando',
};

// Slugs para las URLs SEO por departamento (/jobs/[slug]).
export const DEPARTMENT_SLUG: Record<Department, string> = {
  LA_PAZ: 'la-paz',
  SANTA_CRUZ: 'santa-cruz',
  COCHABAMBA: 'cochabamba',
  ORURO: 'oruro',
  POTOSI: 'potosi',
  CHUQUISACA: 'chuquisaca',
  TARIJA: 'tarija',
  BENI: 'beni',
  PANDO: 'pando',
};

export const SLUG_TO_DEPARTMENT: Record<string, Department> = Object.fromEntries(
  Object.entries(DEPARTMENT_SLUG).map(([dep, slug]) => [slug, dep as Department]),
);

export type Category =
  | 'VENTAS'
  | 'GASTRONOMIA'
  | 'CONSTRUCCION'
  | 'LIMPIEZA'
  | 'CUIDADO_PERSONAS'
  | 'TRANSPORTE'
  | 'ADMINISTRACION'
  | 'TECNOLOGIA'
  | 'EDUCACION'
  | 'SALUD'
  | 'BELLEZA'
  | 'SEGURIDAD'
  | 'AGROPECUARIA'
  | 'MECANICA'
  | 'MARKETING_DISENO'
  | 'OTRO';

export const CATEGORY_LABEL: Record<Category, string> = {
  VENTAS: 'Ventas',
  GASTRONOMIA: 'Gastronomía',
  CONSTRUCCION: 'Construcción',
  LIMPIEZA: 'Limpieza',
  CUIDADO_PERSONAS: 'Cuidado de personas',
  TRANSPORTE: 'Transporte',
  ADMINISTRACION: 'Administración',
  TECNOLOGIA: 'Tecnología',
  EDUCACION: 'Educación',
  SALUD: 'Salud',
  BELLEZA: 'Belleza',
  SEGURIDAD: 'Seguridad',
  AGROPECUARIA: 'Agropecuaria',
  MECANICA: 'Mecánica',
  MARKETING_DISENO: 'Marketing y diseño',
  OTRO: 'Otro',
};

// DADO_DE_BAJA se persiste; VENCIDO se calcula con expiresAt (ver adEffectiveStatus).
export type AdStatus = 'ACTIVO' | 'DADO_DE_BAJA';
export type EffectiveStatus = 'ACTIVO' | 'VENCIDO' | 'DADO_DE_BAJA';

export const DURATION_DAYS = [3, 7, 15, 30];

// Tope de teléfonos adicionales por anuncio (igual que en la API).
export const MAX_EXTRA_PHONES = 4;

export type ReportReason = 'SPAM' | 'FRAUDE' | 'CONTENIDO_INAPROPIADO' | 'OTRO';

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  SPAM: 'Spam',
  FRAUDE: 'Fraude / estafa',
  CONTENIDO_INAPROPIADO: 'Contenido inapropiado',
  OTRO: 'Otro',
};

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  phone: string | null;
  // Único distintivo entre usuarios: acceso al panel de administración.
  isAdmin: boolean;
  // false en cuentas creadas con Google (sin contraseña local).
  hasPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  requirements?: string | null;
  location?: string | null;
  // Referencia en texto libre ("frente al mercado Los Pozos"): solo se muestra,
  // no se filtra. Como el teléfono, requiere sesión para verla.
  locationReference?: string | null;
  department?: Department | null;
  category?: Category | null;
  latitude?: number | null;
  longitude?: number | null;
  schedule?: string | null;
  // Nulo = salario a convenir (p. ej. anuncios importados por CSV sin salario).
  // Con salaryMax el par es un rango; salary es siempre el extremo inferior.
  salary?: string | number | null;
  salaryMax?: string | number | null;
  phone: string;
  // Números de contacto adicionales (los avisos suelen publicar dos o tres).
  extraPhones?: string[];
  jobType: JobType;
  status: AdStatus;
  durationDays: number;
  expiresAt: string;
  createdById: string;
  // emailVerified alimenta el badge "Verificado" (señal de confianza).
  createdBy?: { id: string; name: string; email: string; emailVerified?: boolean };
  // Calificación del publicante; el backend la adjunta en los listados.
  ownerRating?: { average: number | null; count: number };
  // Accesos e interesados; el backend los adjunta en detalle y /listings/mine.
  _count?: { visits: number; interests: number };
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  authorId: string;
  ownerId: string;
  // Nulo si el anuncio reseñado ya fue eliminado (la reseña se conserva).
  adId: string | null;
  author?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// Interés propio en un anuncio ajeno (se registra al contactar).
export interface Interest {
  id: string;
  adId: string;
  createdAt: string;
  ad: Ad;
}

export interface ReviewsResponse extends Paginated<Review> {
  average: number | null;
  // Con sesión y adId en la consulta: si el usuario ya calificó ese anuncio.
  alreadyReviewed?: boolean;
}

export type NotificationType =
  | 'CHAT_INICIADO'
  | 'NUEVA_REVIEW'
  | 'ANUNCIO_VENCIDO'
  | 'NUEVO_ANUNCIO';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  adId?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: AppNotification[];
  unread: number;
}

export interface JobAlert {
  id: string;
  department: Department | null;
  category: Category | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Conteos por opción para la barra de filtros (endpoint /listings/facets).
export interface Facets {
  total: number;
  jobType: Partial<Record<JobType, number>>;
  department: Partial<Record<Department, number>>;
  category: Partial<Record<Category, number>>;
  salaryMin: number;
  salaryMax: number;
}

// Estado efectivo de un anuncio: un ACTIVO con expiresAt en el pasado está VENCIDO.
export function adEffectiveStatus(a: Pick<Ad, 'status' | 'expiresAt'>): EffectiveStatus {
  if (a.status === 'DADO_DE_BAJA') return 'DADO_DE_BAJA';
  return new Date(a.expiresAt).getTime() > Date.now() ? 'ACTIVO' : 'VENCIDO';
}

export const STATUS_LABEL: Record<EffectiveStatus, string> = {
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  DADO_DE_BAJA: 'Dado de baja',
};

// Destino tras iniciar sesión o registrarse (?next=): solo rutas internas,
// para no servir de redirección abierta.
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

// Sueldo del anuncio como texto: monto fijo, rango ("Bs 3.500 a 4.500") o
// "A convenir" cuando no hay salario. Única fuente para tarjetas y detalle.
export function salaryLabel(
  ad: Pick<Ad, 'salary' | 'salaryMax'>,
  fallback = 'A convenir',
) {
  const amount = (v: Ad['salary']) =>
    v != null && v !== '' ? Number(v) : null;
  const min = amount(ad.salary);
  if (min == null || !Number.isFinite(min)) return fallback;
  const bs = (n: number) => n.toLocaleString('es-BO');
  const max = amount(ad.salaryMax);
  // Un techo igual al piso no es un rango, es el mismo monto.
  return max != null && Number.isFinite(max) && max > min
    ? `Bs ${bs(min)} a ${bs(max)}`
    : `Bs ${bs(min)}`;
}

// Todos los números de contacto del anuncio, sin repetidos y sin vacíos: el
// principal primero. Vacío si el anuncio llegó sin contacto (visitante anónimo).
export function adPhones(ad: Pick<Ad, 'phone' | 'extraPhones'>): string[] {
  const all = [ad.phone, ...(ad.extraPhones ?? [])]
    .map((p) => (p ?? '').trim())
    .filter(Boolean);
  return [...new Set(all)];
}

// Enlace de WhatsApp: wa.me exige el número con código de país. Los números
// nuevos llegan en E.164 (+591…); a los antiguos, de 8 dígitos locales, se
// les antepone el 591 de Bolivia.
export function waLink(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, '');
  const number =
    phone.startsWith('+') || digits.startsWith('591') || digits.length > 8
      ? digits
      : `591${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${number}${text}`;
}
