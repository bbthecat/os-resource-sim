/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fcfaf9", /* soft cream */
        surface: "#ffffff", /* white */
        "surface-raised": "#f8fafc", /* slate-50 */
        "surface-hover": "#f1f5f9", /* slate-100 */
        "border-subtle": "#e2e8f0", /* slate-200 */
        "border-light": "#cbd5e1", /* slate-300 */
        pastel: {
          pink: "#f8a5c2",
          yellow: "#fcf1b6",
          green: "#cde5d2",
          blue: "#9adcfb",
          purple: "#e2c2dd",
        },
        primary: {
          DEFAULT: "#9adcfb", /* pastel blue */
          hover: "#89cbe9",
          subtle: "#e0f6ff",
        },
        secondary: "#f8a5c2", /* pastel pink */
        danger: "#ff8a8a",
        warning: "#fcf1b6",
        info: "#cde5d2"
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        subtle: "0 4px 15px -3px rgba(0, 0, 0, 0.05), 0 2px 6px -2px rgba(0, 0, 0, 0.02)",
        card: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
        glow: "0 0 20px rgba(154, 220, 251, 0.4)",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
