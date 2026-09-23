import type {
  Ad,
  Category,
  Department,
  EffectiveStatus,
  JobType,
  ReportReason,
} from '@/lib/types';
import { DEPARTMENT_LABEL } from '@/lib/types';
import type { SortOption } from '@/lib/sort';
import type { Locale } from './routing';

// BCP 47 tag used to format numbers and dates in each locale.
export const INTL_LOCALE: Record<Locale, string> = {
  es: 'es-BO',
  en: 'en-US',
  pt: 'pt-BR',
};

// Translator for the "enums" namespace, as returned by
// useTranslations('enums') or getTranslations('enums').
type EnumsT = (key: never, values?: Record<string, string | number>) => string;

// Localized labels for the enum values the public site shows. The Spanish
// constants in lib/types.ts (JOB_TYPE_LABEL, ...) stay for the admin panel.
export function createLabels(t: EnumsT, locale: Locale) {
  const tr = t as unknown as (key: string, values?: Record<string, string | number>) => string;
  const num = (n: number) => n.toLocaleString(INTL_LOCALE[locale]);
  return {
    jobType: (v: JobType) => tr(`jobType.${v}`),
    category: (v: Category) => tr(`category.${v}`),
    status: (v: EffectiveStatus) => tr(`status.${v}`),
    reportReason: (v: ReportReason) => tr(`reportReason.${v}`),
    sort: (v: SortOption) => tr(`sort.${v}`),
    // Department names are proper nouns: the same in every locale.
    department: (v: Department) => DEPARTMENT_LABEL[v],
    number: num,
    date: (iso: string) => new Date(iso).toLocaleDateString(INTL_LOCALE[locale]),
    // Same rules as lib/types.ts#salaryLabel, localized.
    salary: (ad: Pick<Ad, 'salary' | 'salaryMax'>, fallback?: string) => {
      const amount = (v: Ad['salary']) => (v != null && v !== '' ? Number(v) : null);
      const min = amount(ad.salary);
      if (min == null || !Number.isFinite(min)) return fallback ?? tr('salary.negotiable');
      const max = amount(ad.salaryMax);
      return max != null && Number.isFinite(max) && max > min
        ? tr('salary.range', { min: num(min), max: num(max) })
        : tr('salary.amount', { amount: num(min) });
    },
  };
}

export type Labels = ReturnType<typeof createLabels>;
