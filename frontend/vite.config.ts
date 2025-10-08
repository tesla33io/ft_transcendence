import { defineConfig } from 'vite'


export default defineConfig({
  server: {
    port: 5173,      // The port your Vite dev server runs on
    host: true,      // Listen on all network interfaces (important for Docker)
    strictPort: true, // Don't switch port if 5173 is taken
    open: false,      // Open browser automatically when true
    allowedHosts: true,

    proxy: {
      // Proxy API requests to the gateway-service
      '/api': {
        target: 'http://gateway-service:3000', // The backend container name + port
        changeOrigin: true,                    // Needed for virtual host changes
        secure: false,                         // Don't enforce https
        rewrite: (path) => path.replace(/^\/api/, '/api') // Optional: keeps /api path
      },

      // Proxy WebSocket connections
      '/ws': {
        target: 'ws://gateway-service:3000', // Use ws:// scheme for WebSockets
        ws: true,                            // Enable WebSocket proxying
      }
    }
  },

  
})
