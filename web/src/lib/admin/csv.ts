import {
  Category,
  CATEGORY_LABEL,
  Department,
  DEPARTMENT_LABEL,
  DURATION_DAYS,
  JobType,
  JOB_TYPE_LABEL,
} from './types';

// Payload de una oferta lista para enviar a POST /listings/bulk.
export interface CsvAd {
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  department: Department;
  category: Category;
  schedule?: string;
  // Sin salario el anuncio queda "a convenir" (no se asigna valor por defecto).
  salary?: number;
  phone: string;
  jobType: JobType;
  durationDays: number;
}

// Resultado de una fila del archivo: valores mapeados (para la vista previa)
// y errores de validación. Sin errores, `values` es un CsvAd completo.
export interface CsvRowResult {
  // Línea del archivo (1-based, contando la cabecera) para reportar errores.
  line: number;
  values: Partial<CsvAd>;
  errors: string[];
}

export interface ParsedCsv {
  // Error de estructura (cabecera inválida); si existe, no hay filas.
  headerError?: string;
  rows: CsvRowResult[];
}

// ——— Parser CSV mínimo (RFC 4180) ———
// Soporta campos entrecomillados (con comas, saltos de línea y "" escapadas)
// y detecta si el separador es coma o punto y coma (Excel en español exporta
// con ';'). Suficiente para las plantillas del panel sin sumar dependencias.

function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.slice(0, text.indexOf('\n') === -1 ? undefined : text.indexOf('\n'));
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  return semis > commas ? ';' : ',';
}

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, ''); // BOM de Excel
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
  // Filas totalmente vacías (líneas en blanco al final, etc.) se descartan.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

// ——— Mapeo de cabeceras y valores ———

