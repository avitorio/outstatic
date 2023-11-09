const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    `src/**/*.{js,ts,jsx,tsx}`,
    `src/pages/**/*.{js,ts,jsx,tsx}`,
    `src/components/**/*.{js,ts,jsx,tsx}`
  ],
  theme: {
    extend: {
      animation: {
        draw: 'draw 8s cubic-bezier(.34,.06,.13,.92) infinite'
      },
      keyframes: {
        draw: {
          '0%': { 'stroke-dashoffset': '8000', 'stroke-dasharray': '4000' },
          '50%': { 'stroke-dashoffset': '5000', 'stroke-dasharray': '4000' },
          '50.001%': {
            'stroke-dashoffset': '4000',
            'stroke-dasharray': '4000'
          },
          '100%': { 'stroke-dashoffset': '1500', 'stroke-dasharray': '4000' }
        }
      }
    }
  },
  // https://tailwindcss.com/docs/configuration#selector-strategy
  important: '#outstatic',
  plugins: [
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
