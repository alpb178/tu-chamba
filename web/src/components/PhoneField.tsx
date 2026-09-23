'use client';

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Phones saved before the international input have no country code:
// they're assumed Bolivian so the field displays them correctly.
function toE164(value: string) {
  if (!value) return undefined;
  if (value.startsWith('+')) return value;
  return `+591${value.replace(/\D/g, '')}`;
}

// International phone field (react-phone-number-input): country selector
// with flag (Bolivia by default) and E.164 format (+591…), which prevents
// mistyped numbers. Styles in globals.css (.PhoneInput*).
export function PhoneField({
  value,
  onChange,
  required = false,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
}) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="BO"
      value={toE164(value)}
      onChange={(v) => onChange(v ?? '')}
      required={required}
    />
  );
}
