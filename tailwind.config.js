/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        narceja: {
          50:  '#fdf8f0',
          100: '#faecd8',
          200: '#f4d5a8',
          300: '#ecb870',
          400: '#e3963a',
          500: '#d4781a',
          600: '#b85e13',
          700: '#924811',
          800: '#753a14',
          900: '#5e3013',
          950: '#341607',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    }
  },
  plugins: []
}

