/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // <--- ¡Esto es vital!
  ],
theme: {
    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '768px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }

      '3xl': '1920px',
      // => @media (max-width: 1920px) { ... }

      '4xl': '2500px',
      // => @media (max-width: 2500px) { ... }

    },
  },
  plugins: [],
}