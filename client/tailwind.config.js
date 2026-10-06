/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4fb',
          100: '#d6e4f5',
          200: '#adc8ea',
          500: '#2c64b0',
          600: '#1d4f91',
          700: '#173f75',
          800: '#12315a',
          900: '#0c2140',
        },
        cilantro: {
          50: '#effaeb',
          100: '#d9f1cf',
          500: '#4a9f35',
          600: '#3f8f2f',
          700: '#327224',
        },
        cream: '#faf8f4',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.06)',
        lift: '0 8px 30px rgba(16,24,40,.12)',
      },
    },
  },
  plugins: [],
}
