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

// Slugs for the per-department SEO URLs (/jobs/[slug]).
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

// DADO_DE_BAJA is persisted; VENCIDO is computed from expiresAt (see adEffectiveStatus).
export type AdStatus = 'ACTIVO' | 'DADO_DE_BAJA';
export type EffectiveStatus = 'ACTIVO' | 'VENCIDO' | 'DADO_DE_BAJA';

export const DURATION_DAYS = [3, 7, 15, 30];

// Max extra phones per ad (same as in the API).
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
  // The only distinction between users: access to the admin panel.
  isAdmin: boolean;
  // false for accounts created with Google (no local password).
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
  // Free-text landmark ("frente al mercado Los Pozos"): only displayed, not
  // filtered on. Like the phone, it requires a session to see it.
  locationReference?: string | null;
  department?: Department | null;
  category?: Category | null;
  latitude?: number | null;
  longitude?: number | null;
  schedule?: string | null;
  // Null = salary "a convenir" (e.g. ads imported via CSV without a salary).
  // With salaryMax the pair is a range; salary is always the lower bound.
  salary?: string | number | null;
  salaryMax?: string | number | null;
  phone: string;
  // Extra contact numbers (listings often publish two or three).
  extraPhones?: string[];
  jobType: JobType;
  status: AdStatus;
  // Featured from the panel: the card marks it. The priority number that
  // decides the order never leaves the panel.
  featured?: boolean;
  durationDays: number;
  expiresAt: string;
  createdById: string;
  // emailVerified feeds the "Verificado" badge (trust signal).
  createdBy?: { id: string; name: string; email: string; emailVerified?: boolean };
  // The poster's rating; the backend attaches it in listings.
  ownerRating?: { average: number | null; count: number };
  // Views and interested users; the backend attaches them in detail and /listings/mine.
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
  // Null if the reviewed ad was already deleted (the review is kept).
  adId: string | null;
  author?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// The user's own interest in someone else's ad (recorded on contact).
export interface Interest {
  id: string;
  adId: string;
  createdAt: string;
  ad: Ad;
}

export interface ReviewsResponse extends Paginated<Review> {
  average: number | null;
  // With a session and adId in the query: whether the user already rated that ad.
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

// Per-option counts for the filter bar (endpoint /listings/facets).
export interface Facets {
  total: number;
  jobType: Partial<Record<JobType, number>>;
  department: Partial<Record<Department, number>>;
  category: Partial<Record<Category, number>>;
  salaryMin: number;
  salaryMax: number;
}

// An ad's effective status: an ACTIVO ad with expiresAt in the past is VENCIDO.
export function adEffectiveStatus(a: Pick<Ad, 'status' | 'expiresAt'>): EffectiveStatus {
  if (a.status === 'DADO_DE_BAJA') return 'DADO_DE_BAJA';
  return new Date(a.expiresAt).getTime() > Date.now() ? 'ACTIVO' : 'VENCIDO';
}

export const STATUS_LABEL: Record<EffectiveStatus, string> = {
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  DADO_DE_BAJA: 'Dado de baja',
};

// Destination after signing in or registering (?next=): internal routes only,
// so it can't be used as an open redirect.
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

// The ad's salary as text: fixed amount, range ("Bs 3.500 a 4.500") or
// "A convenir" when there is no salary. Single source for cards and detail.
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
  // A ceiling equal to the floor is not a range, it's the same amount.
  return max != null && Number.isFinite(max) && max > min
    ? `Bs ${bs(min)} a ${bs(max)}`
    : `Bs ${bs(min)}`;
}

// All of the ad's contact numbers, without duplicates or blanks: the main one
// first. Empty if the ad came without contact info (anonymous visitor).
export function adPhones(ad: Pick<Ad, 'phone' | 'extraPhones'>): string[] {
  const all = [ad.phone, ...(ad.extraPhones ?? [])]
    .map((p) => (p ?? '').trim())
    .filter(Boolean);
  return [...new Set(all)];
}

// WhatsApp link: wa.me requires the number with country code. New numbers
// arrive in E.164 (+591…); old ones, with 8 local digits, get Bolivia's 591
// prepended.
export function waLink(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, '');
  const number =
    phone.startsWith('+') || digits.startsWith('591') || digits.length > 8
      ? digits
      : `591${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${number}${text}`;
}
