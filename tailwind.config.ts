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
        // Vercel DESIGN.md tokens (via getdesign)
        ink: "#171717",
        canvas: "#ffffff",
        "canvas-soft": "#fafafa",
        "canvas-soft-2": "#f5f5f5",
        hairline: "#ebebeb",
        "hairline-strong": "#a1a1a1",
        "body-text": "#4d4d4d",
        mute: "#888888",
        link: "#0070f3",
        "link-deep": "#0761d1",
        "link-bg-soft": "#d3e5ff",
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
