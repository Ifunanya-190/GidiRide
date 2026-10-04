/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gidi: {
          ink: '#06100e',
          asphalt: '#0b1312',
          road: '#121d1a',
          chalk: '#fff9ec',
          yellow: '#f6b91a',
          green: '#18d463',
          red: '#ff5b4f'
        }
      },
      boxShadow: {
        gidi: '0 24px 80px rgba(0,0,0,.42)'
      },
      borderRadius: {
        gidi: '1.75rem'
      }
    }
  },
  plugins: []
};
