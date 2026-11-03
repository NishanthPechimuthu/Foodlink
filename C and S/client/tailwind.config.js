/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F8F4E7',
          50: '#FDFBF7',
          100: '#FAF7EE',
          200: '#F5EEDD',
          300: '#EFE2C5',
          dark: '#E8DBC0',
        },
        chocolate: {
          DEFAULT: '#4E342E',
          50: '#EFEBE9',
          100: '#D7CCC8',
          200: '#BCAAA4',
          300: '#8D6E63',
          400: '#6D4C41',
          500: '#4E342E',
          600: '#3E2723',
          700: '#2F1D1A',
        },
        burntOrange: {
          DEFAULT: '#CC5500',
          50: '#FFF3E8',
          100: '#FFE2CC',
          200: '#FFC199',
          300: '#FFA066',
          400: '#E6690B',
          500: '#CC5500',
          600: '#B34700',
          700: '#8A3600',
        },
        mutedGreen: {
          DEFAULT: '#2E7D32',
          light: '#E8F5E9',
          dark: '#1B5E20',
        },
        amberPending: {
          DEFAULT: '#ED6C02',
          light: '#FFF4E5',
          dark: '#C75B00',
        },
        softRed: {
          DEFAULT: '#D32F2F',
          light: '#FFEBEE',
          dark: '#C62828',
        },
        neutralGrey: {
          DEFAULT: '#6B7280',
          light: '#F3F4F6',
          dark: '#374151',
        }
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        sans: ['Nunito Sans', 'sans-serif'],
      },
      boxShadow: {
        'clay-btn': '0 4px 10px rgba(204, 85, 0, 0.25), inset 0 2px 3px rgba(255, 255, 255, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.15)',
        'clay-btn-hover': '0 6px 14px rgba(204, 85, 0, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.45), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
        'clay-card': '0 8px 24px rgba(78, 52, 46, 0.06), 0 2px 6px rgba(78, 52, 46, 0.04)',
        'clay-card-hover': '0 12px 32px rgba(78, 52, 46, 0.12), 0 4px 8px rgba(78, 52, 46, 0.06)',
      },
    },
  },
  plugins: [],
}
