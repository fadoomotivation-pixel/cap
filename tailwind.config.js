/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#16315c',
          orange: '#f26522',
          gray: '#f5f5f5',
          dark: '#333333'
        }
      },
      // Headings were Playfair Display, a high-contrast serif that reads as a
      // newspaper masthead rather than a property brand. Outfit is a geometric
      // sans — closer to how developers and smart-city projects present
      // themselves, and far easier to read at large sizes on a phone.
      //
      // `outfit` is registered because 14 files already used `font-outfit`
      // while no such family existed in this config, so every one of those
      // classes silently did nothing.
      fontFamily: {
        heading: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        outfit: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
