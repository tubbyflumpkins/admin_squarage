import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'squarage-green': '#4A9B4E',
        'squarage-orange': '#F7901E',
        'squarage-blue': '#01BAD5',
        'squarage-red': '#F04E23',
        'squarage-yellow': '#F5B74C',
        'squarage-black': '#333333',
        'squarage-pink': '#F2BAC9',
        'squarage-dark-blue': '#2274A5',
        'squarage-white': '#fffaf4',
        'brown-dark': '#333',
        'brown-medium': '#666',
        'brown-light': '#999',
      },
      fontFamily: {
        'neue-haas': ['var(--font-neue-haas)', 'sans-serif'],
        'soap': ['var(--font-soap)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config