/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ✅ TUS COLORES EXISTENTES - MANTIENEN FUNCIONANDO
        'coop-primary': '#0ea5e9',    // Celeste (Sky-500) - Para elementos principales
        'coop-secondary': '#0369a1',  // Azul más oscuro (Sky-700) - Para elementos secundarios
        'coop-accent': '#0891b2',     // Turquesa (Cyan-600) - Para acentos
        'coop-dark': '#0c4a6e',       // Azul marino (Sky-900) - Para sidebar y fondos oscuros
        'coop-neutral': '#334155',    // Gris azulado (Slate-700) - Para textos principales
        'coop-light': '#f0f9ff',      // Celeste muy claro (Sky-50) - Para fondos claros
        'coop-success': '#10b981',    // Verde (Emerald-500) - Para éxito
        'coop-warning': '#f59e0b',    // Ámbar (Amber-500) - Para advertencias
        'coop-danger': '#ef4444',     // Rojo (Red-500) - Para errores/peligro

        // ✨ NUEVOS COLORES DINÁMICOS CON VARIABLES CSS
        // Sistema de temas que se puede cambiar dinámicamente
        theme: {
          primary: 'var(--color-primary)',
          'primary-dark': 'var(--color-primary-dark)',
          'primary-light': 'var(--color-primary-light)',
          'primary-lighter': 'var(--color-primary-lighter)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          background: 'var(--color-background)',
          surface: 'var(--color-surface)',
          border: 'var(--color-border)',
        },
        
        // Colores específicos para navegación (dinámicos)
        sidebar: {
          DEFAULT: 'var(--color-sidebar)',
          hover: 'var(--color-sidebar-hover)',
          text: 'var(--color-sidebar-text)',
        },
        header: {
          DEFAULT: 'var(--color-header)',
          text: 'var(--color-header-text)',
          border: 'var(--color-header-border)',
        },
        
        // Aliases para compatibilidad (mapean a variables CSS)
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
      },
      animation: {
        // Tus animaciones existentes
        'spin-slow': 'spin 3s linear infinite',
        'fadeIn': 'fadeIn 0.2s ease-out forwards',
        'slideDown': 'slideDown 0.2s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        
        // Nuevas animaciones para temas
        'theme-fade-in': 'themeFadeIn 0.5s ease-in-out',
        'theme-slide-up': 'themeSlideUp 0.3s ease-out',
        'theme-pulse': 'themePulse 2s infinite',
        'color-transition': 'colorTransition 0.3s ease-in-out',
      },
      keyframes: {
        // Tus keyframes existentes
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
        
        // Nuevos keyframes para temas
        themeFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        themeSlideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        themePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        colorTransition: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        }
      },
      boxShadow: {
        // Tus sombras existentes
        'window': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        
        // Nuevas sombras dinámicas basadas en el tema
        'theme': '0 4px 6px -1px rgba(var(--color-primary-rgb), 0.1), 0 2px 4px -1px rgba(var(--color-primary-rgb), 0.06)',
        'theme-lg': '0 10px 15px -3px rgba(var(--color-primary-rgb), 0.1), 0 4px 6px -2px rgba(var(--color-primary-rgb), 0.05)',
        'theme-xl': '0 20px 25px -5px rgba(var(--color-primary-rgb), 0.1), 0 10px 10px -5px rgba(var(--color-primary-rgb), 0.04)',
      },
      transitionProperty: {
        // Tus transiciones existentes
        'height': 'height',
        'spacing': 'margin, padding',
        
        // Nuevas transiciones para temas
        'theme': 'color, background-color, border-color, box-shadow',
        'theme-all': 'all',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      }
    },
  },
  plugins: [],
}