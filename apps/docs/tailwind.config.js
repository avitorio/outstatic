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
            '--tw-prose-body': 'hsl(var(--prose-body))',
            '--tw-prose-headings': 'hsl(var(--prose-headings))',
            '--tw-prose-lead': 'hsl(var(--prose-lead))',
            '--tw-prose-links': 'hsl(var(--prose-links))',
            '--tw-prose-bold': 'hsl(var(--prose-bold))',
            '--tw-prose-counters': 'hsl(var(--prose-counters))',
            '--tw-prose-bullets': 'hsl(var(--prose-bullets))',
            '--tw-prose-hr': 'hsl(var(--prose-hr))',
            '--tw-prose-quotes': 'hsl(var(--prose-quotes))',
            '--tw-prose-quote-borders': 'hsl(var(--prose-quote-borders))',
            '--tw-prose-captions': 'hsl(var(--prose-captions))',
            '--tw-prose-kbd': 'hsl(var(--prose-kbd))',
            '--tw-prose-kbd-shadows': 'hsl(var(--prose-kbd-shadows))',
            '--tw-prose-code': 'hsl(var(--prose-code))',
            '--tw-prose-pre-code': 'hsl(var(--prose-pre-code))',
            '--tw-prose-pre-bg': 'hsl(var(--prose-pre-bg))',
            '--tw-prose-th-borders': 'hsl(var(--prose-th-borders))',
            '--tw-prose-td-borders': 'hsl(var(--prose-td-borders))',
            '--tw-prose-invert-body': 'hsl(var(--prose-bullets))',
            '--tw-prose-invert-headings': '#fff',
            '--tw-prose-invert-lead': 'hsl(var(--prose-counters))',
            '--tw-prose-invert-links': '#fff',
            '--tw-prose-invert-bold': '#fff',
            '--tw-prose-invert-counters': 'hsl(var(--prose-counters))',
            '--tw-prose-invert-bullets': 'hsl(var(--prose-lead))',
            '--tw-prose-invert-hr': 'hsl(var(--prose-body))',
            '--tw-prose-invert-quotes': '#f3f4f6',
            '--tw-prose-invert-quote-borders': 'hsl(var(--prose-body))',
            '--tw-prose-invert-captions': 'hsl(var(--prose-counters))',
            '--tw-prose-invert-kbd': '#fff',
            '--tw-prose-invert-kbd-shadows': '255 255 255',
            '--tw-prose-invert-code': '#fff',
            '--tw-prose-invert-pre-code': 'hsl(var(--prose-bullets))',
            '--tw-prose-invert-pre-bg': 'rgba(0, 0, 0, .5)',
            '--tw-prose-invert-th-borders': 'hsl(var(--prose-lead))',
            '--tw-prose-invert-td-borders': 'hsl(var(--prose-body))'
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
