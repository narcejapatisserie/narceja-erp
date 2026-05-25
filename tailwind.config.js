/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta extraída da logo Narceja Pâtisserie
        narceja: {
          50:  '#faf5f0',   // bege muito claro
          100: '#f5ede4',   // fundo da logo
          200: '#e8d5c4',   // rosa pálido
          300: '#d4b896',   // bege médio
          400: '#c49e6e',   // dourado claro
          500: '#b8924a',   // dourado principal (moldura)
          600: '#9a7838',   // dourado escuro
          700: '#7a5c28',   // marrom dourado
          800: '#5c3d1a',   // marrom médio
          900: '#4a1f1f',   // marrom escuro (texto NARCEJA)
          950: '#2d0f0f',   // marrom muito escuro
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    }
  },
  plugins: []
}

