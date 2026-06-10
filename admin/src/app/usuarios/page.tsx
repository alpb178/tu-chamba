'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Role, User } from '@/lib/types';
import { Button, ConfirmDialog, DataTable, Select } from '@/components/ui';

type UserRow = User & { _count?: { anuncios: number } };

const ROLES: Role[] = ['ADMIN', 'EMPLEADOR', 'TRABAJADOR'];

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);

  function load() {
    setLoading(true);
    api<UserRow[]>('/users')
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function changeRole(id: string, role: Role) {
    await api(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    load();
  }

  async function remove() {
    if (!toDelete) return;
    await api(`/users/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    load();
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Usuarios</h1>
      <DataTable headers={['Nombre', 'Correo', 'Teléfono', 'Rol', 'Anuncios', '']}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3">{u.nombre}</td>
            <td className="px-4 py-3 text-gray-600">{u.email}</td>
            <td className="px-4 py-3 text-gray-600">{u.telefono}</td>
            <td className="px-4 py-3">
              <Select
                value={u.role}
                onChange={(e) => changeRole(u.id, e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </td>
            <td className="px-4 py-3 text-gray-600">{u._count?.anuncios ?? 0}</td>
            <td className="px-4 py-3 text-right">
              <Button variant="danger" onClick={() => setToDelete(u)}>
                Eliminar
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar usuario"
        message={`¿Eliminar a ${toDelete?.nombre}? Se borrarán también sus anuncios.`}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
