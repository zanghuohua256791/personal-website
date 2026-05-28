import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        accent: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#f9d7a5',
          300: '#f5ba6d',
          400: '#f09433',
          500: '#ed7a12',
          600: '#de6008',
          700: '#b84909',
          800: '#923a0e',
          900: '#76310f',
        },
      },
      maxWidth: {
        'content': '72rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
