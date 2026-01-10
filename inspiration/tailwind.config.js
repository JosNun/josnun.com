/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      colors: {
        terminal: {
          green: '#00ff00',
          amber: '#ffb000',
          bg: '#0a0e14',
        },
        earth: {
          sand: '#e8d5b7',
          clay: '#c9a783',
          moss: '#7a8b72',
          stone: '#5a5a5a',
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
