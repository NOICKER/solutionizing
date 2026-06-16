import type { Config } from "tailwindcss";

const config: Config = {
  // Dark mode is NOT a Tailwind concern in the new design.
  // Dark surfaces are controlled via CSS variables and body.is-dark class.
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Primary design tokens
        bg:            "#e8e0d4",
        "bg-light":    "#f0e8dc",
        cream:         "#faf7f2",
        ink:           "#1c1008",
        "ink-soft":    "#6b5c4a",
        electric:      "#ff6b1a",
        "electric-dim":"rgba(255, 107, 26, 0.10)",
        "electric-mid":"rgba(255, 107, 26, 0.25)",
        dark:          "#1c1008",
        "dark-surface":"#2a1e12",

        // Semantic aliases (used in components)
        primary:       "#ff6b1a",
        "primary-hover":"#e55f12",
        background:    "#e8e0d4",
        surface:       "#f0e8dc",
        "surface-elevated": "#faf7f2",
        "text-main":   "#1c1008",
        "text-muted":  "#6b5c4a",
        "border-subtle":"rgba(28, 16, 8, 0.12)",
        "border-strong":"rgba(28, 16, 8, 0.25)",

        // Dark surface tokens
        "panel-dark":      "#1c1008",
        "panel-dark-soft": "#2a1e12",
        "neutral-bg":      "#e8e0d4",
        "neutral-card":    "#f0e8dc",
      },
      fontFamily: {
        sans:    ["Satoshi", "sans-serif"],
        display: ["Fraunces", "serif"],
        mono:    ["DM Mono", "monospace"],
      },
      boxShadow: {
        card:       "0 4px 24px rgba(28, 16, 8, 0.08)",
        "card-soft":"0 2px 12px rgba(28, 16, 8, 0.05)",
        "electric": "0 8px 24px rgba(255, 107, 26, 0.25)",
      },
      borderRadius: {
        pill: "999px",
        card: "1.25rem",
        panel:"1.75rem",
        lg:   "1rem",
        DEFAULT:"0.5rem",
      },
      transitionTimingFunction: {
        ease: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
