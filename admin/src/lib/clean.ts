import { CsvAd, CsvRowResult, extractTitle } from './csv';

// ——— Limpieza de ofertas importadas ———
// Preprocesa las filas parseadas del archivo antes de subirlas por lotes:
// quita de la descripción las frases con datos de contacto, mueve la sección
// de requisitos a su columna, y descarta las filas que quedan sin descripción
// o sin teléfono. Todo es determinista y se muestra en una vista previa.

export interface CleanedRow {
  line: number;
  values: Partial<CsvAd>;
  // Motivos por los que la fila no se importará; vacío = fila lista.
  removedReasons: string[];
  descriptionModified: boolean;
  requirementsExtracted: boolean;
  placeholderReplaced: boolean;
}

export interface CleanStats {
  total: number;
  removed: number;
  descriptionsModified: number;
  requirementsExtracted: number;
  placeholdersReplaced: number;
}

export interface CleanResult {
  rows: CleanedRow[];
  stats: CleanStats;
}

// Minúsculas y sin tildes, conservando la longitud ("á" -> "a"): permite
// buscar sobre el texto plegado y cortar el original con los mismos índices.
function fold(s: string): string {
  let out = '';
  for (const ch of s.split('')) {
    const base = ch.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    out += (base.length === 1 ? base : ch).toLowerCase();
  }
  return out;
}

// Referencias a teléfono o medios de contacto (sobre texto plegado). Incluye
// variaciones comunes en español y números de celular bolivianos.
const CONTACT_RE = new RegExp(
  [
    '\\btel(?:f|efono)?s?\\b',
    '\\bfono\\b',
    'whatsapp?',
    '\\bwsp\\b',
    '\\bwasap\\b',
    '\\bwapp\\b',
    '\\bwpp\\b',
    '\\bcel(?:ular(?:es)?)?\\b',
    '\\bllam\\w+',
    '\\bcontact\\w+',
    '\\bcomunic\\w+',
    '\\binformes\\b',
    '(?:mayor|mas) informacion',
    'informacion al \\d',
    'numero de contacto',
    '\\bnro\\.? de contacto',
    'datos de contacto',
    '\\+?591[\\s.-]?\\d',
    // Números "pelados": celulares (8 dígitos, empiezan en 6/7) o similares.
    '\\b\\d{7,8}\\b',
  ].join('|'),
);

// Encabezados de requisitos dentro de la descripción. Los sustantivos aceptan
// dos puntos, guion o punto; las frases con verbo ("se requiere") solo con dos
// puntos, para no confundirlas con la redacción del anuncio ("Se requiere
// ayudante de cocina" es la oferta, no un requisito).
const BOUNDARY = '(?:^|\\n|(?<=[.!?;])\\s*)';
const REQ_HEADER_RE = new RegExp(
  `${BOUNDARY}(?:los\\s+)?(?:requisitos?|requerimientos?|perfil(?:\\s+(?:requerido|solicitado|del?\\s+(?:puesto|candidato|postulante)))?|condiciones|indispensable)\\s*[:\\-–.]\\s*` +
    `|${BOUNDARY}(?:se\\s+(?:requiere|solicita|pide|necesita)|debe\\s+cumplir(?:\\s+con)?)\\s*:\\s*`,
);

// "Ver descripción", "Consultar descripción" y similares en la columna
// de requisitos: son relleno, no requisitos reales.
const PLACEHOLDER_RE =
  /^\W*(?:ver|consultar|revisar|leer|segun|idem)\s+(?:la\s+|el\s+)?(?:descripcion|descripciones|detalle|anuncio|aviso)\W*$/;

