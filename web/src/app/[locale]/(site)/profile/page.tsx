'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Button, FormField, Input } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { PhoneField } from '@/components/PhoneField';
import { Skeleton } from '@/components/Skeleton';

// Single profile: personal data and password (no account types).
// The email identifies the account and can't be changed.
export default function ProfilePage() {
  const t = useTranslations('account.profile');
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

  // Google accounts have no local password: they can set one.
  const hasPassword = Boolean(user?.hasPassword);
  const changingPassword = passwords.password.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (changingPassword && passwords.password !== passwords.confirm) {
      setError(t('passwordMismatch'));
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
      // After saving, always go to the home page.
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  if (loading || !user)
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-card border border-outline-variant bg-surface-container-lowest p-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );

  return (
    <div className="mx-auto max-w-md rounded-card border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-4 text-xl font-semibold text-on-surface">{t('title')}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label={t('email')}>
          <Input
            value={user.email}
            disabled
            readOnly
            aria-readonly="true"
            className="cursor-not-allowed bg-surface-container-low text-on-surface-variant"
          />
        </FormField>
        <FormField label={t('name')}>
          <Input
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </FormField>
        <FormField label={t('phone')}>
          <PhoneField
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
          />
        </FormField>

        <fieldset className="space-y-4 border-t border-outline-variant/60 pt-4">
          <legend className="sr-only">{t('passwordLegend')}</legend>
          <p className="text-sm font-medium text-on-surface">
            {hasPassword ? t('changePassword') : t('setPassword')}
            <span className="ml-1 font-normal text-outline">{t('optional')}</span>
          </p>
          {!hasPassword && (
            <p className="text-xs text-on-surface-variant">
              {t('googleNote')}
            </p>
          )}
          {hasPassword && (
            <FormField label={t('currentPassword')}>
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
          <FormField label={t('newPassword')}>
            <PasswordInput
              autoComplete="new-password"
              value={passwords.password}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, password: e.target.value }))
              }
              minLength={6}
            />
          </FormField>
          <FormField label={t('confirmPassword')}>
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
          {saving ? t('saving') : t('save')}
        </Button>
      </form>
    </div>
  );
}
