import { CsvAd, CsvRowResult, extractTitle } from './csv';

// ——— Cleanup of imported job listings ———
// Preprocesses the rows parsed from the file before uploading them in batches:
// removes sentences with contact details from the description, moves the
// requirements section to its column, and drops rows left without a
// description or phone. Everything is deterministic and shown in a preview.

export interface CleanedRow {
  line: number;
  values: Partial<CsvAd>;
  // Reasons why the row won't be imported; empty = row ready.
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

// Lowercase and without accents, preserving length ("á" -> "a"): allows
// searching the folded text and slicing the original with the same indices.
function fold(s: string): string {
  let out = '';
  for (const ch of s.split('')) {
    const base = ch.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    out += (base.length === 1 ? base : ch).toLowerCase();
  }
  return out;
}

// References to phones or contact channels (on folded text). Includes
// common Spanish variations and Bolivian mobile numbers.
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
    // "Bare" numbers: mobile phones (8 digits, starting with 6/7) or similar.
    '\\b\\d{7,8}\\b',
  ].join('|'),
);

// Requirement headings inside the description. Nouns accept a colon, dash
// or period; verb phrases ("se requiere") only a colon, so they aren't
// confused with the listing's wording ("Se requiere ayudante de cocina" is
// the job offer, not a requirement).
const BOUNDARY = '(?:^|\\n|(?<=[.!?;])\\s*)';
const REQ_HEADER_RE = new RegExp(
  `${BOUNDARY}(?:los\\s+)?(?:requisitos?|requerimientos?|perfil(?:\\s+(?:requerido|solicitado|del?\\s+(?:puesto|candidato|postulante)))?|condiciones|indispensable)\\s*[:\\-–.]\\s*` +
    `|${BOUNDARY}(?:se\\s+(?:requiere|solicita|pide|necesita)|debe\\s+cumplir(?:\\s+con)?)\\s*:\\s*`,
);

// "Ver descripción", "Consultar descripción" and the like in the
// requirements column: they are filler, not real requirements.
const PLACEHOLDER_RE =
  /^\W*(?:ver|consultar|revisar|leer|segun|idem)\s+(?:la\s+|el\s+)?(?:descripcion|descripciones|detalle|anuncio|aviso)\W*$/;

// Removes the sentences (or comma-separated chunks) that refer to a contact,
// keeping the rest of the description.
function stripContact(text: string): string {
  const lines = text.split(/\n/).map((line) => {
    const sentences = line.split(/(?<=[.!?;])\s+/);
    return sentences
      .map((sentence) => {
        if (!CONTACT_RE.test(fold(sentence))) return sentence;
        // Within a mixed sentence the chunks without contact info are kept:
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

// Splits the requirements section off the description (if present): from the
// heading to the end. Returns both parts without the heading.
function splitRequirements(text: string): { description: string; requirements: string } {
  const m = REQ_HEADER_RE.exec(fold(text));
  if (!m) return { description: text, requirements: '' };
  return {
    description: text.slice(0, m.index),
    requirements: text.slice(m.index + m[0].length),
  };
}

// Final cleanup of a cell: repeated spaces and line breaks, duplicated or
// orphaned punctuation after removing fragments.
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

    // 1) Description: contact details removed, and the requirements section
    //    moves to its column.
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

    // 1b) The title is also stripped of contact details; if it ends up empty
    //     it is derived again from the cleaned description.
    if (original.title) {
      let cleanTitle = tidy(stripContact(original.title));
      if (!cleanTitle && values.description) {
        cleanTitle = extractTitle(values.description).title;
      }
      values.title = cleanTitle || original.title;
    }

    // 2) Requirements column: if empty or with filler like "Ver descripción"
    //    it is filled with the extracted text; if it has its own content,
    //    the extracted text is appended so it isn't lost.
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

    // 3) Rows that aren't imported after processing.
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
