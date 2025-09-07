import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Base public path when served in production
  base: "/qr-host/",

  // Build configuration
  build: {
    // Output directory for production build
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: true,
    // Target modern browsers that support ES modules
    target: 'es2015',
    // Use esbuild for minification (built-in, no extra dependencies)
    minify: 'esbuild'
  },

  // Development server configuration
  server: {
    // Port for development server
    port: 5173,
    // Open browser automatically
    open: true,
    // Enable CORS for camera access
    cors: true,
    // Host configuration for mobile testing
    host: true
  },

  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },

  // Plugin configuration
  plugins: [],

  // Optimize dependencies
  optimizeDeps: {
    include: ['jsqr']
  }
})