// Quita las oraciones (o tramos entre comas) que refieren a un contacto,
// conservando el resto de la descripción.
function stripContact(text: string): string {
  const lines = text.split(/\n/).map((line) => {
    const sentences = line.split(/(?<=[.!?;])\s+/);
    return sentences
      .map((sentence) => {
        if (!CONTACT_RE.test(fold(sentence))) return sentence;
        // Dentro de una oración mixta se conservan los tramos sin contacto:
        // "Se busca vendedor, llamar al 71111111" -> "Se busca vendedor".
        return sentence
          .split(',')
          .filter((part) => !CONTACT_RE.test(fold(part)))
          .join(',');
      })
      .filter((s) => s.trim() !== '')
      .join(' ');
  });
  return lines.filter((l) => l.trim() !== '').join('\n');
}

// Separa la sección de requisitos de la descripción (si existe): desde el
// encabezado hasta el final. Devuelve ambas partes sin el encabezado.
function splitRequirements(text: string): { description: string; requirements: string } {
  const m = REQ_HEADER_RE.exec(fold(text));
  if (!m) return { description: text, requirements: '' };
  return {
    description: text.slice(0, m.index),
    requirements: text.slice(m.index + m[0].length),
  };
}

// Limpieza final de una celda: espacios y saltos repetidos, puntuación
// duplicada o huérfana tras quitar fragmentos.
function tidy(s: string): string {
  return s
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/ ([.,;:!?])/g, '$1')
    .replace(/([.,;:])(?:\s*\1)+/g, '$1')
    .replace(/,\s*([.;:])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/^[\s.,;:¡!¿?·|–-]+/g, '')
    .replace(/[\s,;:¡¿·|–-]+$/g, '')
    .trim();
}

export function cleanRows(rows: CsvRowResult[]): CleanResult {
  const stats: CleanStats = {
    total: rows.length,
    removed: 0,
    descriptionsModified: 0,
    requirementsExtracted: 0,
    placeholdersReplaced: 0,
  };

  const cleaned = rows.map((row): CleanedRow => {
    const original = row.values;
    const values: Partial<CsvAd> = { ...original };
    let descriptionModified = false;
    let requirementsExtracted = false;
    let placeholderReplaced = false;

    // 1) Descripción: fuera datos de contacto, y la sección de requisitos
    //    pasa a su columna.
    let extracted = '';
    if (original.description) {
      const { description, requirements } = splitRequirements(
        stripContact(original.description),
      );
      const cleanDescription = tidy(description);
      extracted = tidy(requirements);
      descriptionModified = cleanDescription !== original.description;
      values.description = cleanDescription || undefined;
    }

    // 1b) El título también se limpia de datos de contacto; si queda vacío
    //     se vuelve a derivar de la descripción ya limpia.
    if (original.title) {
      let cleanTitle = tidy(stripContact(original.title));
      if (!cleanTitle && values.description) {
        cleanTitle = extractTitle(values.description).title;
      }
      values.title = cleanTitle || original.title;
    }

    // 2) Columna Requisitos: vacía o con relleno tipo "Ver descripción" se
    //    completa con lo extraído; con contenido propio, lo extraído se
    //    añade al final para no perderlo.
    const existing = (original.requirements ?? '').trim();
    if (existing && PLACEHOLDER_RE.test(fold(existing))) {
      values.requirements = extracted || undefined;
      placeholderReplaced = true;
    } else if (!existing) {
      values.requirements = extracted || undefined;
    } else if (extracted) {
      values.requirements = tidy(`${existing}\n${extracted}`);
    }
    if (extracted) requirementsExtracted = true;

    // 3) Filas que no se importan tras el procesamiento.
    const removedReasons: string[] = [];
    if (!original.description) {
      removedReasons.push('Sin descripción');
    } else if (!values.description) {
      removedReasons.push('La descripción quedó vacía tras la limpieza');
    }
    if (!original.phone) removedReasons.push('Sin teléfono de contacto');

    if (removedReasons.length) stats.removed++;
    if (descriptionModified) stats.descriptionsModified++;
    if (requirementsExtracted) stats.requirementsExtracted++;
    if (placeholderReplaced) stats.placeholdersReplaced++;

    return {
      line: row.line,
      values,
      removedReasons,
      descriptionModified,
      requirementsExtracted,
      placeholderReplaced,
    };
  });

  return { rows: cleaned, stats };
}
