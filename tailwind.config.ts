import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // SOMLUTION-DESIGN.md tokens — 레트로 파스텔·무광·1px 스트로크·순검정 없음
        ink: "#5b5856",
        canvas: "#fffef9",
        "canvas-soft": "#eceef8",
        "canvas-soft-2": "#eaf2fb",
        hairline: "#e6e0d8",
        "hairline-strong": "#c9c2ba",
        "body-text": "#83807d",
        mute: "#aca79f",
        link: "#ef9dbb",
        "link-deep": "#d97ea0",
        "link-bg-soft": "#fdeef4",
        "card-pink": "#fdeef4",
        blush: "#fbdcd2",
        mint: "#bdeecb",
        butter: "#fbe8ab",
        sky: "#bfe3f7",
      },
      boxShadow: {
        "level-2": "0px 1px 1px rgba(0,0,0,0.02), 0px 2px 2px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08)",
        "level-3": "0px 2px 2px rgba(0,0,0,0.04), 0px 8px 8px -8px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08)",
        "level-4": "0px 2px 2px rgba(0,0,0,0.04), 0px 8px 16px -4px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
