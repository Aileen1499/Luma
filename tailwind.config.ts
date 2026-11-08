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
        background: "var(--bg-wash)",
        surface: "#FFFFFF",
        border: "rgba(28, 26, 38, 0.10)",
        ink: {
          DEFAULT: "#1E1A33",
          strong: "#1C1A26",
          muted: "#4A4560",
        },
        "text-2": "#4A4560",
        accent: {
          DEFAULT: "#5E52C9",
          lavender: "#D6CBFA",
          peach: "#FBD6BD",
          mint: "#C6E6D6",
        },
        success: "#3F8F6B",
        missed: "#F7E2D5",
        gold: "#E3A94B",
      },
      borderRadius: {
        card: "18px",
        tile: "12px",
        button: "14px",
      },
      fontFamily: {
        display: [
          "var(--font-bricolage)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        body: [
          "var(--font-manrope)",
          "system-ui",
          "-apple-system",
          "sans-serif",
          "'PingFang SC'",
          "'Microsoft YaHei'",
          "'Noto Sans SC'",
        ],
      },
      boxShadow: {
        none: "none",
      },
    },
  },
  plugins: [],
};

export default config;

