/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#F5EDE2',
          100: '#EDDFD2',
          200: '#E8CFC1',
          300: '#D9C3A6',
          400: '#C49A6C',
          500: '#8A6B4A',
          600: '#7A4F3A',
          700: '#4B2E2A',
          800: '#2E1C17',
          900: '#1F110E',
        },
        khaki: {
          50: '#FAF7F2',
          100: '#F5EDE2',
          200: '#EDE0D0',
          300: '#DDCEBA',
          400: '#CCBAA0',
          500: '#BBA688',
          600: '#A08C6E',
          700: '#7F6B50',
          800: '#5E4D38',
          900: '#3D3020',
        },
        mustard: {
          50: '#FFF9F0',
          100: '#FFF0E0',
          200: '#FFE0B0',
          300: '#FFD080',
          400: '#E8B050',
          500: '#C49A6C',
          600: '#A07A4A',
          700: '#7A5A30',
          800: '#543E20',
          900: '#302010',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        body: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
