/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#060709',
          900: '#0a0b0f',
          850: '#0f1117',
          800: '#151722',
          750: '#1b1e2c',
          700: '#232738',
          600: '#32374d',
        },
        brand: {
          emerald: '#10b981',
          cyan: '#06b6d4',
          lime: '#84cc16',
          purple: '#8b5cf6',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 25px 50px -12px rgba(0, 0, 0, 0.75), inset 0 1px 1px 0 rgba(255, 255, 255, 0.18)',
        'glass-hover': '0 30px 60px -12px rgba(0, 0, 0, 0.85), inset 0 1px 2px 0 rgba(255, 255, 255, 0.28)',
        'glass-sm': '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)',
        'pill-white': '0 8px 24px -4px rgba(255, 255, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
