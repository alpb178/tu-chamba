import type { Config } from 'tailwindcss';

// Sistema de diseño compartido (marca TuChamba: azul marino + amarillo)
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#102136',
          dark: '#0a1626',
          light: '#E7EAF0',
        },
        accent: {
          DEFAULT: '#fdc101',
          dark: '#e0a900',
        },
      },
    },
  },
  plugins: [],
};
export default config;
