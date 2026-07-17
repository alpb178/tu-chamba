import type { IconType } from 'react-icons';
import {
  MdBadge,
  MdBusinessCenter,
  MdCategory,
  MdCheck,
  MdChevronLeft,
  MdChevronRight,
  MdCleaningServices,
  MdComputer,
  MdConstruction,
  MdContentCut,
  MdExpandLess,
  MdExpandMore,
  MdLocalShipping,
  MdLocationOn,
  MdMail,
  MdMedicalServices,
  MdNotifications,
  MdOpenInNew,
  MdPayments,
  MdPerson,
  MdPublic,
  MdRestaurant,
  MdSchedule,
  MdSchool,
  MdRefresh,
  MdSearch,
  MdSecurity,
  MdShare,
  MdStar,
  MdStorefront,
  MdTune,
  MdVisibility,
  MdVisibilityOff,
  MdVolunteerActivism,
} from 'react-icons/md';

// SVG empaquetados en el bundle (react-icons) en lugar de la fuente de
// Material Symbols: la fuente dependía del CDN de Google y en redes móviles
// fallaba, mostrando el nombre del icono como texto ("location_on").
// Se conservan los nombres de Material como API para no tocar cada uso.
const ICONS: Record<string, IconType> = {
  badge: MdBadge,
  business_center: MdBusinessCenter,
  category: MdCategory,
  check: MdCheck,
  chevron_left: MdChevronLeft,
  chevron_right: MdChevronRight,
  cleaning_services: MdCleaningServices,
  computer: MdComputer,
  construction: MdConstruction,
  content_cut: MdContentCut,
  expand_less: MdExpandLess,
  expand_more: MdExpandMore,
  local_shipping: MdLocalShipping,
  location_on: MdLocationOn,
  mail: MdMail,
  medical_services: MdMedicalServices,
  notifications: MdNotifications,
  open_in_new: MdOpenInNew,
  payments: MdPayments,
  person: MdPerson,
  public: MdPublic,
  restaurant: MdRestaurant,
  schedule: MdSchedule,
  school: MdSchool,
  refresh: MdRefresh,
  search: MdSearch,
  share: MdShare,
  // Material Symbols "shield_person" no existe en el set MD clásico.
  shield_person: MdSecurity,
  star: MdStar,
  storefront: MdStorefront,
  tune: MdTune,
  visibility: MdVisibility,
  visibility_off: MdVisibilityOff,
  volunteer_activism: MdVolunteerActivism,
};

// El tamaño se controla con clases de font-size (text-lg, text-3xl...):
// el SVG mide 1em, igual que hacía la fuente de iconos.
export function Icon({ name, className = '' }: { name: string; className?: string }) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return <Cmp aria-hidden className={`inline-block shrink-0 ${className}`} />;
}
