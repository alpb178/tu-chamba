import { describe, it, expect } from 'vitest';
import { parseCsv, parseAdsCsv, extractTitle } from './csv';

describe('parseCsv (parser CSV robusto)', () => {
  it('detecta el separador punto y coma y descarta líneas vacías', () => {
    const rows = parseCsv('a;b;c\n1;2;3\n\n');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('respeta comas dentro de comillas y las comillas escapadas', () => {
    const rows = parseCsv('descripcion,telefono\n"Hola, mundo ""x""",70012345');
    expect(rows[1]).toEqual(['Hola, mundo "x"', '70012345']);
  });

  it('quita el BOM de Excel y soporta CRLF', () => {
    const rows = parseCsv('﻿a,b\r\n1,2\r\n');
    expect(rows[0]).toEqual(['a', 'b']);
    expect(rows[1]).toEqual(['1', '2']);
  });
});

describe('extractTitle', () => {
  it('toma la primera oración como título y deja el resto', () => {
    const { title, rest } = extractTitle('Vendedor de tienda. Turno tarde.');
    expect(title).toBe('Vendedor de tienda');
    expect(rest).toBe('Turno tarde.');
  });
  it('sin puntuación usa toda la descripción como título', () => {
    expect(extractTitle('Cajero medio tiempo').title).toBe('Cajero medio tiempo');
  });
});

describe('parseAdsCsv (validación e importación)', () => {
  it('reporta cabeceras obligatorias faltantes', () => {
    const res = parseAdsCsv('nombre,edad\nAna,30');
    expect(res.headerError).toMatch(/Faltan columnas/);
    expect(res.rows).toHaveLength(0);
  });

  it('avisa cuando solo hay cabecera', () => {
    const res = parseAdsCsv('descripcion,telefono');
    expect(res.headerError).toMatch(/solo contiene la cabecera/);
  });

  it('marca error en filas sin descripción o sin teléfono', () => {
    const res = parseAdsCsv(
      'descripcion,telefono\n,70012345\nVendedor,123',
    );
    expect(res.rows[0].errors).toContain('La descripción es obligatoria');
    expect(res.rows[1].errors).toContain('El teléfono es obligatorio');
  });

  it('completa defaults (depto, categoría, jornada) y deriva el título', () => {
    const res = parseAdsCsv(
      'descripcion,telefono\n"Se busca cajero. Turno noche.",70012345',
    );
    const row = res.rows[0];
    expect(row.errors).toHaveLength(0);
    expect(row.values.title).toBe('Se busca cajero');
    expect(row.values.description).toBe('Turno noche.');
    expect(row.values.department).toBe('SANTA_CRUZ');
    expect(row.values.category).toBe('OTRO');
    expect(row.values.jobType).toBe('TIEMPO_COMPLETO');
    expect(row.values.durationDays).toBe(7);
    expect(row.line).toBe(2);
  });

  it('parsea salario en formato boliviano (miles con punto)', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,salario\nVendedor,70012345,"Bs 3.500"',
    );
    expect(res.rows[0].values.salary).toBe(3500);
  });

  it('trata "No especificado" como celda vacía', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,ubicacion\nVendedor,70012345,No especificado',
    );
    expect(res.rows[0].values.location).toBeUndefined();
  });
});
