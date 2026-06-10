import { TipoJornada, TIPO_JORNADA_LABEL } from '@/lib/types';

const COLORS: Record<TipoJornada, string> = {
  DIARIA: 'bg-orange-100 text-orange-800',
  TIEMPO_COMPLETO: 'bg-green-100 text-green-800',
  MEDIA_JORNADA: 'bg-blue-100 text-blue-800',
};

export function Badge({ tipo }: { tipo: TipoJornada }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[tipo]}`}
    >
      {TIPO_JORNADA_LABEL[tipo]}
    </span>
  );
}
