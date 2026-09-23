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

// Allowed publication durations (in days). 3 is the default.
export const DURATION_DAYS = [3, 7, 15, 30];

// Cap for the manual priority (the same one the API validates).
export const MAX_PRIORITY = 99;

// DADO_DE_BAJA is persisted; VENCIDO is computed from expiresAt (see adEffectiveStatus).
export type AdStatus = 'ACTIVO' | 'DADO_DE_BAJA';
export type EffectiveStatus = 'ACTIVO' | 'VENCIDO' | 'DADO_DE_BAJA';

export const STATUS_LABEL: Record<EffectiveStatus, string> = {
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  DADO_DE_BAJA: 'Dado de baja',
};

export type ReportReason = 'SPAM' | 'FRAUDE' | 'CONTENIDO_INAPROPIADO' | 'OTRO';
export type ReportStatus = 'PENDIENTE' | 'ATENDIDO' | 'DESCARTADO';

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  SPAM: 'Spam',
  FRAUDE: 'Fraude / estafa',
  CONTENIDO_INAPROPIADO: 'Contenido inapropiado',
  OTRO: 'Otro',
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  PENDIENTE: 'Pendiente',
  ATENDIDO: 'Atendido',
  DESCARTADO: 'Descartado',
};

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  // The only distinction between users: access to this panel.
  isAdmin: boolean;
  // Sign-up method: 'google' (no local password) or 'email'. The backend
  // derives it from googleId; only 'email' accounts can change the password.
  provider?: 'google' | 'email';
  createdAt: string;
  updatedAt: string;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  requirements?: string | null;
  location?: string | null;
  // Free-text reference ("frente al mercado Los Pozos"): display only.
  locationReference?: string | null;
  department?: Department | null;
  category?: Category | null;
  latitude?: number | null;
  longitude?: number | null;
  schedule?: string | null;
  // Null = negotiable salary (e.g. CSV-imported listings without a salary).
  // With salaryMax the pair is a range; salary is always the lower bound.
  salary?: string | number | null;
  salaryMax?: string | number | null;
  phone: string;
  // Additional contact numbers (listings often publish two or three).
  extraPhones?: string[];
  jobType: JobType;
  status: AdStatus;
  // Manual priority: the highest goes first in the portal and the panel (0 = normal).
  priority: number;
  durationDays: number;
  expiresAt: string;
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  reason: ReportReason;
  comment?: string | null;
  status: ReportStatus;
  adId: string;
  ad?: {
    id: string;
    description: string;
    status: AdStatus;
    createdBy?: { id: string; name: string; email: string };
  };
  reporter?: { id: string; name: string; email: string };
  createdAt: string;
}

export type TraceType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'EMAIL_VERIFIED'
  | 'ADMIN_CREATED'
  | 'ROLE_UPDATED'
  | 'USER_DELETED'
  | 'AD_CREATED'
  | 'AD_UPDATED'
  | 'AD_VIEWED'
  | 'AD_IMPORTED'
  | 'AD_UNPUBLISHED'
  | 'AD_REPUBLISHED'
  | 'AD_DELETED'
  | 'REPORT_CREATED'
  | 'REPORT_RESOLVED'
  | 'REPORT_DELETED'
  | 'REVIEW_CREATED'
  | 'REVIEW_UPDATED'
  | 'REVIEW_DELETED'
  | 'USER_UPDATED'
  | 'TRACE_DELETED';

export const TRACE_TYPE_LABEL: Record<TraceType, string> = {
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  REGISTER: 'Registro',
  EMAIL_VERIFIED: 'Correo verificado',
  ADMIN_CREATED: 'Admin creado',
  ROLE_UPDATED: 'Rol actualizado',
  USER_DELETED: 'Usuario eliminado',
  AD_CREATED: 'Anuncio creado',
  AD_UPDATED: 'Anuncio editado',
  AD_VIEWED: 'Detalle visto',
  AD_IMPORTED: 'Importación CSV',
  AD_UNPUBLISHED: 'Anuncio dado de baja',
  AD_REPUBLISHED: 'Anuncio republicado',
  AD_DELETED: 'Anuncio eliminado',
  REPORT_CREATED: 'Reporte enviado',
  REPORT_RESOLVED: 'Reporte resuelto',
  REPORT_DELETED: 'Reporte eliminado',
  REVIEW_CREATED: 'Reseña creada',
  REVIEW_UPDATED: 'Reseña editada',
  REVIEW_DELETED: 'Reseña eliminada',
  USER_UPDATED: 'Usuario editado',
  TRACE_DELETED: 'Traza eliminada',
};

export type TraceResult = 'OK' | 'ERROR';

export interface Trace {
  id: string;
  type: TraceType;
  description: string;
  actorId: string | null;
  actorEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  // Country (ISO-2) and request source/origin (utm_source or Referer host).
  country: string | null;
  source: string | null;
  // Affected resource in "type:id" format (e.g. "ad:<uuid>").
  resource: string | null;
  result: TraceResult;
  // Milliseconds from the start of the request to the event.
  durationMs: number | null;
  createdAt: string;
}

