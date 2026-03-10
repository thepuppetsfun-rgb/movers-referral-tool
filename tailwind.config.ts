import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#1c1917', 2: '#44403c', 3: '#78716c' },
        surface: { DEFAULT: '#faf9f7', 2: '#f5f3ef' },
        border: '#e7e2db',
        accent: { DEFAULT: '#b84318', hover: '#9a3714', bg: '#fef7f4' },
        green: { DEFAULT: '#3d7c4a', bg: '#f4faf5' },
        amber: { DEFAULT: '#9a6b15', bg: '#fffcf5' },
      },
    },
  },
  plugins: [],
} satisfies Config
