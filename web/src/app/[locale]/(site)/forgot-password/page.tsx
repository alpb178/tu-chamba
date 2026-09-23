'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { Button, FormField, Input } from '@/components/ui';

// Requests the reset link. The API always responds "sent"
// (it doesn't reveal which emails exist).
export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-card border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-2 text-xl font-semibold text-on-surface">
        {t('forgotPassword.title')}
      </h1>
      {sent ? (
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            {t.rich('forgotPassword.sent', {
              email,
              b: (chunks) => <strong className="text-on-surface">{chunks}</strong>,
            })}
          </p>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              {t('forgotPassword.backToLogin')}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-on-surface-variant">
            {t('forgotPassword.intro')}
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField label={t('fields.email')}>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>
            {error && <p className="text-sm text-error">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-on-surface-variant">
            <Link href="/login" className="text-brand hover:underline">
              {t('forgotPassword.backToLogin')}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
