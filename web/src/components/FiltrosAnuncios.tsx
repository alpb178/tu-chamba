'use client';

import {
  Categoria,
  CATEGORIA_LABEL,
  Departamento,
  DEPARTAMENTO_LABEL,
  TipoJornada,
  TIPO_JORNADA_LABEL,
} from '@/lib/types';

const TIPOS: TipoJornada[] = ['DIARIA', 'TIEMPO_COMPLETO', 'MEDIA_JORNADA'];

export interface Filtros {
  tipoJornada: TipoJornada | '';
  departamento: Departamento | '';
  categoria: Categoria | '';
}

// Barra de filtros de la home: jornada en chips (pocas) + departamento y
// categoría en selects. Incluye "Limpiar" cuando hay algún filtro activo.
export function FiltrosAnuncios({
  value,
  onChange,
}: {
  value: Filtros;
  onChange: (f: Filtros) => void;
}) {
  const chip = (activo: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      activo
        ? 'border-brand bg-brand text-white'
        : 'border-gray-300 bg-white text-gray-700 hover:border-brand hover:text-brand'
    }`;

  const jornadas: { valor: TipoJornada | ''; label: string }[] = [
    { valor: '', label: 'Todas' },
    ...TIPOS.map((t) => ({ valor: t, label: TIPO_JORNADA_LABEL[t] })),
  ];

  const hayFiltros =
    !!value.tipoJornada || !!value.departamento || !!value.categoria;

  const selectClass =
    'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label="Tipo de jornada" className="flex flex-wrap gap-2">
        {jornadas.map((o) => (
          <button
            key={o.valor || 'todas'}
            type="button"
            role="radio"
            aria-checked={value.tipoJornada === o.valor}
            onClick={() => onChange({ ...value, tipoJornada: o.valor })}
            className={chip(value.tipoJornada === o.valor)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <span className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" aria-hidden="true" />

      <label className="sr-only" htmlFor="filtro-departamento">
        Departamento
      </label>
      <select
        id="filtro-departamento"
        className={selectClass}
        value={value.departamento}
        onChange={(e) =>
          onChange({ ...value, departamento: e.target.value as Departamento | '' })
        }
      >
        <option value="">Todo el país</option>
        {Object.entries(DEPARTAMENTO_LABEL).map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="filtro-categoria">
        Categoría
      </label>
      <select
        id="filtro-categoria"
        className={selectClass}
        value={value.categoria}
        onChange={(e) =>
          onChange({ ...value, categoria: e.target.value as Categoria | '' })
        }
      >
        <option value="">Todas las categorías</option>
        {Object.entries(CATEGORIA_LABEL).map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>

      {hayFiltros && (
        <button
          type="button"
          onClick={() => onChange({ tipoJornada: '', departamento: '', categoria: '' })}
          className="text-sm text-gray-500 underline hover:text-brand"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
