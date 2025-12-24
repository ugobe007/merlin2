/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(251, 191, 36, 0.2)',
          },
          '50%': { 
            boxShadow: '0 0 16px 4px rgba(251, 191, 36, 0.3)',
          },
        },
      },
    },
  },
  plugins: [],
}

