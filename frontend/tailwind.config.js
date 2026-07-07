/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tema FotoQu (dari FotoQu website design / theme.css)
        background: "#F7F5F0",
        card: "#FFFFFF",
        ink: "#141210",
        secondary: "#EDEAE3",
        muted: "#7A7570",
        "muted-soft": "#A09A93",
        accent: "#C9843A",
        "footer-dark": "#0E0C0A",
        destructive: "#C93A3A",
        // Alias lama agar kelas existing tidak langsung pecah saat transisi.
        cream: "#F7F5F0",
        sand: "#EDEAE3",
        sandborder: "rgba(20,18,16,0.12)",
      },
      fontFamily: {
        serif: ['"DM Serif Display"', "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"DM Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
