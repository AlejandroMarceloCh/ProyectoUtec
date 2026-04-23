/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg:       "#0D0D0D",
        surface:  "#141414",
        surface2: "#1C1C1C",
        border:   "#2A2A2A",

        primary:         "#00C9D8",
        "primary-light": "#33D9E5",
        "primary-dark":  "#009FAB",

        text:  "#F5F7FA",
        muted: "#7A7A7A",

        success: "#22C55E",
        warning: "#F59E0B",
        error:   "#EF4444",
      },
      fontFamily: {
        heading:    ["SpaceGrotesk-Bold"],
        "heading-m": ["SpaceGrotesk-Medium"],
        sans:       ["Inter-Regular"],
        medium:     ["Inter-Medium"],
        semibold:   ["Inter-SemiBold"],
        bold:       ["Inter-Bold"],
      },
    },
  },
  plugins: [],
};
