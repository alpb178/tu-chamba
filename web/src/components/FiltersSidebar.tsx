'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Category,
  CATEGORY_LABEL,
  Department,
  DEPARTMENT_LABEL,
  Facets,
  JobType,
  JOB_TYPE_LABEL,
} from '@/lib/types';
import { Skeleton } from './Skeleton';

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

// Slider de salario con dos manijas (rango) sobre una pista. El arrastre se
// maneja con Pointer Events propios sobre la pista: el truco de dos <input
// type="range"> superpuestos depende de pointer-events en el pseudo-elemento
// del thumb, que Safari no soporta (el filtro "no funcionaba" en Mac/iOS).
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
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'lo' | 'hi' | null>(null);
  // Espejo de los valores para leerlos en pointerup sin closures desfasadas.
  const values = useRef({ lo: minValue, hi: maxValue });

  useEffect(() => {
    setLo(minValue);
    setHi(maxValue);
    values.current = { lo: minValue, hi: maxValue };
  }, [minValue, maxValue]);

  if (max <= min) return null;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const keyStep = Math.max(1, Math.round((max - min) / 50));

  const valueAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(min + ratio * (max - min));
  };

  function setValue(which: 'lo' | 'hi', v: number) {
    if (which === 'lo') {
      const next = Math.max(min, Math.min(v, values.current.hi));
      values.current.lo = next;
      setLo(next);
    } else {
      const next = Math.min(max, Math.max(v, values.current.lo));
      values.current.hi = next;
      setHi(next);
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const v = valueAt(e.clientX);
    // Arrastra la manija más cercana al punto tocado.
    dragging.current =
      Math.abs(v - values.current.lo) <= Math.abs(v - values.current.hi)
        ? 'lo'
        : 'hi';
    e.currentTarget.setPointerCapture(e.pointerId);
    setValue(dragging.current, v);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragging.current) setValue(dragging.current, valueAt(e.clientX));
  }

  function onPointerEnd() {
    if (!dragging.current) return;
    dragging.current = null;
    onCommit(values.current.lo, values.current.hi);
  }

  function onThumbKey(which: 'lo' | 'hi') {
    return (e: React.KeyboardEvent) => {
      const current = which === 'lo' ? values.current.lo : values.current.hi;
      const delta =
        e.key === 'ArrowLeft' || e.key === 'ArrowDown'
          ? -keyStep
          : e.key === 'ArrowRight' || e.key === 'ArrowUp'
            ? keyStep
            : null;
      if (delta == null) return;
      e.preventDefault();
      setValue(which, current + delta);
      onCommit(values.current.lo, values.current.hi);
    };
  }

  const thumbClass =
    'absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-gray-700">
        <span>Bs {lo.toLocaleString('es-BO')}</span>
        <span>Bs {hi.toLocaleString('es-BO')}</span>
      </div>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className="relative h-5 cursor-pointer touch-none"
      >
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded bg-gray-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-brand"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Salario mínimo"
          aria-valuemin={min}
          aria-valuemax={hi}
          aria-valuenow={lo}
          onKeyDown={onThumbKey('lo')}
          className={thumbClass}
          style={{ left: `${pct(lo)}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Salario máximo"
          aria-valuemin={lo}
          aria-valuemax={max}
          aria-valuenow={hi}
          onKeyDown={onThumbKey('hi')}
          className={thumbClass}
          style={{ left: `${pct(hi)}%` }}
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

  // Mientras cargan las facetas, la barra muestra su silueta.
  if (!facets) {
    return (
      <aside
        aria-hidden="true"
        className="w-full shrink-0 rounded-lg border border-gray-200 bg-white p-4 md:w-64"
      >
        <Skeleton className="h-4 w-16" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="mt-5 space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </aside>
    );
  }

  const hasFilters =
    value.jobType.length ||
    value.department.length ||
    value.category.length ||
    value.salaryMin != null ||
    value.salaryMax != null;

  const categories = Object.keys(CATEGORY_LABEL) as Category[];
  const departments = Object.keys(DEPARTMENT_LABEL) as Department[];

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

      <Section title="Salario (Bs)">
        {facets.salaryMax > facets.salaryMin ? (
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
        ) : (
          // Sin rango no hay nada que filtrar: se informa en vez de ocultar.
          <p className="text-xs text-gray-400">
            {facets.salaryMax > 0
              ? `Todas las ofertas actuales pagan Bs ${facets.salaryMax.toLocaleString('es-BO')}.`
              : 'Sin ofertas con salario publicado.'}
          </p>
        )}
      </Section>
    </aside>
  );
}
