import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-public-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // BRAND Fallback Palette
        brand: {
          50: '#f0f5fb',
          100: '#e0ecfa',
          200: '#c2d9f7',
          300: '#94bdf3',
          400: '#609bec',
          500: '#1435b0',
          600: '#092cb1',
          700: '#082594',
          800: '#0a2075',
          900: '#0c1d5f',
          950: '#07103a',
          navy: '#092cb1',
        },
        // DESKTOP: Global Express Sampled Palette
        desktop: {
          hero: '#1435b0',       // Main hero & banner blue
          deep: '#092cb1',       // Deep navy background for hero/footer
          navy: '#1231a2',       // Services section dark navy
          accent: '#fd8f49',     // Primary Orange CTA ("Search", "Reserve", "Next Step")
          accentHover: '#ea7c35',// Orange hover state
          cardHeader: '#5780ff', // Travel details summary card header blue
          bgTint: '#f0f5fb',     // Light icy blue background section tint
        },
        // MOBILE: YATRE Sampled Palette
        mobile: {
          header: '#3684e2',     // Medium blue top headers & illustrations
          primaryBtn: '#003072', // Dark navy blue primary action buttons ("Get OTP", "Verify")
          cardTint: '#e8f2fe',   // Light blue pill highlights & input backgrounds
          screenBg: '#ffffff',   // Clean white screen background
          border: '#dcebfa',     // Subtle blue-tint border stroke
          subtext: '#64748b',    // Muted grey-blue text
        },
      },
      borderRadius: {
        'xl': '0.875rem',  // 14px
        '2xl': '1.25rem',  // 20px
        '3xl': '1.75rem',  // 28px
      },
      boxShadow: {
        'card': '0 10px 30px -5px rgba(20, 53, 176, 0.08)',
        'summary': '0 20px 40px -10px rgba(9, 44, 177, 0.2)',
        'floating': '0 15px 35px -5px rgba(0, 48, 114, 0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
