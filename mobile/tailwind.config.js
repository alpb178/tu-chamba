/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
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
