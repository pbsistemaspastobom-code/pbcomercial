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
      },
    },
  },
  plugins: [],
};
