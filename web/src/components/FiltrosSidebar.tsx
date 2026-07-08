'use client';

import { useEffect, useState } from 'react';
import {
  Categoria,
  CATEGORIA_LABEL,
  Departamento,
  DEPARTAMENTO_LABEL,
  Facetas,
  TipoJornada,
  TIPO_JORNADA_LABEL,
} from '@/lib/types';

export interface Filtros {
  tipoJornada: TipoJornada[];
  departamento: Departamento[];
  categoria: Categoria[];
  salarioMin?: number;
  salarioMax?: number;
}

export const SIN_FILTROS: Filtros = {
  tipoJornada: [],
  departamento: [],
  categoria: [],
};

// Sección colapsable con encabezado (estilo del catálogo de referencia).
function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(true);
  return (
    <div className="border-b border-gray-200 py-3">
      <button
        type="button"
        onClick={() => setAbierto((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500"
        aria-expanded={abierto}
      >
        {titulo}
        <span className="text-gray-400">{abierto ? '−' : '+'}</span>
      </button>
      {abierto && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

// Fila de opción con checkbox y contador.
function Opcion({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm text-gray-700">
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 rounded border-gray-300 accent-brand"
        />
        {label}
      </span>
      {count != null && <span className="text-xs text-gray-400">{count}</span>}
    </label>
  );
}

// Slider de salario con dos manijas (rango) sobre una pista.
function RangoSalario({
  min,
  max,
  valorMin,
  valorMax,
  onCommit,
}: {
  min: number;
  max: number;
  valorMin: number;
  valorMax: number;
  onCommit: (lo: number, hi: number) => void;
}) {
  const [lo, setLo] = useState(valorMin);
  const [hi, setHi] = useState(valorMax);

  useEffect(() => {
    setLo(valorMin);
    setHi(valorMax);
  }, [valorMin, valorMax]);

  if (max <= min) return null;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const thumb =
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-white';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-gray-700">
        <span>Bs {lo.toLocaleString('es-BO')}</span>
        <span>Bs {hi.toLocaleString('es-BO')}</span>
      </div>
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded bg-gray-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-brand"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi))}
          onPointerUp={() => onCommit(lo, hi)}
          onKeyUp={() => onCommit(lo, hi)}
          aria-label="Salario mínimo"
          className={`pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent ${thumb}`}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo))}
          onPointerUp={() => onCommit(lo, hi)}
          onKeyUp={() => onCommit(lo, hi)}
          aria-label="Salario máximo"
          className={`pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent ${thumb}`}
        />
      </div>
    </div>
  );
}

// Barra lateral de filtros: jornada, categoría, departamento y salario.
export function FiltrosSidebar({
  value,
  facetas,
  onChange,
}: {
  value: Filtros;
  facetas: Facetas | null;
  onChange: (f: Filtros) => void;
}) {
  function toggle<T>(lista: T[], item: T): T[] {
    return lista.includes(item)
      ? lista.filter((x) => x !== item)
      : [...lista, item];
  }

  const hay =
    value.tipoJornada.length ||
    value.departamento.length ||
    value.categoria.length ||
    value.salarioMin != null ||
    value.salarioMax != null;

  // Categorías/departamentos a mostrar: los que tienen anuncios o están elegidos.
  const cats = (Object.keys(CATEGORIA_LABEL) as Categoria[]).filter(
    (c) => facetas?.categoria[c] || value.categoria.includes(c),
  );
  const deptos = (Object.keys(DEPARTAMENTO_LABEL) as Departamento[]).filter(
    (d) => facetas?.departamento[d] || value.departamento.includes(d),
  );

  return (
    <aside className="w-full shrink-0 rounded-lg border border-gray-200 bg-white p-4 md:w-64">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Filtros</h2>
        {hay ? (
          <button
            type="button"
            onClick={() => onChange(SIN_FILTROS)}
            className="text-xs text-gray-500 underline hover:text-brand"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <Seccion titulo="Tipo de jornada">
        {(Object.keys(TIPO_JORNADA_LABEL) as TipoJornada[]).map((t) => (
          <Opcion
            key={t}
            label={TIPO_JORNADA_LABEL[t]}
            count={facetas?.tipoJornada[t] ?? 0}
            checked={value.tipoJornada.includes(t)}
            onToggle={() =>
              onChange({ ...value, tipoJornada: toggle(value.tipoJornada, t) })
            }
          />
        ))}
      </Seccion>

      {cats.length > 0 && (
        <Seccion titulo="Categoría">
          {cats.map((c) => (
            <Opcion
              key={c}
              label={CATEGORIA_LABEL[c]}
              count={facetas?.categoria[c] ?? 0}
              checked={value.categoria.includes(c)}
              onToggle={() =>
                onChange({ ...value, categoria: toggle(value.categoria, c) })
              }
            />
          ))}
        </Seccion>
      )}

      {deptos.length > 0 && (
        <Seccion titulo="Departamento">
          {deptos.map((d) => (
            <Opcion
              key={d}
              label={DEPARTAMENTO_LABEL[d]}
              count={facetas?.departamento[d] ?? 0}
              checked={value.departamento.includes(d)}
              onToggle={() =>
                onChange({ ...value, departamento: toggle(value.departamento, d) })
              }
            />
          ))}
        </Seccion>
      )}

      {facetas && facetas.salarioMax > facetas.salarioMin && (
        <Seccion titulo="Salario (Bs)">
          <RangoSalario
            min={facetas.salarioMin}
            max={facetas.salarioMax}
            valorMin={value.salarioMin ?? facetas.salarioMin}
            valorMax={value.salarioMax ?? facetas.salarioMax}
            onCommit={(lo, hi) =>
              onChange({
                ...value,
                salarioMin: lo > facetas.salarioMin ? lo : undefined,
                salarioMax: hi < facetas.salarioMax ? hi : undefined,
              })
            }
          />
        </Seccion>
      )}
    </aside>
  );
}
