'use client';

import Link from 'next/link';
import { DayPoint, HourPoint } from '@/lib/admin/types';
import { Icon } from './Icon';

// Dashboard charts built with Tailwind (no charting library).
// Spec: bars ≤24px, rounded tip only at the data end, a single series per
// chart (the title names the series, no legend).

// Default brand blue for the charts. Matches the --c-primary token
// (0 74 198); it's a literal because SVG/canvas doesn't reliably resolve CSS
// variables in the color attribute.
const BRAND_BLUE = '#004AC6'; // --c-primary token (tu-chamba blue)

// 'YYYY-MM-DD' → 'd/M' without going through Date (avoids timezone shifts).
function dayLabel(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(day)}/${Number(month)}`;
}

// Daily columns with a hover tooltip. Only the maximum is labeled; the other
// values live in the tooltip.
export function DailyColumns({
  data,
  color = BRAND_BLUE,
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
            {/* Every other day (always the last) avoids overlaps with 14 columns. */}
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

// Columns per hour of day (0-23) with a tooltip; same visual language as
// DailyColumns. Only the peak hour is labeled; the axis marks every 3 hours.
export function HourlyColumns({
  data,
  color = BRAND_BLUE,
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
            {/* Every 3 hours is enough to orient without overlaps (24 columns). */}
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

// Daily line with dots and a tooltip (a single series; the title names the
// series). The line lives in a percentage-based SVG with a non-scaling stroke
// and the dots are absolute divs, so nothing distorts when the width changes.
export function DailyLine({
  data,
  color = BRAND_BLUE,
  unit,
}: {
  data: DayPoint[];
  color?: string;
  unit: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const hasData = data.some((d) => d.total > 0);
  const n = data.length;
  // Vertical margin: 6% on top (max label) and 6% at the bottom (dots at 0).
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const y = (total: number) => 6 + (1 - total / max) * 88;
  const points = data.map((d, i) => `${x(i)},${y(d.total)}`).join(' ');
  // Whether the max has been labeled (only the first one, if repeated).
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
        {/* One cell per day: wide hover area, dot and tooltip. */}
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
              {/* The day's dot: with data it takes the series tone; at 0 (or
                  with no data) it's a neutral dot on the baseline. */}
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

// Horizontal bars with the value at the tip (a single series/tone).
export function HorizontalBars({
  data,
  color = BRAND_BLUE,
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

// Container card for a dashboard chart. With href, the whole card is a
// shortcut to the section the series belongs to (the chart's hover tooltips
// still work the same).
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
    'rounded-card border border-outline-variant bg-surface-container-lowest p-5 shadow-aceternity';
  if (!href) {
    return (
      <div className={base}>
        <h2 className="mb-4 text-sm font-medium text-on-surface-variant">{title}</h2>
        {children}
      </div>
    );
  }
  return (
    // Named group: hovering the card must not trigger the chart's inner
    // tooltips (which use the unnamed group).
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
