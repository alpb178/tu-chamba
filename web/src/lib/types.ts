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

// Slugs para las URLs SEO por departamento (/empleos/[slug]).
export const DEPARTAMENTO_SLUG: Record<Departamento, string> = {
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

export const SLUG_DEPARTAMENTO: Record<string, Departamento> = Object.fromEntries(
  Object.entries(DEPARTAMENTO_SLUG).map(([dep, slug]) => [slug, dep as Departamento]),
);

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

export const DURACIONES_DIAS = [3, 7, 15, 30];

export type MotivoReporte = 'SPAM' | 'FRAUDE' | 'CONTENIDO_INAPROPIADO' | 'OTRO';

export const MOTIVO_REPORTE_LABEL: Record<MotivoReporte, string> = {
  SPAM: 'Spam',
  FRAUDE: 'Fraude / estafa',
  CONTENIDO_INAPROPIADO: 'Contenido inapropiado',
  OTRO: 'Otro',
};

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
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

export interface Review {
  id: string;
  rating: number;
  comentario: string;
  autorId: string;
  empleadorId: string;
  autor?: { id: string; nombre: string };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsResponse extends Paginated<Review> {
  promedio: number | null;
}

export type TipoNotificacion =
  | 'CHAT_INICIADO'
  | 'NUEVA_REVIEW'
  | 'ANUNCIO_VENCIDO'
  | 'NUEVO_ANUNCIO';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  anuncioId?: string | null;
  createdAt: string;
}

export interface NotificacionesResponse {
  items: Notificacion[];
  noLeidas: number;
}

export interface AlertaEmpleo {
  id: string;
  departamento: Departamento | null;
  categoria: Categoria | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Conteos por opción para la barra de filtros (endpoint /anuncios/facetas).
export interface Facetas {
  total: number;
  tipoJornada: Partial<Record<TipoJornada, number>>;
  departamento: Partial<Record<Departamento, number>>;
  categoria: Partial<Record<Categoria, number>>;
  salarioMin: number;
  salarioMax: number;
}

// Estado efectivo de un anuncio: un ACTIVO con expiraEn en el pasado está VENCIDO.
export function estadoAnuncio(a: Pick<Anuncio, 'estado' | 'expiraEn'>): EstadoEfectivo {
  if (a.estado === 'DADO_DE_BAJA') return 'DADO_DE_BAJA';
  return new Date(a.expiraEn).getTime() > Date.now() ? 'ACTIVO' : 'VENCIDO';
}

export const ESTADO_LABEL: Record<EstadoEfectivo, string> = {
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  DADO_DE_BAJA: 'Dado de baja',
};

// Enlace de WhatsApp: wa.me exige el número con código de país (Bolivia 591).
export function waLink(telefono: string, mensaje?: string) {
  const digits = telefono.replace(/\D/g, '');
  const numero = digits.startsWith('591') ? digits : `591${digits}`;
  const text = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return `https://wa.me/${numero}${text}`;
}
