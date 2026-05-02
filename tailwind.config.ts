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
        brand: {
          primary: '#9A6B82',
          'primary-hover': '#85576E',
          'primary-light': '#F8EEF2',
          'primary-border': 'rgba(154, 107, 130, 0.16)',
          secondary: '#E5C6D4',
          gold: '#C3A067',
          'gold-light': '#F8F0DD',
          bgLight: '#FCF7F5',
          bgDark: '#241F22',
          textPrimary: '#241F22',
          textMuted: '#70656B',
          border: '#EEE3E6',
          error: '#E05252',
          success: '#4CAF82',
          surfacePink: '#FBF7F8',
          surfaceWarm: '#FFF9F7',
          surfaceCream: '#FFFDFC',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#9A6B82',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: '#E5C6D4',
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
      boxShadow: {
        card: '0 20px 70px -58px rgba(36,31,34,0.55)',
        'card-hover': '0 30px 90px -60px rgba(154,107,130,0.75)',
        editorial: '0 30px 90px -65px rgba(36,31,34,0.45)',
        soft: '0 20px 60px -15px rgba(139,58,143,0.08)',
      },
      zIndex: {
        'admin-overlay': '45',
        'admin-header': '30',
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
        'skip-link': '100',
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