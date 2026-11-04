import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all /api/* requests to your backend during development.
      // Change the target to wherever your backend is running.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // If your backend already has /api prefix, leave rewrite as-is.
        // If your backend routes start at /  (no /api prefix), uncomment below:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
