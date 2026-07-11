'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Button, FormField, Input } from '@/components/ui';
import { Skeleton } from '@/components/Skeleton';

// Perfil único: solo datos personales del usuario (sin tipos de cuenta).
// El correo identifica la cuenta y no se puede modificar.
export default function ProfilePage() {
  const { user, loading } = useRequireAuth();
  const { refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone ?? '' });
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: form.name, phone: form.phone }),
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
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Teléfono (opcional, se precarga al publicar)">
          <Input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </FormField>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </div>
  );
}
