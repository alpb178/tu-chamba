import type { Config } from 'tailwindcss';

// Sistema de diseño TuChamba: tokens Material 3 (azul primario + ámbar).
// Los alias brand/accent apuntan a la misma paleta para que el código que
// aún los usa quede automáticamente en el nuevo estilo.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#004ac6',
        'on-primary': '#ffffff',
        'primary-container': '#2563eb',
        'on-primary-container': '#eeefff',
        secondary: '#855300',
        'on-secondary': '#ffffff',
        'secondary-container': '#fea619',
        'on-secondary-container': '#684000',
        tertiary: '#006242',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#007d55',
        'on-tertiary-container': '#bdffdb',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        background: '#faf8ff',
        'on-background': '#131b2e',
        surface: '#faf8ff',
        'on-surface': '#131b2e',
        'surface-variant': '#dae2fd',
        'on-surface-variant': '#434655',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f3ff',
        'surface-container': '#eaedff',
        'surface-container-high': '#e2e7ff',
        'surface-container-highest': '#dae2fd',
        'surface-dim': '#d2d9f4',
        'inverse-surface': '#283044',
        'inverse-on-surface': '#eef0ff',
        'inverse-primary': '#b4c5ff',
        outline: '#737686',
        'outline-variant': '#c3c6d7',
        // Alias del código existente → nueva paleta.
        brand: {
          DEFAULT: '#004ac6',
          dark: '#003ea8',
          light: '#dbe1ff',
        },
        accent: {
          DEFAULT: '#fea619',
          dark: '#e08c00',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-hanken)', 'var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
