'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  CATEGORY_LABEL,
  DEPARTMENT_LABEL,
  DURATION_DAYS,
  JOB_TYPE_LABEL,
  Category,
  Department,
  JobType,
} from '@/lib/types';
import { buildTemplateCsv, CsvAd, parseAdsCsv, ParsedCsv } from '@/lib/csv';
import { CleanResult, cleanRows } from '@/lib/clean';
import { AdminTable, Button, IconButton, SelectCheckbox } from '@/components/ui';
import { useSelection } from '@/lib/useSelection';

const PREVIEW_HEADERS = [
  'Línea',
  'Título',
  'Descripción',
  'Teléfono',
  'Departamento',
  'Categoría',
  'Salario',
  'Jornada',
  'Estado',
  '',
];

const CLEAN_HEADERS = [
  'Línea',
  'Título',
  'Descripción',
  'Requisitos',
  'Teléfono',
  'Cambios',
  'Estado',
  '',
];

const CELL_INPUT_CLASS =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1.5 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary';

// Celdas editables no controladas: el estado se actualiza al salir del campo
// (onBlur) para no re-renderizar toda la tabla en cada tecla.
function CellTextarea({
  value,
  onCommit,
  label,
}: {
  value: string;
  onCommit: (v: string) => void;
  label: string;
}) {
  return (
    <textarea
      className={`${CELL_INPUT_CLASS} min-w-[18rem]`}
      rows={3}
      defaultValue={value}
      aria-label={label}
      onBlur={(e) => e.target.value !== value && onCommit(e.target.value)}
    />
  );
}

function CellInput({
  value,
  onCommit,
  label,
  type = 'text',
  className = '',
}: {
  value: string;
  onCommit: (v: string) => void;
  label: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      className={`${CELL_INPUT_CLASS} ${className}`}
      defaultValue={value}
      aria-label={label}
      onBlur={(e) => e.target.value !== value && onCommit(e.target.value)}
    />
  );
}

