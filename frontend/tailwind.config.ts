/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { brand: '#FF4458', 'brand-dark': '#CC2F42' },
      fontFamily: { display: ['var(--font-syne)', 'sans-serif'], body: ['var(--font-dm)', 'sans-serif'] },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
    },
  },
  plugins: [],
};
