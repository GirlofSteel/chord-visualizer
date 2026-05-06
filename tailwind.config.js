/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 页面背景
        'page-bg': '#F5F5F7',
        // 卡片背景
        'card-bg': '#FFFFFF',
        // 主文字
        'text-primary': '#111111',
        // 次文字
        'text-secondary': '#666666',
        // 辅助文字
        'text-muted': '#999999',
        // 分割线
        'border-light': '#EAEAEA',
        // 功能色
        'success': '#34C759',
        'error': '#FF3B30',
        'error-bg': '#FFECEC',
        // 图表颜色
        'chart-default': '#DCDCDC',
        'chart-active': '#111111',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro"', '"PingFang SC"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        'card': '16px',
        'pill': '999px',
      },
    },
  },
  plugins: [],
}
