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
