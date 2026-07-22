import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Une clases de Tailwind resolviendo conflictos (el último gana). Portado del
// design system de Iris Natural para poder reutilizar sus componentes de UI.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
