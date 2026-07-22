import { describe, it, expect } from 'vitest';
import { cleanRows } from './clean';

// Construye una fila como la produce parseAdsCsv.
function row(values: Record<string, unknown>) {
  return { line: 2, values, errors: [] } as never;
}

describe('cleanRows (preprocesado de anuncios)', () => {
  it('quita el tramo con teléfono conservando lo demás de la oración', () => {
    const res = cleanRows([
      row({ description: 'Se busca vendedor, llamar al 71111111', phone: '71111111' }),
    ]);
    expect(res.rows[0].values.description).toBe('Se busca vendedor');
    expect(res.rows[0].descriptionModified).toBe(true);
  });

  it('marca para eliminar la fila que queda sin descripción tras limpiar', () => {
    const res = cleanRows([
      row({ description: 'Escribe al wsp 70000000', phone: '70000000' }),
    ]);
    // Si toda la descripción era contacto, queda vacía -> motivo de eliminación.
    expect(res.rows[0].removedReasons.length).toBeGreaterThan(0);
    expect(res.stats.removed).toBe(1);
  });

  it('una descripción limpia no se marca como modificada', () => {
    const res = cleanRows([
      row({ description: 'Atención al cliente en tienda', phone: '70012345' }),
    ]);
    expect(res.rows[0].descriptionModified).toBe(false);
    expect(res.rows[0].removedReasons).toHaveLength(0);
  });

  it('la fila sin teléfono se marca para eliminar', () => {
    const res = cleanRows([row({ description: 'Vendedor de tienda' })]);
    expect(res.rows[0].removedReasons).toContain('Sin teléfono de contacto');
  });

  it('cuenta el total de filas procesadas', () => {
    const res = cleanRows([
      row({ description: 'A', phone: '70012345' }),
      row({ description: 'B', phone: '70012346' }),
    ]);
    expect(res.stats.total).toBe(2);
  });
});
