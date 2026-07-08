'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Notificacion, NotificacionesResponse, TipoNotificacion } from '@/lib/types';
import { useAuth } from '@/lib/auth';

const POLL_MS = 30_000;

const ICONO: Record<TipoNotificacion, string> = {
  CHAT_INICIADO: '💬',
  NUEVA_REVIEW: '⭐',
  ANUNCIO_VENCIDO: '⏰',
  NUEVO_ANUNCIO: '📢',
};

function hace(fecha: string) {
  const min = Math.floor((Date.now() - new Date(fecha).getTime()) / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(fecha).toLocaleDateString('es-BO');
}

// Campana de notificaciones in-app (solo usuarios autenticados).
// Refresca por polling; al hacer clic se marca leída y, si la notificación
// referencia un anuncio, navega a su detalle.
export function NotificacionesBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<NotificacionesResponse | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api<NotificacionesResponse>('/notificaciones')
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [user, load]);

  // Cierra el panel al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!user) return null;

  async function abrir(n: Notificacion) {
    setOpen(false);
    if (!n.leida) {
      // Optimista: no bloqueamos la navegación por el marcado.
      api(`/notificaciones/${n.id}/leida`, { method: 'PATCH' })
        .then(load)
        .catch(() => {});
    }
    if (n.anuncioId) router.push(`/anuncios/${n.anuncioId}`);
  }

  async function leerTodas() {
    await api('/notificaciones/leer-todas', { method: 'POST' }).catch(() => {});
    load();
  }

  const noLeidas = data?.noLeidas ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-xl leading-none hover:bg-gray-100"
        aria-label={`Notificaciones${noLeidas ? ` (${noLeidas} sin leer)` : ''}`}
      >
        🔔
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-sm font-semibold text-gray-700">
              Notificaciones
            </span>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={leerTodas}
                className="text-xs text-brand underline hover:text-brand-dark"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {!data || data.items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-gray-500">
                No tienes notificaciones.
              </li>
            ) : (
              data.items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-gray-50 ${
                      n.leida ? 'opacity-60' : 'bg-brand-light/30'
                    }`}
                  >
                    <span className="mt-0.5">{ICONO[n.tipo]}</span>
                    <span className="flex-1">
                      <span className="block text-sm text-gray-800">
                        {n.mensaje}
                      </span>
                      <span className="text-xs text-gray-400">
                        {hace(n.createdAt)}
                        {n.anuncioId ? ' · Ver detalles' : ''}
                      </span>
                    </span>
                    {!n.leida && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
