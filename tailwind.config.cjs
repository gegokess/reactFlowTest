/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Neutrals
        'bg': '#FFFFFF',
        'surface': '#F6F7F9',
        'border': '#E9ECF1',
        'line': '#EEF1F5',
        'text': '#1E2430',
        'text-muted': '#6B7280',

        // Semantic
        'success': '#38C77A',
        'warning': '#FF8A3D',
        'danger': '#F05252',
        'info': '#4C6EF5',

        // Accents
        'accent-1': '#8A7CF6',
        'accent-2': '#EA7AF6',
        'accent-3': '#FDB36A',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
      },
      borderRadius: {
        'xs': '6px',
        'sm': '10px',
        'md': '14px',
        'lg': '18px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(16, 24, 40, 0.05)',
        'md': '0 6px 24px rgba(16, 24, 40, 0.06)',
        'lg': '0 12px 40px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
}