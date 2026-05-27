const fastWebPreview = process.env.FORMALIO_FAST_WEB_PREVIEW === '1';

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: fastWebPreview
    ? ['./app/index.tsx', './src/screens/prototype/**/*.{js,jsx,ts,tsx}']
    : ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#001F3F',
        teal: '#28A745',
        danger: '#DC3545',
        warning: '#FFC107',
        orange: '#FD7E14',
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          400: '#94A3B8',
          500: '#64748B',
          700: '#334155',
          900: '#0F172A'
        }
      },
      borderRadius: {
        '2xl': 20,
        '3xl': 28
      }
    }
  },
  plugins: []
};
