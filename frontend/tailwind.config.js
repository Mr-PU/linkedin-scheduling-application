/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}", // Scans all JS/JSX files in src for Tailwind classes
    ],
    theme: {
      extend: {}, // You can customize colors, spacing, etc., here if needed
    },
    plugins: [],
  };