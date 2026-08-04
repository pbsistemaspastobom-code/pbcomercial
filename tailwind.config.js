/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        pasto: {
          escuro: "#2D6A27",
          medio: "#3A7D2E",
          claro: "#D6EDD3",
          amarelo: "#E8B800",
        },
        // Agro-Corporate Precision
        primary: {
          DEFAULT: "#1b4332",
          dark: "#012d1d",
          container: "#1b4332",
          active: "#2d6a4f",
        },
        gold: {
          DEFAULT: "#E9C349",
          soft: "#fed65b",
          deep: "#735c00",
        },
        surface: {
          DEFAULT: "#f8f9fa",
          card: "#ffffff",
          low: "#f3f4f5",
          high: "#e7e8e9",
        },
        ink: {
          DEFAULT: "#191c1d",
          soft: "#414844",
          mute: "#717973",
        },
      },
      fontFamily: {
        headline: ["'Hanken Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 4px 20px rgba(27,67,50,0.04)",
        cardHover: "0 8px 30px rgba(27,67,50,0.08)",
      },
    },
  },
  plugins: [],
};
