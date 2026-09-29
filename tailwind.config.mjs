/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,ts,json}',
    // Las clases que añade el script de rescate de Safari también deben existir.
    './public/safari/*.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF4444',
        'on-primary': '#FFFFFF',
        background: '#0E0E0F',
        surface: '#151619',
        'surface-container-low': '#1A1B1E',
        'surface-container-high': '#222327',
        'surface-container-highest': '#2B2C31',
        'on-surface': '#E6E6E6',
        'on-surface-variant': '#8E9299',
        outline: '#44474D',
        'outline-variant': '#2E3136',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'spin-vinyl': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
};
