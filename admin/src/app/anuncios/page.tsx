'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Anuncio,
  CATEGORIA_LABEL,
  ESTADO_LABEL,
  EstadoEfectivo,
  estadoAnuncio,
  Paginated,
} from '@/lib/types';
import { Badge, Button, ConfirmDialog, DataTable } from '@/components/ui';

const ESTADO_STYLE: Record<EstadoEfectivo, string> = {
  ACTIVO: 'bg-green-100 text-green-800',
  VENCIDO: 'bg-amber-100 text-amber-800',
  DADO_DE_BAJA: 'bg-gray-200 text-gray-600',
};

export default function AnunciosAdminPage() {
  const [items, setItems] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Anuncio | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    // Vista admin: incluye vencidos y dados de baja.
    api<Paginated<Anuncio>>('/anuncios/todos?limit=100')
      .then((res) => setItems(res.items))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function remove() {
    if (!toDelete) return;
    await api(`/anuncios/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    load();
  }

  async function darDeBaja(a: Anuncio) {
    await api(`/anuncios/${a.id}/baja`, { method: 'POST' });
    load();
  }

  async function republicar(a: Anuncio) {
    await api(`/anuncios/${a.id}/republicar`, { method: 'POST' });
    load();
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Anuncios</h1>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No hay anuncios.</p>
      ) : (
      <DataTable
        headers={[
          'Descripción',
          'Categoría',
          'Ubicación',
          'Salario',
          'Jornada',
          'Estado',
          'Publicado',
          'Vence',
          'Autor',
          '',
        ]}
      >
        {items.map((a) => {
          const estado = estadoAnuncio(a);
          return (
            <tr key={a.id}>
              <td className="max-w-xs truncate px-4 py-3">{a.descripcion}</td>
              <td className="px-4 py-3 text-gray-600">
                {a.categoria ? CATEGORIA_LABEL[a.categoria] : '—'}
              </td>
              <td className="px-4 py-3 text-gray-600">{a.ubicacion ?? '—'}</td>
              <td className="px-4 py-3 font-medium text-brand">
                Bs {Number(a.salario).toLocaleString('es-BO')}
              </td>
              <td className="px-4 py-3">
                <Badge tipo={a.tipoJornada} />
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLE[estado]}`}
                >
                  {ESTADO_LABEL[estado]}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(a.createdAt).toLocaleDateString('es-BO')}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(a.expiraEn).toLocaleDateString('es-BO')}
              </td>
              <td className="px-4 py-3 text-gray-600">{a.createdBy?.nombre ?? '—'}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  {estado === 'ACTIVO' ? (
                    <Button variant="outline" onClick={() => darDeBaja(a)}>
                      Dar de baja
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => republicar(a)}>
                      Republicar
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => setToDelete(a)}>
                    Eliminar
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar anuncio"
        message="Esto borra el anuncio definitivamente (no es una baja). ¿Continuar?"
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
