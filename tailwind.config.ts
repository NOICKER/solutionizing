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
        primary: "#F97C5A",
        secondary: "#25252A",
        "neutral-bg": "#141417",
        "neutral-card": "#1C1C21",
        "tester-terracotta": "#F97C5A",
        "tester-terracotta-dark": "#FF6A4D",
        "tester-sage": "#3F3F46",
        "tester-sage-soft": "#27272A",
        "tester-cream": "#A1A1AA",
        "tester-beige": "#3F3F46",
        "tester-apricot": "#F97C5A",
        "tester-ink": "#FFFFFF",
        "tester-muted": "#A1A1AA",
        "surface-white": "#1C1C21",
        "surface-warm": "#1C1C21",
        "text-main": "#FFFFFF",
        background: "#141417",
        surface: "#1C1C21",
        "surface-elevated": "#25252A",
        "primary-hover": "#FF6A4D",
        accent: "#25252A",
        "text-muted": "#A1A1AA",
        "border-subtle": "#2E2F3A",
        "panel-dark": "#1C1C21",
        "panel-dark-soft": "#25252A"
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
        card: "1.5rem",
        panel: "2rem",
        lg: "1rem",
        DEFAULT: "0.5rem",
        pill: "999px"
      }
    }
  },
  plugins: []
};

export default config;
