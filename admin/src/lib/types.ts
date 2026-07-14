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
  | 'REGISTER'
  | 'EMAIL_VERIFIED'
  | 'ADMIN_CREATED'
  | 'ROLE_UPDATED'
  | 'USER_DELETED'
  | 'AD_CREATED'
  | 'AD_UNPUBLISHED'
  | 'AD_REPUBLISHED'
  | 'AD_DELETED'
  | 'REPORT_RESOLVED';

export const TRACE_TYPE_LABEL: Record<TraceType, string> = {
  LOGIN: 'Inicio de sesión',
  REGISTER: 'Registro',
  EMAIL_VERIFIED: 'Correo verificado',
  ADMIN_CREATED: 'Admin creado',
  ROLE_UPDATED: 'Rol actualizado',
  USER_DELETED: 'Usuario eliminado',
  AD_CREATED: 'Anuncio creado',
  AD_UNPUBLISHED: 'Anuncio dado de baja',
  AD_REPUBLISHED: 'Anuncio republicado',
  AD_DELETED: 'Anuncio eliminado',
  REPORT_RESOLVED: 'Reporte resuelto',
};

export interface Trace {
  id: string;
  type: TraceType;
  description: string;
  actorId: string | null;
  actorEmail: string | null;
  createdAt: string;
}

// Punto de una serie diaria del dashboard (fecha en formato YYYY-MM-DD).
export interface DayPoint {
  date: string;
  total: number;
}

export interface VisitStats {
  total: number;
  last24h: number;
  last7Days: number;
  byDay: DayPoint[];
}

export interface AdminStats {
  users: { total: number; admins: number };
  ads: { total: number; byDay: DayPoint[] };
  // Visitas al detalle de anuncios.
  visits: VisitStats;
  // Páginas vistas del portal (visitas generales al sitio).
  siteVisits: VisitStats;
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
