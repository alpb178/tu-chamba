'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';

type Status = 'verifying' | 'ok' | 'error';

function VerifyEmail() {
  const t = useTranslations('auth.verify');
  const params = useSearchParams();
  const token = params.get('token');
  const { refresh } = useAuth();
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return; // avoids double execution in StrictMode
    done.current = true;

    if (!token) {
      setStatus('error');
      setMessage(t('missingToken'));
      return;
    }
    api('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(async () => {
        setStatus('ok');
        await refresh();
      })
      .catch((e) => {
        setStatus('error');
        setMessage((e as Error).message);
      });
  }, [token, refresh, t]);

  return (
    <div className="mx-auto max-w-md rounded-card border border-outline-variant bg-surface-container-lowest p-8 text-center">
      {status === 'verifying' && (
        <p className="text-on-surface-variant">{t('verifying')}</p>
      )}
      {status === 'ok' && (
        <>
          <div className="mb-2 text-3xl">✅</div>
          <h1 className="text-xl font-semibold text-on-surface">
            {t('successTitle')}
          </h1>
          <p className="mt-2 text-on-surface-variant">
            {t('successBody')}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/">
              <Button>{t('goHome')}</Button>
            </Link>
          </div>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="mb-2 text-3xl">⚠️</div>
          <h1 className="text-xl font-semibold text-on-surface">
            {t('errorTitle')}
          </h1>
          <p className="mt-2 text-on-surface-variant">{message}</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            {t('errorHint')}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/login">
              <Button variant="outline">{t('login')}</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  const tc = useTranslations('common');
  return (
    <Suspense fallback={<p className="text-on-surface-variant">{tc('loading')}</p>}>
      <VerifyEmail />
    </Suspense>
  );
}
