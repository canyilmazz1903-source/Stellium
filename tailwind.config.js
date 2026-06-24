/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cosmic: {
          bg: "#0D1117",       // Deep night blue background
          card: "#161B22",     // Obsidian / dark grey card background
          text: "#F0F6FC",     // White / light grey text
          stardust: "#8B949E", // Stardust grey body text
          gold: "#D4AF37",     // Antique gold / brass accents
          goldLight: "#F3E5AB",// Pale warm gold highlights
          goldDark: "#AA7C11", // Dark gold / brass shadows
        }
      },
      fontFamily: {
        serif: ["Cinzel", "CormorantGaramond", "Georgia", "serif"],
        sans: ["Inter", "System", "sans-serif"],
      }
    },
  },
  plugins: [],
}
