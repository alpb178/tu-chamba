'use client';

import { useState } from 'react';

// Selección de filas para el borrado por lotes de las tablas del panel.
// Los ids marcados se conservan al cambiar de página o de filtro.
export function useSelection(pageIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allInPage =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Marca o desmarca todas las filas de la página visible.
  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allInPage) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
  }

  return { selected, allInPage, toggleOne, togglePage, clear };
}
