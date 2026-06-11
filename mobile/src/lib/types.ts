export type Role = 'ADMIN' | 'TRABAJADOR' | 'EMPLEADOR';

export type TipoJornada = 'DIARIA' | 'TIEMPO_COMPLETO' | 'MEDIA_JORNADA';

export const TIPO_JORNADA_LABEL: Record<TipoJornada, string> = {
  DIARIA: 'Diaria',
  TIEMPO_COMPLETO: 'Tiempo completo',
  MEDIA_JORNADA: 'Media jornada',
};

export interface User {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  role: Role;
}

export interface Anuncio {
  id: string;
  descripcion: string;
  salario: string | number;
  telefono: string;
  tipoJornada: TipoJornada;
  createdById: string;
  createdBy?: { id: string; nombre: string; email: string };
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
