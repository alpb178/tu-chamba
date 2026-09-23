import { JobType } from '@/lib/types';
import { useLabels } from '@/i18n/use-labels';

// Work schedule chips using the palette containers (amber/green/blue).
const COLORS: Record<JobType, string> = {
  DIARIA: 'bg-secondary-container text-on-secondary-container',
  TIEMPO_COMPLETO: 'bg-tertiary-container text-on-tertiary-container',
  MEDIA_JORNADA: 'bg-brand-light text-primary',
  POR_CONTRATO: 'bg-secondary-container text-on-secondary-container',
  PASANTIA: 'bg-brand-light text-primary',
  FREELANCE: 'bg-tertiary-container text-on-tertiary-container',
  // No declared schedule: neutral chip, doesn't compete with real schedules.
  A_CONVENIR: 'bg-surface-variant text-on-surface-variant',
};

export function Badge({ jobType }: { jobType: JobType }) {
  const labels = useLabels();
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${COLORS[jobType]}`}
    >
      {labels.jobType(jobType)}
    </span>
  );
}
