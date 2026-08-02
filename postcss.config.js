export default {
  plugins: {
    // Tailwind 4 ships its own PostCSS plugin package, and handles vendor
    // prefixing itself, so autoprefixer is no longer a dependency here.
    '@tailwindcss/postcss': {},
  },
};
