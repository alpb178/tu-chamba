'use client';

import { useState } from 'react';

export function SearchBar({
  initial = '',
  onSearch,
}: {
  initial?: string;
  onSearch: (q: string) => void;
}) {
  const [q, setQ] = useState(initial);
  return (
    <form
      className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 transition-shadow focus-within:border-primary focus-within:shadow-md"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(q.trim());
      }}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-outline">
        search
      </span>
      <input
        placeholder="Buscar empleos por descripción..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full border-none bg-transparent text-sm text-on-surface outline-none placeholder:text-outline focus:ring-0"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-on-primary transition-all hover:brightness-110 active:scale-95"
      >
        Buscar
      </button>
    </form>
  );
}
