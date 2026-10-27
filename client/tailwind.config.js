/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#176b5b",
          dark: "#105548",
        },
      },
    },
  },
  plugins: [],
};
