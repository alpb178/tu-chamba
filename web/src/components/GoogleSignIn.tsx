'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCRIPT_ID = 'google-gsi-client';

declare global {
  interface Window {
    // Google Identity Services (script cargado en runtime).
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

// Botón "Continuar con Google". Si la cuenta no existe se crea al momento
// (sin más datos: el teléfono se completa después desde el perfil).
// No se renderiza si NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado.
// `next`: ruta a la que volver tras entrar (p. ej. el anuncio compartido).
export function GoogleSignIn({ next = '/' }: { next?: string }) {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Referencia estable para el callback de GIS (se inicializa una sola vez).
  const onCredentialRef = useRef<(token: string) => void>(() => {});
  onCredentialRef.current = async (token: string) => {
    setError(null);
    try {
      await loginWithGoogle(token);
      router.push(next);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (!CLIENT_ID) return;

    function init() {
      if (!window.google?.accounts?.id || !buttonRef.current) return false;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp: { credential: string }) =>
          onCredentialRef.current(resp.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 320,
      });
      return true;
    }

    if (init()) return;

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', init);
    return () => script?.removeEventListener('load', init);
  }, []);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">o</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div ref={buttonRef} className="flex justify-center" />
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
