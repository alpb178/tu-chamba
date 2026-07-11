import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from 'react';
import { JobType, JOB_TYPE_LABEL } from '@/lib/types';

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger';
}) {
  const styles = {
    primary: 'bg-primary text-on-primary font-bold hover:brightness-110',
    outline:
      'border border-outline-variant bg-surface-container-lowest text-on-surface-variant font-medium hover:border-primary hover:text-primary',
    danger: 'bg-error text-on-error font-bold hover:brightness-110',
  }[variant];
  return (
    <button
      className={`rounded-lg px-3 py-1.5 text-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
      {...props}
    >
      {children}
    </select>
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
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE_COLORS[type]}`}>
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
      <div className="w-full max-w-sm rounded-lg bg-surface-container-lowest p-6 shadow-lg">
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
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/60">{children}</tbody>
      </table>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      <p className="text-sm text-on-surface-variant">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand">{value}</p>
    </div>
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
  headers: string[];
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
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-8 w-16" />
    </div>
  );
}

export function ChartCardSkeleton({ height = 'h-40' }: { height?: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      <Skeleton className="h-4 w-56" />
      <Skeleton className={`mt-4 w-full ${height}`} />
    </div>
  );
}
