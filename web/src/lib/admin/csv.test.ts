import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  parseAdsCsv,
  extractTitle,
  parseSalary,
  parsePhones,
} from './csv';

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
    // Sin jornada declarada no se asume tiempo completo (sería dato inventado).
    expect(row.values.jobType).toBe('A_CONVENIR');
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

describe('parseSalary (montos y rangos)', () => {
  it('un solo monto no genera rango', () => {
    expect(parseSalary('3000')).toEqual({ salary: 3000 });
    expect(parseSalary('Bs 2.500,50')).toEqual({ salary: 2500.5 });
  });

  it('reconoce rangos con guion, "a" y guion largo', () => {
    expect(parseSalary('3500-4500')).toEqual({ salary: 3500, salaryMax: 4500 });
    expect(parseSalary('2000 a 3000')).toEqual({ salary: 2000, salaryMax: 3000 });
    expect(parseSalary('Bs 2.700 – 2.800')).toEqual({
      salary: 2700,
      salaryMax: 2800,
    });
  });

  it('ordena el rango al revés y descarta texto sin monto', () => {
    expect(parseSalary('4500-3500')).toEqual({ salary: 3500, salaryMax: 4500 });
    expect(parseSalary('a convenir')).toBeNull();
  });
});

describe('parsePhones (varios números por celda)', () => {
  it('separa por barra, coma y "y", sin repetidos', () => {
    expect(parsePhones('77900185 / 67894829')).toEqual(['77900185', '67894829']);
    expect(parsePhones('70012345, 3467010')).toEqual(['70012345', '3467010']);
    expect(parsePhones('70012345 y 70012345')).toEqual(['70012345']);
  });

  it('descarta lo que no llega a 7 dígitos', () => {
    expect(parsePhones('123 / 70012345')).toEqual(['70012345']);
    expect(parsePhones('No especificado')).toEqual([]);
  });
});

describe('parseAdsCsv — teléfonos, rangos y referencia', () => {
  it('el primer número es el principal y el resto adicionales', () => {
    const res = parseAdsCsv(
      'descripcion,telefono\nVendedor,"77900185 / 67894829 / 3467010"',
    );
    const row = res.rows[0];
    expect(row.errors).toHaveLength(0);
    expect(row.values.phone).toBe('77900185');
    expect(row.values.extraPhones).toEqual(['67894829', '3467010']);
  });

  it('un salario en rango llena piso y techo', () => {
    const res = parseAdsCsv('descripcion,telefono,salario\nVendedor,70012345,3500-4500');
    expect(res.rows[0].values.salary).toBe(3500);
    expect(res.rows[0].values.salaryMax).toBe(4500);
  });

  it('la columna de salario máximo se ignora si no supera el piso', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,salario,salarioMax\nVendedor,70012345,3000,2500',
    );
    expect(res.rows[0].values.salary).toBe(3000);
    expect(res.rows[0].values.salaryMax).toBeUndefined();
  });

  it('mapea los rubros de la fuente a los propios', () => {
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

  it('acepta las jornadas nuevas y sus sinónimos', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,tipoJornada\nA,70012345,POR_CONTRATO\nB,70012345,practicas\nC,70012345,Independiente',
    );
    expect(res.rows.map((r) => r.values.jobType)).toEqual([
      'POR_CONTRATO',
      'PASANTIA',
      'FREELANCE',
    ]);
  });

  it('lee la referencia de ubicación', () => {
    const res = parseAdsCsv(
      'descripcion,telefono,referencia\nVendedor,70012345,"Frente al mercado Los Pozos"',
    );
    expect(res.rows[0].values.locationReference).toBe('Frente al mercado Los Pozos');
  });
});
