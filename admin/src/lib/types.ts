export type Role = 'ADMIN' | 'TRABAJADOR' | 'EMPLEADOR';

export type TipoJornada = 'DIARIA' | 'TIEMPO_COMPLETO' | 'MEDIA_JORNADA';

export const TIPO_JORNADA_LABEL: Record<TipoJornada, string> = {
  DIARIA: 'Diaria',
  TIEMPO_COMPLETO: 'Tiempo completo',
  MEDIA_JORNADA: 'Media jornada',
};

export type Departamento =
  | 'LA_PAZ'
  | 'SANTA_CRUZ'
  | 'COCHABAMBA'
  | 'ORURO'
  | 'POTOSI'
  | 'CHUQUISACA'
  | 'TARIJA'
  | 'BENI'
  | 'PANDO';

export const DEPARTAMENTO_LABEL: Record<Departamento, string> = {
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

export type Categoria =
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

export const CATEGORIA_LABEL: Record<Categoria, string> = {
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

// DADO_DE_BAJA se persiste; VENCIDO se calcula con expiraEn (ver estadoAnuncio).
export type EstadoAnuncio = 'ACTIVO' | 'DADO_DE_BAJA';
export type EstadoEfectivo = 'ACTIVO' | 'VENCIDO' | 'DADO_DE_BAJA';

export const ESTADO_LABEL: Record<EstadoEfectivo, string> = {
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  DADO_DE_BAJA: 'Dado de baja',
};

export type MotivoReporte = 'SPAM' | 'FRAUDE' | 'CONTENIDO_INAPROPIADO' | 'OTRO';
export type EstadoReporte = 'PENDIENTE' | 'ATENDIDO' | 'DESCARTADO';

export const MOTIVO_REPORTE_LABEL: Record<MotivoReporte, string> = {
  SPAM: 'Spam',
  FRAUDE: 'Fraude / estafa',
  CONTENIDO_INAPROPIADO: 'Contenido inapropiado',
  OTRO: 'Otro',
};

export const ESTADO_REPORTE_LABEL: Record<EstadoReporte, string> = {
  PENDIENTE: 'Pendiente',
  ATENDIDO: 'Atendido',
  DESCARTADO: 'Descartado',
};

export interface User {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Anuncio {
  id: string;
  descripcion: string;
  requisitos?: string | null;
  ubicacion?: string | null;
  departamento?: Departamento | null;
  categoria?: Categoria | null;
  latitud?: number | null;
  longitud?: number | null;
  horario?: string | null;
  salario: string | number;
  telefono: string;
  tipoJornada: TipoJornada;
  estado: EstadoAnuncio;
  duracionDias: number;
  expiraEn: string;
  createdById: string;
  createdBy?: { id: string; nombre: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface Reporte {
  id: string;
  motivo: MotivoReporte;
  comentario?: string | null;
  estado: EstadoReporte;
  anuncioId: string;
  anuncio?: {
    id: string;
    descripcion: string;
    estado: EstadoAnuncio;
    createdBy?: { id: string; nombre: string; email: string };
  };
  reporter?: { id: string; nombre: string; email: string };
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

export interface AdminStats {
  users: { total: number; byRole: Record<Role, number> };
  ads: { total: number; byDay: DayPoint[] };
  visits: {
    total: number;
    last24h: number;
    last7Days: number;
    byDay: DayPoint[];
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Estado efectivo de un anuncio: un ACTIVO con expiraEn en el pasado está VENCIDO.
export function estadoAnuncio(a: Pick<Anuncio, 'estado' | 'expiraEn'>): EstadoEfectivo {
  if (a.estado === 'DADO_DE_BAJA') return 'DADO_DE_BAJA';
  return new Date(a.expiraEn).getTime() > Date.now() ? 'ACTIVO' : 'VENCIDO';
}
