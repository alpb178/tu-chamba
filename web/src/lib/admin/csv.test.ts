import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  parseAdsCsv,
  extractTitle,
  parseSalary,
  parsePhones,
} from './csv';

describe('parseCsv (robust CSV parser)', () => {
  it('detects the semicolon separator and drops empty lines', () => {
    const rows = parseCsv('a;b;c\n1;2;3\n\n');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('keeps commas inside quotes and escaped quotes', () => {
    const rows = parseCsv('descripcion,telefono\n"Hola, mundo ""x""",70012345');
    expect(rows[1]).toEqual(['Hola, mundo "x"', '70012345']);
  });

  it('strips the Excel BOM and supports CRLF', () => {
    const rows = parseCsv('﻿a,b\r\n1,2\r\n');
    expect(rows[0]).toEqual(['a', 'b']);
    expect(rows[1]).toEqual(['1', '2']);
  });
});

describe('extractTitle', () => {
  it('takes the first sentence as the title and keeps the rest', () => {
    const { title, rest } = extractTitle('Vendedor de tienda. Turno tarde.');
    expect(title).toBe('Vendedor de tienda');
    expect(rest).toBe('Turno tarde.');
  });
  it('without punctuation uses the whole description as the title', () => {
    expect(extractTitle('Cajero medio tiempo').title).toBe('Cajero medio tiempo');
  });
});

describe('parseAdsCsv (validation and import)', () => {
  it('reports missing required headers', () => {
    const res = parseAdsCsv('nombre,edad\nAna,30');
    expect(res.headerError).toMatch(/Faltan columnas/);
    expect(res.rows).toHaveLength(0);
  });

  it('warns when there is only a header', () => {
    const res = parseAdsCsv('descripcion,telefono');
    expect(res.headerError).toMatch(/solo contiene la cabecera/);
  });

  it('flags an error on rows without description or phone', () => {
    const res = parseAdsCsv(
      'descripcion,telefono\n,70012345\nVendedor,123',
    );
    expect(res.rows[0].errors).toContain('La descripción es obligatoria');
    expect(res.rows[1].errors).toContain('El teléfono es obligatorio');
  });

  it('fills defaults (department, category, job type) and derives the title', () => {
    const res = parseAdsCsv(
      'descripcion,telefono\n"Se busca cajero. Turno noche.",70012345',
    );
    const row = res.rows[0];
    expect(row.errors).toHaveLength(0);
    expect(row.values.title).toBe('Se busca cajero');
    expect(row.values.description).toBe('Turno noche.');
    expect(row.values.department).toBe('SANTA_CRUZ');
    expect(row.values.category).toBe('OTRO');
    // Without a declared job type, full-time is not assumed (it'd be made-up data).
    expect(row.values.jobType).toBe('A_CONVENIR');
    expect(row.values.durationDays).toBe(7);
    expect(row.line).toBe(2);
  });

  it('parses salary in Bolivian format (dot as thousands separator)', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,salario\nVendedor,70012345,"Bs 3.500"',
    );
    expect(res.rows[0].values.salary).toBe(3500);
  });

  it('treats "No especificado" as an empty cell', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,ubicacion\nVendedor,70012345,No especificado',
    );
    expect(res.rows[0].values.location).toBeUndefined();
  });
});

describe('parseSalary (amounts and ranges)', () => {
  it('a single amount does not produce a range', () => {
    expect(parseSalary('3000')).toEqual({ salary: 3000 });
    expect(parseSalary('Bs 2.500,50')).toEqual({ salary: 2500.5 });
  });

  it('recognizes ranges with hyphen, "a" and en dash', () => {
    expect(parseSalary('3500-4500')).toEqual({ salary: 3500, salaryMax: 4500 });
    expect(parseSalary('2000 a 3000')).toEqual({ salary: 2000, salaryMax: 3000 });
    expect(parseSalary('Bs 2.700 – 2.800')).toEqual({
      salary: 2700,
      salaryMax: 2800,
    });
  });

  it('fixes a reversed range and drops text without an amount', () => {
    expect(parseSalary('4500-3500')).toEqual({ salary: 3500, salaryMax: 4500 });
    expect(parseSalary('a convenir')).toBeNull();
  });
});

describe('parsePhones (several numbers per cell)', () => {
  it('splits by slash, comma and "y", without duplicates', () => {
    expect(parsePhones('77900185 / 67894829')).toEqual(['77900185', '67894829']);
    expect(parsePhones('70012345, 3467010')).toEqual(['70012345', '3467010']);
    expect(parsePhones('70012345 y 70012345')).toEqual(['70012345']);
  });

  it('drops anything shorter than 7 digits', () => {
    expect(parsePhones('123 / 70012345')).toEqual(['70012345']);
    expect(parsePhones('No especificado')).toEqual([]);
  });
});

describe('parseAdsCsv — phones, ranges and reference', () => {
  it('the first number is the main one and the rest are additional', () => {
    const res = parseAdsCsv(
      'descripcion,telefono\nVendedor,"77900185 / 67894829 / 3467010"',
    );
    const row = res.rows[0];
    expect(row.errors).toHaveLength(0);
    expect(row.values.phone).toBe('77900185');
    expect(row.values.extraPhones).toEqual(['67894829', '3467010']);
  });

  it('a salary range fills floor and ceiling', () => {
    const res = parseAdsCsv('descripcion,telefono,salario\nVendedor,70012345,3500-4500');
    expect(res.rows[0].values.salary).toBe(3500);
    expect(res.rows[0].values.salaryMax).toBe(4500);
  });

  it('the max salary column is ignored if it does not exceed the floor', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,salario,salarioMax\nVendedor,70012345,3000,2500',
    );
    expect(res.rows[0].values.salary).toBe(3000);
    expect(res.rows[0].values.salaryMax).toBeUndefined();
  });

  it('maps the source categories to our own', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,categoria\nA,70012345,HOGAR_LIMPIEZA\nB,70012345,CHOFERES\nC,70012345,VARIOS\nD,70012345,AGROPECUARIA',
    );
    expect(res.rows.map((r) => r.values.category)).toEqual([
      'LIMPIEZA',
      'TRANSPORTE',
      'OTRO',
      'AGROPECUARIA',
    ]);
  });

  it('accepts the new job types and their synonyms', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,tipoJornada\nA,70012345,POR_CONTRATO\nB,70012345,practicas\nC,70012345,Independiente',
    );
    expect(res.rows.map((r) => r.values.jobType)).toEqual([
      'POR_CONTRATO',
      'PASANTIA',
      'FREELANCE',
    ]);
  });

  it('reads the location reference', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,referencia\nVendedor,70012345,"Frente al mercado Los Pozos"',
    );
    expect(res.rows[0].values.locationReference).toBe('Frente al mercado Los Pozos');
  });
});
