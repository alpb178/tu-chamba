'use client';

import { useEffect, useId, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

// Select del sistema de diseño: trigger estilo input + listbox flotante.
// Accesible con teclado (flechas, Enter, Escape, Home/End) y aria-*.
// `required` se valida vía un input oculto (validación nativa del form).
export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecciona…',
  icon,
  required = false,
  name,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  // Material Symbol opcional al inicio del trigger (p. ej. location_on).
  icon?: string;
  required?: boolean;
  name?: string;
  // Estilos extra del trigger (padding/rounding para variantes como el hero).
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value);
  const selectedIndex = options.findIndex((o) => o.value === value);

  // Cierra al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // La opción activa queda visible al navegar con teclado.
  useEffect(() => {
    if (open && active >= 0) {
      listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active]);

  function openList() {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function select(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(i + 1, options.length - 1));
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
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        select(active);
        break;
      case 'Escape':
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && active >= 0 ? `${listboxId}-${active}` : undefined
        }
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-left text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
      >
        {icon && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined shrink-0 text-outline"
          >
            {icon}
          </span>
        )}
        <span className={`flex-1 truncate ${selected ? '' : 'text-outline'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span
          aria-hidden="true"
          className={`material-symbols-outlined shrink-0 text-outline transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Validación nativa del formulario (required) sin select nativo. */}
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
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-outline-variant bg-surface-container-lowest py-1 shadow-lg"
        >
          {options.map((o, i) => (
            <li
              key={`${o.value}-${i}`}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                // mousedown evita perder el foco antes del click.
                e.preventDefault();
                select(i);
              }}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                i === active
                  ? 'bg-surface-container-low text-primary'
                  : 'text-on-surface'
              } ${o.value === value ? 'font-bold' : ''}`}
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && (
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-lg text-primary"
                >
                  check
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
