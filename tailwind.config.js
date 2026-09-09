/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,js,html}'],
  theme: {
    extend: {
      colors: {
        // Colores base del proyecto
        base: '#FFFFFF',
        primary: {
          DEFAULT: '#EF7D00',
          50: '#FFF4E8',
          100: '#FFE4C4',
          200: '#FFC988',
          300: '#FBAD4E',
          400: '#F4941F',
          500: '#EF7D00',
          600: '#C46600',
          700: '#8F4A00',
          800: '#5E3100',
          900: '#331B00',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
