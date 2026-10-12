/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172b27',
        moss: '#1b7557',
        leaf: '#e8f4e9',
        paper: '#f8faf7',
        peach: '#f6e7db',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        card: '0 14px 40px rgba(28, 55, 45, .07)',
      },
    },
  },
  plugins: [],
};
