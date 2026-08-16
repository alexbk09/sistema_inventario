/**
 * TableSkeleton — Skeleton loader para tablas
 *
 * @param {number} rows    - Número de filas skeleton (default 6)
 * @param {number} cols    - Número de columnas (default 5)
 */
export default function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="animate-pulse space-y-0">
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0"
        >
          {Array.from({ length: cols }).map((_, ci) => {
            const widths = ['w-32', 'w-40', 'w-24', 'w-20', 'w-28'];
            return (
              <div
                key={ci}
                className={`h-4 rounded bg-muted ${widths[ci % widths.length]}`}
              />
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-muted" />
            <div className="w-7 h-7 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * CardSkeleton — Skeleton para grid de cards (productos)
 *
 * @param {number} count - Número de cards skeleton
 */
export function CardSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-card border border-border rounded-xl overflow-hidden">
          <div className="aspect-square bg-muted" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="flex items-center justify-between mt-2">
              <div className="h-5 bg-muted rounded w-16" />
              <div className="h-5 bg-muted rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * StatsSkeleton — Skeleton para fila de KPI cards
 *
 * @param {number} count - Número de KPI cards
 */
export function StatsSkeleton({ count = 4 }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-muted" />
            <div className="h-3 bg-muted rounded w-24" />
          </div>
          <div className="h-8 bg-muted rounded w-20" />
        </div>
      ))}
    </div>
  );
}
