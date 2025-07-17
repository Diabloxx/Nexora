/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nexora Brand Colors - Purple Theme
        nexora: {
          50: '#faf7ff',
          100: '#f3ebff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Modern Purple Gradients
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Dark theme with purple tints
        dark: {
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
        // Custom background colors with purple hints
        bg: {
          primary: 'linear-gradient(135deg, #1a1625 0%, #2d1b4e 100%)',
          secondary: 'linear-gradient(135deg, #0f0b1f 0%, #1a1625 100%)',
          tertiary: 'linear-gradient(135deg, #1e1b3a 0%, #3c2a5c 100%)',
          modal: 'linear-gradient(135deg, #2a1f3d 0%, #3d2c5f 100%)',
        }
      },
      backgroundImage: {
        'nexora-gradient': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 25%, #c084fc 50%, #d8b4fe 100%)',
        'nexora-gradient-hover': 'linear-gradient(135deg, #6b21a8 0%, #7c3aed 25%, #9333ea 50%, #a855f7 100%)',
        'nexora-dark': 'linear-gradient(135deg, #0f0b1f 0%, #1a1625 25%, #2d1b4e 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(124, 58, 237, 0.1) 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #1a1625 0%, #0f0b1f 100%)',
        'glow-purple': 'radial-gradient(circle at center, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}
