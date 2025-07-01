const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      animation: {
        'fade-in': 'fadeIn .5s ease-in-out',
        draw: 'draw 8s cubic-bezier(.34,.06,.13,.92) infinite',
        'draw-once': 'draw-once 2s cubic-bezier(.34,.06,.13,.34) forwards'
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        draw: {
          '0%': { 'stroke-dashoffset': '8000', 'stroke-dasharray': '4000' },
          '50%': { 'stroke-dashoffset': '5000', 'stroke-dasharray': '4000' },
          '50.001%': {
            'stroke-dashoffset': '4000',
            'stroke-dasharray': '4000'
          },
          '100%': { 'stroke-dashoffset': '1500', 'stroke-dasharray': '4000' }
        },
        'draw-once': {
          '0%': { 'stroke-dashoffset': '5400', 'stroke-dasharray': '4000' },
          '100%': {
            'stroke-dashoffset': '8000',
            'stroke-dasharray': '4000'
          }
        }
      }
    }
  },
  // https://tailwindcss.com/docs/configuration#selector-strategy
  important: '#outstatic',
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    plugin(function ({ addUtilities }) {
      addUtilities(
        {
          '.scrollbar-hide': {
            scrollbarGutter: 'stable',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': {
              marginTop: '20px',
              marginBottom: '16px',
              marginRight: '2px',
              backgroundColor: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              boxShadow: 'inset 0 0 0 5px rgba(128, 128, 128, 0)',
              borderRadius: '20px'
            },
            '&:hover': {
              '&::-webkit-scrollbar-thumb': {
                boxShadow: 'inset 0 0 0 5px rgba(192, 192, 192, 0.2)',
                '&:hover': {
                  boxShadow: 'inset 0 0 0 5px rgba(128, 128, 128, 0.4)'
                }
              }
            }
          }
        },
        ['responsive']
      )
    })
  ]
}
