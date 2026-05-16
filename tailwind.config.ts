import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Cormorant Garamond', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        label: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-display)', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#7B3F8C',
          light: '#B77BC8',
          dark: '#52265E',
        },
        secondary: {
          DEFAULT: '#B88967',
          light: '#DFC2AF',
        },
        neutral: {
          50: '#FAFAF9',
          100: '#F5F3F0',
          200: '#E8E4DF',
          300: '#D4CFC8',
          400: '#A8A09A',
          500: '#7A726B',
          600: '#5C554E',
          700: '#3D3530',
          800: '#2A2420',
          900: '#1A1512',
        },
        surface: '#FFFFFF',
        error: '#C0392B',
        success: '#27AE60',
        admin: {
          success: '#4CAF82',
          'success-light': '#E8F5E9',
          warning: '#F59E0B',
          'warning-light': '#FFF8E1',
          error: '#E05252',
          'error-light': '#FFEBEE',
          info: '#0EA5E9',
          'info-light': '#E0F2FE',
          neutral: '#71717A',
          'neutral-light': '#F4F4F5',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: '#C0392B',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F5F3F0',
          foreground: '#A8A09A',
        },
        accent: {
          DEFAULT: '#C4A35A',
          foreground: '#1A1512',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1512',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1512',
        },
      },
      spacing: {
        '4.5': '18px',
        '18': '72px',
        '22': '88px',
        '30': '120px',
      },
      fontSize: {
        'display-xl': ['5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-md': ['2.75rem', { lineHeight: '1.15' }],
        'heading-sm': ['1.375rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'label': ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.12em' }],
        'price': ['1.75rem', { lineHeight: '1.2' }],
        'nav': ['0.75rem', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.06)',
        'editorial': '0 30px 90px -65px rgba(26,10,30,0.45)',
        'soft': '0 2px 12px rgba(107,63,160,0.06)',
        'nav': '0 1px 0 rgba(0,0,0,0.06)',
      },
      zIndex: {
        'admin-overlay': '45',
        'admin-header': '30',
        'base': '0',
        'card': '10',
        'section-header': '20',
        'announcement': '40',
        'navbar': '50',
        'cart-backdrop': '55',
        'cart': '60',
        'menu-backdrop': '65',
        'menu': '70',
        'modal-backdrop': '75',
        'modal': '80',
        'toast': '90',
        'tooltip': '95',
        'whatsapp': '56',
        'back-to-top': '55',
        'skip-link': '100',
      },
      borderRadius: {
        'lg': '1.5rem',
        'md': '1rem',
        'sm': '0.75rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;

export default config;