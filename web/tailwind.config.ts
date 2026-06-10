import type { Config } from 'tailwindcss';

// Sistema de diseño compartido (marca verde, estilo clasificados El Deber)
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de marca TuChamba
        brand: {
          DEFAULT: '#102136', // azul marino
          dark: '#0a1626',
          light: '#E7EAF0',
        },
        accent: {
          DEFAULT: '#fdc101', // amarillo
          dark: '#e0a900',
        },
      },
    },
  },
  plugins: [],
};
export default config;
