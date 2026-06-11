'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Anuncio } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { AnuncioCard } from '@/components/AnuncioCard';
import { Button } from '@/components/ui';

export default function MisAnunciosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    api<Anuncio[]>('/anuncios/mis-anuncios')
      .then(setItems)
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  if (authLoading || loading)
    return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Mis anuncios</h1>
        <Link href="/anuncios/nuevo">
          <Button>Publicar anuncio</Button>
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500">Aún no has publicado anuncios.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((a) => (
            <AnuncioCard key={a.id} anuncio={a} />
          ))}
        </div>
      )}
    </div>
  );
}
