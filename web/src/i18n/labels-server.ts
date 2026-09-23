import { getTranslations } from 'next-intl/server';
import { createLabels } from './labels';
import type { Locale } from './routing';

// Localized enum labels, numbers and dates for server components.
export async function getLabels(locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'enums' });
  return createLabels(t as never, locale);
}
