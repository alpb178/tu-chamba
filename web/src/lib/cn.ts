import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merges Tailwind classes resolving conflicts (last one wins). Ported from the
// Iris Natural design system so its UI components can be reused.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
