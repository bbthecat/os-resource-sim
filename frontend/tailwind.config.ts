/** @type {import('tailwindcss').Config} */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Sage Forest palette — values live as CSS variables in src/index.css
      colors: {
        canvas: token('canvas'),
        surface: {
          DEFAULT: token('surface'),
          muted: token('surface-muted'),
        },
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        ink: token('ink'),
        muted: token('muted'),
        subtle: token('subtle'),
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          soft: token('primary-soft'),
          ink: token('primary-ink'),
        },
        warning: {
          DEFAULT: token('warning'),
          soft: token('warning-soft'),
          line: token('warning-line'),
        },
        danger: {
          DEFAULT: token('danger'),
          soft: token('danger-soft'),
          line: token('danger-line'),
        },
        info: {
          DEFAULT: token('info'),
          soft: token('info-soft'),
        },
        // the dark timeline scrubber — the one dark surface in the app
        night: {
          DEFAULT: token('night'),
          raised: token('night-raised'),
          line: token('night-line'),
          text: token('night-text'),
          muted: token('night-muted'),
          signal: token('night-signal'),
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: "0 1px 2px rgb(31 42 31 / 0.04)",
        pop: "0 12px 32px -8px rgb(31 42 31 / 0.18), 0 2px 6px rgb(31 42 31 / 0.06)",
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'draw-in': 'drawIn 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        drawIn: {
          '0%': { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },
      },
    },
  },
  plugins: [],
}
