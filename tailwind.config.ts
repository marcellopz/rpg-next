import type { Config } from "tailwindcss";

// Tailwind v3 (NOT v4): v3 emits CSS that works on both modern browsers and
// the old webOS TV engine, so one version covers the whole app (main app + /tv).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
