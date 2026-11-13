/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noir: {
          950: '#07080A',
          900: '#0C0E12',
          800: '#13161D',
          700: '#1C202B',
          600: '#282E3D',
        },
        dossier: {
          light: '#F5F0E6',
          DEFAULT: '#EAE1CF',
          dark: '#D5C7AD',
          ink: '#161616',
        },
        crimson: {
          DEFAULT: '#D9383A',
          glow: '#FF4749',
          dark: '#9E1F21',
        },
        amber: {
          tactical: '#E5A93C',
          glow: '#FFC24B',
        },
        emerald: {
          clearance: '#28B463',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        stamp: ['"Special Elite"', '"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'dossier': '0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'crimson-glow': '0 0 25px rgba(217, 56, 58, 0.45)',
        'amber-glow': '0 0 25px rgba(229, 169, 60, 0.35)',
      }
    },
  },
  plugins: [],
}
