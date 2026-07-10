'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Role, User } from '@/lib/types';
import { Button, ConfirmDialog, DataTable, Input, Select } from '@/components/ui';

type UserRow = User & { _count?: { ads: number } };

const ROLES: Role[] = ['ADMIN', 'EMPLEADOR', 'TRABAJADOR'];

// Alta de un administrador: el backend solo pide correo y contraseña.
function CreateAdminDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api('/users/admin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setEmail('');
      setPassword('');
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-lg"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Crear administrador</h3>
          <p className="mt-1 text-sm text-gray-600">
            Tendrá acceso completo a este panel.
          </p>
        </div>
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creando...' : 'Crear admin'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    api<UserRow[]>('/users')
      .then(setUsers)
      .catch((e) => setError((e as Error).message))
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Usuarios</h1>
        <Button onClick={() => setCreating(true)}>Crear admin</Button>
      </div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">No hay usuarios.</p>
      ) : (
      <DataTable headers={['Nombre', 'Correo', 'Teléfono', 'Rol', 'Anuncios', '']}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3">{u.name}</td>
            <td className="px-4 py-3 text-gray-600">{u.email}</td>
            <td className="px-4 py-3 text-gray-600">{u.phone}</td>
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
            <td className="px-4 py-3 text-gray-600">{u._count?.ads ?? 0}</td>
            <td className="px-4 py-3 text-right">
              <Button variant="danger" onClick={() => setToDelete(u)}>
                Eliminar
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
      )}

      <CreateAdminDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          load();
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar usuario"
        message={`¿Eliminar a ${toDelete?.name}? Se borrarán también sus anuncios.`}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
