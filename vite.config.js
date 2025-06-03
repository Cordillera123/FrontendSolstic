import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({

  plugins: [
    react(), 
    tailwindcss() // ✅ Solo una declaración de Tailwind
  ],
  base: '/FrontendSolstic/', // ✅ Base path para producción
  
  // ✅ Configuración del servidor de desarrollo
  server: {
    port: 5173,
    host: true,
    open: '/FrontendSolstic/', // ✅ Abrir directamente en la ruta correcta
    // ✅ Configurar fallback para SPA routing
    historyApiFallback: {
      index: '/FrontendSolstic/index.html',
      rewrites: [
        { from: /^\/FrontendSolstic\/.*$/, to: '/FrontendSolstic/index.html' }
      ]
    }
  },
  
  // ✅ Configuración para preview (producción)
  preview: {
    port: 4173,
    host: true,
    open: '/FrontendSolstic/'
  },
  
  // ✅ Configuración de build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // ✅ Optimizaciones adicionales
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react']
        }
      }
    }
  }
=======
  plugins: [react(), tailwindcss()],
  base: '/FrontendSolstic/'  // ← AGREGAR ESTA LÍNEA

})