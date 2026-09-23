import { Ad } from './types';

// The /listings backend doesn't accept a sort parameter, so sorting is
// applied client-side on the cards already loaded (the current page on
// desktop; the infinite-scroll accumulation on mobile). It doesn't touch the
// API.
//
// It lives in `lib` rather than inside `home-client` so it can be tested: the
// featured-ads rule is the only thing on this screen that can go wrong
// silently (it shows up as "the paid ad isn't at the top", which nobody
// reports).
export type SortOption =
  | 'newest'
  | 'oldest'
  | 'salary-desc'
  | 'salary-asc';

export const SORT_LABEL: Record<SortOption, string> = {
  newest: 'Más recientes',
  oldest: 'Más antiguos',
  'salary-desc': 'Salario: mayor a menor',
  'salary-asc': 'Salario: menor a mayor',
};

// Sorts a copy of the listings by the chosen option. The salary may be null
// ("a convenir"): it is pushed to the end in both directions.
//
// FEATURED ads always go first, above the chosen option. They didn't use to:
// the backend puts them at the start and this function re-sorted the whole
// list by date or salary, so the ad prioritized from the panel lost its place
// as soon as the page rendered. Priority was useless on the portal, which is
// exactly where it had to work.
//
// Among featured ads their ARRIVAL ORDER rules, and that's the detail that
// makes this work: the priority number is deliberately not sent to the portal
// (`toPublicAd` replaces it with `featured` so the assigned position isn't
// revealed), but the API returns them already sorted by descending priority
// — so the position they arrive in IS the priority, and we just have to keep
// it. That's why the index is taken BEFORE re-sorting.
//
// The chosen option still rules everything else: it is applied to the whole
// list and `filter` keeps that order for non-featured ads.
export function sortAds(list: Ad[], sort: SortOption): Ad[] {
  const salaryOf = (a: Ad) =>
    a.salary != null && a.salary !== '' ? Number(a.salary) : null;
  const arrivalIndex = new Map(list.map((ad, i) => [ad.id, i]));
  const out = [...list];
  switch (sort) {
    case 'oldest':
      out.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      break;
    case 'salary-desc':
      out.sort((a, b) => {
        const sa = salaryOf(a);
        const sb = salaryOf(b);
        if (sa == null) return sb == null ? 0 : 1;
        if (sb == null) return -1;
        return sb - sa;
      });
      break;
    case 'salary-asc':
      out.sort((a, b) => {
        const sa = salaryOf(a);
        const sb = salaryOf(b);
        if (sa == null) return sb == null ? 0 : 1;
        if (sb == null) return -1;
        return sa - sb;
      });
      break;
    case 'newest':
    default:
      out.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
  const featuredAds = out
    .filter((ad) => ad.featured)
    .sort(
      (a, b) => (arrivalIndex.get(a.id) ?? 0) - (arrivalIndex.get(b.id) ?? 0),
    );
  const rest = out.filter((ad) => !ad.featured);
  return [...featuredAds, ...rest];
}
