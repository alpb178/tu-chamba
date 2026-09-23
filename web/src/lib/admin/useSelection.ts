'use client';

import { useState } from 'react';

// Row selection for batch deletion in the panel tables.
// Checked ids are kept when changing page or filter.
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

  // Checks or unchecks all rows on the visible page.
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
