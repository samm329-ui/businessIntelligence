import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "oklch(var(--border) / <alpha-value>)",
                input: "oklch(var(--input) / <alpha-value>)",
                ring: "oklch(var(--ring) / <alpha-value>)",
                background: "oklch(var(--background) / <alpha-value>)",
                foreground: "oklch(var(--foreground) / <alpha-value>)",
                primary: {
                    DEFAULT: "#00FCC2", // Cyan
                    foreground: "#050B14",
                },
                secondary: {
                    DEFAULT: "#26E07A", // Emerald
                    foreground: "#050B14",
                },
                accent: {
                    DEFAULT: "#FFD28E", // Gold
                    foreground: "#050B14",
                },
                destructive: {
                    DEFAULT: "#FF6B6B",
                    foreground: "#FFFFFF",
                },
                muted: {
                    DEFAULT: "#9DB3BD",
                    foreground: "#E6F3F8",
                },
                popover: {
                    DEFAULT: "#07111B",
                    foreground: "#E6F3F8",
                },
                card: {
                    DEFAULT: "rgba(13, 24, 37, 0.4)",
                    foreground: "#E6F3F8",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "12px",
                "2xl": "16px",
                "3xl": "24px",
            },
            boxShadow: {
                'rim-cyan': '0 0 15px rgba(0, 252, 194, 0.15), inset 0 0 10px rgba(0, 252, 194, 0.05)',
                'rim-gold': '0 0 15px rgba(255, 210, 142, 0.15), inset 0 0 10px rgba(255, 210, 142, 0.05)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                glow: {
                    '0%, 100%': { opacity: '0.4', filter: 'blur(20px)' },
                    '50%': { opacity: '0.8', filter: 'blur(35px)' },
                },
                "fade-up": {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                glow: "glow 3s ease-in-out infinite",
                "fade-up": "fade-up 0.5s ease-out forwards",
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
};
export default config;
