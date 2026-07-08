import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchAnuncios } from '@/lib/server-api';
import {
  DEPARTAMENTO_LABEL,
  DEPARTAMENTO_SLUG,
  SLUG_DEPARTAMENTO,
} from '@/lib/types';
import { AnuncioCard } from '@/components/AnuncioCard';

type Params = { params: Promise<{ departamento: string }> };

// Genera las 9 páginas de departamento en build (indexables y rápidas).
export function generateStaticParams() {
  return Object.values(DEPARTAMENTO_SLUG).map((departamento) => ({ departamento }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { departamento } = await params;
  const dep = SLUG_DEPARTAMENTO[departamento];
  if (!dep) return { title: 'Empleos — Tu Chamba' };
  const nombre = DEPARTAMENTO_LABEL[dep];
  const title = `Empleos en ${nombre} — Tu Chamba`;
  const description = `Ofertas de trabajo y chamba en ${nombre}, Bolivia. Encuentra empleo cerca de ti y contacta por WhatsApp.`;
  return {
    title,
    description,
    alternates: { canonical: `/empleos/${departamento}` },
    openGraph: { title, description },
  };
}

export default async function EmpleosDepartamentoPage({ params }: Params) {
  const { departamento } = await params;
  const dep = SLUG_DEPARTAMENTO[departamento];
  if (!dep) notFound();

  const nombre = DEPARTAMENTO_LABEL[dep];
  const data = await fetchAnuncios({ departamento: dep, limit: 50 });
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:text-brand">
          Inicio
        </Link>{' '}
        / Empleos en {nombre}
      </nav>

      <header>
        <h1 className="text-2xl font-bold text-brand">Empleos en {nombre}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {items.length > 0
            ? `${data?.total} ${data?.total === 1 ? 'oferta disponible' : 'ofertas disponibles'} en ${nombre}, Bolivia.`
            : `Aún no hay ofertas activas en ${nombre}. Vuelve pronto.`}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {items.map((a) => (
          <AnuncioCard key={a.id} anuncio={a} />
        ))}
      </div>
    </div>
  );
}
