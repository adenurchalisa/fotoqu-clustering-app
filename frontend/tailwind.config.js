/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tema FotoQu (dipindah dari assets/style.css versi Streamlit)
        cream: "#FBF8F2",
        sand: "#F4ECDD",
        sandborder: "#E2CFA8",
        ink: "#141414",
        muted: "#666666",
        accent: "#8A5A1E",
      },
      fontFamily: {
        serif: ['"DM Serif Display"', "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
