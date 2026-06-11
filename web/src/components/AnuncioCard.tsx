import Link from 'next/link';
import { Anuncio } from '@/lib/types';
import { Badge } from './Badge';

export function AnuncioCard({ anuncio }: { anuncio: Anuncio }) {
  return (
    <Link
      href={`/anuncios/${anuncio.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 text-sm text-gray-800">{anuncio.descripcion}</p>
        <Badge tipo={anuncio.tipoJornada} />
      </div>
      <div className="mt-3">
        <span className="text-lg font-semibold text-brand">
          Bs {Number(anuncio.salario).toLocaleString('es-BO')}
        </span>
      </div>
    </Link>
  );
}
