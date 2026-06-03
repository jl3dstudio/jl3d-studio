import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design System "Industrial Precision"
        bg: {
          900: '#080B12',
          800: '#0D1117',
          700: '#141923',
          600: '#1C2333',
          500: '#252D3D',
        },
        border: {
          DEFAULT: '#2A3347',
          accent: '#1E3A5F',
        },
        brand: {
          500: '#2563EB',
          400: '#3B82F6',
          300: '#60A5FA',
        },
        cyan: {
          400: '#22D3EE',
        },
        success: '#4ADE80',
        warning: '#FBBF24',
        danger: '#F87171',
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-10px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
} satisfies Config
