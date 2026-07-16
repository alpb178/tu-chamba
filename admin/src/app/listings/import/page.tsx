'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  CATEGORY_LABEL,
  DEPARTMENT_LABEL,
  DURATION_DAYS,
  JOB_TYPE_LABEL,
} from '@/lib/types';
import { buildTemplateCsv, CsvAd, parseAdsCsv, ParsedCsv } from '@/lib/csv';
import { Button, DataTable } from '@/components/ui';

const PREVIEW_HEADERS = [
  'Línea',
  'Descripción',
  'Departamento',
  'Categoría',
  'Salario',
  'Jornada',
  'Estado',
];

export default function ImportAdsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [importing, setImporting] = useState(false);
  const [created, setCreated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validRows = parsed?.rows.filter((r) => r.errors.length === 0) ?? [];
  const invalidRows = parsed?.rows.filter((r) => r.errors.length > 0) ?? [];

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Permite volver a elegir el mismo archivo tras corregirlo.
    e.target.value = '';
    if (!file) return;
    setFileName(file.name);
    setCreated(null);
    setError(null);
    setParsed(parseAdsCsv(await file.text()));
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
      const items = validRows.map((r) => r.values as CsvAd);
      const res = await api<{ created: number }>('/listings/bulk', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      setCreated(res.created);
      setParsed(null);
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
          sin alguno de estos datos no se importan. El resto de columnas es opcional:{' '}
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

      {parsed && !parsed.headerError && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-on-surface-variant">
              {fileName}: {validRows.length} {validRows.length === 1 ? 'oferta lista' : 'ofertas listas'}
              {invalidRows.length > 0 && (
                <span className="text-error">
                  {' '}· {invalidRows.length} con errores (no se importarán)
                </span>
              )}
            </p>
            <Button onClick={importAds} disabled={importing || validRows.length === 0}>
              {importing
                ? 'Importando...'
                : `Importar ${validRows.length} ${validRows.length === 1 ? 'oferta' : 'ofertas'}`}
            </Button>
          </div>

          <DataTable headers={PREVIEW_HEADERS}>
            {parsed.rows.map((row) => (
              <tr key={row.line} className={row.errors.length ? 'bg-error/5' : ''}>
                <td className="px-4 py-3 text-on-surface-variant">{row.line}</td>
                <td className="max-w-xs truncate px-4 py-3">
                  {row.values.description ?? '—'}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {row.values.department ? DEPARTMENT_LABEL[row.values.department] : '—'}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {row.values.category ? CATEGORY_LABEL[row.values.category] : '—'}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {row.values.salary != null
                    ? `Bs ${row.values.salary.toLocaleString('es-BO')}`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {row.values.jobType ? JOB_TYPE_LABEL[row.values.jobType] : '—'}
                </td>
                <td className="px-4 py-3">
                  {row.errors.length === 0 ? (
                    <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Lista
                    </span>
                  ) : (
                    <span className="text-xs text-error">{row.errors.join('; ')}</span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </div>
  );
}
