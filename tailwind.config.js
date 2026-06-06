/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0500',
        surface: '#1f0e00',
        'surface-2': '#2a1400',
        primary: '#8B4513',
        gold: '#d4a017',
        'gold-bright': '#f0c040',
        danger: '#8b0000',
        text: '#f5e6c8',
        muted: '#a08060',
        success: '#4a7c2e'
      },
      fontFamily: {
        display: ['Almendra', 'serif'],
        body: ['"Frank Ruhl Libre"', 'serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
        'shake': 'shake 0.4s ease-in-out',
        'dice-roll': 'diceRoll 0.6s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'level-up': 'levelUp 1s ease-out',
        'flash-red': 'flashRed 0.4s ease-out',
        'flash-green': 'flashGreen 0.4s ease-out',
        'fall': 'fall 0.5s ease-in forwards'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' }
        },
        diceRoll: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.3)' },
          '100%': { transform: 'rotate(360deg) scale(1)' }
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(212, 160, 23, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(212, 160, 23, 0.8)' }
        },
        levelUp: {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.2)', filter: 'brightness(1.5)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1)' }
        },
        flashRed: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(139, 0, 0, 0.6)' }
        },
        flashGreen: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(74, 124, 46, 0.6)' }
        },
        fall: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(40px) scale(0.5)' }
        }
      }
    }
  },
  plugins: []
};
