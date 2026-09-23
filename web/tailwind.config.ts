import type { Config } from 'tailwindcss';
const {
  default: flattenColorPalette,
} = require('tailwindcss/lib/util/flattenColorPalette');
import svgToDataUri from 'mini-svg-data-uri';

// TuChamba design system: Material 3 tokens (primary blue + amber) on top of
// the editorial visual language ported from Iris Natural (serif+sans type,
// aceternity shadows, square corners, grid/dot backgrounds and animations).
// The brand/accent aliases point to the same palette so code that still uses
// them automatically picks up the new style.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // Always light mode: without the 'dark' class the dark: variants don't apply.
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
        // Aliases from existing code -> tokens (they change with the theme).
        brand: {
          DEFAULT: 'rgb(var(--c-brand) / <alpha-value>)',
          dark: 'rgb(var(--c-brand-strong) / <alpha-value>)',
          light: 'rgb(var(--c-brand-light) / <alpha-value>)',
        },
        // The amber accent points to the tokens (it used to be hardcoded and
        // could drift from the palette if the theme changed).
        accent: {
          DEFAULT: 'rgb(var(--c-secondary-container) / <alpha-value>)',
          dark: 'rgb(var(--c-secondary) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Body/UI: Libre Franklin. Editorial headlines: Merriweather serif.
        sans: ['var(--font-libre-franklin)', 'system-ui', 'sans-serif'],
        libre: ['var(--font-libre-franklin)', 'system-ui', 'sans-serif'],
        display: ['var(--font-merriweather-garamond)', 'Georgia', 'serif'],
        merriweather: ['var(--font-merriweather-garamond)', 'Georgia', 'serif'],
      },
      boxShadow: {
        // Soft multi-layer shadows from the aceternity language (Iris Natural).
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
        // Border of priority ads: one color every 5 s (three segments, 15 s
        // for a full cycle). See the keyframe for the breakdown.
        'featured-border': 'featured-border 15s ease-in-out infinite',
      },
      keyframes: {
        // The featured ad's border, changing color every 5 seconds.
        //
        // Each segment holds for 3 s and crosses into the next over 2 s: the
        // change is visible without the border flickering, and in a list with
        // several featured ads they all move in step (same animation, same
        // start) instead of each one twinkling on its own.
        //
        // Only `border-color` is animated, and that's not laziness: it's the
        // only property of the card that can change without shifting
        // anything. The width stays at 1 px, so the featured card takes up
        // exactly the same space as the rest.
        //
        // The three colors are the palette's three tones. The blue is
        // `primary-container` (more saturated) rather than `primary`, because
        // `primary` at 40 % is the HOVER border of a regular card and the blue
        // segment would read as "the cursor is over me" instead of "this one
        // is featured".
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
      // Square corners by default (editorial look): `rounded` with no suffix
      // stays square; brand pills use an explicit `rounded-full`.
      //
      // CARDS are the exception, which is why they get their own token instead
      // of a `rounded-2xl` repeated in thirty places: a card's radius is a
      // design decision made once, and with a loose class, the day it changes
      // you have to hunt it down by hand across the whole portal (which is
      // exactly how `FeaturedBrands` ended up with a radius nobody else
      // shared).
      //
      //   rounded-card → content surfaces: ad cards, form panels, dialogs,
      //                  panel cards.
      //   rounded-tile → what goes INSIDE or on top of a card: the category
      //                  tile, dropdown menus. Smaller on purpose: an inner
      //                  radius equal to the outer one looks rounder than the
      //                  border that contains it.
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
    // Decorative grid and dot backgrounds per color (bg-grid-<color>, etc.)
    // and the `highlight` utility (inner top border) from the aceternity language.
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
