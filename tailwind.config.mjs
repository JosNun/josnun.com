/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        forest: '#1a3a2e',
        sage: '#4a6b5c',
        moss: '#7a9b89',
        leaf: '#a8c5b8',
        cream: '#f4f1ea',
        bark: '#8b7355',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      typography: {
        botanical: {
          css: {
            '--tw-prose-body': '#4a6b5c',
            '--tw-prose-headings': '#1a3a2e',
            '--tw-prose-links': '#1a3a2e',
            '--tw-prose-bold': '#1a3a2e',
            '--tw-prose-code': '#1a3a2e',
            '--tw-prose-quotes': '#4a6b5c',
            '--tw-prose-quote-borders': '#7a9b89',
            'a': {
              textDecoration: 'none',
              borderBottom: '1px solid #a8c5b8',
              transition: 'border-color 0.2s ease',
              '&:hover': {
                borderColor: '#7a9b89',
              },
            },
            'code': {
              backgroundColor: '#e8e2d4',
              padding: '0.125rem 0.375rem',
              borderRadius: '0',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            'pre': {
              padding: '1.5rem',
              borderRadius: '0',
              border: '1px solid #a8c5b8',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              fontWeight: '400',
            },
            'h2, h3, h4, h5, h6': {
              scrollMarginTop: '5rem',
            },
            '.heading-anchor': {
              marginLeft: '0.4em',
              color: '#a8c5b8',
              fontWeight: '300',
              textDecoration: 'none',
              border: '0',
              opacity: '0',
              transition: 'opacity 0.2s ease, color 0.2s ease',
            },
            'h2:hover .heading-anchor, h3:hover .heading-anchor, h4:hover .heading-anchor, h5:hover .heading-anchor, h6:hover .heading-anchor': {
              opacity: '1',
            },
            '.heading-anchor:hover': {
              color: '#7a9b89',
            },
            '.heading-anchor:focus-visible': {
              opacity: '1',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
