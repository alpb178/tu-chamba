'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Review, ReviewsResponse } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Button, FormField } from './ui';
import { ReviewSkeleton } from './Skeleton';

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-500" aria-label={`${value} de 5 estrellas`}>
      {'★'.repeat(value)}
      <span className="text-gray-300">{'★'.repeat(5 - value)}</span>
    </span>
  );
}

// Reseñas del empleador dueño del anuncio. Los TRABAJADORES pueden
// calificar (1-5 + comentario obligatorio); una reseña por empleador.
export function Reviews({
  employerId,
  employerName,
}: {
  employerId: string;
  employerName: string;
}) {
  const { user } = useAuth();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(() => {
    api<ReviewsResponse>(`/reviews?employerId=${employerId}`)
      .then(setData)
      .catch(() => setData(null));
  }, [employerId]);

  useEffect(load, [load]);

  const ownReview = user
    ? data?.items.find((r) => r.authorId === user.id)
    : undefined;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api<Review>('/reviews', {
        method: 'POST',
        body: JSON.stringify({ employerId, rating, comment }),
      });
      setSubmitted(true);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Una reseña por empleador: con la propia ya enviada, no hay formulario.
  const canReview = user?.role === 'TRABAJADOR' && !ownReview;

  return (
    <section className="space-y-3 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          Reseñas de {employerName}
        </h2>
        {data && data.total > 0 && (
          <p className="text-sm text-gray-600">
            <Stars value={Math.round(data.average ?? 0)} />{' '}
            {data.average?.toFixed(1)} · {data.total}{' '}
            {data.total === 1 ? 'reseña' : 'reseñas'}
          </p>
        )}
      </div>

      {data && data.items.length === 0 && (
        <p className="text-sm text-gray-500">
          Este empleador aún no tiene reseñas.
        </p>
      )}

      {/* Mientras cargan las reseñas, siluetas en vez de una lista vacía. */}
      {!data && (
        <ul className="space-y-2" aria-hidden="true">
          <ReviewSkeleton />
          <ReviewSkeleton />
        </ul>
      )}

      <ul className="space-y-2">
        {data?.items.map((r) => (
          <li key={r.id} className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {r.author?.name ?? 'Usuario'}
              </span>
              <Stars value={r.rating} />
            </div>
            <p className="mt-1 text-sm text-gray-600">{r.comment}</p>
          </li>
        ))}
      </ul>

      {user?.role === 'TRABAJADOR' && ownReview && (
        <p className="text-sm text-gray-500">
          {submitted
            ? '¡Gracias por tu reseña!'
            : 'Ya calificaste a este empleador.'}
        </p>
      )}

      {canReview && (
        <form onSubmit={onSubmit} className="space-y-3 rounded-md border border-gray-200 p-3">
          <p className="text-sm font-medium text-gray-700">
            Calificar a este empleador
          </p>
          <FormField label="Calificación">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`text-2xl leading-none ${
                    n <= rating ? 'text-amber-500' : 'text-gray-300'
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </FormField>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? 'Enviando...' : 'Enviar reseña'}
          </Button>
        </form>
      )}
    </section>
  );
}
