/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        kk: {
          cream: "#FBF5EA",
          paper: "#FFFFFF",
          ink: "#262138",
          inksoft: "#544d68",
          coral: "#FF6B57",
          coraldeep: "#E14F3C",
          teal: "#0FA398",
          tealdeep: "#0C7F76",
          indigo: "#5B52F0",
          indigodeep: "#4038C9",
          sun: "#FFC145",
        },
      },
      fontFamily: {
        display: ['Fredoka', '"Baloo 2"', 'system-ui', 'sans-serif'],
        game: ['"Baloo 2"', '"Comic Sans MS"', "system-ui", "sans-serif"],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'kk-sm': '3px 3px 0 #262138',
        'kk-md': '4px 4px 0 #262138',
        'kk-lg': '6px 6px 0 #262138',
        'kk-xl': '9px 9px 0 #262138',
      },
    },
  },
  plugins: [],
};
