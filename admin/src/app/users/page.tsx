'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import {
  AdminTable,
  Button,
  ConfirmDialog,
  IconButton,
  Input,
  SelectCheckbox,
} from '@/components/ui';
import { CustomSelect } from '@/components/CustomSelect';
import { EditUserDialog } from '@/components/EditUserDialog';
import { useSelection } from '@/lib/useSelection';

const HEADERS = ['Nombre', 'Correo', 'Teléfono', 'Acceso', 'Anuncios', ''];

type UserRow = User & { _count?: { ads: number } };

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
        className="w-full max-w-sm space-y-4 rounded-lg bg-surface-container-lowest p-6 shadow-lg"
      >
        <div>
          <h3 className="text-lg font-semibold text-on-surface">Crear administrador</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
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
        {error && <p className="text-sm text-error">{error}</p>}
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
  const [toEdit, setToEdit] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const { selected, allInPage, toggleOne, togglePage, clear } = useSelection(
    users.map((u) => u.id),
  );
  // El borrado total conserva a los administradores.
  const clientCount = users.filter((u) => !u.isAdmin).length;

  function load() {
    setLoading(true);
    setError(null);
    api<UserRow[]>('/users')
      .then(setUsers)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  // Concede o revoca el acceso a este panel (único distintivo entre usuarios).
  async function setAdmin(id: string, isAdmin: boolean) {
    await api(`/users/${id}/admin`, {
      method: 'PATCH',
      body: JSON.stringify({ isAdmin }),
    });
    load();
  }

  async function remove() {
    if (!toDelete) return;
    await api(`/users/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    load();
  }

  async function removeSelected() {
    setConfirmBulk(false);
    await api('/users/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: [...selected] }),
    });
    clear();
    load();
  }

  async function removeAll() {
    setConfirmAll(false);
    await api('/users/all', { method: 'DELETE' });
    clear();
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-on-surface">Usuarios</h1>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="danger" onClick={() => setConfirmBulk(true)}>
              Eliminar seleccionados ({selected.size})
            </Button>
          )}
          {clientCount > 0 && (
            <Button variant="danger" onClick={() => setConfirmAll(true)}>
              Eliminar todos ({clientCount})
            </Button>
          )}
          <IconButton
            icon="refresh"
            label="Actualizar la lista"
            onClick={load}
            disabled={loading}
          />
          <IconButton
            icon="person_add"
            label="Crear administrador"
            variant="primary"
            onClick={() => setCreating(true)}
          />
        </div>
      </div>
      <AdminTable
        headers={[
          <SelectCheckbox
            key="select-page"
            label="Seleccionar todos los usuarios de la página"
            checked={allInPage}
            onChange={togglePage}
          />,
          ...HEADERS,
        ]}
        loading={loading}
        error={error}
        empty="No hay usuarios."
      >
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3">
              <SelectCheckbox
                label={`Seleccionar a ${u.name}`}
                checked={selected.has(u.id)}
                onChange={() => toggleOne(u.id)}
              />
            </td>
            <td className="px-4 py-3">{u.name}</td>
            <td className="px-4 py-3 text-on-surface-variant">{u.email}</td>
            <td className="px-4 py-3 text-on-surface-variant">{u.phone}</td>
            <td className="px-4 py-3">
              <div className="w-36">
                <CustomSelect
                  value={u.isAdmin ? 'ADMIN' : 'USUARIO'}
                  onChange={(v) => setAdmin(u.id, v === 'ADMIN')}
                  options={[
                    { value: 'USUARIO', label: 'Usuario' },
                    { value: 'ADMIN', label: 'Admin' },
                  ]}
                />
              </div>
            </td>
            <td className="px-4 py-3 text-on-surface-variant">{u._count?.ads ?? 0}</td>
            <td className="px-4 py-3 text-right">
              <div className="flex justify-end gap-1.5">
                <IconButton icon="edit" label="Editar" onClick={() => setToEdit(u)} />
                <IconButton
                  icon="delete"
                  label="Eliminar"
                  variant="danger"
                  onClick={() => setToDelete(u)}
                />
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      <EditUserDialog
        user={toEdit}
        onClose={() => setToEdit(null)}
        onSaved={() => {
          setToEdit(null);
          load();
        }}
      />

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

      <ConfirmDialog
        open={confirmAll}
        title="Eliminar TODOS los usuarios"
        message={`Esto borra definitivamente los ${clientCount} usuarios registrados y sus anuncios (no se puede deshacer). Las cuentas de administrador se conservan. ¿Continuar?`}
        onConfirm={removeAll}
        onCancel={() => setConfirmAll(false)}
      />

      <ConfirmDialog
        open={confirmBulk}
        title="Eliminar usuarios seleccionados"
        message={`¿Eliminar ${selected.size} ${
          selected.size === 1 ? 'usuario' : 'usuarios'
        }? Se borrarán también sus anuncios. Tu propia cuenta no se toca.`}
        onConfirm={removeSelected}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}
