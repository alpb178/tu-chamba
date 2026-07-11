'use client';

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Los teléfonos guardados antes del input internacional no llevan código
// de país: se asumen bolivianos para que el campo los muestre bien.
function toE164(value: string) {
  if (!value) return undefined;
  if (value.startsWith('+')) return value;
  return `+591${value.replace(/\D/g, '')}`;
}

// Campo de teléfono internacional (react-phone-number-input): selector de
// país con bandera (Bolivia por defecto) y formato E.164 (+591…), que
// evita números mal escritos. Estilos en globals.css (.PhoneInput*).
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
