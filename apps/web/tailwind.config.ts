import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        razorpayBlue: "var(--primary)",
      },
      fontFamily: {
        sans: ['Inter', '"Inter Fallback Arial"', 'Arial', 'sans-serif'],
        display: ['"TASA Orbiter"', '"TASA Orbiter Fallback Arial"', 'Inter', 'Arial', 'sans-serif'],
        number: ['"TASA Orbiter"', '"TASA Orbiter Fallback Arial"', 'Inter', 'Arial', 'sans-serif'],
        mono: ['"TASA Orbiter"', 'Inter', '"Inter Fallback Arial"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
