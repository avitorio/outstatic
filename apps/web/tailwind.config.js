/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      borderRadius: {
        cartoon: '2% 95% 1% 95%/95% 3% 92% 3%',
        cartoon2: '95% 1% 90% 1%/5% 90% 2% 93%'
      },
      animation: {
        write: 'write 1000ms ease-out 800ms',
        'fade-in': 'fade-in 300ms ease-out forwards',
        'fade-in-up': 'fade-in-up 300ms ease-out forwards',
        nudge: 'nudge 400ms linear'
      },
      keyframes: {
        write: {
          '0%': { 'stroke-dashoffset': '2000' },
          '100%': { 'stroke-dashoffset': '0' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0px)' }
        },
        nudge: {
          '0%': {
            transform: 'rotate(-7deg)'
          },
          '33%': {
            transform: 'rotate(7deg)'
          },

          '66%': {
            transform: 'rotate(-7deg)'
          }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    plugin(function ({ matchUtilities }) {
      matchUtilities({
        // Class name
        'animation-delay': (value) => {
          return {
            animationDelay: value // Desired CSS properties here
          }
        },
        'animation-duration': (value) => {
          return {
            animationDuration: value // Desired CSS properties here
          }
        }
      })
    })
  ]
}
