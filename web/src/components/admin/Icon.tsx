import type { IconType } from 'react-icons';
import {
  MdAdminPanelSettings,
  MdAdsClick,
  MdBarChart,
  MdCheck,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdHistory,
  MdDelete,
  MdEdit,
  MdExpandMore,
  MdFlag,
  MdGroup,
  MdLanguage,
  MdLogout,
  MdMailOutline,
  MdMenu,
  MdMonitorHeart,
  MdPersonAdd,
  MdPersonSearch,
  MdPublish,
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
  admin_panel_settings: MdAdminPanelSettings,
  ads_click: MdAdsClick,
  check: MdCheck,
  chevron_left: MdChevronLeft,
  chevron_right: MdChevronRight,
  close: MdClose,
  history: MdHistory,
  delete: MdDelete,
  edit: MdEdit,
  expand_more: MdExpandMore,
  flag: MdFlag,
  group: MdGroup,
  language: MdLanguage,
  logout: MdLogout,
  mail: MdMailOutline,
  menu: MdMenu,
  // Material Symbols "monitoring" no existe en el set MD clásico.
  monitoring: MdBarChart,
  monitor_heart: MdMonitorHeart,
  person_add: MdPersonAdd,
  person_search: MdPersonSearch,
  publish: MdPublish,
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
