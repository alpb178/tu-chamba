export type JobType = 'DIARIA' | 'TIEMPO_COMPLETO' | 'MEDIA_JORNADA';

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  DIARIA: 'Diaria',
  TIEMPO_COMPLETO: 'Tiempo completo',
  MEDIA_JORNADA: 'Media jornada',
};

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  phone: string | null;
  // Único distintivo entre usuarios: acceso al panel de administración.
  isAdmin: boolean;
}

export interface Ad {
  id: string;
  description: string;
  salary: string | number;
  phone: string;
  jobType: JobType;
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  // Calificación del publicante; el backend la adjunta en los listados.
  ownerRating?: { average: number | null; count: number };
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
