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
    },
    // ✅ AGREGAR CONFIGURACIÓN DE PROXY
    proxy: {
      // Redirigir todas las peticiones a /api hacia el backend Laravel
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      },
      // Redirigir todas las peticiones a /storage hacia el backend Laravel
      '/storage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      }
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