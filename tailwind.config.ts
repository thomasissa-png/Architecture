import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        foreground: "#1C1C1E",
        sage: {
          DEFAULT: "#7D9B76",
          light: "#9BB594",
          dark: "#5F7A58",
        },
        muted: "#6B6B6D",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tight: "-0.02em",
        tighter: "-0.03em",
      },
    },
  },
  plugins: [],
};
export default config;
