// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Estados del tema
  const [currentTheme, setCurrentTheme] = useState('blue');
  const [customColors, setCustomColors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Definición de temas predefinidos
  const predefinedThemes = {
    blue: {
      name: 'Azul Clásico',
      colors: {
        primary: '#3B82F6',
        primaryDark: '#1D4ED8',
        primaryLight: '#93C5FD',
        primaryLighter: '#DBEAFE',
        sidebar: '#1E3A8A',
        sidebarHover: '#1E40AF',
        header: '#2563EB',
        headerText: '#FFFFFF',
        accent: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
      }
    },
    green: {
      name: 'Verde Naturaleza',
      colors: {
        primary: '#10B981',
        primaryDark: '#047857',
        primaryLight: '#6EE7B7',
        primaryLighter: '#D1FAE5',
        sidebar: '#064E3B',
        sidebarHover: '#065F46',
        header: '#059669',
        headerText: '#FFFFFF',
        accent: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#F0FDF4',
        surface: '#FFFFFF',
        border: '#BBF7D0',
      }
    },
    purple: {
      name: 'Púrpura Elegante',
      colors: {
        primary: '#8B5CF6',
        primaryDark: '#7C3AED',
        primaryLight: '#C4B5FD',
        primaryLighter: '#EDE9FE',
        sidebar: '#581C87',
        sidebarHover: '#6B21A8',
        header: '#7C3AED',
        headerText: '#FFFFFF',
        accent: '#EC4899',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        border: '#E5E7EB',
      }
    },
    orange: {
      name: 'Naranja Energético',
      colors: {
        primary: '#F97316',
        primaryDark: '#EA580C',
        primaryLight: '#FDBA74',
        primaryLighter: '#FED7AA',
        sidebar: '#9A3412',
        sidebarHover: '#C2410C',
        header: '#EA580C',
        headerText: '#FFFFFF',
        accent: '#06B6D4',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#FFFBEB',
        surface: '#FFFFFF',
        border: '#FED7AA',
      }
    },
    dark: {
      name: 'Oscuro Profesional',
      colors: {
        primary: '#6366F1',
        primaryDark: '#4F46E5',
        primaryLight: '#A5B4FC',
        primaryLighter: '#E0E7FF',
        sidebar: '#1F2937',
        sidebarHover: '#374151',
        header: '#111827',
        headerText: '#F9FAFB',
        accent: '#10B981',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        border: '#D1D5DB',
      }
    },
    custom: {
      name: 'Personalizado',
      colors: {} // Se llena dinámicamente
    }
  };

  // Obtener el tema actual con sus colores
  const getCurrentThemeColors = useCallback(() => {
    if (currentTheme === 'custom') {
      return customColors;
    }
    return predefinedThemes[currentTheme]?.colors || predefinedThemes.blue.colors;
  }, [currentTheme, customColors]);

  // Aplicar colores CSS y clases de tema
  const applyThemeColors = useCallback((colors, themeName) => {
    const root = document.documentElement;
    
    // Aplicar variables CSS
    Object.entries(colors).forEach(([key, value]) => {
      // Convertir camelCase a kebab-case
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--color-${cssVar}`, value);
    });

    // Agregar RGB del color primario para sombras
    if (colors.primary) {
      const hex = colors.primary.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
    }

    // Aplicar clases de tema al body
    const body = document.body;
    
    // Remover clases de tema anteriores
    const themeClasses = ['theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-dark', 'theme-custom'];
    themeClasses.forEach(cls => body.classList.remove(cls));
    
    // Agregar clase del tema actual
    if (themeName && themeName !== 'blue') {
      body.classList.add(`theme-${themeName}`);
    }

    // Agregar animación de cambio
    body.classList.add('theme-changing');
    setTimeout(() => {
      body.classList.remove('theme-changing');
    }, 600);
  }, []);

  // Cargar tema desde localStorage
  const loadThemeFromStorage = useCallback(() => {
    try {
      const savedTheme = localStorage.getItem('app-theme');
      const savedCustomColors = localStorage.getItem('app-custom-colors');
      
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
      
      if (savedCustomColors) {
        setCustomColors(JSON.parse(savedCustomColors));
      }
    } catch (error) {
      console.error('Error loading theme from storage:', error);
    }
  }, []);

  // Guardar tema en localStorage
  const saveThemeToStorage = useCallback((theme, colors = null) => {
    try {
      localStorage.setItem('app-theme', theme);
      if (colors) {
        localStorage.setItem('app-custom-colors', JSON.stringify(colors));
      }
    } catch (error) {
      console.error('Error saving theme to storage:', error);
    }
  }, []);

  // Cambiar tema
  const changeTheme = useCallback(async (themeName, newCustomColors = null) => {
    setIsLoading(true);
    
    try {
      // Simular delay para mejor UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCurrentTheme(themeName);
      
      if (themeName === 'custom' && newCustomColors) {
        setCustomColors(newCustomColors);
        saveThemeToStorage(themeName, newCustomColors);
        applyThemeColors(newCustomColors, themeName);
      } else {
        const themeColors = predefinedThemes[themeName]?.colors || predefinedThemes.blue.colors;
        saveThemeToStorage(themeName);
        applyThemeColors(themeColors, themeName);
      }
    } catch (error) {
      console.error('Error changing theme:', error);
    } finally {
      setIsLoading(false);
    }
  }, [saveThemeToStorage, applyThemeColors]);

  // Actualizar colores personalizados
  const updateCustomColors = useCallback((newColors) => {
    const updatedColors = { ...customColors, ...newColors };
    setCustomColors(updatedColors);
    
    if (currentTheme === 'custom') {
      applyThemeColors(updatedColors, 'custom');
      saveThemeToStorage('custom', updatedColors);
    }
  }, [customColors, currentTheme, applyThemeColors, saveThemeToStorage]);

  // Obtener clases CSS para elementos específicos
  const getThemeClasses = useCallback((element, variant = 'default') => {
    const baseClasses = {
      // Sidebar
      sidebar: {
        default: 'bg-sidebar text-white border-r border-border',
        hover: 'hover:bg-sidebar-hover',
      },
      
      // Header de ventanas
      windowHeader: {
        default: 'bg-header text-header-text border-b border-border',
        hover: 'hover:bg-primary-dark',
      },
      
      // Botones
      button: {
        primary: 'bg-primary hover:bg-primary-dark text-white border-primary',
        secondary: 'bg-surface hover:bg-primary-lighter text-primary border-border',
        success: 'bg-success hover:bg-green-600 text-white',
        warning: 'bg-warning hover:bg-yellow-600 text-white',
        danger: 'bg-error hover:bg-red-600 text-white',
      },
      
      // Cards y superficies
      card: {
        default: 'bg-surface border-border shadow-sm',
        hover: 'hover:bg-primary-lighter',
        selected: 'bg-primary-lighter border-primary',
      },
      
      // Inputs
      input: {
        default: 'bg-surface border-border focus:border-primary focus:ring-primary',
        error: 'bg-surface border-error focus:border-error focus:ring-error',
        success: 'bg-surface border-success focus:border-success focus:ring-success',
      },
      
      // Badges y estados
      badge: {
        primary: 'bg-primary-lighter text-primary',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
      }
    };
    
    return baseClasses[element]?.[variant] || baseClasses[element]?.default || '';
  }, []);

  // Verificar si es tema oscuro
  const isDarkTheme = currentTheme === 'dark';

  // Obtener información del tema actual
  const getCurrentThemeInfo = useCallback(() => {
    return {
      name: currentTheme,
      displayName: predefinedThemes[currentTheme]?.name || 'Desconocido',
      colors: getCurrentThemeColors(),
      isCustom: currentTheme === 'custom',
      isDark: isDarkTheme,
    };
  }, [currentTheme, getCurrentThemeColors, isDarkTheme]);

  // Efectos
  useEffect(() => {
    loadThemeFromStorage();
  }, [loadThemeFromStorage]);

  useEffect(() => {
    const colors = getCurrentThemeColors();
    applyThemeColors(colors, currentTheme);
  }, [getCurrentThemeColors, applyThemeColors, currentTheme]);

  // Valor del contexto
  const contextValue = {
    // Estado
    currentTheme,
    customColors,
    isLoading,
    
    // Temas disponibles
    predefinedThemes,
    
    // Funciones principales
    changeTheme,
    updateCustomColors,
    
    // Utilidades
    getThemeClasses,
    getCurrentThemeColors,
    getCurrentThemeInfo,
    
    // Información
    isDarkTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;