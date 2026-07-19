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
import { Icon } from './Icon';

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

// Sección colapsable: el encabezado abierto se pinta como píldora ámbar
// (estilo del mock); cerrado queda como fila discreta con icono.
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          open
            ? 'bg-secondary-container font-bold text-on-secondary-container'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <Icon name={icon} className="text-sm" />
        <span className="flex-1">{title}</span>
        <Icon name={open ? 'expand_less' : 'expand_more'} className="text-sm" />
      </button>
      {open && <div className="mt-3 space-y-2 pl-2">{children}</div>}
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
    // py-1.5 + checkbox de 20px: objetivo táctil cómodo en móvil.
    <label className="group flex cursor-pointer items-center justify-between py-1.5 text-base text-on-surface-variant transition-colors hover:text-on-surface">
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-5 w-5 rounded border-outline accent-primary"
        />
        <span className="transition-colors group-hover:text-primary">
          {label}
        </span>
      </span>
      {count != null && <span className="text-xs text-outline">{count}</span>}
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
    'absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-surface-container-lowest shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-on-surface-variant">
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
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded bg-surface-container-high" />
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

// Ancho de la columna: crece con la pantalla (más aire en monitores grandes).
const SIDEBAR_WIDTH = 'w-full shrink-0 md:w-64 xl:w-72 2xl:w-80';

// Barra lateral de filtros: jornada, categoría, departamento y salario.
// En móvil se colapsa tras un botón "Filtros" con el conteo de activos.
export function FiltersSidebar({
  value,
  facets,
  onChange,
  total,
}: {
  value: Filters;
  facets: Facets | null;
  onChange: (f: Filters) => void;
  // Resultados con los filtros actuales: alimenta el botón "Ver N
  // resultados" que cierra el panel en móvil.
  total?: number | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
        className={`${SIDEBAR_WIDTH} hidden rounded-xl border border-outline-variant bg-surface-container-low p-5 md:block`}
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

  const activeCount =
    value.jobType.length +
    value.category.length +
    value.department.length +
    (value.salaryMin != null || value.salaryMax != null ? 1 : 0);
  const hasFilters = activeCount > 0;

  const categories = Object.keys(CATEGORY_LABEL) as Category[];
  const departments = Object.keys(DEPARTMENT_LABEL) as Department[];

  return (
    <div className={`${SIDEBAR_WIDTH} md:sticky md:top-24`}>
      {/* Móvil: botón que muestra/oculta los filtros. */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        aria-controls="filtros-panel"
        className="flex w-full items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface shadow-sm md:hidden"
      >
        <Icon name="tune" className="text-lg" />
        Filtros
        {hasFilters && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-container px-1.5 text-xs font-bold text-on-secondary-container">
            {activeCount}
          </span>
        )}
        <Icon
          name="expand_more"
          className={`ml-auto text-outline transition-transform ${
            mobileOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <aside
        id="filtros-panel"
        className={`${
          mobileOpen ? 'mt-2 block' : 'hidden'
        } space-y-5 rounded-xl border border-outline-variant bg-surface-container-low p-5 shadow-sm md:mt-0 md:block`}
      >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-on-surface">
            Filtros
          </h2>
          <p className="text-xs text-on-surface-variant">Refina tu búsqueda</p>
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => onChange(NO_FILTERS)}
            className="text-xs font-bold text-primary hover:underline"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <Section title="Tipo de jornada" icon="schedule">
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

      <Section title="Categoría" icon="category">
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

      <Section title="Departamento" icon="location_on">
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

      <Section title="Salario (Bs)" icon="payments">
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
          <p className="text-xs text-outline">
            {facets.salaryMax > 0
              ? `Todas las ofertas actuales pagan Bs ${facets.salaryMax.toLocaleString('es-BO')}.`
              : 'Sin ofertas con salario publicado.'}
          </p>
        )}
      </Section>

      {/* Móvil: cierra el panel mostrando cuántos resultados esperan
          debajo (el listado ya se actualizó en vivo). */}
      <button
        type="button"
        onClick={() => setMobileOpen(false)}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition-all hover:brightness-110 active:scale-95 md:hidden"
      >
        {total != null
          ? `Ver ${total} ${total === 1 ? 'resultado' : 'resultados'}`
          : 'Ver resultados'}
      </button>
      </aside>
    </div>
  );
}
