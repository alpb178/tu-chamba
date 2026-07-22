'use client';

import Link from 'next/link';
import { DayPoint, HourPoint } from '@/lib/admin/types';
import { Icon } from './Icon';

// Gráficos del dashboard hechos con Tailwind (sin librería de gráficos).
// Especificación: barras ≤24px, punta redondeada solo en el extremo del dato,
// una sola serie por gráfico (el título nombra la serie, sin leyenda).

// Azul de marca por defecto de las gráficas. Corresponde al token
// --c-primary (0 74 198); va como literal porque el SVG/canvas no resuelve
// variables CSS de forma fiable en el atributo color.
const BRAND_GREEN = '#6DBA74'; // token --c-primary (verde de Iris)

// 'YYYY-MM-DD' → 'd/M' sin pasar por Date (evita desfases de zona horaria).
function dayLabel(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(day)}/${Number(month)}`;
}

// Columnas por día con tooltip al pasar el mouse. Solo se etiqueta el máximo;
// el resto de valores vive en el tooltip.
export function DailyColumns({
  data,
  color = BRAND_GREEN,
  unit,
}: {
  data: DayPoint[];
  color?: string;
  unit: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const hasData = data.some((d) => d.total > 0);

  return (
    <div>
      <div className="flex h-40 items-end gap-1">
        {data.map((d) => {
          const isMax = hasData && d.total === max;
          return (
            <div
              key={d.date}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              <div className="pointer-events-none absolute -top-1 z-10 hidden -translate-y-full whitespace-nowrap bg-inverse-surface px-2 py-1 text-xs text-inverse-on-surface group-hover:block">
                {dayLabel(d.date)} — {d.total} {unit}
              </div>
              {isMax && (
                <span className="mb-0.5 text-xs font-medium text-on-surface-variant">
                  {d.total}
                </span>
              )}
              {d.total > 0 ? (
                <div
                  className="w-full max-w-[24px] rounded-t"
                  style={{
                    backgroundColor: color,
                    height: `${(d.total / max) * 100}%`,
                    minHeight: 3,
                  }}
                />
              ) : (
                <div className="h-[3px] w-full max-w-[24px] rounded bg-surface-container-high" />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1 border-t border-outline-variant pt-1">
        {data.map((d, i) => (
          <span
            key={d.date}
            className="flex-1 text-center text-[10px] text-on-surface-variant"
          >
            {/* Día por medio (siempre el último) evita choques con 14 columnas. */}
            {(data.length - 1 - i) % 2 === 0 ? dayLabel(d.date) : ''}
          </span>
        ))}
      </div>
      {!hasData && (
        <p className="mt-2 text-center text-xs text-outline">
          Sin registros en los últimos {data.length} días.
        </p>
      )}
    </div>
  );
}

// Columnas por hora del día (0-23) con tooltip; mismo lenguaje visual que
// DailyColumns. Solo se etiqueta la hora pico; el eje marca cada 3 horas.
export function HourlyColumns({
  data,
  color = BRAND_GREEN,
  unit,
}: {
  data: HourPoint[];
  color?: string;
  unit: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const hasData = data.some((d) => d.total > 0);
  const maxIndex = data.findIndex((d) => d.total === max);

  return (
    <div>
      <div className="flex h-40 items-end gap-0.5">
        {data.map((d, i) => (
          <div
            key={d.hour}
            className="group relative flex h-full flex-1 flex-col items-center justify-end"
          >
            <div className="pointer-events-none absolute -top-1 z-10 hidden -translate-y-full whitespace-nowrap bg-inverse-surface px-2 py-1 text-xs text-inverse-on-surface group-hover:block">
              {d.hour}:00–{d.hour}:59 — {d.total} {unit}
            </div>
            {hasData && i === maxIndex && (
              <span className="mb-0.5 text-xs font-medium text-on-surface-variant">
                {d.total}
              </span>
            )}
            {d.total > 0 ? (
              <div
                className="w-full max-w-[24px] rounded-t"
                style={{
                  backgroundColor: color,
                  height: `${(d.total / max) * 100}%`,
                  minHeight: 3,
                }}
              />
            ) : (
              <div className="h-[3px] w-full max-w-[24px] rounded bg-surface-container-high" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-0.5 border-t border-outline-variant pt-1">
        {data.map((d) => (
          <span
            key={d.hour}
            className="flex-1 text-center text-[10px] text-on-surface-variant"
          >
            {/* Cada 3 horas alcanza para ubicarse sin chocar (24 columnas). */}
            {d.hour % 3 === 0 ? `${d.hour}h` : ''}
          </span>
        ))}
      </div>
      {!hasData && (
        <p className="mt-2 text-center text-xs text-outline">
          Sin visitas en los últimos 7 días.
        </p>
      )}
    </div>
  );
}

// Línea por día con puntos y tooltip (una sola serie; el título nombra la
// serie). La línea vive en un SVG porcentual con trazo sin escalar y los
// puntos son divs absolutos, así nada se deforma al cambiar el ancho.
export function DailyLine({
  data,
  color = BRAND_GREEN,
  unit,
}: {
  data: DayPoint[];
  color?: string;
  unit: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const hasData = data.some((d) => d.total > 0);
  const n = data.length;
  // Margen vertical: 6% arriba (etiqueta del máximo) y 6% abajo (puntos en 0).
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const y = (total: number) => 6 + (1 - total / max) * 88;
  const points = data.map((d, i) => `${x(i)},${y(d.total)}`).join(' ');
  // Ya se etiquetó el máximo (solo el primero, si se repite).
  const maxIndex = data.findIndex((d) => d.total === max);

  return (
    <div>
      <div className="relative h-40">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {hasData && (
            <polygon
              points={`${points} ${x(n - 1)},94 ${x(0)},94`}
              fill={color}
              opacity="0.08"
            />
          )}
          {hasData && (
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {/* Una celda por día: zona de hover ancha, punto y tooltip. */}
        <div className="absolute inset-0 flex">
          {data.map((d, i) => (
            <div key={d.date} className="group relative h-full flex-1">
              <div
                className="pointer-events-none absolute z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap bg-inverse-surface px-2 py-1 text-xs text-inverse-on-surface group-hover:block"
                style={{ left: `${50}%`, top: `calc(${y(d.total)}% - 8px)` }}
              >
                {dayLabel(d.date)} — {d.total} {unit}
              </div>
              {hasData && i === maxIndex && (
                <span
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-full pb-1 text-xs font-medium text-on-surface-variant"
                  style={{ left: '50%', top: `${y(d.total)}%` }}
                >
                  {d.total}
                </span>
              )}
              {/* Punto del día: con dato lleva el tono de la serie; en 0 (o
                  sin datos) queda un punto neutro sobre la línea base. */}
              <span
                className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform group-hover:scale-150 ${
                  d.total > 0
                    ? 'border-2 border-surface-container-lowest'
                    : 'bg-surface-container-high'
                }`}
                style={{
                  left: '50%',
                  top: `${y(d.total)}%`,
                  ...(d.total > 0 ? { backgroundColor: color } : {}),
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 flex gap-1 border-t border-outline-variant pt-1">
        {data.map((d, i) => (
          <span
            key={d.date}
            className="flex-1 text-center text-[10px] text-on-surface-variant"
          >
            {(data.length - 1 - i) % 2 === 0 ? dayLabel(d.date) : ''}
          </span>
        ))}
      </div>
      {!hasData && (
        <p className="mt-2 text-center text-xs text-outline">
          Sin registros en los últimos {data.length} días.
        </p>
      )}
    </div>
  );
}

