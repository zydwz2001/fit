/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vibe-green': '#10B981',
      },
      borderRadius: {
        'vibe': '12px',
        'vibe-lg': '24px',
        'vibe-xl': '32px',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
