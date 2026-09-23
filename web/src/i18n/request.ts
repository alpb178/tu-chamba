import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { messages } from './messages';

export default getRequestConfig(async ({ requestLocale }) => {
  // The [locale] segment; missing outside it (e.g. the /admin panel, which
  // is Spanish only).
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return { locale, messages: messages[locale] };
});
