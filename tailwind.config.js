/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Fredoka", "sans-serif"], body: ["Assistant", "sans-serif"] },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        gold: { 50: "#FFF9E6", 100: "#FDEFC4", 200: "#F9DD8A", 300: "#F2C653", 400: "#E6AE2B", 500: "#C98F12", 600: "#9E6C0B", 700: "#6E4A08", 900: "#2A1C03" },
      },
    },
  },
  plugins: [],
};
