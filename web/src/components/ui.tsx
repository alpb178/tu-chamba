import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

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
    // Píldora del CTA principal ("Publicar oferta de trabajo").
    accent:
      'rounded-full bg-primary-container text-on-primary-container font-bold hover:shadow-lg',
  }[variant];
  return (
    <button
      className={`px-4 py-2 text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${styles} ${className}`}
      {...props}
    />
  );
}

// Acción con solo icono: el nombre va en el tooltip (title) y en aria-label.
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
      'border border-error/40 bg-surface-container-lowest text-error hover:border-error hover:bg-error hover:text-on-error',
  }[variant];
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${styles} ${className}`}
      {...props}
    >
      <Icon name={icon} className="text-lg" />
    </button>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-base text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
      {...props}
    />
  );
}

export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  // Muestra el asterisco de campo obligatorio junto a la etiqueta.
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-on-surface-variant">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-error">
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
