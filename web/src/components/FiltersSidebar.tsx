'use client';

import { useEffect, useState } from 'react';
import {
  Category,
  CATEGORY_LABEL,
  Department,
  DEPARTMENT_LABEL,
  Facets,
  JobType,
  JOB_TYPE_LABEL,
} from '@/lib/types';

export interface Filters {
  jobType: JobType[];
  department: Department[];
  category: Category[];
  salaryMin?: number;
  salaryMax?: number;
}

export const NO_FILTERS: Filters = {
  jobType: [],
  department: [],
  category: [],
};

// Sección colapsable con encabezado (estilo del catálogo de referencia).
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-200 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500"
        aria-expanded={open}
      >
        {title}
        <span className="text-gray-400">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

// Fila de opción con checkbox y contador.
function Option({
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
function SalaryRange({
  min,
  max,
  minValue,
  maxValue,
  onCommit,
}: {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onCommit: (lo: number, hi: number) => void;
}) {
  const [lo, setLo] = useState(minValue);
  const [hi, setHi] = useState(maxValue);

  useEffect(() => {
    setLo(minValue);
    setHi(maxValue);
  }, [minValue, maxValue]);

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
export function FiltersSidebar({
  value,
  facets,
  onChange,
}: {
  value: Filters;
  facets: Facets | null;
  onChange: (f: Filters) => void;
}) {
  function toggle<T>(list: T[], item: T): T[] {
    return list.includes(item)
      ? list.filter((x) => x !== item)
      : [...list, item];
  }

  const hasFilters =
    value.jobType.length ||
    value.department.length ||
    value.category.length ||
    value.salaryMin != null ||
    value.salaryMax != null;

  // Categorías/departamentos a mostrar: los que tienen anuncios o están elegidos.
  const categories = (Object.keys(CATEGORY_LABEL) as Category[]).filter(
    (c) => facets?.category[c] || value.category.includes(c),
  );
  const departments = (Object.keys(DEPARTMENT_LABEL) as Department[]).filter(
    (d) => facets?.department[d] || value.department.includes(d),
  );

  return (
    <aside className="w-full shrink-0 rounded-lg border border-gray-200 bg-white p-4 md:w-64">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Filtros</h2>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => onChange(NO_FILTERS)}
            className="text-xs text-gray-500 underline hover:text-brand"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <Section title="Tipo de jornada">
        {(Object.keys(JOB_TYPE_LABEL) as JobType[]).map((t) => (
          <Option
            key={t}
            label={JOB_TYPE_LABEL[t]}
            count={facets?.jobType[t] ?? 0}
            checked={value.jobType.includes(t)}
            onToggle={() =>
              onChange({ ...value, jobType: toggle(value.jobType, t) })
            }
          />
        ))}
      </Section>

      {categories.length > 0 && (
        <Section title="Categoría">
          {categories.map((c) => (
            <Option
              key={c}
              label={CATEGORY_LABEL[c]}
              count={facets?.category[c] ?? 0}
              checked={value.category.includes(c)}
              onToggle={() =>
                onChange({ ...value, category: toggle(value.category, c) })
              }
            />
          ))}
        </Section>
      )}

      {departments.length > 0 && (
        <Section title="Departamento">
          {departments.map((d) => (
            <Option
              key={d}
              label={DEPARTMENT_LABEL[d]}
              count={facets?.department[d] ?? 0}
              checked={value.department.includes(d)}
              onToggle={() =>
                onChange({ ...value, department: toggle(value.department, d) })
              }
            />
          ))}
        </Section>
      )}

      {facets && facets.salaryMax > facets.salaryMin && (
        <Section title="Salario (Bs)">
          <SalaryRange
            min={facets.salaryMin}
            max={facets.salaryMax}
            minValue={value.salaryMin ?? facets.salaryMin}
            maxValue={value.salaryMax ?? facets.salaryMax}
            onCommit={(lo, hi) =>
              onChange({
                ...value,
                salaryMin: lo > facets.salaryMin ? lo : undefined,
                salaryMax: hi < facets.salaryMax ? hi : undefined,
              })
            }
          />
        </Section>
      )}
    </aside>
  );
}
