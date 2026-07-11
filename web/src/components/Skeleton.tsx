// Bloques de carga (skeletons) que replican la silueta del contenido real,
// en lugar de un texto "Cargando...". Todos pulsan con animate-pulse.

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-container-high ${className}`} />;
}

// Silueta de una AdCard del listado.
export function AdCardSkeleton() {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="mt-2 flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

export function AdListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <AdCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Silueta de una reseña (detalle del anuncio).
export function ReviewSkeleton() {
  return (
    <li className="rounded-md bg-surface-container-low p-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-2 h-4 w-3/4" />
    </li>
  );
}
