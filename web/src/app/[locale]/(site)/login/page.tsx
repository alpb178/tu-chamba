'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth';
import { safeNext } from '@/lib/types';
import { Button, FormField, Input } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { GoogleSignIn } from '@/components/GoogleSignIn';

function LoginForm() {
  const { login } = useAuth();
  const t = useTranslations('auth');
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-card border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-4 text-xl font-semibold text-on-surface">{t('login.title')}</h1>
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
        <FormField label={t('fields.password')}>
          <PasswordInput
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>
        <p className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-brand hover:underline"
          >
            {t('login.forgotPassword')}
          </Link>
        </p>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>

      <div className="mt-4">
        <GoogleSignIn next={next} />
      </div>

      <p className="mt-4 text-center text-sm text-on-surface-variant">
        {t.rich('login.noAccount', {
          link: (chunks) => (
            <Link
              href={
                next === '/' ? '/register' : `/register?next=${encodeURIComponent(next)}`
              }
              className="text-brand hover:underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}

export default function LoginPage() {
  const tc = useTranslations('common');
  return (
    <Suspense fallback={<p className="text-on-surface-variant">{tc('loading')}</p>}>
      <LoginForm />
    </Suspense>
  );
}
