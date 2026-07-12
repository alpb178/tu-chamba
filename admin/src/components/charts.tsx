'use client';

import { DayPoint } from '@/lib/types';

// Gráficos del dashboard hechos con Tailwind (sin librería de gráficos).
// Especificación: barras ≤24px, punta redondeada solo en el extremo del dato,
// una sola serie por gráfico (el título nombra la serie, sin leyenda).

// 'YYYY-MM-DD' → 'd/M' sin pasar por Date (evita desfases de zona horaria).
function dayLabel(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(day)}/${Number(month)}`;
}

// Columnas por día con tooltip al pasar el mouse. Solo se etiqueta el máximo;
// el resto de valores vive en el tooltip.
export function DailyColumns({
  data,
  color = '#004ac6',
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
              <div className="pointer-events-none absolute -top-1 z-10 hidden -translate-y-full whitespace-nowrap rounded-md bg-inverse-surface px-2 py-1 text-xs text-white group-hover:block">
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

// Barras horizontales con el valor en la punta (una sola serie/tono).
export function HorizontalBars({
  data,
  color = '#004ac6',
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

// Tarjeta contenedora de un gráfico del dashboard.
export function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-on-surface-variant">{title}</h2>
      {children}
    </div>
  );
}
