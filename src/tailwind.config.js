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
          escuro: "#1C4416",
          medio: "#3A7D2E",
          claro: "#D6EDD3",
          amarelo: "#E8B800",
        },
        // Paleta PB Cadastro
        primary: {
          DEFAULT: "#2D6A27",
          dark: "#1C4416",
          container: "#0F2E1E",
          active: "#3A7D2E",
        },
        gold: {
          DEFAULT: "#E8B800",
          soft: "#FBF3D6",
          deep: "#9A7A00",
        },
        surface: {
          DEFAULT: "#F8F9FA",
          card: "#FFFFFF",
          low: "#F1F5EF",
          high: "#E9ECEF",
        },
        ink: {
          DEFAULT: "#243024",
          soft: "#414844",
          mute: "#6B7568",
        },
        // status (sem vermelho de dado — vermelho só em excluir/erro crítico)
        status: {
          okBg: "#D6EDD3", okText: "#1C4416",
          alertaBg: "#FBF3D6", alertaText: "#9A7A00",
          criticoBg: "#F7E3E1", criticoText: "#9A3B32",
        },
      },
      fontFamily: {
        headline: ["'Manrope'", "sans-serif"],
        body: ["'Work Sans'", "sans-serif"],
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
