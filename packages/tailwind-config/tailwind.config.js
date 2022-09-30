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
      colors: {
        brandblue: colors.blue[500],
        brandred: colors.red[500]
      }
    }
  },
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
