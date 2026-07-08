'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Anuncio, Paginated, User } from '@/lib/types';
import { StatCard } from '@/components/ui';
import { MarcasDestacadas } from '@/components/MarcasDestacadas';

export default function DashboardPage() {
  const [usuarios, setUsuarios] = useState<number | null>(null);
  const [anuncios, setAnuncios] = useState<number | null>(null);

  useEffect(() => {
    api<User[]>('/users').then((u) => setUsuarios(u.length));
    // /anuncios (público) solo cuenta vigentes; el panel necesita el total
    // real, incluidos vencidos y dados de baja.
    api<Paginated<Anuncio>>('/anuncios/todos?limit=1').then((a) =>
      setAnuncios(a.total),
    );
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Resumen</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Usuarios registrados" value={usuarios ?? '—'} />
        <StatCard label="Anuncios publicados" value={anuncios ?? '—'} />
      </div>

      <MarcasDestacadas />
    </div>
  );
}
