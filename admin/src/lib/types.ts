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

// Duraciones de publicación permitidas (en días). 3 es el valor por defecto.
export const DURATION_DAYS = [3, 7, 15, 30];

// DADO_DE_BAJA se persiste; VENCIDO se calcula con expiresAt (ver adEffectiveStatus).
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
  // Único distintivo entre usuarios: acceso a este panel.
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  requirements?: string | null;
  location?: string | null;
  department?: Department | null;
  category?: Category | null;
  latitude?: number | null;
  longitude?: number | null;
  schedule?: string | null;
  // Nulo = salario a convenir (p. ej. anuncios importados por CSV sin salario).
  salary?: string | number | null;
  phone: string;
  jobType: JobType;
  status: AdStatus;
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
  // Recurso afectado en formato "tipo:id" (ej. "ad:<uuid>").
  resource: string | null;
  result: TraceResult;
  // Milisegundos desde el inicio del request hasta el evento.
  durationMs: number | null;
  createdAt: string;
}

// Reseña del reporte admin (el anuncio es null si ya fue eliminado).
export interface AdminReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: { id: string; name: string; email: string };
  owner: { id: string; name: string; email: string };
  ad: { id: string; description: string; status: AdStatus; expiresAt: string } | null;
}

// ——— Actividad del sitio (observabilidad) ———

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

// "Mozilla/5.0 (iPhone...) Chrome/126..." -> "Chrome · Móvil" para las tablas.
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

// Punto de una serie diaria del dashboard (fecha en formato YYYY-MM-DD).
export interface DayPoint {
  date: string;
  total: number;
}

// Punto de la distribución horaria (hora local de Bolivia, 0-23).
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
  // byDay: registros por día calendario, siempre sin administradores.
  users: { total: number; admins: number; byDay: DayPoint[] };
  ads: { total: number; byDay: DayPoint[] };
  // Visitas al detalle de anuncios.
  visits: VisitStats;
  // Páginas vistas del portal (visitas generales al sitio); byHour es la
  // distribución por hora del día de la última semana.
  siteVisits: VisitStats & { byHour: HourPoint[] };
}

// Fila de la estadística de actividad de usuarios registrados (sin admins):
// última visita al portal y tiempo de estancia (sesiones por huecos de
// inactividad de 30 min sobre los últimos 30 días).
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

// Fila del ranking de anuncios más clickeados (visitas al detalle).
export interface TopAd extends Ad {
  visitsTotal: number;
  visitsLast7Days: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Estado efectivo de un anuncio: un ACTIVO con expiresAt en el pasado está VENCIDO.
export function adEffectiveStatus(ad: Pick<Ad, 'status' | 'expiresAt'>): EffectiveStatus {
  if (ad.status === 'DADO_DE_BAJA') return 'DADO_DE_BAJA';
  return new Date(ad.expiresAt).getTime() > Date.now() ? 'ACTIVO' : 'VENCIDO';
}
