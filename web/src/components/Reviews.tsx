'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Review, ReviewsResponse } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Button, FormField } from './ui';
import { ReviewSkeleton } from './Skeleton';

function Stars({ value }: { value: number }) {
  return (
    <span className="text-secondary-container" aria-label={`${value} de 5 estrellas`}>
      {'★'.repeat(value)}
      <span className="text-outline-variant">{'★'.repeat(5 - value)}</span>
    </span>
  );
}

// Reviews of the poster who owns the ad. Any authenticated user can rate
// someone else's ad (1-5 + comment); one per ad.
export function Reviews({
  adId,
  ownerId,
  ownerName,
}: {
  adId: string;
  ownerId: string;
  ownerName: string;
}) {
  const { user } = useAuth();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // The form is visually heavy: collapsed until the user wants to rate.
  const [formOpen, setFormOpen] = useState(false);

  // Reloads when the user changes: alreadyReviewed depends on the token.
  const load = useCallback(() => {
    api<ReviewsResponse>(`/reviews?ownerId=${ownerId}&adId=${adId}`)
      .then(setData)
      .catch(() => setData(null));
  }, [ownerId, adId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  // Already rated this ad: the backend says so (the user's own review may not
  // be on the first page of the poster's list).
  const alreadyReviewed = Boolean(data?.alreadyReviewed);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api<Review>('/reviews', {
        method: 'POST',
        body: JSON.stringify({ adId, rating, comment }),
      });
      setSubmitted(true);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // One review per ad and never on your own ad. Waits for loading so the
  // button isn't shown and then removed.
  const isOwner = user?.id === ownerId;
  const canReview = Boolean(user) && !isOwner && data != null && !alreadyReviewed;

  return (
    <section className="space-y-3 border-t border-outline-variant/60 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-on-surface-variant">
          Reseñas de {ownerName}
        </h2>
        {data && data.total > 0 && (
          <p className="text-sm text-on-surface-variant">
            <Stars value={Math.round(data.average ?? 0)} />{' '}
            {data.average?.toFixed(1)} · {data.total}{' '}
            {data.total === 1 ? 'reseña' : 'reseñas'}
          </p>
        )}
      </div>

      {data && data.items.length === 0 && (
        <p className="text-sm text-on-surface-variant">
          Este publicante aún no tiene reseñas.
        </p>
      )}

      {/* While reviews load, skeletons instead of an empty list. */}
      {!data && (
        <ul className="space-y-2" aria-hidden="true">
          <ReviewSkeleton />
          <ReviewSkeleton />
        </ul>
      )}

      <ul className="space-y-2">
        {data?.items.map((r) => (
          <li key={r.id} className="bg-surface-container-low p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-on-surface-variant">
                {r.author?.name ?? 'Usuario'}
              </span>
              <Stars value={r.rating} />
            </div>
            <p className="mt-1 text-base text-on-surface-variant">{r.comment}</p>
          </li>
        ))}
      </ul>

      {user && !isOwner && alreadyReviewed && (
        <p className="text-sm text-on-surface-variant">
          {submitted
            ? '¡Gracias por tu reseña!'
            : 'Ya calificaste este anuncio.'}
        </p>
      )}

      {canReview && !formOpen && (
        <Button variant="outline" onClick={() => setFormOpen(true)}>
          Calificar este anuncio
        </Button>
      )}

      {canReview && formOpen && (
        <form onSubmit={onSubmit} className="space-y-3 border border-outline-variant p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-on-surface-variant">
              Calificar este anuncio
            </p>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-xs text-on-surface-variant underline hover:text-brand"
            >
              Cancelar
            </button>
          </div>
          <FormField label="Calificación">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`text-2xl leading-none ${
                    n <= rating ? 'text-secondary-container' : 'text-outline-variant'
                  }`}
                  aria-label={`${n} estrellas`}
                >
                  ★
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Comentario">
            <textarea
              className="w-full border border-outline-variant px-3 py-2 text-base outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </FormField>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? 'Enviando...' : 'Enviar reseña'}
          </Button>
        </form>
      )}
    </section>
  );
}
