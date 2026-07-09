/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#00072d', // Rich Black
          card: '#051650', // Deep Navy
          panel: '#0a2472', // Dark Blue
          accent: '#123499', // Caribbean Green (blue in image)
          gold: '#d9a74a', // Gold
          goldDark: '#c5923c',
          textLight: '#eaedfa',
        }
      }
    },
  },
  plugins: [],
}
