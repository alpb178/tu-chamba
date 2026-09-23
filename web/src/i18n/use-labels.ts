import { useLocale, useTranslations } from 'next-intl';
import { createLabels } from './labels';
import type { Locale } from './routing';

// Localized enum labels, numbers and dates. Works in client components and in
// non-async server components (async ones use getLabels from labels-server).
export function useLabels() {
  const t = useTranslations('enums');
  const locale = useLocale() as Locale;
  return createLabels(t as never, locale);
}
