'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Anuncio, Paginated } from '@/lib/types';
import { Badge, Button, ConfirmDialog, DataTable } from '@/components/ui';

export default function AnunciosAdminPage() {
  const [items, setItems] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Anuncio | null>(null);

  function load() {
    setLoading(true);
    api<Paginated<Anuncio>>('/anuncios?limit=100')
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function remove() {
    if (!toDelete) return;
    await api(`/anuncios/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    load();
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Anuncios</h1>
      <DataTable headers={['Descripción', 'Salario', 'Jornada', 'Autor', 'Teléfono', '']}>
        {items.map((a) => (
          <tr key={a.id}>
            <td className="max-w-xs truncate px-4 py-3">{a.descripcion}</td>
            <td className="px-4 py-3 font-medium text-brand">
              Bs {Number(a.salario).toLocaleString('es-BO')}
            </td>
            <td className="px-4 py-3">
              <Badge tipo={a.tipoJornada} />
            </td>
            <td className="px-4 py-3 text-gray-600">{a.createdBy?.nombre ?? '—'}</td>
            <td className="px-4 py-3 text-gray-600">{a.telefono}</td>
            <td className="px-4 py-3 text-right">
              <Button variant="danger" onClick={() => setToDelete(a)}>
                Eliminar
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar anuncio"
        message="¿Seguro que deseas eliminar este anuncio?"
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
