/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'PingFang SC', 'sans-serif'] },
      boxShadow: {
        soft: '0 18px 50px rgba(30, 36, 44, 0.08)',
        float: '0 24px 80px rgba(18, 25, 38, 0.12)',
      },
    },
  },
  plugins: [],
};
