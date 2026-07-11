'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';

type Status = 'verifying' | 'ok' | 'error';

function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get('token');
  const { refresh } = useAuth();
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return; // evita doble ejecución en StrictMode
    done.current = true;

    if (!token) {
      setStatus('error');
      setMessage('Falta el token de verificación.');
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
  }, [token, refresh]);

  return (
    <div className="mx-auto max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest p-8 text-center">
      {status === 'verifying' && (
        <p className="text-on-surface-variant">Verificando tu correo...</p>
      )}
      {status === 'ok' && (
        <>
          <div className="mb-2 text-3xl">✅</div>
          <h1 className="text-xl font-semibold text-on-surface">
            ¡Correo verificado!
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Tu cuenta ya está activa. Ya puedes publicar y usar Tu Chamba con
            normalidad.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/">
              <Button>Ir al inicio</Button>
            </Link>
          </div>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="mb-2 text-3xl">⚠️</div>
          <h1 className="text-xl font-semibold text-on-surface">
            No pudimos verificar tu correo
          </h1>
          <p className="mt-2 text-on-surface-variant">{message}</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Inicia sesión y pide un nuevo enlace desde el aviso de tu cuenta.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/login">
              <Button variant="outline">Ingresar</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-on-surface-variant">Cargando...</p>}>
      <VerifyEmail />
    </Suspense>
  );
}
