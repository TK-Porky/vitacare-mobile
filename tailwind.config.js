/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#0D6EFD',       // bleu médical
        secondary: '#198754',     // vert santé
        danger: '#DC3545',
        surface: '#F8FAFC',
      },
    },
  },
  plugins: [],
};