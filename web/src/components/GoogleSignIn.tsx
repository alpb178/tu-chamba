'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button, FormField, Input, Select } from './ui';

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

// Botón "Continuar con Google" + paso de completar perfil para cuentas
// nuevas (rol y, si es empleador, teléfono — coherente con el registro).
// No se renderiza si NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado.
export function GoogleSignIn() {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  const [idToken, setIdToken] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [role, setRole] = useState<'TRABAJADOR' | 'EMPLEADOR'>('TRABAJADOR');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Referencia estable para el callback de GIS (se inicializa una sola vez).
  const onCredentialRef = useRef<(token: string) => void>(() => {});
  onCredentialRef.current = async (token: string) => {
    setError(null);
    try {
      const res = await loginWithGoogle(token);
      if (res.needsProfile) {
        // Cuenta nueva: pedimos rol (y teléfono si será empleador).
        setIdToken(token);
        setNombre(res.nombre);
      } else {
        router.push('/');
      }
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

  async function completarPerfil(e: React.FormEvent) {
    e.preventDefault();
    if (!idToken) return;
    setError(null);
    setSaving(true);
    try {
      const res = await loginWithGoogle(idToken, {
        role,
        telefono: telefono.trim() || undefined,
      });
      if (!res.needsProfile) router.push('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">o</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {idToken ? (
        <form
          onSubmit={completarPerfil}
          className="space-y-3 rounded-md border border-gray-200 p-3"
        >
          <p className="text-sm text-gray-700">
            ¡Hola{nombre ? `, ${nombre}` : ''}! Para terminar de crear tu
            cuenta, cuéntanos cómo usarás Tu Chamba.
          </p>
          <FormField label="Quiero registrarme como">
            <Select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as 'TRABAJADOR' | 'EMPLEADOR')
              }
            >
              <option value="TRABAJADOR">Trabajador (busco empleo)</option>
              <option value="EMPLEADOR">Empleador (publico empleos)</option>
            </Select>
          </FormField>
          <FormField
            label={
              role === 'EMPLEADOR' ? 'Teléfono (WhatsApp)' : 'Teléfono (opcional)'
            }
          >
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required={role === 'EMPLEADOR'}
            />
          </FormField>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Creando cuenta...' : 'Crear cuenta con Google'}
          </Button>
        </form>
      ) : (
        <>
          <div ref={buttonRef} className="flex justify-center" />
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
