import type { LucideIcon } from 'lucide-react';
import {
  ShieldUser,
  MousePointerClick,
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  Trash2,
  Pencil,
  ChevronDown,
  Flag,
  Users,
  Languages,
  LogOut,
  Mail,
  Menu,
  HeartPulse,
  UserPlus,
  UserSearch,
  Upload,
  ReceiptText,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  Eye,
  EyeOff,
  Briefcase,
  CheckCircle2,
  Clock,
  Ban,
  Smartphone,
  Monitor,
} from 'lucide-react';

// SVG empaquetados (lucide-react, la misma librería que usa el proyecto
// hermano Iris Natural) en lugar de la fuente de Material Symbols: sin
// dependencia del CDN de Google Fonts. Se conservan los nombres de Material
// como API (mismo criterio que en el portal web).
const ICONS: Record<string, LucideIcon> = {
  admin_panel_settings: ShieldUser,
  ads_click: MousePointerClick,
  check: Check,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  close: X,
  history: History,
  delete: Trash2,
  edit: Pencil,
  expand_more: ChevronDown,
  flag: Flag,
  group: Users,
  language: Languages,
  logout: LogOut,
  mail: Mail,
  menu: Menu,
  monitoring: Activity,
  monitor_heart: HeartPulse,
  person_add: UserPlus,
  person_search: UserSearch,
  publish: Upload,
  receipt_long: ReceiptText,
  refresh: RefreshCw,
  search: Search,
  star: Star,
  trending_up: TrendingUp,
  visibility: Eye,
  visibility_off: EyeOff,
  work: Briefcase,
  // Estados / dispositivos.
  check_circle: CheckCircle2,
  schedule: Clock,
  block: Ban,
  smartphone: Smartphone,
  computer: Monitor,
};

// El tamaño se controla con clases de font-size (text-lg...): los iconos de
// lucide-react miden 24px fijos por defecto y no responden a text-*, así que
// se fuerza width/height a 1em para que el SVG escale con el font-size.
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
