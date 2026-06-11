'use client';

import { TipoJornada, TIPO_JORNADA_LABEL } from '@/lib/types';

const TIPOS: TipoJornada[] = ['DIARIA', 'TIEMPO_COMPLETO', 'MEDIA_JORNADA'];

export function FilterSidebar({
  value,
  onChange,
}: {
  value: TipoJornada | '';
  onChange: (v: TipoJornada | '') => void;
}) {
  return (
    <aside className="w-full shrink-0 rounded-lg border border-gray-200 bg-white p-4 md:w-60">
      <h2 className="mb-3 text-sm font-semibold text-gray-800">Tipo de jornada</h2>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name="tipoJornada"
            checked={value === ''}
            onChange={() => onChange('')}
            className="accent-brand"
          />
          Todas
        </label>
        {TIPOS.map((t) => (
          <label key={t} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="tipoJornada"
              checked={value === t}
              onChange={() => onChange(t)}
              className="accent-brand"
            />
            {TIPO_JORNADA_LABEL[t]}
          </label>
        ))}
      </div>
    </aside>
  );
}