// Review as shown in the admin report (the listing is null if it was already
// deleted).
export interface AdminReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: { id: string; name: string; email: string };
  owner: { id: string; name: string; email: string };
  ad: { id: string; description: string; status: AdStatus; expiresAt: string } | null;
}

// ——— Site activity (observability) ———

export type ServiceState = 'up' | 'warning' | 'down' | 'not_applicable';

export interface ServiceStatus {
  key: string;
  state: ServiceState;
  detail: string;
  latencyMs?: number;
}

export interface PerformanceMetrics {
  requestsLastHour: number;
  requestsPerMinute: number;
  avgResponseMs: number;
  errorsLastHour: number;
  connectedUsers: number;
  startedAt: string;
  uptimeSeconds: number;
  cpu: { loadPercent: number; cores: number };
  memory: { processRssMb: number; totalMb: number; freeMb: number };
  disk: { totalGb: number; freeGb: number } | null;
}

export type ErrorSeverity = 'WARNING' | 'ERROR' | 'CRITICAL';
export type ErrorStatus = 'NEW' | 'RESOLVED';

export interface ErrorLog {
  id: string;
  service: string;
  message: string;
  stack: string | null;
  path: string | null;
  severity: ErrorSeverity;
  status: ErrorStatus;
  createdAt: string;
}

export const ERROR_SEVERITY_LABEL: Record<ErrorSeverity, string> = {
  WARNING: 'Advertencia',
  ERROR: 'Error',
  CRITICAL: 'Crítico',
};

export const ERROR_STATUS_LABEL: Record<ErrorStatus, string> = {
  NEW: 'Nuevo',
  RESOLVED: 'Resuelto',
};

// "Mozilla/5.0 (iPhone...) Chrome/126..." -> "Chrome · Móvil" for the tables.
export function formatUserAgent(ua: string | null): string {
  if (!ua) return '—';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Otro';
  const device = /Mobile|Android|iPhone|iPad/.test(ua) ? 'Móvil' : 'Escritorio';
  return `${browser} · ${device}`;
}

// Point of a daily dashboard series (date in YYYY-MM-DD format).
export interface DayPoint {
  date: string;
  total: number;
}

// Point of the hourly distribution (Bolivia local time, 0-23).
export interface HourPoint {
  hour: number;
  total: number;
}

export interface VisitStats {
  total: number;
  last24h: number;
  last7Days: number;
  byDay: DayPoint[];
}

export interface AdminStats {
  // byDay: sign-ups per calendar day, always excluding admins.
  users: { total: number; admins: number; byDay: DayPoint[] };
  ads: { total: number; byDay: DayPoint[] };
  // Listing detail visits. `liveAds` is the part of the total that belongs to
  // listings that still exist: when a listing is deleted its visits are kept
  // without an owner, and this is all "Top anuncios" sees.
  visits: VisitStats & { liveAds: number };
  // Portal page views (general site visits); byHour is the distribution by
  // hour of day over the last week.
  siteVisits: VisitStats & { byHour: HourPoint[] };
}

// Row of the registered-user activity statistics (no admins): last portal
// visit and time spent (sessions split by 30-min inactivity gaps over the
// last 30 days).
export interface UserActivity {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  lastVisitAt: string | null;
  sessionsLast30Days: number;
  totalMinutesLast30Days: number;
  avgSessionMinutes: number;
}

// Row of the most-clicked listings ranking (detail visits).
export interface TopAd extends Ad {
  visitsTotal: number;
  visitsLast7Days: number;
}

// Clicks on a "Sitios de interés" card (a Grupo CorpSC company).
export interface SiteClickRow {
  company: string;
  label: string;
  clicksLast30Days: number;
  clicksLast7Days: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Effective status of a listing: an ACTIVO one with expiresAt in the past is VENCIDO.
export function adEffectiveStatus(ad: Pick<Ad, 'status' | 'expiresAt'>): EffectiveStatus {
  if (ad.status === 'DADO_DE_BAJA') return 'DADO_DE_BAJA';
  return new Date(ad.expiresAt).getTime() > Date.now() ? 'ACTIVO' : 'VENCIDO';
}

// Listing salary as text: fixed amount, range ("Bs 3.500 a 4.500") or
// "A convenir" (same rule as the portal, see lib/types.ts).
export function salaryLabel(
  ad: Pick<Ad, 'salary' | 'salaryMax'>,
  fallback = 'A convenir',
) {
  const amount = (v: Ad['salary']) => (v != null && v !== '' ? Number(v) : null);
  const min = amount(ad.salary);
  if (min == null || !Number.isFinite(min)) return fallback;
  const bs = (n: number) => n.toLocaleString('es-BO');
  const max = amount(ad.salaryMax);
  return max != null && Number.isFinite(max) && max > min
    ? `Bs ${bs(min)} a ${bs(max)}`
    : `Bs ${bs(min)}`;
}
