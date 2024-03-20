/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

module.exports = {
  darkMode: 'selector',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}'
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
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
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
      },
      typography: ({ theme }) => ({
        outstatic: {
          css: {
            '--tw-prose-body': theme('colors.foreground'),
            '--tw-prose-headings': theme('colors.foreground'),
            '--tw-prose-lead': theme('colors.foreground'),
            '--tw-prose-links': theme('colors.foreground'),
            '--tw-prose-bold': theme('colors.foreground'),
            '--tw-prose-counters': theme('colors.foreground'),
            '--tw-prose-bullets': theme('colors.foreground'),
            '--tw-prose-hr': theme('colors.foreground'),
            '--tw-prose-quotes': theme('colors.foreground'),
            '--tw-prose-quote-borders': theme('colors.foreground'),
            '--tw-prose-captions': theme('colors.foreground'),
            '--tw-prose-code': theme('colors.white'),
            '--tw-prose-pre-code': theme('colors.white'),
            '--tw-prose-pre-bg': theme('colors.foreground'),
            '--tw-prose-th-borders': theme('colors.foreground'),
            '--tw-prose-td-borders': theme('colors.foreground'),
            '--tw-prose-invert-body': theme('colors.foreground'),
            '--tw-prose-invert-headings': theme('colors.white'),
            '--tw-prose-invert-lead': theme('colors.foreground'),
            '--tw-prose-invert-links': theme('colors.white'),
            '--tw-prose-invert-bold': theme('colors.white'),
            '--tw-prose-invert-counters': theme('colors.foreground'),
            '--tw-prose-invert-bullets': theme('colors.foreground'),
            '--tw-prose-invert-hr': theme('colors.foreground'),
            '--tw-prose-invert-quotes': theme('colors.foreground'),
            '--tw-prose-invert-quote-borders': theme('colors.foreground'),
            '--tw-prose-invert-captions': theme('colors.foreground'),
            '--tw-prose-invert-code': theme('colors.white'),
            '--tw-prose-invert-pre-code': theme('colors.foreground'),
            '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
            '--tw-prose-invert-th-borders': theme('colors.foreground'),
            '--tw-prose-invert-td-borders': theme('colors.foreground')
          }
        }
      })
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
