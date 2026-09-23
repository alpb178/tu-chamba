'use client';

/**
 * The language menu, shared by every site of the CORPSC group.
 *
 * This file is the same in all five sites (portfolio, Tu Chamba, Iris Natural,
 * Take, Invoices); change it everywhere or nowhere. Each site only wires it:
 * it passes the current locale, one href per locale (the same page in that
 * language, query string included) and, optionally, its own Link component.
 *
 * - Every option is a real link, so crawlers and no-JS visitors can switch too.
 * - Colours come from CSS variables with neutral fallbacks, so it takes each
 *   brand's palette without depending on that site's Tailwind config:
 *     button: --lang-fg, --lang-bg, --lang-border
 *     menu:   --lang-menu-bg, --lang-menu-fg, --lang-menu-border,
 *             --lang-accent (current item and focus ring), --lang-hover
 * - Keyboard: Enter/Space/ArrowDown open it, arrows move, Escape closes and
 *   returns focus to the button, Tab leaves it.
 */

import { useEffect, useId, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';

export interface LanguageOption {
  /** Locale code as it appears in the URL: `es`, `en`, `pt`. */
  code: string;
  /** Name in its own language: `Español`, `English`, `Português`. */
  label: string;
  /** BCP 47 tag for hreflang/lang: `es`, `en`, `pt-BR`. */
  hrefLang: string;
  /** The current page in that language. */
  href: string;
}

type LinkLike = ComponentType<{
  ref?: (node: HTMLAnchorElement | null) => void;
  href: string;
  className?: string;
  style?: CSSProperties;
  hrefLang?: string;
  lang?: string;
  role?: string;
  tabIndex?: number;
  "aria-current"?: "true" | undefined;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}>;

interface Props {
  current: string;
  options: LanguageOption[];
  /** The site's Link (next/link, next-intl…). Defaults to a plain anchor. */
  linkAs?: LinkLike;
  /** Accessible name of the button, in the current language. */
  label: string;
  /** Open the menu upwards (e.g. in a footer). */
  placement?: 'bottom' | 'top';
  /** Align the menu to the button's left or right edge. */
  align?: 'start' | 'end';
  className?: string;
  /** Called after a language is picked (e.g. to close a mobile menu). */
  onSelect?: (code: string) => void;
}

const GlobeIcon = () => (
  <svg width={16} height={16} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.75} aria-hidden='true'>
    <circle cx={12} cy={12} r={9} />
    <path d='M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z' />
  </svg>
);

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width={12}
    height={12}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    aria-hidden='true'
    style={{ transition: 'transform 150ms ease', transform: open ? 'rotate(180deg)' : undefined }}
  >
    <path d='m6 9 6 6 6-6' />
  </svg>
);

const Check = () => (
  <svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.25} aria-hidden='true'>
    <path d='m5 12 5 5 9-10' />
  </svg>
);

export function LanguageSwitcher({
  current,
  options,
  linkAs,
  label,
  placement = 'bottom',
  align = 'end',
  className,
  onSelect,
}: Props) {
  const Link = (linkAs ?? 'a') as LinkLike;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const menuId = useId();

  const active = options.find((o) => o.code === current) ?? options[0];

  // Clicking or focusing outside closes it.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  // On open, focus the current language so arrows start from there. It is
  // found through the DOM and the effect depends on `open` alone: a site that
  // rebuilds `options` on every render must not yank focus back to the current
  // language while the visitor is moving through the list.
  useEffect(() => {
    if (!open) return;
    const items = itemsRef.current;
    (items.find((node) => node?.getAttribute('aria-current') === 'true') ?? items[0])?.focus();
  }, [open]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  const onItemKey = (event: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
    const last = options.length - 1;
    const move = (to: number) => {
      event.preventDefault();
      itemsRef.current[to]?.focus();
    };
    if (event.key === 'ArrowDown') move(index === last ? 0 : index + 1);
    else if (event.key === 'ArrowUp') move(index === 0 ? last : index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(last);
    else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') close(false);
  };

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block' }}
      onBlur={(event) => {
        if (open && !rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type='button'
        aria-haspopup='true'
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${label}: ${active.label}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 999,
          border: '1px solid var(--lang-border, rgba(0, 0, 0, 0.15))',
          background: 'var(--lang-bg, transparent)',
          color: 'var(--lang-fg, currentColor)',
          font: 'inherit',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        <GlobeIcon />
        <span>{active.code}</span>
        <Chevron open={open} />
      </button>

      <ul
        id={menuId}
        hidden={!open}
        style={{
          position: 'absolute',
          zIndex: 60,
          [placement === 'bottom' ? 'top' : 'bottom']: 'calc(100% + 6px)',
          [align === 'end' ? 'right' : 'left']: 0,
          minWidth: 168,
          margin: 0,
          padding: 6,
          listStyle: 'none',
          borderRadius: 10,
          border: '1px solid var(--lang-menu-border, rgba(0, 0, 0, 0.12))',
          background: 'var(--lang-menu-bg, #ffffff)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
        }}
      >
        {options.map((option, index) => {
          const isCurrent = option.code === active.code;
          return (
            <li key={option.code}>
              <Link
                ref={(node: HTMLAnchorElement | null) => {
                  itemsRef.current[index] = node;
                }}
                href={option.href}
                hrefLang={option.hrefLang}
                lang={option.hrefLang}
                aria-current={isCurrent ? 'true' : undefined}
                tabIndex={open ? 0 : -1}
                onKeyDown={(event: React.KeyboardEvent<HTMLAnchorElement>) => onItemKey(event, index)}
                onClick={() => {
                  setOpen(false);
                  onSelect?.(option.code);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '8px 10px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? 'var(--lang-accent, currentColor)' : 'var(--lang-menu-fg, #1f2937)',
                }}
                className='lang-switcher-item'
              >
                <span>{option.label}</span>
                {isCurrent ? <Check /> : null}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Hover and keyboard focus for the items, without a stylesheet per site. */}
      <style>{`.lang-switcher-item:hover,.lang-switcher-item:focus-visible{background:var(--lang-hover,rgba(0,0,0,.05))}.lang-switcher-item:focus-visible{outline:2px solid var(--lang-accent,currentColor);outline-offset:-2px}`}</style>
    </div>
  );
}

/** The three languages of the group, named in their own language. */
export const GROUP_LANGUAGES = [
  { code: 'es', label: 'Español', hrefLang: 'es' },
  { code: 'en', label: 'English', hrefLang: 'en' },
  { code: 'pt', label: 'Português', hrefLang: 'pt-BR' },
] as const;
