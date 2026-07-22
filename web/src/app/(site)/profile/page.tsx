'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Button, FormField, Input } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { PhoneField } from '@/components/PhoneField';
import { Skeleton } from '@/components/Skeleton';

// Perfil único: datos personales y contraseña (sin tipos de cuenta).
// El correo identifica la cuenta y no se puede modificar.
export default function ProfilePage() {
  const { user, loading } = useRequireAuth();
  const { refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [passwords, setPasswords] = useState({
    current: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone ?? '' });
  }, [user]);

  // Las cuentas de Google no tienen contraseña local: pueden definir una.
  const hasPassword = Boolean(user?.hasPassword);
  const changingPassword = passwords.password.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (changingPassword && passwords.password !== passwords.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSaving(true);
    try {
      await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          ...(changingPassword
            ? {
                password: passwords.password,
                ...(hasPassword
                  ? { currentPassword: passwords.current }
                  : {}),
              }
            : {}),
        }),
      });
      await refresh();
      // Tras guardar, siempre a la página principal.
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  if (loading || !user)
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );

  return (
    <div className="mx-auto max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-4 text-xl font-semibold text-on-surface">Mi perfil</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Correo (no se puede modificar)">
          <Input
            value={user.email}
            disabled
            readOnly
            aria-readonly="true"
            className="cursor-not-allowed bg-surface-container-low text-on-surface-variant"
          />
        </FormField>
        <FormField label="Nombre">
          <Input
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Teléfono (opcional, se precarga al publicar)">
          <PhoneField
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
          />
        </FormField>

        <fieldset className="space-y-4 border-t border-outline-variant/60 pt-4">
          <legend className="sr-only">Contraseña</legend>
          <p className="text-sm font-medium text-on-surface">
            {hasPassword ? 'Cambiar contraseña' : 'Definir contraseña'}
            <span className="ml-1 font-normal text-outline">(opcional)</span>
          </p>
          {!hasPassword && (
            <p className="text-xs text-on-surface-variant">
              Tu cuenta usa Google. Si defines una contraseña, también podrás
              entrar con tu correo.
            </p>
          )}
          {hasPassword && (
            <FormField label="Contraseña actual">
              <PasswordInput
                autoComplete="current-password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
                required={changingPassword}
              />
            </FormField>
          )}
          <FormField label="Nueva contraseña (mín. 6)">
            <PasswordInput
              autoComplete="new-password"
              value={passwords.password}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, password: e.target.value }))
              }
              minLength={6}
            />
          </FormField>
          <FormField label="Confirmar nueva contraseña">
            <PasswordInput
              autoComplete="new-password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, confirm: e.target.value }))
              }
              minLength={6}
              required={changingPassword}
            />
          </FormField>
        </fieldset>

        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </div>
  );
}
