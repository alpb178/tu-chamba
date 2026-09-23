import {
  Category,
  CATEGORY_LABEL,
  Department,
  DEPARTMENT_LABEL,
  DURATION_DAYS,
  JobType,
  JOB_TYPE_LABEL,
} from './types';

// Payload of a job listing ready to send to POST /listings/bulk.
export interface CsvAd {
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  locationReference?: string;
  department: Department;
  category: Category;
  schedule?: string;
  // Without a salary the listing is "a convenir" (no default value is set).
  // With salaryMax the pair is a range and salary is its lower bound.
  salary?: number;
  salaryMax?: number;
  phone: string;
  // Additional numbers in the ad ("77900185 / 67894829"): the first goes in
  // phone and the rest here.
  extraPhones?: string[];
  jobType: JobType;
  durationDays: number;
}

// Cap on additional numbers per listing (same as in the API).
export const MAX_EXTRA_PHONES = 4;

// Result for one file row: mapped values (for the preview) and validation
// errors. With no errors, `values` is a complete CsvAd.
export interface CsvRowResult {
  // File line (1-based, counting the header) for error reporting.
  line: number;
  values: Partial<CsvAd>;
  errors: string[];
}

export interface ParsedCsv {
  // Structural error (invalid header); if present, there are no rows.
  headerError?: string;
  rows: CsvRowResult[];
}

// ——— Minimal CSV parser (RFC 4180) ———
// Supports quoted fields (with commas, line breaks and escaped "") and
// detects whether the separator is a comma or a semicolon (Spanish-locale
// Excel exports with ';'). Enough for the panel's templates without adding
// dependencies.

function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.slice(0, text.indexOf('\n') === -1 ? undefined : text.indexOf('\n'));
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  return semis > commas ? ';' : ',';
}

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, ''); // Excel BOM
  const delimiter = detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  // Fully empty rows (trailing blank lines, etc.) are dropped.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

// ——— Header and value mapping ———

