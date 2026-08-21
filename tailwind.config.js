/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Gordita', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