// "Tipo de jornada" -> "tipodejornada": sin tildes ni separadores.
function normalizeKey(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

// "Tiempo completo" -> "TIEMPO_COMPLETO": mismo formato que los enums de la API.
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

// Cabeceras aceptadas (en español —como la plantilla— o el nombre del campo
// de la API), ya normalizadas con normalizeKey.
const HEADER_ALIASES: Record<string, Field> = {
  titulo: 'title',
  title: 'title',
  descripcion: 'description',
  description: 'description',
  requisitos: 'requirements',
  requirements: 'requirements',
  ubicacion: 'location',
  location: 'location',
  departamento: 'department',
  department: 'department',
  categoria: 'category',
  category: 'category',
  rubro: 'category',
  horario: 'schedule',
  schedule: 'schedule',
  salario: 'salary',
  salary: 'salary',
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

// Campo obligatorio -> nombre de columna como aparece en la plantilla,
// para reportar cabeceras faltantes con el nombre que ve el admin.
// Solo descripción y teléfono bloquean la importación; el resto de columnas
// es opcional y se completa con valores por defecto.
const REQUIRED_HEADERS: Record<string, Field> = {
  descripcion: 'description',
  telefono: 'phone',
};

// Acepta tanto el valor del enum (SANTA_CRUZ) como su etiqueta ("Santa Cruz").
function enumMatcher<T extends string>(labels: Record<T, string>) {
  const map = new Map<string, T>();
  for (const [value, label] of Object.entries(labels) as [T, string][]) {
    map.set(normalizeEnum(value), value);
    map.set(normalizeEnum(label), value);
  }
  return (raw: string): T | null => map.get(normalizeEnum(raw)) ?? null;
}

const matchDepartment = enumMatcher<Department>(DEPARTMENT_LABEL);
const matchCategory = enumMatcher<Category>(CATEGORY_LABEL);
const matchJobType = enumMatcher<JobType>(JOB_TYPE_LABEL);

// Título derivado de la descripción cuando el archivo no trae la columna:
// la primera oración (hasta el primer punto, signo o salto de línea), con
// tope de 100 caracteres. Solo se recorta de la descripción si queda resto.
export function extractTitle(description: string): { title: string; rest: string } {
  const cut = description.search(/[.!?\n]/);
  const title = (cut === -1 ? description : description.slice(0, cut))
    .trim()
    .slice(0, 100);
  const rest = cut === -1 ? '' : description.slice(cut + 1).trim();
  if (!title) return { title: description.trim().slice(0, 100), rest: '' };
  return { title, rest };
}

// "Bs 2.500,50" -> 2500.5. Acepta coma o punto decimal (formato es-BO o en-US).
function parseSalary(raw: string): number | null {
  let s = raw.replace(/[^\d.,-]/g, '');
  s = s.replace(/[.,]+$/, ''); // separador colgante: "3.500." -> "3.500"
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  // Solo punto y agrupando de a 3: es separador de miles ("3.000" -> 3000).
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Convierte el texto de un CSV en filas validadas listas para importar.
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
      // Placeholder típico de archivos extraídos: equivale a celda vacía
      // (si quedara, se mostraría literalmente en ubicación u horario).
      raw[field] = normalizeKey(value) === 'noespecificado' ? '' : value;
    });

    const values: Partial<CsvAd> = {};
    const errors: string[] = [];

    // Solo la descripción y el teléfono bloquean la fila; el resto se
    // completa con valores por defecto cuando falta o no coincide.
    if (raw.description) values.description = raw.description;
    else errors.push('La descripción es obligatoria');

    // Título: el de la columna o, si falta, la primera oración de la
    // descripción (que se recorta de esta si queda contenido después).
    if (raw.title) {
      values.title = raw.title.slice(0, 100);
    } else if (values.description) {
      const { title, rest } = extractTitle(values.description);
      values.title = title;
      if (rest) values.description = rest;
    }

    // Un teléfono real tiene al menos 7 dígitos; textos como "No especificado"
    // cuentan como fila sin teléfono.
    const phoneDigits = (raw.phone ?? '').replace(/\D/g, '');
    if (phoneDigits.length >= 7) values.phone = raw.phone;
    else errors.push('El teléfono es obligatorio');

    if (raw.requirements) values.requirements = raw.requirements;

    if (raw.location) values.location = raw.location;

    const department = raw.department ? matchDepartment(raw.department) : null;
    values.department = department ?? 'SANTA_CRUZ';

    const category = raw.category ? matchCategory(raw.category) : null;
    values.category = category ?? 'OTRO';

    if (raw.schedule) values.schedule = raw.schedule;

    // Sin salario (o con un valor no numérico) el campo queda vacío.
    const salary = raw.salary ? parseSalary(raw.salary) : null;
    if (salary != null) values.salary = salary;

    const jobType = raw.jobType ? matchJobType(raw.jobType) : null;
    values.jobType = jobType ?? 'TIEMPO_COMPLETO';

    const days = raw.durationDays ? Number(raw.durationDays) : NaN;
    values.durationDays = DURATION_DAYS.includes(days) ? days : 7;

    // +2: la fila 0 del cuerpo está en la línea 2 del archivo (tras la cabecera).
    return { line: i + 2, values, errors };
  });

  return { rows };
}

// Plantilla descargable con las cabeceras esperadas y filas de ejemplo.
export function buildTemplateCsv(): string {
  return [
    'titulo,descripcion,requisitos,ubicacion,departamento,categoria,horario,salario,telefono,tipoJornada,duracionDias',
    '"Vendedor de tienda","Se busca vendedor con experiencia en atención al cliente","Experiencia mínima de 1 año","Av. Banzer 3er anillo, zona norte",SANTA_CRUZ,VENTAS,"Lun-Vie 8:00 a 16:00",2500,71111111,TIEMPO_COMPLETO,7',
    ',"Ayudante de cocina para restaurante céntrico. Preparación de ingredientes y limpieza.",,"Calle Comercio esq. Ayacucho",LA_PAZ,GASTRONOMIA,,1800,72222222,MEDIA_JORNADA,3',
  ].join('\n');
}
