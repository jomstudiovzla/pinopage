/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./assets/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#f2f6f0',
          cream: '#fbf8f2',
          sage: '#8fa07e',
          accent: '#7b956c',
          green: '#2d4d36',
          vivid: '#1e5138',
          earth: '#c99665',
          charcoal: '#222820',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
