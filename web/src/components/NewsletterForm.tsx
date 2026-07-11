'use client';

import { useState } from 'react';

// Suscripción a novedades. UI-only por ahora: valida y confirma en el cliente.
// Para persistir emails hace falta un endpoint (p. ej. POST /newsletter).
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setOk(true);
    setEmail('');
  }

  return (
    <div>
      <p className="mb-2 text-sm text-on-surface-variant">Recibe nuevas ofertas por correo</p>
      {ok ? (
        <p className="text-sm text-tertiary">
          ¡Gracias! Te avisaremos de nuevas ofertas.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex items-center gap-2 border-b border-outline-variant pb-1">
          <label htmlFor="newsletter-email" className="sr-only">
            Tu correo para novedades
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu email para novedades"
            className="w-full bg-transparent text-sm text-on-surface placeholder-outline outline-none"
          />
          <button
            type="submit"
            aria-label="Suscribirme"
            className="shrink-0 rounded-md p-1 text-on-surface-variant transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}