function CellSelect<T extends string>({
  value,
  labels,
  onCommit,
  label,
}: {
  value: T;
  labels: Record<T, string>;
  onCommit: (v: T) => void;
  label: string;
}) {
  return (
    <select
      className={`${CELL_INPUT_CLASS} cursor-pointer`}
      value={value}
      aria-label={label}
      onChange={(e) => onCommit(e.target.value as T)}
    >
      {(Object.entries(labels) as [T, string][]).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

// Reglas mínimas de una fila importable (las mismas del parser CSV).
function validateValues(v: Partial<CsvAd>): string[] {
  const errors: string[] = [];
  if (!v.title) errors.push('El título es obligatorio');
  if (!v.description) errors.push('La descripción es obligatoria');
  if ((v.phone ?? '').replace(/\D/g, '').length < 7)
    errors.push('El teléfono es obligatorio');
  return errors;
}

function removedReasonsFor(v: Partial<CsvAd>): string[] {
  const reasons: string[] = [];
  if (!v.title) reasons.push('Sin título');
  if (!v.description) reasons.push('Sin descripción');
  if ((v.phone ?? '').replace(/\D/g, '').length < 7)
    reasons.push('Sin teléfono de contacto');
  return reasons;
}

export default function ImportAdsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  // Filas del archivo descartadas de entrada por no tener descripción o teléfono.
  const [discarded, setDiscarded] = useState(0);
  // Vista previa del preprocesado (limpieza); null = vista del archivo tal cual.
  const [cleaned, setCleaned] = useState<CleanResult | null>(null);
  // Cambia en cada limpieza para remontar las celdas editables con los
  // valores recién procesados (son campos no controlados).
  const [cleanGen, setCleanGen] = useState(0);
  const [importing, setImporting] = useState(false);
  const [created, setCreated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Selección para quitar varias filas de la vista previa a la vez. Las
  // filas se identifican por su número de línea del archivo.
  const visibleRows = cleaned ? cleaned.rows : parsed?.rows ?? [];
  const { selected, allInPage, toggleOne, togglePage, clear } = useSelection(
    visibleRows.map((r) => String(r.line)),
  );

  const validRows = parsed?.rows.filter((r) => r.errors.length === 0) ?? [];
  const invalidRows = parsed?.rows.filter((r) => r.errors.length > 0) ?? [];
  const cleanRowsReady = cleaned?.rows.filter((r) => r.removedReasons.length === 0) ?? [];
  const cleanRowsRemoved = (cleaned?.rows.length ?? 0) - cleanRowsReady.length;
  const importCount = cleaned ? cleanRowsReady.length : validRows.length;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Permite volver a elegir el mismo archivo tras corregirlo.
    e.target.value = '';
    if (!file) return;
    setFileName(file.name);
    setCreated(null);
    setError(null);
    setCleaned(null);
    // Los anuncios sin descripción o sin teléfono se eliminan de entrada:
    // no aparecen en la vista previa ni se importan.
    const result = parseAdsCsv(await file.text());
    const kept = result.rows.filter((r) => r.errors.length === 0);
    setDiscarded(result.rows.length - kept.length);
    setParsed({ ...result, rows: kept });
    clear();
  }

  // Edición de la vista previa original: revalida la fila al guardar.
  function updateRawRow(line: number, patch: Partial<CsvAd>) {
    setParsed((p) => {
      if (!p) return p;
      return {
        ...p,
        rows: p.rows.map((r) => {
          if (r.line !== line) return r;
          const values = { ...r.values, ...patch };
          return { ...r, values, errors: validateValues(values) };
        }),
      };
    });
  }

  // Edición de la vista previa limpia: recalcula si la fila queda eliminada.
  function updateCleanRow(line: number, patch: Partial<CsvAd>) {
    setCleaned((c) => {
      if (!c) return c;
      return {
        ...c,
        rows: c.rows.map((r) => {
          if (r.line !== line) return r;
          const values = { ...r.values, ...patch };
          return { ...r, values, removedReasons: removedReasonsFor(values) };
        }),
      };
    });
  }

  // Quita una fila de la vista previa: no se importará (el archivo no cambia).
  function removeRawRow(line: number) {
    setParsed((p) =>
      p ? { ...p, rows: p.rows.filter((r) => r.line !== line) } : p,
    );
  }

  function removeCleanRow(line: number) {
    setCleaned((c) =>
      c ? { ...c, rows: c.rows.filter((r) => r.line !== line) } : c,
    );
  }

  // Quita todas las filas seleccionadas de la vista previa visible.
  function removeSelectedRows() {
    const keep = (r: { line: number }) => !selected.has(String(r.line));
    if (cleaned) {
      setCleaned((c) => (c ? { ...c, rows: c.rows.filter(keep) } : c));
    } else {
      setParsed((p) => (p ? { ...p, rows: p.rows.filter(keep) } : p));
    }
    clear();
  }

  function runClean() {
    if (!parsed) return;
    // Las filas que la limpieza deja sin descripción (o sin teléfono) se
    // eliminan de la vista; el resumen conserva el conteo en "eliminados".
    const result = cleanRows(parsed.rows);
    setCleaned({
      ...result,
      rows: result.rows.filter((r) => r.removedReasons.length === 0),
    });
    setCleanGen((g) => g + 1);
    clear();
  }

  function downloadTemplate() {
    const blob = new Blob([buildTemplateCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-ofertas.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importAds() {
    setImporting(true);
    setError(null);
    try {
      const items = cleaned
        ? cleanRowsReady.map((r) => r.values as CsvAd)
        : validRows.map((r) => r.values as CsvAd);
      const res = await api<{ created: number }>('/listings/bulk', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      setCreated(res.created);
      setParsed(null);
      setCleaned(null);
      setFileName(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Importar ofertas por CSV</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Sube un archivo CSV con varias ofertas de trabajo; se publican a nombre de tu
            cuenta de administrador.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            Descargar plantilla
          </Button>
          <Button onClick={() => fileRef.current?.click()}>Elegir archivo CSV</Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onFile}
          />
        </div>
      </div>

      {/* Formato esperado */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 text-sm text-on-surface-variant shadow-sm">
        <p className="font-medium text-on-surface">Formato del archivo</p>
        <p className="mt-2">
          Columnas obligatorias:{' '}
          <code className="rounded bg-surface-container-high px-1">descripcion</code> y{' '}
          <code className="rounded bg-surface-container-high px-1">telefono</code>; las filas
          sin alguno de estos datos se eliminan al cargar el archivo (no aparecen en la
          vista previa ni se importan). El resto de columnas es opcional:{' '}
          <code className="rounded bg-surface-container-high px-1">titulo</code> (si falta,
          se toma la primera oración de la descripción),{' '}
          <code className="rounded bg-surface-container-high px-1">requisitos</code>,{' '}
          <code className="rounded bg-surface-container-high px-1">ubicacion</code>,{' '}
          <code className="rounded bg-surface-container-high px-1">departamento</code>,{' '}
          <code className="rounded bg-surface-container-high px-1">categoria</code>,{' '}
          <code className="rounded bg-surface-container-high px-1">horario</code>,{' '}
          <code className="rounded bg-surface-container-high px-1">salario</code>,{' '}
          <code className="rounded bg-surface-container-high px-1">tipoJornada</code> y{' '}
          <code className="rounded bg-surface-container-high px-1">duracionDias</code>.
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Valores por defecto: departamento Santa Cruz, categoría Otro, jornada Tiempo
            completo y duración 7 días. El salario queda vacío (a convenir) si no se indica.
          </li>
          <li>
            Departamentos: {Object.values(DEPARTMENT_LABEL).join(', ')}.
          </li>
          <li>
            Categorías: {Object.values(CATEGORY_LABEL).join(', ')}.
          </li>
          <li>Jornadas: {Object.values(JOB_TYPE_LABEL).join(', ')}.</li>
          <li>
            Duraciones: {DURATION_DAYS.join(', ')} días.
          </li>
          <li>Se acepta separador coma o punto y coma, y valores con o sin tildes.</li>
          <li>
            La vista previa es editable: los cambios en las celdas se aplican al salir del
            campo y solo afectan a lo que se importa, no al archivo.
          </li>
          <li>
            <span className="font-medium text-on-surface">Limpiar y previsualizar</span>{' '}
            quita de las descripciones las frases con teléfonos o datos de contacto, mueve la
            sección de requisitos a su columna (también cuando dice &quot;Ver
            descripción&quot;) y descarta las filas que quedan sin descripción o sin
            teléfono, mostrando el resultado antes de importar.
          </li>
        </ul>
      </div>

      {created != null && (
        <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-green-50 px-5 py-4 text-sm text-green-800">
          <span>
            Se importaron {created} {created === 1 ? 'oferta' : 'ofertas'} correctamente.
          </span>
          <Button variant="outline" onClick={() => router.push('/listings')}>
            Ver anuncios
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      {parsed?.headerError && (
        <p className="rounded-xl border border-outline-variant bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {fileName}: {parsed.headerError}
        </p>
      )}

      {parsed && !parsed.headerError && parsed.rows.length === 0 && (
        <p className="rounded-xl border border-outline-variant bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {fileName}: las {discarded} filas del archivo fueron eliminadas por no tener
          descripción o teléfono; no hay nada para importar.
        </p>
      )}

      {parsed && !parsed.headerError && parsed.rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-on-surface-variant">
              {fileName}:{' '}
              {cleaned ? (
                <>
                  {cleanRowsReady.length}{' '}
                  {cleanRowsReady.length === 1 ? 'oferta limpia lista' : 'ofertas limpias listas'}
                  {cleaned.stats.removed > 0 && (
                    <span className="text-error">
                      {' '}· {cleaned.stats.removed} eliminadas por la limpieza
                    </span>
                  )}
                  {cleanRowsRemoved > 0 && (
                    <span className="text-error">
                      {' '}· {cleanRowsRemoved} con errores (no se importarán)
                    </span>
                  )}
                </>
              ) : (
                <>
                  {validRows.length} {validRows.length === 1 ? 'oferta lista' : 'ofertas listas'}
                  {invalidRows.length > 0 && (
                    <span className="text-error">
                      {' '}· {invalidRows.length} con errores (no se importarán)
                    </span>
                  )}
                </>
              )}
              {discarded > 0 && (
                <span className="text-error">
                  {' '}· {discarded} {discarded === 1 ? 'eliminada' : 'eliminadas'} del archivo
                  por no tener descripción o teléfono
                </span>
              )}
            </p>
            <div className="flex gap-2">
              {selected.size > 0 && (
                <Button variant="danger" onClick={removeSelectedRows}>
                  Quitar seleccionadas ({selected.size})
                </Button>
              )}
              {cleaned ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCleaned(null);
                    clear();
                  }}
                >
                  Ver archivo original
                </Button>
              ) : (
                <Button variant="outline" onClick={runClean}>
                  Limpiar y previsualizar
                </Button>
              )}
              <Button onClick={importAds} disabled={importing || importCount === 0}>
                {importing
                  ? 'Importando...'
                  : `Importar ${importCount} ${importCount === 1 ? 'oferta' : 'ofertas'}${cleaned ? ' limpias' : ''}`}
              </Button>
            </div>
          </div>

          {/* Resumen del preprocesado */}
          {cleaned && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(
                [
                  ['Registros procesados', cleaned.stats.total],
                  ['Registros eliminados', cleaned.stats.removed],
                  ['Descripciones modificadas', cleaned.stats.descriptionsModified],
                  ['Requisitos extraídos', cleaned.stats.requirementsExtracted],
                  ['"Ver descripción" reemplazados', cleaned.stats.placeholdersReplaced],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
                >
                  <p className="text-xs text-on-surface-variant">{label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary">{value}</p>
                </div>
              ))}
            </div>
          )}

          {cleaned ? (
            <AdminTable
              headers={[
                <SelectCheckbox
                  key="select-page"
                  label="Seleccionar todas las filas"
                  checked={allInPage}
                  onChange={togglePage}
                />,
                ...CLEAN_HEADERS,
              ]}
              empty="La limpieza eliminó todas las filas del archivo."
            >
              {cleaned.rows.map((row) => {
                const changes = [
                  row.descriptionModified && 'Descripción limpiada',
                  row.requirementsExtracted && 'Requisitos extraídos',
                  row.placeholderReplaced && '"Ver descripción" reemplazado',
                ].filter(Boolean) as string[];
                const removed = row.removedReasons.length > 0;
                return (
                  <tr key={`${cleanGen}-${row.line}`} className={removed ? 'bg-error/5' : ''}>
                    <td className="px-4 py-3 align-top">
                      <SelectCheckbox
                        label={`Seleccionar la línea ${row.line}`}
                        checked={selected.has(String(row.line))}
                        onChange={() => toggleOne(String(row.line))}
                      />
                    </td>
                    <td className="px-4 py-3 align-top text-on-surface-variant">{row.line}</td>
                    <td className="px-4 py-3 align-top">
                      <CellInput
                        value={row.values.title ?? ''}
                        label={`Título de la línea ${row.line}`}
                        className="min-w-[12rem]"
                        onCommit={(v) =>
                          updateCleanRow(row.line, { title: v.trim() || undefined })
                        }
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <CellTextarea
                        value={row.values.description ?? ''}
                        label={`Descripción de la línea ${row.line}`}
                        onCommit={(v) =>
                          updateCleanRow(row.line, { description: v.trim() || undefined })
                        }
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <CellTextarea
                        value={row.values.requirements ?? ''}
                        label={`Requisitos de la línea ${row.line}`}
                        onCommit={(v) =>
                          updateCleanRow(row.line, { requirements: v.trim() || undefined })
                        }
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <CellInput
                        value={row.values.phone ?? ''}
                        label={`Teléfono de la línea ${row.line}`}
                        type="tel"
                        className="w-28"
                        onCommit={(v) =>
                          updateCleanRow(row.line, { phone: v.trim() || undefined })
                        }
                      />
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-on-surface-variant">
                      {changes.length ? changes.join(' · ') : 'Sin cambios'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {removed ? (
                        <span className="text-xs text-error">
                          Eliminada: {row.removedReasons.join('; ')}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Lista
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <IconButton
                        icon="delete"
                        label="Quitar fila"
                        variant="danger"
                        onClick={() => removeCleanRow(row.line)}
                      />
                    </td>
                  </tr>
                );
              })}
            </AdminTable>
          ) : (
            <AdminTable
              headers={[
                <SelectCheckbox
                  key="select-page"
                  label="Seleccionar todas las filas"
                  checked={allInPage}
                  onChange={togglePage}
                />,
                ...PREVIEW_HEADERS,
              ]}
              empty="No hay filas para importar."
            >
              {parsed.rows.map((row) => (
                <tr key={row.line} className={row.errors.length ? 'bg-error/5' : ''}>
                  <td className="px-4 py-3 align-top">
                    <SelectCheckbox
                      label={`Seleccionar la línea ${row.line}`}
                      checked={selected.has(String(row.line))}
                      onChange={() => toggleOne(String(row.line))}
                    />
                  </td>
                  <td className="px-4 py-3 align-top text-on-surface-variant">{row.line}</td>
                  <td className="px-4 py-3 align-top">
                    <CellInput
                      value={row.values.title ?? ''}
                      label={`Título de la línea ${row.line}`}
                      className="min-w-[12rem]"
                      onCommit={(v) =>
                        updateRawRow(row.line, { title: v.trim() || undefined })
                      }
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <CellTextarea
                      value={row.values.description ?? ''}
                      label={`Descripción de la línea ${row.line}`}
                      onCommit={(v) =>
                        updateRawRow(row.line, { description: v.trim() || undefined })
                      }
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <CellInput
                      value={row.values.phone ?? ''}
                      label={`Teléfono de la línea ${row.line}`}
                      type="tel"
                      className="w-28"
                      onCommit={(v) => updateRawRow(row.line, { phone: v.trim() || undefined })}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <CellSelect<Department>
                      value={row.values.department ?? 'SANTA_CRUZ'}
                      labels={DEPARTMENT_LABEL}
                      label={`Departamento de la línea ${row.line}`}
                      onCommit={(v) => updateRawRow(row.line, { department: v })}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <CellSelect<Category>
                      value={row.values.category ?? 'OTRO'}
                      labels={CATEGORY_LABEL}
                      label={`Categoría de la línea ${row.line}`}
                      onCommit={(v) => updateRawRow(row.line, { category: v })}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <CellInput
                      value={row.values.salary != null ? String(row.values.salary) : ''}
                      label={`Salario de la línea ${row.line}`}
                      type="number"
                      className="w-24"
                      onCommit={(v) => {
                        const n = Number(v);
                        updateRawRow(row.line, {
                          salary: v.trim() && Number.isFinite(n) && n > 0 ? n : undefined,
                        });
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <CellSelect<JobType>
                      value={row.values.jobType ?? 'TIEMPO_COMPLETO'}
                      labels={JOB_TYPE_LABEL}
                      label={`Jornada de la línea ${row.line}`}
                      onCommit={(v) => updateRawRow(row.line, { jobType: v })}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    {row.errors.length === 0 ? (
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Lista
                      </span>
                    ) : (
                      <span className="text-xs text-error">{row.errors.join('; ')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <IconButton
                      icon="delete"
                      label="Quitar fila"
                      variant="danger"
                      onClick={() => removeRawRow(row.line)}
                    />
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
        </>
      )}
    </div>
  );
}
