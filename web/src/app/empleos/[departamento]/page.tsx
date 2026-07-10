import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchAds } from '@/lib/server-api';
import {
  DEPARTMENT_LABEL,
  DEPARTMENT_SLUG,
  SLUG_TO_DEPARTMENT,
} from '@/lib/types';
import { AdCard } from '@/components/AdCard';

// El segmento de ruta se llama [departamento] porque es parte de la URL
// pública SEO (/empleos/la-paz); el nombre del parámetro debe coincidir.
type Params = { params: Promise<{ departamento: string }> };

// Genera las 9 páginas de departamento en build (indexables y rápidas).
export function generateStaticParams() {
  return Object.values(DEPARTMENT_SLUG).map((departamento) => ({ departamento }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { departamento: slug } = await params;
  const department = SLUG_TO_DEPARTMENT[slug];
  if (!department) return { title: 'Empleos — Tu Chamba' };
  const departmentName = DEPARTMENT_LABEL[department];
  const title = `Empleos en ${departmentName} — Tu Chamba`;
  const description = `Ofertas de trabajo y chamba en ${departmentName}, Bolivia. Encuentra empleo cerca de ti y contacta por WhatsApp.`;
  return {
    title,
    description,
    alternates: { canonical: `/empleos/${slug}` },
    openGraph: { title, description },
  };
}

export default async function DepartmentJobsPage({ params }: Params) {
  const { departamento: slug } = await params;
  const department = SLUG_TO_DEPARTMENT[slug];
  if (!department) notFound();

  const departmentName = DEPARTMENT_LABEL[department];
  const data = await fetchAds({ department, limit: 50 });
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:text-brand">
          Inicio
        </Link>{' '}
        / Empleos en {departmentName}
      </nav>

      <header>
        <h1 className="text-2xl font-bold text-brand">Empleos en {departmentName}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {items.length > 0
            ? `${data?.total} ${data?.total === 1 ? 'oferta disponible' : 'ofertas disponibles'} en ${departmentName}, Bolivia.`
            : `Aún no hay ofertas activas en ${departmentName}. Vuelve pronto.`}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {items.map((a) => (
          <AdCard key={a.id} ad={a} />
        ))}
      </div>
    </div>
  );
}