// "Tipo de jornada" -> "tipodejornada": no accents or separators.
function normalizeKey(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

// "Tiempo completo" -> "TIEMPO_COMPLETO": same format as the API enums.
function normalizeEnum(s: string) {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

type Field = keyof CsvAd;

// Accepted headers (in Spanish —like the template— or the API field name),
// already normalized with normalizeKey.
const HEADER_ALIASES: Record<string, Field> = {
  titulo: 'title',
  title: 'title',
  descripcion: 'description',
  description: 'description',
  requisitos: 'requirements',
  requirements: 'requirements',
  ubicacion: 'location',
  location: 'location',
  referencia: 'locationReference',
  referenciaubicacion: 'locationReference',
  locationreference: 'locationReference',
  departamento: 'department',
  department: 'department',
  categoria: 'category',
  category: 'category',
  rubro: 'category',
  horario: 'schedule',
  schedule: 'schedule',
  salario: 'salary',
  salary: 'salary',
  salariomax: 'salaryMax',
  salariohasta: 'salaryMax',
  salarymax: 'salaryMax',
  telefono: 'phone',
  phone: 'phone',
  tipojornada: 'jobType',
  tipodejornada: 'jobType',
  jornada: 'jobType',
  jobtype: 'jobType',
  duraciondias: 'durationDays',
  duracion: 'durationDays',
  durationdays: 'durationDays',
};

// Required field -> column name as it appears in the template, to report
// missing headers with the name the admin sees.
// Only description and phone block the import; the other columns are
// optional and filled with default values.
const REQUIRED_HEADERS: Record<string, Field> = {
  descripcion: 'description',
  telefono: 'phone',
};

// Accepts the enum value (SANTA_CRUZ), its label ("Santa Cruz") or a
// synonym from the source (newspaper ads use their own vocabulary).
function enumMatcher<T extends string>(
  labels: Record<T, string>,
  aliases: Record<string, T> = {},
) {
  const map = new Map<string, T>();
  for (const [value, label] of Object.entries(labels) as [T, string][]) {
    map.set(normalizeEnum(value), value);
    map.set(normalizeEnum(label), value);
  }
  for (const [alias, value] of Object.entries(aliases) as [string, T][]) {
    map.set(normalizeEnum(alias), value);
  }
  return (raw: string): T | null => map.get(normalizeEnum(raw)) ?? null;
}

// Source categories that already have an equivalent of ours: no new category
// is created for a synonym (CHOFERES is TRANSPORTE, VARIOS is OTRO).
const CATEGORY_ALIASES: Record<string, Category> = {
  VARIOS: 'OTRO',
  OTROS: 'OTRO',
  CHOFERES: 'TRANSPORTE',
  CHOFER: 'TRANSPORTE',
  HOGAR_LIMPIEZA: 'LIMPIEZA',
  LIMPIEZA_HOGAR: 'LIMPIEZA',
  MARKETING: 'MARKETING_DISENO',
  DISENO: 'MARKETING_DISENO',
  AGRICULTURA: 'AGROPECUARIA',
  GANADERIA: 'AGROPECUARIA',
};

const JOB_TYPE_ALIASES: Record<string, JobType> = {
  MEDIO_TIEMPO: 'MEDIA_JORNADA',
  TIEMPO_PARCIAL: 'MEDIA_JORNADA',
  CONTRATO: 'POR_CONTRATO',
  TEMPORAL: 'POR_CONTRATO',
  PRACTICAS: 'PASANTIA',
  PRACTICANTE: 'PASANTIA',
  INDEPENDIENTE: 'FREELANCE',
};

const matchDepartment = enumMatcher<Department>(DEPARTMENT_LABEL);
const matchCategory = enumMatcher<Category>(CATEGORY_LABEL, CATEGORY_ALIASES);
const matchJobType = enumMatcher<JobType>(JOB_TYPE_LABEL, JOB_TYPE_ALIASES);

// Title derived from the description when the file has no such column:
// the first sentence (up to the first period, mark or line break), capped
// at 100 characters. It's only cut from the description if something remains.
export function extractTitle(description: string): { title: string; rest: string } {
  const cut = description.search(/[.!?\n]/);
  const title = (cut === -1 ? description : description.slice(0, cut))
    .trim()
    .slice(0, 100);
  const rest = cut === -1 ? '' : description.slice(cut + 1).trim();
  if (!title) return { title: description.trim().slice(0, 100), rest: '' };
  return { title, rest };
}

// "Bs 2.500,50" -> 2500.5. Accepts a decimal comma or point (es-BO or en-US).
function parseAmount(raw: string): number | null {
  let s = raw.replace(/[^\d.,]/g, '');
  s = s.replace(/[.,]+$/, ''); // trailing separator: "3.500." -> "3.500"
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  // Only points grouping by 3: it's a thousands separator ("3.000" -> 3000).
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Salary in the ad: an amount ("3000") or a range ("3500-4500", "2000 a 3000",
// "Bs 2.500 – 4.000"). Returns the floor and, if it's a range, its ceiling.
export function parseSalary(
  raw: string,
): { salary: number; salaryMax?: number } | null {
  // Range separator: dash (including the long one), slash or "a"/"hasta".
  const parts = raw
    .split(/\s*(?:[-–—/]|\ba\b|\bhasta\b)\s*/i)
    .map((p) => parseAmount(p))
    .filter((n): n is number => n != null);
  if (!parts.length) return null;
  const [min, max] = [Math.min(...parts), Math.max(...parts)];
  return max > min ? { salary: min, salaryMax: max } : { salary: min };
}

// Phones in the ad: often several in one cell ("77900185 / 67894829",
// "7712 3456, 69236841"). The first is the main one and the rest become
// additional; those under 7 digits and duplicates are dropped.
export function parsePhones(raw: string): string[] {
  const candidates = raw.split(/[/,;|]|\s+(?:o|y)\s+|\s{2,}/i);
  const valid = candidates
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, '').length >= 7);
  return [...new Set(valid)].slice(0, MAX_EXTRA_PHONES + 1);
}

// Turns a CSV's text into validated rows ready to import.
export function parseAdsCsv(text: string): ParsedCsv {
  const table = parseCsv(text);
  if (table.length === 0) return { headerError: 'El archivo está vacío.', rows: [] };

  const header = table[0].map((h) => HEADER_ALIASES[normalizeKey(h)] ?? null);
  const missing = Object.keys(REQUIRED_HEADERS).filter(
    (name) => !header.includes(REQUIRED_HEADERS[name]),
  );
  if (missing.length) {
    return {
      headerError: `Faltan columnas obligatorias en la cabecera: ${missing.join(', ')}. Descarga la plantilla para ver el formato esperado.`,
      rows: [],
    };
  }
  if (table.length === 1) {
    return { headerError: 'El archivo solo contiene la cabecera, sin ofertas.', rows: [] };
  }

  const rows = table.slice(1).map((cells, i): CsvRowResult => {
    const raw: Partial<Record<Field, string>> = {};
    header.forEach((field, col) => {
      if (!field) return;
      const value = (cells[col] ?? '').trim();
      // Typical placeholder in extracted files: equivalent to an empty cell
      // (if kept, it would show literally in location or schedule).
      raw[field] = normalizeKey(value) === 'noespecificado' ? '' : value;
    });

    const values: Partial<CsvAd> = {};
    const errors: string[] = [];

    // Only description and phone block the row; the rest is filled with
    // default values when missing or not matching.
    if (raw.description) values.description = raw.description;
    else errors.push('La descripción es obligatoria');

    // Title: the column's value or, if missing, the first sentence of the
    // description (cut from it if content remains afterwards).
    if (raw.title) {
      values.title = raw.title.slice(0, 100);
    } else if (values.description) {
      const { title, rest } = extractTitle(values.description);
      values.title = title;
      if (rest) values.description = rest;
    }

    // A real phone has at least 7 digits; texts like "No especificado"
    // count as a row without a phone. If the cell has several numbers, the
    // first is the main one and the others become additional.
    const phones = parsePhones(raw.phone ?? '');
    if (phones.length) {
      values.phone = phones[0];
      if (phones.length > 1) values.extraPhones = phones.slice(1);
    } else {
      errors.push('El teléfono es obligatorio');
    }

    if (raw.requirements) values.requirements = raw.requirements;

    if (raw.location) values.location = raw.location;

    if (raw.locationReference) values.locationReference = raw.locationReference;

    const department = raw.department ? matchDepartment(raw.department) : null;
    values.department = department ?? 'SANTA_CRUZ';

    const category = raw.category ? matchCategory(raw.category) : null;
    values.category = category ?? 'OTRO';

    if (raw.schedule) values.schedule = raw.schedule;

    // Without a salary (or with a non-numeric value) the field stays empty. A
    // range in the cell ("3500-4500") also fills the ceiling; a separate max
    // salary column takes precedence over the ceiling inferred from the range.
    const salary = raw.salary ? parseSalary(raw.salary) : null;
    if (salary != null) {
      values.salary = salary.salary;
      if (salary.salaryMax != null) values.salaryMax = salary.salaryMax;
    }
    const salaryMax = raw.salaryMax ? parseAmount(raw.salaryMax) : null;
    // A ceiling below the floor is not a range: ignored (the API would reject it).
    if (salaryMax != null && values.salary != null && salaryMax > values.salary) {
      values.salaryMax = salaryMax;
    }

    // Without a declared schedule it's imported as "a convenir": previously
    // TIEMPO_COMPLETO was assumed, which was made-up data.
    const jobType = raw.jobType ? matchJobType(raw.jobType) : null;
    values.jobType = jobType ?? 'A_CONVENIR';

    const days = raw.durationDays ? Number(raw.durationDays) : NaN;
    values.durationDays = DURATION_DAYS.includes(days) ? days : 7;

    // +2: body row 0 is on line 2 of the file (after the header).
    return { line: i + 2, values, errors };
  });

  return { rows };
}

// Downloadable template with the expected headers and sample rows.
export function buildTemplateCsv(): string {
  return [
    'titulo,descripcion,requisitos,ubicacion,referencia,departamento,categoria,horario,salario,telefono,tipoJornada,duracionDias',
    // Salary accepts an amount or a range ("3500-4500"), and the phone cell
    // accepts several numbers separated by "/".
    '"Vendedor de tienda","Se busca vendedor con experiencia en atención al cliente","Experiencia mínima de 1 año","Av. Banzer 3er anillo, zona norte","Frente al supermercado",SANTA_CRUZ,VENTAS,"Lun-Vie 8:00 a 16:00",2500,71111111,TIEMPO_COMPLETO,7',
    ',"Ayudante de cocina para restaurante céntrico. Preparación de ingredientes y limpieza.",,"Calle Comercio esq. Ayacucho",,LA_PAZ,GASTRONOMIA,,1800-2400,"72222222 / 3467010",MEDIA_JORNADA,3',
  ].join('\n');
}
