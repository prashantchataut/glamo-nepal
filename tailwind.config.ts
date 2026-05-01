import type { Config } from "tailwindcss";

const config = {
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
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        serif: [
          'var(--font-cormorant)',
          'Georgia',
          'serif'
        ],
        sans: [
          'var(--font-dm-sans)',
          'system-ui',
          'sans-serif'
        ]
      },
      colors: {
        brand: {
          primary: '#8B3A8F',
          'primary-hover': '#7A3380',
          'primary-light': '#F7EDF8',
          'primary-border': 'rgba(139, 58, 143, 0.15)',
          secondary: '#D4A0D7',
          gold: '#C9A84C',
          'gold-light': '#FBF5E6',
          bgLight: '#FDF6F9',
          bgDark: '#1A0A1E',
          textPrimary: '#1C1C1C',
          textMuted: '#6B6B6B',
          border: '#F0E8F0',
          error: '#E05252',
          success: '#4CAF82',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#8B3A8F',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: '#D4A0D7',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      zIndex: {
        base: '0',
        card: '10',
        'section-header': '20',
        announcement: '40',
        navbar: '50',
        'cart-backdrop': '55',
        cart: '60',
        'menu-backdrop': '65',
        menu: '70',
        'modal-backdrop': '75',
        modal: '80',
        toast: '90',
        tooltip: '95',
        whatsapp: '45',
        'back-to-top': '45',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        marquee: 'marquee 20s linear infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config