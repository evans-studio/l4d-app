import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Love4Detailing Brand Purple System
        brand: {
          50: '#faf7ff',
          100: '#f3ecff',
          200: '#e9ddff',
          300: '#d7c1ff',
          400: '#c299ff',
          500: '#a966ff',
          600: '#9747ff', // Primary brand color
          700: '#8a3af7',
          800: '#7a2ee6', // Dark variant
          900: '#6525c4',
          950: '#4a1a93',
          DEFAULT: '#9747FF',
          light: '#B269FF',
          dark: '#7A2EE6',
        },
        // Primary colors (aliased to brand for consistency)
        primary: {
          50: '#faf7ff',
          100: '#f3ecff',
          200: '#e9ddff',
          300: '#d7c1ff',
          400: '#c299ff',
          500: '#a966ff',
          600: '#9747ff',
          700: '#8a3af7',
          800: '#7a2ee6',
          900: '#6525c4',
          950: '#4a1a93',
          DEFAULT: '#9747FF',
          light: '#B269FF',
          dark: '#7A2EE6',
        },
        // Purple-tinted semantic colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          DEFAULT: '#22c55e',
          purple: '#2dd4bf', // Success with purple hint
        },
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          DEFAULT: '#eab308',
          purple: '#f59e0b', // Warning with purple hint
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
          purple: '#e11d48', // Error with purple hint
        },
        // Purple-tinted neutrals for dark theme
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Love4Detailing Surface Colors with Purple Hints
        surface: {
          primary: '#0a0a0a',     // Pure black background
          secondary: '#141318',   // Slightly purple-tinted dark
          tertiary: '#1f1d26',    // More purple-tinted
          hover: '#2a2831',       // Purple-tinted hover
          active: '#35323f',      // Purple-tinted active
          card: '#161419',        // Card backgrounds with purple hint
          modal: '#1a1720',       // Modal backgrounds
        },
        // Purple-enhanced text colors
        text: {
          primary: '#ffffff',
          secondary: '#e1e0e7',   // Slightly purple-tinted secondary
          muted: '#9b9ba7',       // Purple-tinted muted
          inverse: '#000000',
          purple: '#c299ff',      // Purple text variant
          'purple-muted': '#a1a1b3', // Muted purple text
        },
        // Purple-focused border system
        border: {
          primary: '#404040',
          secondary: '#2a2831',   // Purple-tinted borders
          hover: '#544f61',       // Purple hover borders
          focus: '#9747FF',       // Brand purple focus
          purple: '#6525c4',      // Purple border variant
          'purple-light': '#8a3af7', // Light purple borders
        },
        // Purple accent system
        accent: {
          purple: '#9747FF',
          'purple-light': '#B269FF',
          'purple-dark': '#7A2EE6',
          'purple-glow': 'rgba(151, 71, 255, 0.3)',
          'purple-subtle': 'rgba(151, 71, 255, 0.1)',
          'purple-hover': 'rgba(151, 71, 255, 0.2)',
        }
      },
      // Typography
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Purple-enhanced animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'purple-pulse': 'purplePulse 2s infinite',
        'purple-glow': 'purpleGlow 1.5s ease-in-out infinite alternate',
        'purple-bounce': 'purpleBounce 1s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        purplePulse: {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(151, 71, 255, 0.4)' 
          },
          '50%': { 
            boxShadow: '0 0 0 10px rgba(151, 71, 255, 0)' 
          },
        },
        purpleGlow: {
          '0%': { 
            boxShadow: '0 0 20px rgba(151, 71, 255, 0.3)' 
          },
          '100%': { 
            boxShadow: '0 0 30px rgba(151, 71, 255, 0.6)' 
          },
        },
        purpleBounce: {
          '0%, 100%': { 
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
          },
          '50%': { 
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
          },
        },
      },
      // Component Sizes
      height: {
        'touch': '44px', // Minimum touch target
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      // Purple-enhanced box shadows
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(151, 71, 255, 0.3)',
        'purple': '0 4px 14px 0 rgba(151, 71, 255, 0.15)',
        'purple-lg': '0 10px 25px -3px rgba(151, 71, 255, 0.2)',
        'purple-xl': '0 20px 40px -4px rgba(151, 71, 255, 0.25)',
        'purple-glow': '0 0 30px rgba(151, 71, 255, 0.4)',
        'purple-glow-lg': '0 0 50px rgba(151, 71, 255, 0.3)',
        'purple-inner': 'inset 0 2px 4px rgba(151, 71, 255, 0.1)',
      },
      // Border Radius
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // Responsive Breakpoints (already defined but documenting)
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}

export default config