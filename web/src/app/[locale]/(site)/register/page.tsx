'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth';
import { safeNext } from '@/lib/types';
import { Button, FormField, Input } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { PhoneField } from '@/components/PhoneField';
import { GoogleSignIn } from '@/components/GoogleSignIn';

function RegisterForm() {
  const { register } = useAuth();
  const t = useTranslations('auth');
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError(t('passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      router.push(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-card border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-4 text-xl font-semibold text-on-surface">{t('register.title')}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label={t('register.name')}>
          <Input
            autoComplete="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </FormField>
        <FormField label={t('fields.email')}>
          <Input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </FormField>
        <FormField label={t('register.password')}>
          <PasswordInput
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            minLength={6}
            required
          />
        </FormField>
        <FormField label={t('register.confirm')}>
          <PasswordInput
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)}
            minLength={6}
            required
          />
        </FormField>
        <FormField label={t('register.phone')}>
          <PhoneField value={form.phone} onChange={(v) => set('phone', v)} />
        </FormField>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('register.submitting') : t('register.submit')}
        </Button>
      </form>

      <div className="mt-4">
        <GoogleSignIn next={next} />
      </div>

      <p className="mt-4 text-center text-sm text-on-surface-variant">
        {t.rich('register.haveAccount', {
          link: (chunks) => (
            <Link
              href={next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`}
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

export default function RegisterPage() {
  const tc = useTranslations('common');
  return (
    <Suspense fallback={<p className="text-on-surface-variant">{tc('loading')}</p>}>
      <RegisterForm />
    </Suspense>
  );
}
