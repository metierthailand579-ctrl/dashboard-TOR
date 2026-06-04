import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plex-thai)", "system-ui", "sans-serif"],
      },
      colors: {
        // Metier brand — accent orange #ff5008 (CI Dec 2024)
        brand: {
          50: "#fff3ed",
          100: "#ffe2d4",
          200: "#ffc3a8",
          500: "#ff5008",
          600: "#ff5008",
          700: "#db4205",
          800: "#b5360a",
          900: "#7c2706",
        },
        metier: {
          orange: "#ff5008",
          black: "#000000",
          white: "#ffffff",
        },
      },
    },
  },
  plugins: [],
};

export default config;
