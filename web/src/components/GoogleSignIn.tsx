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
        // Máximo que permite GIS: cubre el botón propio que tiene debajo.
        width: 400,
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-surface-container-high" />
        <span className="text-xs text-outline">o</span>
        <div className="h-px flex-1 bg-surface-container-high" />
      </div>

      {/* Botón propio, siempre visible. Con el OAuth configurado, el botón
          real de Google se superpone invisible y captura el clic; sin
          configurar, se explica en vez de esconder la opción. */}
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            !CLIENT_ID &&
            setError(
              'El inicio con Google aún no está disponible. Usa tu correo y contraseña.',
            )
          }
          className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm font-medium text-on-surface transition-all hover:border-primary active:scale-[0.99]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l4-3.1z"
            />
            <path
              fill="#EA4335"
              d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z"
            />
          </svg>
          Continuar con Google
        </button>
        {CLIENT_ID && (
          <div
            ref={buttonRef}
            aria-hidden="true"
            className="absolute inset-0 flex justify-center overflow-hidden opacity-0"
          />
        )}
      </div>
      {error && <p className="text-center text-sm text-error">{error}</p>}
    </div>
  );
}
