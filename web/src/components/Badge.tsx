import { JobType, JOB_TYPE_LABEL } from '@/lib/types';

// Chips de jornada con los contenedores de la paleta (ámbar/verde/azul).
const COLORS: Record<JobType, string> = {
  DIARIA: 'bg-secondary-container text-on-secondary-container',
  TIEMPO_COMPLETO: 'bg-tertiary-container text-on-tertiary-container',
  MEDIA_JORNADA: 'bg-brand-light text-primary',
};

export function Badge({ jobType }: { jobType: JobType }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${COLORS[jobType]}`}
    >
      {JOB_TYPE_LABEL[jobType]}
    </span>
  );
}
