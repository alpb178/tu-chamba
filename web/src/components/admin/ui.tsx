import { ButtonHTMLAttributes, Children, InputHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { JobType, JOB_TYPE_LABEL } from '@/lib/admin/types';
import { Icon } from './Icon';

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger';
}) {
  const styles = {
    primary:
      'bg-primary text-on-primary font-semibold shadow-aceternity hover:-translate-y-0.5 hover:shadow-md hover:brightness-110',
    outline:
      'border border-outline-variant bg-surface-container-lowest text-on-surface-variant font-medium hover:-translate-y-0.5 hover:border-primary hover:text-primary',
    danger:
      'bg-error text-on-error font-semibold shadow-aceternity hover:-translate-y-0.5 hover:shadow-md hover:brightness-110',
  }[variant];
  return (
    <button
      className={`px-3 py-1.5 text-sm transition-all duration-300 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${styles} ${className}`}
      {...props}
    />
  );
}

// Acción de fila con solo icono: el nombre de la acción va en el tooltip
// (title) y en aria-label para lectores de pantalla.
export function IconButton({
  icon,
  label,
  variant = 'outline',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: string;
  label: string;
  variant?: 'outline' | 'primary' | 'danger';
}) {
  const styles = {
    outline:
      'border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary',
    primary: 'bg-primary text-on-primary hover:brightness-110',
    danger:
      'border border-error/40 bg-surface-container-lowest text-error hover:bg-error hover:text-on-error hover:border-error',
  }[variant];
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${styles} ${className}`}
      {...props}
    >
      <Icon name={icon} className="text-lg" />
    </button>
  );
}

// Checkbox de selección de filas (borrado por lotes) en las tablas.
export function SelectCheckbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      className="h-4 w-4 cursor-pointer accent-primary"
      {...props}
    />
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
      {...props}
    />
  );
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

// Chips de jornada con los contenedores de la paleta (ámbar/verde/azul).
const BADGE_COLORS: Record<JobType, string> = {
  DIARIA: 'bg-secondary-container text-on-secondary-container',
  TIEMPO_COMPLETO: 'bg-tertiary-container text-on-tertiary-container',
  MEDIA_JORNADA: 'bg-brand-light text-primary',
};

export function Badge({ type }: { type: JobType }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] ${BADGE_COLORS[type]}`}>
      {JOB_TYPE_LABEL[type]}
    </span>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm border border-outline-variant bg-surface-container-lowest p-6 shadow-aceternity">
        <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
        <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: ReactNode[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto border border-outline-variant bg-surface-container-lowest shadow-aceternity">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/60 [&>tr]:transition-colors [&>tr:hover]:bg-surface-container-low">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// Tabla estándar del panel: encapsula los cuatro estados de una tabla con
// datos remotos. Primera carga -> skeleton; recarga con datos previos ->
// tabla atenuada (transición suave, sin parpadeo); error -> mensaje; sin
// filas -> una fila de "sin datos" dentro de la propia tabla.
export function AdminTable({
  headers,
  loading = false,
  error = null,
  empty = 'No hay datos.',
  skeletonRows = 8,
  children,
}: {
  headers: ReactNode[];
  loading?: boolean;
  error?: string | null;
  empty?: string;
  skeletonRows?: number;
  children?: ReactNode;
}) {
  const rows = Children.toArray(children);
  if (error) return <p className="text-sm text-error">{error}</p>;
  if (loading && rows.length === 0) {
    return <TableSkeleton headers={headers} rows={skeletonRows} />;
  }
  return (
    <div
      aria-busy={loading}
      className={`transition-opacity duration-300 ${
        loading ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <DataTable headers={headers}>
        {rows.length > 0 ? (
          rows
        ) : (
          <tr>
            <td
              colSpan={headers.length}
              className="px-4 py-10 text-center text-sm text-on-surface-variant"
            >
              {empty}
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}

// Con href, el KPI es un acceso directo a la sección a la que pertenece.
export function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-sm text-on-surface-variant">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-primary">{value}</p>
    </>
  );
  const base =
    'border border-outline-variant bg-surface-container-lowest p-5 shadow-aceternity';
  if (!href) return <div className={base}>{body}</div>;
  return (
    <Link
      href={href}
      title="Ver la sección"
      className={`group relative block transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md ${base}`}
    >
      {body}
      <Icon
        name="chevron_right"
        className="absolute right-3 top-3 text-lg text-outline opacity-0 transition-opacity group-hover:opacity-100"
      />
    </Link>
  );
}

// ——— Skeletons: siluetas de carga con pulso, en vez de "Cargando..." ———

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-container-high ${className}`} />;
}

// Tabla en carga: mismas cabeceras reales, filas con siluetas.
export function TableSkeleton({
  headers,
  rows = 6,
}: {
  headers: ReactNode[];
  rows?: number;
}) {
  return (
    <div aria-hidden="true">
      <DataTable headers={headers}>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {headers.map((_, c) => (
              <td key={c} className="px-4 py-3">
                <Skeleton className={`h-4 ${c === 0 ? 'w-32' : 'w-20'}`} />
              </td>
            ))}
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="border border-outline-variant bg-surface-container-lowest p-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-8 w-16" />
    </div>
  );
}

export function ChartCardSkeleton({ height = 'h-40' }: { height?: string }) {
  return (
    <div className="border border-outline-variant bg-surface-container-lowest p-5">
      <Skeleton className="h-4 w-56" />
      <Skeleton className={`mt-4 w-full ${height}`} />
    </div>
  );
}
