import type { Locale } from './i18n/routing';
import type { Messages } from './i18n/messages';

// Typed translation keys: t('nav.publish') fails to compile if the key is
// missing from the Spanish messages (the English ones are checked against
// them in i18n/messages.test.ts).
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
