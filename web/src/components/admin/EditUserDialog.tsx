'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button, FormField, Input } from './ui';
import { PasswordInput } from '@/components/PasswordInput';

// Edición de los datos de la cuenta de un usuario desde el panel. La
// contraseña solo se puede cambiar en cuentas locales (las de Google no
// tienen contraseña local).
export function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    provider?: 'google' | 'email';
  } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cuenta de Google: sin contraseña local, no se muestra el campo.
  const isGoogle = user?.provider === 'google';

  // Al abrir con otro usuario, el formulario arranca con sus datos.
  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? '');
    setPassword('');
    setError(null);
  }, [user]);

  if (!user) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/users/${user.id}`, {
        method: 'PATCH',
        // La contraseña solo se envía si se escribió una nueva.
        body: JSON.stringify({
          name,
          email,
          phone,
          ...(!isGoogle && password ? { password } : {}),
        }),
      });
      onSaved();
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
        autoComplete="off"
        className="w-full max-w-sm space-y-4 rounded-lg bg-surface-container-lowest p-6 shadow-lg"
      >
        <div>
          <h3 className="text-lg font-semibold text-on-surface">Editar usuario</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Puede iniciar sesión con el usuario o con el correo.
          </p>
        </div>
        <div className="space-y-3">
          <FormField label="Usuario">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </FormField>
          <FormField label="Correo">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Teléfono">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Sin teléfono"
            />
          </FormField>
          {isGoogle ? (
            <p className="text-xs text-on-surface-variant">
              Cuenta de Google: la contraseña se gestiona en Google, no aquí.
            </p>
          ) : (
            <FormField label="Nueva contraseña">
              <PasswordInput
                autoComplete="new-password"
                placeholder="Dejar en blanco para no cambiarla"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </FormField>
          )}
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
