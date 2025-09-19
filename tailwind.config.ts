import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Entity Color System
        customer: {
          DEFAULT: "var(--customer-bg)",
          foreground: "var(--customer-fg)",
          light: "var(--customer-bg-light)",
          "light-foreground": "var(--customer-fg-light)",
        },
        product: {
          DEFAULT: "var(--product-bg)",
          foreground: "var(--product-fg)",
          light: "var(--product-bg-light)",
          "light-foreground": "var(--product-fg-light)",
        },
        supplier: {
          DEFAULT: "var(--supplier-bg)",
          foreground: "var(--supplier-fg)",
          light: "var(--supplier-bg-light)",
          "light-foreground": "var(--supplier-fg-light)",
        },
        order: {
          DEFAULT: "var(--order-bg)",
          foreground: "var(--order-fg)",
          light: "var(--order-bg-light)",
          "light-foreground": "var(--order-fg-light)",
        },
        invoice: {
          DEFAULT: "var(--invoice-bg)",
          foreground: "var(--invoice-fg)",
          light: "var(--invoice-bg-light)",
          "light-foreground": "var(--invoice-fg-light)",
        },
        inventory: {
          DEFAULT: "var(--inventory-bg)",
          foreground: "var(--inventory-fg)",
          light: "var(--inventory-bg-light)",
          "light-foreground": "var(--inventory-fg-light)",
        },
        // Status Colors
        success: {
          DEFAULT: "var(--status-success-bg)",
          foreground: "var(--status-success-fg)",
          light: "var(--status-success-bg-light)",
          "light-foreground": "var(--status-success-fg-light)",
        },
        warning: {
          DEFAULT: "var(--status-warning-bg)",
          foreground: "var(--status-warning-fg)",
          light: "var(--status-warning-bg-light)",
          "light-foreground": "var(--status-warning-fg-light)",
        },
        error: {
          DEFAULT: "var(--status-error-bg)",
          foreground: "var(--status-error-fg)",
          light: "var(--status-error-bg-light)",
          "light-foreground": "var(--status-error-fg-light)",
        },
        info: {
          DEFAULT: "var(--status-info-bg)",
          foreground: "var(--status-info-fg)",
          light: "var(--status-info-bg-light)",
          "light-foreground": "var(--status-info-fg-light)",
        },
        processing: {
          DEFAULT: "var(--status-processing-bg)",
          foreground: "var(--status-processing-fg)",
          light: "var(--status-processing-bg-light)",
          "light-foreground": "var(--status-processing-fg-light)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
      },
      fontSize: {
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-normal)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-normal)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-normal)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-relaxed)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-normal)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-snug)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-snug)" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "var(--leading-tight)" }],
        "5xl": ["var(--text-5xl)", { lineHeight: "var(--leading-tight)" }],
        "6xl": ["var(--text-6xl)", { lineHeight: "var(--leading-tight)" }],
        "7xl": ["var(--text-7xl)", { lineHeight: "var(--leading-tight)" }],
      },
      lineHeight: {
        tight: "var(--leading-tight)",
        snug: "var(--leading-snug)",
        normal: "var(--leading-normal)",
        relaxed: "var(--leading-relaxed)",
        loose: "var(--leading-loose)",
      },
      letterSpacing: {
        tighter: "var(--tracking-tighter)",
        tight: "var(--tracking-tight)",
        normal: "var(--tracking-normal)",
        wide: "var(--tracking-wide)",
        wider: "var(--tracking-wider)",
        widest: "var(--tracking-widest)",
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        base: "var(--spacing-base)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
        "3xl": "var(--spacing-3xl)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
