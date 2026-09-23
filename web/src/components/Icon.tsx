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

// SVGs bundled into the app (lucide-react, the same library the sister
// project Iris Natural uses) instead of the Material Symbols font: the font
// depended on Google's CDN and failed on mobile networks, showing the icon
// name as text ("location_on"). The Material names are kept as the API
// (object keys) so no call site has to change.
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
  // lucide-react no longer ships brand icons; the "thumbs up" is used as a
  // recognizable stand-in for the Facebook link.
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
  // States / devices.
  check_circle: CheckCircle2,
  block: Ban,
  smartphone: Smartphone,
};

// Size is controlled with font-size classes (text-lg, text-3xl...): lucide-react
// icons are a fixed 24px by default and do NOT respond to text-* classes, so
// width/height are forced to 1em so the SVG scales with font-size just like
// the icon font did.
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
