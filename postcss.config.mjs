// Autoprefixer reads the `browserslist` in package.json and adds the
// old vendor prefixes needed by the webOS TV engine (Chromium 38/53).
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
