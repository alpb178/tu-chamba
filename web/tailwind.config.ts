import type { Config } from 'tailwindcss';

// Sistema de diseño TuChamba: tokens Material 3 (azul primario + ámbar).
// Los alias brand/accent apuntan a la misma paleta para que el código que
// aún los usa quede automáticamente en el nuevo estilo.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // Siempre modo claro: sin la clase 'dark' las variantes dark: no aplican.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': 'rgb(var(--c-primary) / <alpha-value>)',
        'on-primary': 'rgb(var(--c-on-primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--c-primary-container) / <alpha-value>)',
        'on-primary-container': 'rgb(var(--c-on-primary-container) / <alpha-value>)',
        'secondary': 'rgb(var(--c-secondary) / <alpha-value>)',
        'on-secondary': 'rgb(var(--c-on-secondary) / <alpha-value>)',
        'secondary-container': 'rgb(var(--c-secondary-container) / <alpha-value>)',
        'on-secondary-container': 'rgb(var(--c-on-secondary-container) / <alpha-value>)',
        'tertiary': 'rgb(var(--c-tertiary) / <alpha-value>)',
        'on-tertiary': 'rgb(var(--c-on-tertiary) / <alpha-value>)',
        'tertiary-container': 'rgb(var(--c-tertiary-container) / <alpha-value>)',
        'on-tertiary-container': 'rgb(var(--c-on-tertiary-container) / <alpha-value>)',
        'error': 'rgb(var(--c-error) / <alpha-value>)',
        'on-error': 'rgb(var(--c-on-error) / <alpha-value>)',
        'error-container': 'rgb(var(--c-error-container) / <alpha-value>)',
        'on-error-container': 'rgb(var(--c-on-error-container) / <alpha-value>)',
        'background': 'rgb(var(--c-background) / <alpha-value>)',
        'on-background': 'rgb(var(--c-on-background) / <alpha-value>)',
        'surface': 'rgb(var(--c-surface) / <alpha-value>)',
        'on-surface': 'rgb(var(--c-on-surface) / <alpha-value>)',
        'surface-variant': 'rgb(var(--c-surface-variant) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--c-on-surface-variant) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--c-surface-container-lowest) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--c-surface-container-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--c-surface-container) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--c-surface-container-high) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--c-surface-container-highest) / <alpha-value>)',
        'surface-dim': 'rgb(var(--c-surface-dim) / <alpha-value>)',
        'inverse-surface': 'rgb(var(--c-inverse-surface) / <alpha-value>)',
        'inverse-on-surface': 'rgb(var(--c-inverse-on-surface) / <alpha-value>)',
        'inverse-primary': 'rgb(var(--c-inverse-primary) / <alpha-value>)',
        'outline': 'rgb(var(--c-outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--c-outline-variant) / <alpha-value>)',
        // Alias del código existente -> tokens (cambian con el tema).
        brand: {
          DEFAULT: 'rgb(var(--c-brand) / <alpha-value>)',
          dark: 'rgb(var(--c-brand-strong) / <alpha-value>)',
          light: 'rgb(var(--c-brand-light) / <alpha-value>)',
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
