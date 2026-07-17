import type { IconType } from 'react-icons';
import {
  MdBarChart,
  MdCheck,
  MdExpandMore,
  MdFlag,
  MdGroup,
  MdMonitorHeart,
  MdPersonSearch,
  MdReceiptLong,
  MdRefresh,
  MdSearch,
  MdStar,
  MdTrendingUp,
  MdVisibility,
  MdVisibilityOff,
  MdWork,
} from 'react-icons/md';

// SVG empaquetados (react-icons) en lugar de la fuente de Material Symbols:
// sin dependencia del CDN de Google Fonts. Se conservan los nombres de
// Material como API (mismo criterio que en el portal web).
const ICONS: Record<string, IconType> = {
  check: MdCheck,
  expand_more: MdExpandMore,
  flag: MdFlag,
  group: MdGroup,
  // Material Symbols "monitoring" no existe en el set MD clásico.
  monitoring: MdBarChart,
  monitor_heart: MdMonitorHeart,
  person_search: MdPersonSearch,
  receipt_long: MdReceiptLong,
  refresh: MdRefresh,
  search: MdSearch,
  star: MdStar,
  trending_up: MdTrendingUp,
  visibility: MdVisibility,
  visibility_off: MdVisibilityOff,
  work: MdWork,
};

// El tamaño se controla con clases de font-size (text-lg...): el SVG mide 1em.
export function Icon({ name, className = '' }: { name: string; className?: string }) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return <Cmp aria-hidden className={`inline-block shrink-0 ${className}`} />;
}
