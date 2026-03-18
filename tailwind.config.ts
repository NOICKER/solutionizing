import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#D97706",
        secondary: "#5F7D81",
        "neutral-bg": "#F6F7F6",
        "neutral-card": "#EBECEB",
        "tester-terracotta": "#D97757",
        "tester-terracotta-dark": "#C86A4C",
        "tester-sage": "#4A7C75",
        "tester-sage-soft": "#E6F0EE",
        "tester-cream": "#F7F2EA",
        "tester-beige": "#EEE7DB",
        "tester-apricot": "#E6B89C",
        "tester-ink": "#2D2A26",
        "tester-muted": "#8C8680",
        "surface-white": "#FFFFFF",
        "surface-warm": "#FFFFFF",
        "text-main": "#1A1816",
        background: "#F6F7F6",
        surface: "#FFFFFF",
        "surface-elevated": "#FFFFFF",
        "primary-hover": "#B45309",
        accent: "#5F7D81",
        "text-muted": "#5A5754",
        "border-subtle": "#CCD1CF",
        "panel-dark": "#1A1816",
        "panel-dark-soft": "#2A2724"
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"]
      },
      boxShadow: {
        card: "0 18px 40px rgba(45, 42, 38, 0.1)",
        "card-soft": "0 10px 30px rgba(45, 42, 38, 0.07)",
        "soft-xl": "0 20px 40px -15px rgba(0, 0, 0, 0.1)",
        "cta-orange": "0 10px 30px -5px rgba(217, 119, 6, 0.25)",
        "tester-soft": "0 16px 40px rgba(45, 42, 38, 0.08)",
        "tester-modal": "0 20px 50px -12px rgba(217, 119, 87, 0.18)"
      },
      borderRadius: {
        xl: "1.5rem",
        "2xl": "2rem",
        lg: "1rem",
        DEFAULT: "0.5rem",
        pill: "999px"
      }
    }
  },
  plugins: []
};

export default config;
