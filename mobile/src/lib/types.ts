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
  // Nulo = salario a convenir (p. ej. anuncios importados por CSV sin salario).
  // Con salaryMax el par es un rango; salary es siempre el extremo inferior.
  salary?: string | number | null;
  salaryMax?: string | number | null;
  phone: string;
  // Números de contacto adicionales (los avisos suelen publicar dos o tres).
  extraPhones?: string[];
  // Referencia en texto libre ("frente al mercado Los Pozos").
  locationReference?: string | null;
  jobType: JobType;
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  // Calificación del publicante; el backend la adjunta en los listados.
  ownerRating?: { average: number | null; count: number };
  createdAt: string;
}

// Sueldo del anuncio como texto: monto fijo, rango ("Bs 3.500 a 4.500") o
// "A convenir" (mismo criterio que el portal web).
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

// Todos los números de contacto, sin repetidos ni vacíos: el principal primero.
export function adPhones(ad: Pick<Ad, 'phone' | 'extraPhones'>): string[] {
  const all = [ad.phone, ...(ad.extraPhones ?? [])]
    .map((p) => (p ?? '').trim())
    .filter(Boolean);
  return [...new Set(all)];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
