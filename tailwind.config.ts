import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
  ],
  theme: {
    extend: {
      colors: {
        exact: "#6aaa64",
        high: "#85c0f9",
        low: "#f5793a",
        "card-bg": "#f6f7f8",
        border: "#d3d6da",
      },
    },
  },
  plugins: [],
};

export default config;
