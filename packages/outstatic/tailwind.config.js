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
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        xl: `calc(var(--radius) + 4px)`,
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)'
      },
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
