import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
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
        obsidian: {
          950: "#050507",
          900: "#0a0a0f",
          850: "#101016",
          800: "#171720",
          700: "#22222f",
          600: "#323243",
        },
        gold: {
          300: "#faecc5",
          400: "#f3d994",
          500: "#e6c367",
          600: "#cda541",
          700: "#a9822a",
        },
        electric: {
          cyan: "#38bdf8",
          violet: "#a855f7",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      fontFamily: {
        serif: ["Cinzel", "Playfair Display", "serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'gold-glow': "0 0 25px -5px rgba(230, 195, 103, 0.25)",
        'cyan-glow': "0 0 25px -5px rgba(56, 189, 248, 0.25)",
        'glass-card': "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'slideInLeft': 'slideInLeft 0.25s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.2' },
          '50%': { transform: 'translateY(100%)', opacity: '0.8' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
