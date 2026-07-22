import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  IdCard,
  X,
  BadgeCheck,
  Briefcase,
  Shapes,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  SprayCan,
  Monitor,
  Construction,
  Scissors,
  ChevronUp,
  ChevronDown,
  ThumbsUp,
  Truck,
  MapPin,
  Mail,
  BriefcaseMedical,
  Bell,
  Maximize2,
  ExternalLink,
  CreditCard,
  User,
  Globe,
  Upload,
  Utensils,
  Clock,
  GraduationCap,
  RefreshCw,
  Search,
  ShieldUser,
  Share2,
  Star,
  Store,
  SlidersHorizontal,
  Eye,
  EyeOff,
  HandHeart,
  CheckCircle2,
  Ban,
  Smartphone,
} from 'lucide-react';

// SVG empaquetados en el bundle (lucide-react, la misma librería que usa el
// proyecto hermano Iris Natural) en lugar de la fuente de Material Symbols:
// la fuente dependía del CDN de Google y en redes móviles fallaba, mostrando
// el nombre del icono como texto ("location_on"). Se conservan los nombres de
// Material como API (clave del objeto) para no tocar cada uso.
const ICONS: Record<string, LucideIcon> = {
  badge: IdCard,
  business_center: Briefcase,
  category: Shapes,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  arrow_upward: ArrowUp,
  check: Check,
  close: X,
  verified: BadgeCheck,
  delete: Trash2,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  cleaning_services: SprayCan,
  computer: Monitor,
  construction: Construction,
  content_cut: Scissors,
  expand_less: ChevronUp,
  expand_more: ChevronDown,
  // lucide-react ya no incluye iconos de marca; se usa el "pulgar arriba"
  // como equivalente reconocible para el enlace de Facebook.
  facebook: ThumbsUp,
  local_shipping: Truck,
  location_on: MapPin,
  mail: Mail,
  medical_services: BriefcaseMedical,
  notifications: Bell,
  open_in_full: Maximize2,
  open_in_new: ExternalLink,
  payments: CreditCard,
  person: User,
  public: Globe,
  publish: Upload,
  restaurant: Utensils,
  schedule: Clock,
  school: GraduationCap,
  refresh: RefreshCw,
  search: Search,
  share: Share2,
  shield_person: ShieldUser,
  star: Star,
  storefront: Store,
  tune: SlidersHorizontal,
  visibility: Eye,
  visibility_off: EyeOff,
  volunteer_activism: HandHeart,
  // Estados / dispositivos.
  check_circle: CheckCircle2,
  block: Ban,
  smartphone: Smartphone,
};

// El tamaño se controla con clases de font-size (text-lg, text-3xl...): los
// iconos de lucide-react miden 24px fijos por defecto y NO responden a las
// clases text-*, así que se fuerza width/height a 1em para que el SVG escale
// con el font-size igual que hacía la fuente de iconos.
export function Icon({ name, className = '' }: { name: string; className?: string }) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return (
    <Cmp
      aria-hidden
      width="1em"
      height="1em"
      className={`inline-block shrink-0 ${className}`}
    />
  );
}
