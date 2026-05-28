/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAF9F5",
        emerald: {
          950: "#0A3A2F",
          900: "#0E4D3E",
          800: "#135F4D",
        },
        gold: {
          DEFAULT: "#C5A059",
          light: "#E5D5BA",
          dark: "#A3803B",
        },
        graphite: {
          DEFAULT: "#2A2F2D",
          light: "#4F5754",
          muted: "#8E8D86",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#F5F3EC",
          border: "#EAE6DF",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        card: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
        modal: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      fontSize: {
        "2xs": "0.65rem",
      },
    },
  },
  plugins: [],
};
