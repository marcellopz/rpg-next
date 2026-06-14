import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

// App accent: Tailwind slate, remapped so component classes map to sensible
// roles (50/100 = tints, 500 = hover/focus, 600 = primary, 700–800 = deep).
const slate = colors.slate;

// Tailwind v3 (NOT v4): v3 emits CSS that works on both modern browsers and
// the old webOS TV engine, so one version covers the whole app (main app + /tv).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: slate[50], // icon / chip background
          100: slate[100], // bullet circles
          200: slate[200],
          300: slate[300],
          400: slate[500],
          500: slate[600], // button hover, input focus, link hover
          600: slate[700], // buttons, CTA band, gradient mid
          700: slate[800], // emphasis text on white, gradient start
          800: slate[900], // gradient end
          900: slate[950],
          950: slate[950],
        },
      },
    },
  },
  plugins: [],
};

export default config;
