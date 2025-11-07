/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mirage - Dark blue-grey for primary dark elements
        mirage: {
          50: '#E8EAEB',
          100: '#D1D5D7',
          200: '#A3ABB0',
          300: '#748188',
          400: '#465761',
          500: '#16232A',
          600: '#121C22',
          700: '#0D1519',
          800: '#090E11',
          900: '#040708',
        },
        // Blaze Orange - Vibrant accent color
        blaze: {
          50: '#FFE8DA',
          100: '#FFD1B6',
          200: '#FFA36D',
          300: '#FF7F2F',
          400: '#FF5B04',
          500: '#FF5B04',
          600: '#CC4903',
          700: '#993702',
          800: '#662502',
          900: '#331201',
        },
        // Deep Sea Green - Secondary dark color
        deepsea: {
          50: '#E5F0F1',
          100: '#CBE1E3',
          200: '#97C3C7',
          300: '#63A5AB',
          400: '#2F878F',
          500: '#075056',
          600: '#064045',
          700: '#043034',
          800: '#032022',
          900: '#011011',
        },
        // Wild Sand - Light background color
        sand: {
          50: '#FFFFFF',
          100: '#F9FCFD',
          200: '#E4EEF0',
          300: '#E4EEF0',
          400: '#D4E4E7',
          500: '#C5DADE',
          600: '#9EAEB1',
          700: '#778385',
          800: '#505758',
          900: '#282C2C',
        },
        // Keep gray for compatibility
        gray: {
          50: '#E4EEF0',
          100: '#D4E4E7',
          200: '#C5DADE',
          300: '#9EAEB1',
          400: '#778385',
          500: '#505758',
          600: '#2F878F',
          700: '#16232A',
          800: '#0D1519',
          900: '#040708',
        },
        // Primary is Blaze Orange for accents
        primary: {
          50: '#FFE8DA',
          100: '#FFD1B6',
          200: '#FFA36D',
          300: '#FF7F2F',
          400: '#FF5B04',
          500: '#FF5B04',
          600: '#CC4903',
          700: '#993702',
          800: '#662502',
          900: '#331201',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(22, 35, 42, 0.06), 0 0 1px rgba(22, 35, 42, 0.04)',
        'medium': '0 4px 16px rgba(22, 35, 42, 0.10), 0 2px 4px rgba(22, 35, 42, 0.06)',
        'strong': '0 8px 32px rgba(22, 35, 42, 0.16), 0 4px 12px rgba(22, 35, 42, 0.10)',
        'glow': '0 0 24px rgba(255, 91, 4, 0.2), 0 0 8px rgba(255, 91, 4, 0.1)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
