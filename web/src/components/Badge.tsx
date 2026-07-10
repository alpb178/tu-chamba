import { JobType, JOB_TYPE_LABEL } from '@/lib/types';

const COLORS: Record<JobType, string> = {
  DIARIA: 'bg-orange-100 text-orange-800',
  TIEMPO_COMPLETO: 'bg-green-100 text-green-800',
  MEDIA_JORNADA: 'bg-blue-100 text-blue-800',
};

export function Badge({ jobType }: { jobType: JobType }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[jobType]}`}
    >
      {JOB_TYPE_LABEL[jobType]}
    </span>
  );
}