// Barras horizontales con el valor en la punta (una sola serie/tono).
export function HorizontalBars({
  data,
  color = BRAND_GREEN,
}: {
  data: { label: string; total: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-sm text-on-surface-variant">{d.label}</span>
          <div className="flex flex-1 items-center gap-2">
            <div
              className="h-3 rounded-r"
              style={{
                backgroundColor: color,
                width: `${(d.total / max) * 100}%`,
                minWidth: d.total > 0 ? 6 : 0,
              }}
            />
            <span className="text-sm font-medium text-on-surface-variant">{d.total}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Tarjeta contenedora de un gráfico del dashboard. Con href, toda la
// tarjeta es un acceso directo a la sección a la que pertenece la serie
// (los tooltips por hover del gráfico siguen funcionando igual).
export function ChartCard({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  const base =
    'border border-outline-variant bg-surface-container-lowest p-5 shadow-aceternity';
  if (!href) {
    return (
      <div className={base}>
        <h2 className="mb-4 text-sm font-medium text-on-surface-variant">{title}</h2>
        {children}
      </div>
    );
  }
  return (
    // Grupo con nombre: el hover de la tarjeta no debe disparar los
    // tooltips internos del gráfico (que usan el grupo sin nombre).
    <Link
      href={href}
      title="Ver la sección"
      className={`group/card block transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-derek ${base}`}
    >
      <h2 className="mb-4 flex items-center justify-between gap-2 text-sm font-medium text-on-surface-variant">
        {title}
        <Icon
          name="chevron_right"
          className="shrink-0 text-lg text-outline opacity-0 transition-opacity group-hover/card:opacity-100"
        />
      </h2>
      {children}
    </Link>
  );
}
