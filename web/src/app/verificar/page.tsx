'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';

type Estado = 'verificando' | 'ok' | 'error';

function Verificar() {
  const params = useSearchParams();
  const token = params.get('token');
  const { refresh } = useAuth();
  const [estado, setEstado] = useState<Estado>('verificando');
  const [mensaje, setMensaje] = useState('');
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return; // evita doble ejecución en StrictMode
    hecho.current = true;

    if (!token) {
      setEstado('error');
      setMensaje('Falta el token de verificación.');
      return;
    }
    api('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(async () => {
        setEstado('ok');
        await refresh();
      })
      .catch((e) => {
        setEstado('error');
        setMensaje((e as Error).message);
      });
  }, [token, refresh]);

  return (
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center">
      {estado === 'verificando' && (
        <p className="text-gray-600">Verificando tu correo...</p>
      )}
      {estado === 'ok' && (
        <>
          <div className="mb-2 text-3xl">✅</div>
          <h1 className="text-xl font-semibold text-gray-800">
            ¡Correo verificado!
          </h1>
          <p className="mt-2 text-gray-600">
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
      {estado === 'error' && (
        <>
          <div className="mb-2 text-3xl">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-800">
            No pudimos verificar tu correo
          </h1>
          <p className="mt-2 text-gray-600">{mensaje}</p>
          <p className="mt-2 text-sm text-gray-500">
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

export default function VerificarPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Cargando...</p>}>
      <Verificar />
    </Suspense>
  );
}
