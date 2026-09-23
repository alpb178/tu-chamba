import {
  ButtonHTMLAttributes,
  ComponentType,
  ElementType,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react';
import { Icon } from './Icon';
import { cn } from '@/lib/cn';

// Site UI primitives with the editorial language ported from Iris Natural:
// square corners, "aceternity" shadow, slight lift on hover and pills
// reserved for brand CTAs. Keeps the M3 palette (blue + amber).

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger' | 'accent';
}) {
  const styles = {
    primary:
      'bg-primary text-on-primary font-semibold shadow-aceternity hover:-translate-y-0.5 hover:shadow-md hover:brightness-110',
    outline:
      'border border-outline-variant bg-surface-container-lowest text-on-surface-variant font-medium hover:-translate-y-0.5 hover:border-primary hover:text-primary',
    danger:
      'bg-error text-on-error font-semibold shadow-aceternity hover:-translate-y-0.5 hover:shadow-md hover:brightness-110',
    // Pill for the main CTA ("Publicar oferta de trabajo"), in the brand amber
    // (same token as the filters). The only rounded shape.
    accent:
      'rounded-full bg-secondary-container text-on-secondary-container font-bold uppercase tracking-[0.12em] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg',
  }[variant];
  return (
    <button
      className={cn(
        'px-5 py-2.5 text-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
        styles,
        className
      )}
      {...props}
    />
  );
}

// Icon-only action: the name goes in the tooltip (title) and in aria-label.
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
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100',
        styles,
        className
      )}
      {...props}
    >
      <Icon name={icon} className="text-lg" />
    </button>
  );
}

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-base text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary',
        className
      )}
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
  // Shows the required-field asterisk next to the label.
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

// ——— Editorial primitives (ported from Iris Natural) ———

// Base card with border, aceternity shadow and rounded corners
// (`rounded-card`, the token shared by every card in the portal).
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-outline-variant bg-surface-container-lowest p-6 shadow-aceternity',
        className
      )}
    >
      {children}
    </div>
  );
}

// Editorial headline (Merriweather serif) with scalable sizes. Uses the
// text-balance utility instead of react-wrap-balancer.
export function Heading({
  className,
  as: Tag = 'h2',
  children,
  size = 'md',
  ...props
}: {
  className?: string;
  as?: ElementType;
  children: ReactNode;
  size?: 'sm' | 'md' | 'xl' | '2xl';
} & HTMLAttributes<HTMLHeadingElement>) {
  const sizeVariants = {
    sm: 'text-xl md:text-2xl md:leading-snug',
    md: 'text-3xl md:text-4xl md:leading-tight',
    xl: 'text-4xl md:text-6xl md:leading-none',
    '2xl': 'text-5xl md:text-7xl md:leading-none',
  };
  const Component = Tag as ComponentType<HTMLAttributes<HTMLElement>>;
  return (
    <Component
      className={cn(
        'font-display font-semibold tracking-tight text-on-surface text-balance',
        sizeVariants[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// Section subtitle/lead.
export function Subheading({
  className,
  as: Tag = 'p',
  children,
  ...props
}: {
  className?: string;
  as?: ElementType;
  children: ReactNode;
} & HTMLAttributes<HTMLParagraphElement>) {
  const Component = Tag as ComponentType<HTMLAttributes<HTMLElement>>;
  return (
    <Component
      className={cn(
        'text-sm font-normal text-on-surface-variant text-balance md:text-base',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
