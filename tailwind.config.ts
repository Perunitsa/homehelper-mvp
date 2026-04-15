import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: 'var(--cream)',
          dark: 'var(--cream-dark)',
        },
        beige: {
          DEFAULT: 'var(--beige)',
          dark: 'var(--beige-dark)',
        },
        olive: {
          DEFAULT: 'var(--olive)',
          light: 'var(--olive-light)',
          dark: 'var(--olive-dark)',
        },
        mint: {
          DEFAULT: 'var(--mint)',
          light: 'var(--mint-light)',
        },
        peach: {
          DEFAULT: 'var(--peach)',
          dark: 'var(--peach-dark)',
        },
        rose: {
          muted: 'var(--rose-muted)',
        },
        gold: {
          soft: 'var(--gold-soft)',
          softDark: 'var(--gold-soft-dark)',
        },
        brown: {
          DEFAULT: 'var(--warm-brown)',
          dark: 'var(--warm-brown-dark)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        whiteSoft: 'var(--white-soft)',
      },
      boxShadow: {
        soft: '0 2px 12px var(--shadow-soft)',
        medium: '0 4px 20px var(--shadow-medium)',
      },
      borderRadius: {
        'cozy': '16px',
        'cozy-sm': '12px',
      },
      fontFamily: {
        handwritten: ['var(--font-caveat)', 'cursive'],
      },
      animation: {
        'sway': 'sway 4s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'breathe': 'breathe 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
