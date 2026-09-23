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
  // The only distinction between users: access to the admin panel.
  isAdmin: boolean;
}

export interface Ad {
  id: string;
  description: string;
  // Null = negotiable salary (e.g. CSV-imported listings without a salary).
  // With salaryMax the pair is a range; salary is always the lower bound.
  salary?: string | number | null;
  salaryMax?: string | number | null;
  phone: string;
  // Additional contact numbers (listings often publish two or three).
  extraPhones?: string[];
  // Free-text reference ("frente al mercado Los Pozos").
  locationReference?: string | null;
  jobType: JobType;
  // Featured from the panel: the card highlights it.
  featured?: boolean;
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
  // The poster's rating; the backend attaches it in listings.
  ownerRating?: { average: number | null; count: number };
  createdAt: string;
}

// Listing salary as text: fixed amount, range ("Bs 3.500 a 4.500") or
// "A convenir" (same rule as the web portal).
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

// All contact numbers, without duplicates or blanks: the main one first.
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
