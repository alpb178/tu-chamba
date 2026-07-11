export type JobType = 'DIARIA' | 'TIEMPO_COMPLETO' | 'MEDIA_JORNADA';

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  DIARIA: 'Diaria',
  TIEMPO_COMPLETO: 'Tiempo completo',
  MEDIA_JORNADA: 'Media jornada',
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

// Slugs para las URLs SEO por departamento (/empleos/[slug]).
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
  OTRO: 'Otro',
};

// DADO_DE_BAJA se persiste; VENCIDO se calcula con expiresAt (ver adEffectiveStatus).
export type AdStatus = 'ACTIVO' | 'DADO_DE_BAJA';
export type EffectiveStatus = 'ACTIVO' | 'VENCIDO' | 'DADO_DE_BAJA';

export const DURATION_DAYS = [3, 7, 15, 30];

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
  description: string;
  requirements?: string | null;
  location?: string | null;
  department?: Department | null;
  category?: Category | null;
  latitude?: number | null;
  longitude?: number | null;
  schedule?: string | null;
  salary: string | number;
  phone: string;
  jobType: JobType;
  status: AdStatus;
  durationDays: number;
  expiresAt: string;
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  // Calificación del publicante; el backend la adjunta en los listados.
  ownerRating?: { average: number | null; count: number };
  // Accesos e interesados; el backend los adjunta en detalle y /ads/mine.
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
  adId: string;
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

// Conteos por opción para la barra de filtros (endpoint /ads/facets).
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
