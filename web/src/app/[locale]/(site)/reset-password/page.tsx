'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { Button, FormField } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';

// Sets the new password using the token from the email link.
function ResetForm() {
  const t = useTranslations('auth');
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t('passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-on-surface-variant">
        {t.rich('resetPassword.missingToken', {
          link: (chunks) => (
            <Link href="/forgot-password" className="text-brand hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          {t('resetPassword.done')}
        </p>
        <Link href="/login" className="block">
          <Button className="w-full">{t('resetPassword.login')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label={t('resetPassword.newPassword')}>
        <PasswordInput
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </FormField>
      <FormField label={t('resetPassword.confirm')}>
        <PasswordInput
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
          required
        />
      </FormField>
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t('resetPassword.submitting') : t('resetPassword.submit')}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  return (
    <div className="mx-auto max-w-md rounded-card border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-4 text-xl font-semibold text-on-surface">
        {t('resetPassword.title')}
      </h1>
      <Suspense fallback={<p className="text-on-surface-variant">{tc('loading')}</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
