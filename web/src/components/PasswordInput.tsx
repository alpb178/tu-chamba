'use client';

import { InputHTMLAttributes, useState } from 'react';
import { Icon } from './Icon';

// Campo de contraseña con "ojito" para mostrar/ocultar el valor.
// Mismos estilos que Input, con el botón integrado a la derecha.
export function PasswordInput({
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className={`w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 pr-11 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-outline transition-colors hover:text-primary"
      >
        <Icon name={visible ? 'visibility_off' : 'visibility'} className="text-xl" />
      </button>
    </div>
  );
}
