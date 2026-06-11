'use client';

import { useState } from 'react';
import { Button, Input } from './ui';

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
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(q.trim());
      }}
    >
      <Input
        placeholder="Buscar empleos por descripción..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Button type="submit">Buscar</Button>
    </form>
  );
}
