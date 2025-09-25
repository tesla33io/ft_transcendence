module.exports = {
	mode: 'jit', // Just-In-Time mode
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'], // Adjust paths to match your project structure
  theme: {
      extend: {
      colors: {
        win98: {
          taskbar: '#C0C0C0',
          button: '#808080',
          text: '#000000',
        },
      },
    },
  },
  plugins: [],
};