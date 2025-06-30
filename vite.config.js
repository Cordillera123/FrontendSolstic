import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: './',

  server: {
    port: 5173,
    host: true,
    open: '/',
    historyApiFallback: {
      index: '/index.html',
      rewrites: [
        { from: /^\/.*$/, to: '/index.html' }
      ]
    }
  },

  preview: {
    port: 4173,
    host: true,
    open: '/'
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react']
        }
      }
    }
  }
})