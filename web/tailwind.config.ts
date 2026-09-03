import type { Config } from 'tailwindcss';
const {
  default: flattenColorPalette,
} = require('tailwindcss/lib/util/flattenColorPalette');
import svgToDataUri from 'mini-svg-data-uri';

// Sistema de diseño TuChamba: tokens Material 3 (azul primario + ámbar) sobre
// el lenguaje visual editorial portado de Iris Natural (tipografía serif+sans,
// sombras aceternity, esquinas rectas, fondos de grid/puntos y animaciones).
// Los alias brand/accent apuntan a la misma paleta para que el código que aún
// los usa quede automáticamente en el nuevo estilo.
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
        // El acento ámbar apunta a los tokens (antes iba hardcodeado y
        // podía divergir de la paleta si cambiaba el tema).
        accent: {
          DEFAULT: 'rgb(var(--c-secondary-container) / <alpha-value>)',
          dark: 'rgb(var(--c-secondary) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Cuerpo/UI: Libre Franklin. Titulares editoriales: Merriweather serif.
        sans: ['var(--font-libre-franklin)', 'system-ui', 'sans-serif'],
        libre: ['var(--font-libre-franklin)', 'system-ui', 'sans-serif'],
        display: ['var(--font-merriweather-garamond)', 'Georgia', 'serif'],
        merriweather: ['var(--font-merriweather-garamond)', 'Georgia', 'serif'],
      },
      boxShadow: {
        // Sombras suaves multicapa del lenguaje aceternity (Iris Natural).
        derek: `0px 0px 0px 1px rgb(0 0 0 / 0.06),
        0px 1px 1px -0.5px rgb(0 0 0 / 0.06),
        0px 3px 3px -1.5px rgb(0 0 0 / 0.06),
        0px 6px 6px -3px rgb(0 0 0 / 0.06),
        0px 12px 12px -6px rgb(0 0 0 / 0.06),
        0px 24px 24px -12px rgb(0 0 0 / 0.06)`,
        aceternity: `0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`,
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        move: 'move 5s linear infinite',
        'spin-circle': 'spin-circle 3s linear infinite',
        meteor: 'meteor 5s linear infinite',
        // Borde de los anuncios con prioridad: un color cada 5 s (tres tramos,
        // 15 s de vuelta completa). Ver el keyframe para el reparto.
        'featured-border': 'featured-border 15s ease-in-out infinite',
      },
      keyframes: {
        // El borde del anuncio destacado, cambiando de color cada 5 segundos.
        //
        // Cada tramo aguanta 3 s y cruza al siguiente en 2 s: el cambio se ve
        // sin que el borde parpadee, y en un listado con varios destacados
        // todos van a compás (misma animación, mismo arranque) en vez de
        // titilar cada uno por su lado.
        //
        // Solo se anima `border-color`, y eso no es pereza: es la única
        // propiedad de la tarjeta que se puede mover sin que nada se
        // descoloque. El grosor sigue en 1 px, así que el destacado ocupa
        // exactamente lo mismo que el resto.
        //
        // Los tres colores son los tres tonos de la paleta. El azul es
        // `primary-container` (más saturado) y no `primary`, porque `primary`
        // al 40 % es el borde del HOVER de una tarjeta normal y el tramo azul
        // se leería como «tengo el cursor encima» en vez de «este va
        // destacado».
        'featured-border': {
          '0%, 100%': { borderColor: 'rgb(var(--c-secondary-container))' },
          '20%': { borderColor: 'rgb(var(--c-secondary-container))' },
          '33.33%': { borderColor: 'rgb(var(--c-tertiary-container))' },
          '53.33%': { borderColor: 'rgb(var(--c-tertiary-container))' },
          '66.66%': { borderColor: 'rgb(var(--c-primary-container))' },
          '86.66%': { borderColor: 'rgb(var(--c-primary-container))' },
        },
        move: {
          '0%': { transform: 'translateX(-200px)' },
          '100%': { transform: 'translateX(200px)' },
        },
        'spin-circle': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: '1' },
          '70%': { opacity: '1' },
          '100%': {
            transform: 'rotate(215deg) translateX(-500px)',
            opacity: '0',
          },
        },
      },
      screens: {
        xs: '576px',
      },
      // Esquinas rectas por defecto (estética editorial): `rounded` sin sufijo
      // queda cuadrado; las píldoras de marca usan `rounded-full` explícito.
      //
      // Las TARJETAS son la excepción, y por eso tienen token propio en vez de
      // un `rounded-2xl` repetido en treinta sitios: el radio de una tarjeta es
      // una decisión de diseño que se toma una vez, y con la clase suelta el
      // día que cambie hay que ir a buscarla a mano por todo el portal (que es
      // exactamente cómo `FeaturedBrands` se quedó con un radio que no
      // compartía nadie).
      //
      //   rounded-card → superficies de contenido: tarjetas de anuncio, paneles
      //                  de formulario, diálogos, tarjetas del panel.
      //   rounded-tile → lo que va DENTRO o encima de una tarjeta: el tile del
      //                  rubro, los menús desplegables. Menor a propósito: un
      //                  radio interior igual al exterior se ve más redondo que
      //                  el borde que lo contiene.
      borderRadius: {
        DEFAULT: '0',
        card: '1rem',
        tile: '0.75rem',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    // Fondos decorativos de rejilla y puntos por color (bg-grid-<color>, etc.)
    // y la utilidad `highlight` (borde superior interior) del lenguaje aceternity.
    function ({ matchUtilities, theme }: any) {
      matchUtilities(
        {
          'bg-grid': (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          'bg-grid-small': (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          'bg-dot': (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
            )}")`,
          }),
          'bg-dot-thick': (value: any) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="2.5"></circle></svg>`
            )}")`,
          }),
        },
        { values: flattenColorPalette(theme('backgroundColor')), type: 'color' }
      );

      matchUtilities(
        {
          highlight: (value: any) => ({
            boxShadow: `inset 0 1px 0 0 ${value}`,
          }),
        },
        { values: flattenColorPalette(theme('backgroundColor')), type: 'color' }
      );
    },
  ],
};
export default config;
