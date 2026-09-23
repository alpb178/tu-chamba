import { describe, it, expect } from 'vitest';
import { cleanRows } from './clean';

// Builds a row the way parseAdsCsv produces it.
function row(values: Record<string, unknown>) {
  return { line: 2, values, errors: [] } as never;
}

describe('cleanRows (listing preprocessing)', () => {
  it('removes the phone segment while keeping the rest of the sentence', () => {
    const res = cleanRows([
      row({ description: 'Se busca vendedor, llamar al 71111111', phone: '71111111' }),
    ]);
    expect(res.rows[0].values.description).toBe('Se busca vendedor');
    expect(res.rows[0].descriptionModified).toBe(true);
  });

  it('flags for removal a row left without a description after cleaning', () => {
    const res = cleanRows([
      row({ description: 'Escribe al wsp 70000000', phone: '70000000' }),
    ]);
    // If the whole description was contact info, it ends up empty -> removal
    // reason.
    expect(res.rows[0].removedReasons.length).toBeGreaterThan(0);
    expect(res.stats.removed).toBe(1);
  });

  it('a clean description is not flagged as modified', () => {
    const res = cleanRows([
      row({ description: 'Atención al cliente en tienda', phone: '70012345' }),
    ]);
    expect(res.rows[0].descriptionModified).toBe(false);
    expect(res.rows[0].removedReasons).toHaveLength(0);
  });

  it('a row without a phone is flagged for removal', () => {
    const res = cleanRows([row({ description: 'Vendedor de tienda' })]);
    expect(res.rows[0].removedReasons).toContain('Sin teléfono de contacto');
  });

  it('counts the total of processed rows', () => {
    const res = cleanRows([
      row({ description: 'A', phone: '70012345' }),
      row({ description: 'B', phone: '70012346' }),
    ]);
    expect(res.stats.total).toBe(2);
  });
});
