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
