'use client';

import { Icon } from './Icon';

// Paginación numerada del panel, la misma del portal web: a la izquierda
// el rango mostrado y a la derecha los botones de página con puntos
// suspensivos para saltos grandes.
function pageItems(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (page <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
  if (page >= totalPages - 3) {
    return [
      1,
      '…',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [1, '…', page - 1, page, page + 1, '…', totalPages];
}

const ITEM_CLASS =
  'flex h-9 min-w-9 items-center justify-center px-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary';

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
      <p className="text-sm text-on-surface-variant">
        Mostrando del <span className="font-medium text-on-surface">{from}</span> al{' '}
        <span className="font-medium text-on-surface">{to}</span> de{' '}
        <span className="font-medium text-on-surface">{total}</span>{' '}
        {total === 1 ? 'resultado' : 'resultados'}
      </p>

      <nav
        aria-label="Paginación"
        className="flex divide-x divide-outline-variant overflow-hidden border border-outline-variant bg-surface-container-lowest"
      >
        <button
          type="button"
          className={`${ITEM_CLASS} text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:hover:bg-transparent`}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Página anterior"
        >
          <Icon name="chevron_left" className="text-lg" />
        </button>

        {pageItems(page, totalPages).map((item, i) =>
          item === '…' ? (
            <span
              key={`gap-${i}`}
              className={`${ITEM_CLASS} text-on-surface-variant`}
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-current={item === page ? 'page' : undefined}
              aria-label={`Página ${item}`}
              className={`${ITEM_CLASS} ${
                item === page
                  ? 'bg-primary font-bold text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          className={`${ITEM_CLASS} text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:hover:bg-transparent`}
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Página siguiente"
        >
          <Icon name="chevron_right" className="text-lg" />
        </button>
      </nav>
    </div>
  );
}
