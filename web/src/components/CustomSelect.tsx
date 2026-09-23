'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
}

// Accent- and case-insensitive comparison for the option search.
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

// Design-system select: input-style trigger + floating listbox.
// Keyboard accessible (arrows, Enter, Escape, Home/End) and aria-*.
// Long lists (>7 options) include a search box to filter them.
// `required` is validated via a hidden input (native form validation).
export function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  icon,
  required = false,
  name,
  className = '',
  searchable,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  // Optional Material Symbol at the start of the trigger (e.g. location_on).
  icon?: string;
  required?: boolean;
  name?: string;
  // Extra trigger styles (padding/rounding for variants like the hero).
  className?: string;
  // Search box inside the dropdown; by default only for long lists.
  searchable?: boolean;
}) {
  const t = useTranslations('home.select');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const withSearch = searchable ?? options.length > 7;
  const selected = options.find((o) => o.value === value);
  const filtered = query
    ? options.filter((o) => normalize(o.label).includes(normalize(query)))
    : options;

  // Closes on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // The search box takes focus on open; the active option stays visible.
  useEffect(() => {
    if (open && withSearch) searchRef.current?.focus();
  }, [open, withSearch]);

  useEffect(() => {
    if (open && active >= 0) {
      listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active]);

  function openList() {
    setQuery('');
    const idx = options.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function select(index: number) {
    const option = filtered[index];
    if (!option) return;
    onChange(option.value);
    close();
  }

  function onNavKey(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(filtered.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        select(active);
        break;
      case 'Escape':
        close();
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  function onTriggerKey(e: React.KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      select(active);
      return;
    }
    onNavKey(e);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && active >= 0 ? `${listboxId}-${active}` : undefined
        }
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onTriggerKey}
        className={`flex w-full items-center gap-2 border border-outline-variant bg-surface-container-lowest px-3 py-2 text-left text-base text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
      >
        {icon && (
          <Icon name={icon} className="text-outline" />
        )}
        <span className={`flex-1 truncate ${selected ? '' : 'text-outline'}`}>
          {selected ? selected.label : (placeholder ?? t('placeholder'))}
        </span>
        <Icon
          name="expand_more"
          className={`text-outline transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Native form validation (required) without a native select. */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          name={name}
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-tile border border-outline-variant bg-surface-container-lowest shadow-derek">
          {withSearch && (
            <div className="flex items-center gap-2 border-b border-outline-variant/60 px-3 py-2">
              <Icon name="search" className="text-lg text-outline" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onNavKey}
                placeholder={t('search')}
                aria-label={t('searchLabel')}
                aria-controls={listboxId}
                aria-activedescendant={
                  active >= 0 ? `${listboxId}-${active}` : undefined
                }
                className="w-full border-none bg-transparent text-base text-on-surface outline-none placeholder:text-outline focus:ring-0"
              />
            </div>
          )}

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="max-h-56 overflow-auto py-1"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-outline">
                {t('noMatches')}
              </li>
            )}
            {filtered.map((o, i) => (
              <li
                key={`${o.value}-${i}`}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  // mousedown avoids losing focus before the click.
                  e.preventDefault();
                  select(i);
                }}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-base ${
                  i === active
                    ? 'bg-surface-container-low text-primary'
                    : 'text-on-surface'
                } ${o.value === value ? 'font-bold' : ''}`}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && (
                  <Icon name="check" className="text-lg text-primary" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
