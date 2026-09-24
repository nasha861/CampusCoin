/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // NextGen BudgetBee brand palette (placeholder — refine with design team).
        brand: {
          50: '#eefdf4',
          100: '#d6fae3',
          200: '#b0f3cb',
          300: '#7ce7ac',
          400: '#43d488',
          500: '#1fba6c',
          600: '#149657',
          700: '#137748',
          800: '#135f3c',
          900: '#114e33',
          950: '#052c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
