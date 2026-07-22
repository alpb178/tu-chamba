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
import { cn } from '@/lib/cn';
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

// Sección colapsable (estilo editorial de Iris): título en versalitas con un
// "+" que gira a "×" al abrir, separadas por una línea inferior. Radio 0.
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-outline-variant py-5 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-on-surface">
        {title}
        <span
          className="text-on-surface transition-transform group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}

// Fila de opción con checkbox cuadrado (radio 0) y contador de facetas.
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
    <li>
      <label className="group flex cursor-pointer items-center gap-3 py-1">
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center border transition-colors',
            checked
              ? 'border-on-surface bg-on-surface text-inverse-on-surface'
              : 'border-on-surface/30 bg-background group-hover:border-on-surface',
          )}
          aria-hidden
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
              <path
                d="M2.5 6.5L5 9L9.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
          )}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onToggle}
        />
        <span className="flex-1 text-sm text-on-surface">{label}</span>
        {count != null && (
          <span className="text-xs text-on-surface-variant">{count}</span>
        )}
      </label>
    </li>
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

  // Manija: único elemento redondeado (rounded-full), como en Iris. La pista y
  // el tramo activo van con esquinas rectas (radio 0).
  const thumbClass =
    'absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-surface-container-lowest shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-on-surface">
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
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 bg-outline-variant" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 bg-brand"
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

// Contenido de la barra lateral de filtros: jornada, categoría, departamento y
// salario. Es puro contenido (sin ancho ni posición propios): la columna de
// ~220px en escritorio y el drawer móvil los gestiona el listado (home-client).
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
      <aside aria-hidden="true" className="text-sm">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 border-b border-outline-variant py-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </aside>
    );
  }

  const activeCount =
    value.jobType.length +
    value.category.length +
    value.department.length +
    (value.salaryMin != null || value.salaryMax != null ? 1 : 0);
  const hasFilters = activeCount > 0;

  const categories = Object.keys(CATEGORY_LABEL) as Category[];
  const departments = Object.keys(DEPARTMENT_LABEL) as Department[];

  return (
    <aside aria-label="Filtros" className="text-sm">
      <div className="flex items-center justify-between pb-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface">
          Filtros
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => onChange(NO_FILTERS)}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant underline-offset-4 hover:text-on-surface hover:underline"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <Section title="Tipo de jornada">
        <ul className="space-y-2">
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
        </ul>
      </Section>

      <Section title="Categoría">
        <ul className="space-y-2">
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
        </ul>
      </Section>

      <Section title="Departamento">
        <ul className="space-y-2">
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
        </ul>
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
          <p className="text-xs text-on-surface-variant">
            {facets.salaryMax > 0
              ? `Todas las ofertas actuales pagan Bs ${facets.salaryMax.toLocaleString('es-BO')}.`
              : 'Sin ofertas con salario publicado.'}
          </p>
        )}
      </Section>
    </aside>
  );
}
