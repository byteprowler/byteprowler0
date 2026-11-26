/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#08090D",
        "midnight-obsidian": "#08090D",
        "midnight-blue": "#101827",
        "electric-blue": "#367BFF",
        "deep-violet": "#7547D8",
        silver: "#C5CAD6",
        "soft-white": "#F0F2F8",
        "slate-dark": "#0c0d12",
        "dark-gray": "#12131a",
        "neon-lime": "#c5ff00",
        "neon-blue": "#00f3ff",
        "neon-purple": "#b65cff",
        "neon-green": "#00ff66",
        "neon-red": "#ff1a1a",
        "neon-nav-blue": "#00f3ff",
      },
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "midnight-blue": "0 0 24px rgba(54, 123, 255, 0.16)",
        "midnight-violet": "0 0 24px rgba(117, 71, 216, 0.16)",
        "glow-lime": "0 0 12px rgba(197, 255, 0, 0.18)",
        "glow-blue": "0 0 12px rgba(0, 243, 255, 0.18)",
        "glow-purple": "0 0 12px rgba(157, 0, 255, 0.18)",
      },
    },
  },
  plugins: [],
}
