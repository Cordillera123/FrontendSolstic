import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: '/FrontendSolstic/',

  server: {
    port: 5173,
    host: true,
    open: '/FrontendSolstic/',
    historyApiFallback: {
      index: '/FrontendSolstic/index.html',
      rewrites: [
        { from: /^\/FrontendSolstic\/.*$/, to: '/FrontendSolstic/index.html' }
      ]
    }
  },

  preview: {
    port: 4173,
    host: true,
    open: '/FrontendSolstic/'
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
