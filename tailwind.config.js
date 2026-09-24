/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#060c16', 900: '#0a1422', 800: '#0d1929', 700: '#111f33', 600: '#1a2a42', line: '#243752' },
        pitch: { DEFAULT: '#e34b4b', dark: '#b9363c', soft: '#3b171c' },
        gold: { DEFAULT: '#f4a261', soft: '#422619' },
        mist: '#91a5bf',
        alert: '#f87171',
        sky: { DEFAULT: '#38bdf8' },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
