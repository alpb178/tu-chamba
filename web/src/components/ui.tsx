import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger' | 'accent';
}) {
  const styles = {
    primary:
      'rounded-lg bg-primary text-on-primary font-bold hover:brightness-110',
    outline:
      'rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant font-medium hover:border-primary hover:text-primary',
    danger: 'rounded-lg bg-error text-on-error font-bold hover:brightness-110',
    // Píldora del CTA principal ("Publicar anuncio").
    accent:
      'rounded-full bg-primary-container text-on-primary-container font-bold hover:shadow-lg',
  }[variant];
  return (
    <button
      className={`px-4 py-2 text-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${styles} ${className}`}
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
      className={`w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
      {...props}
    >
      {children}
    </select>
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
