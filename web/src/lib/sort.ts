import { Ad } from './types';

// El backend de /listings no admite parámetro de orden, así que el orden se
// aplica en cliente sobre las tarjetas ya cargadas (la página actual en
// escritorio; el acumulado del scroll infinito en móvil). No toca la API.
//
// Vive en `lib` y no dentro de `home-client` para poder probarlo: la regla de
// los destacados es lo único de esta pantalla que se puede equivocar en
// silencio (se nota como «el anuncio pagado no sale arriba», que nadie
// reporta).
export type SortOption =
  | 'recientes'
  | 'antiguos'
  | 'salario-desc'
  | 'salario-asc';

export const SORT_LABEL: Record<SortOption, string> = {
  recientes: 'Más recientes',
  antiguos: 'Más antiguos',
  'salario-desc': 'Salario: mayor a menor',
  'salario-asc': 'Salario: menor a mayor',
};

// Ordena una copia de las ofertas según la opción elegida. El salario puede
// venir nulo (a convenir): se manda al final en ambos sentidos.
//
// Los DESTACADOS van primero, siempre, por encima de la opción elegida. Antes
// no: el backend los pone al principio y esta función volvía a ordenar la lista
// entera por fecha o por salario, así que el anuncio priorizado desde el panel
// perdía su sitio en cuanto la página se pintaba. La prioridad no servía para
// nada en el portal, que es justo donde tenía que servir.
//
// Entre los destacados manda su ORDEN DE LLEGADA, y ahí está el detalle que
// hace que esto funcione: el número de prioridad no viaja al portal a
// propósito (`toPublicAd` lo cambia por `featured` para no revelar la posición
// asignada), pero la API los devuelve ya ordenados por prioridad
// descendente — así que la posición con la que llegan ES la prioridad, y
// basta con no perderla. Por eso el índice se toma ANTES de reordenar.
//
// La opción elegida sigue mandando en todo lo demás: se aplica a la lista
// completa y `filter` conserva ese orden para los no destacados.
export function sortAds(list: Ad[], sort: SortOption): Ad[] {
  const salaryOf = (a: Ad) =>
    a.salary != null && a.salary !== '' ? Number(a.salary) : null;
  const llegada = new Map(list.map((ad, i) => [ad.id, i]));
  const out = [...list];
  switch (sort) {
    case 'antiguos':
      out.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      break;
    case 'salario-desc':
      out.sort((a, b) => {
        const sa = salaryOf(a);
        const sb = salaryOf(b);
        if (sa == null) return sb == null ? 0 : 1;
        if (sb == null) return -1;
        return sb - sa;
      });
      break;
    case 'salario-asc':
      out.sort((a, b) => {
        const sa = salaryOf(a);
        const sb = salaryOf(b);
        if (sa == null) return sb == null ? 0 : 1;
        if (sb == null) return -1;
        return sa - sb;
      });
      break;
    case 'recientes':
    default:
      out.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
  const destacados = out
    .filter((ad) => ad.featured)
    .sort((a, b) => (llegada.get(a.id) ?? 0) - (llegada.get(b.id) ?? 0));
  const resto = out.filter((ad) => !ad.featured);
  return [...destacados, ...resto];
}
