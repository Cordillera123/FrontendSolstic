// src/context/ThemeContext.jsx - VERSIÓN MEJORADA CON ESTADOS DE CARGA
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/apiService';

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
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ✅ NUEVO: Estados específicos para la carga inicial
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('init'); // 'init', 'loading-theme', 'loading-colors', 'applying', 'complete'
  const [lastLoadTime, setLastLoadTime] = useState(null);

  // Definición de temas predefinidos (sin cambios)
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

  // ✅ MEJORADO: Cargar configuración desde la API con mejor manejo de estados
  const loadThemeFromAPI = useCallback(async () => {
    try {
      console.log('🎨 ThemeContext - Iniciando carga del tema desde API...');
      setIsLoading(true);
      setLoadingStage('loading-theme');

      // Obtener tema actual
      const themeResponse = await adminService.configuraciones.getByName('sistema_tema_actual');
      const currentThemeFromAPI = themeResponse.data?.[0]?.conf_detalle || 'blue';

      console.log('🎨 Tema obtenido:', currentThemeFromAPI);
      setLoadingStage('loading-colors');

      // Obtener colores personalizados
      const colorsResponse = await adminService.configuraciones.getByName('sistema_colores_personalizados');
      const customColorsFromAPI = colorsResponse.data?.[0]?.conf_detalle || '{}';

      let parsedCustomColors = {};
      try {
        parsedCustomColors = JSON.parse(customColorsFromAPI);
      } catch (parseError) {
        console.warn('⚠️ Error parsing custom colors from API:', parseError);
        parsedCustomColors = {};
      }

      console.log('✅ Colores personalizados obtenidos:', parsedCustomColors);
      setLoadingStage('applying');

      // Simular un pequeño delay para mejor UX en la carga
      await new Promise(resolve => setTimeout(resolve, 800));

      // Aplicar tema
      setCurrentTheme(currentThemeFromAPI);
      setCustomColors(parsedCustomColors);

      // También guardar en localStorage como respaldo
      localStorage.setItem('app-theme', currentThemeFromAPI);
      localStorage.setItem('app-custom-colors', JSON.stringify(parsedCustomColors));

      setLoadingStage('complete');
      setLastLoadTime(new Date());

      console.log('✅ Tema cargado y aplicado exitosamente:', {
        theme: currentThemeFromAPI,
        customColors: parsedCustomColors
      });

      return { theme: currentThemeFromAPI, colors: parsedCustomColors };
    } catch (error) {
      console.error('❌ Error cargando tema desde API:', error);
      
      // Fallback: usar localStorage
      const fallbackTheme = localStorage.getItem('app-theme') || 'blue';
      const fallbackColors = JSON.parse(localStorage.getItem('app-custom-colors') || '{}');
      
      setCurrentTheme(fallbackTheme);
      setCustomColors(fallbackColors);
      setLoadingStage('complete');
      
      console.log('🔄 Usando valores de fallback:', { theme: fallbackTheme, colors: fallbackColors });
      
      return { theme: fallbackTheme, colors: fallbackColors };
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      setIsInitialLoading(false);
    }
  }, []);

  // ✅ MEJORADO: Guardar configuración en la API con mejor feedback
  const saveThemeToAPI = useCallback(async (theme, colors = null) => {
    try {
      console.log('💾 ThemeContext - Guardando tema en API:', { theme, colors });
      setIsLoading(true);

      // Guardar tema actual
      await adminService.configuraciones.updateValue('sistema_tema_actual', theme);

      // Guardar colores personalizados si existen
      if (colors) {
        await adminService.configuraciones.updateValue(
          'sistema_colores_personalizados', 
          JSON.stringify(colors)
        );
      }

      // También guardar en localStorage como respaldo
      localStorage.setItem('app-theme', theme);
      if (colors) {
        localStorage.setItem('app-custom-colors', JSON.stringify(colors));
      }

      setLastLoadTime(new Date());
      console.log('✅ Tema guardado correctamente en API y localStorage');
    } catch (error) {
      console.error('❌ Error guardando tema en API:', error);
      
      // Fallback: solo guardar en localStorage
      localStorage.setItem('app-theme', theme);
      if (colors) {
        localStorage.setItem('app-custom-colors', JSON.stringify(colors));
      }
      
      throw error; // Re-lanzar para que el componente pueda manejarlo
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtener el tema actual con sus colores
  const getCurrentThemeColors = useCallback(() => {
    if (currentTheme === 'custom') {
      return customColors;
    }
    return predefinedThemes[currentTheme]?.colors || predefinedThemes.blue.colors;
  }, [currentTheme, customColors]);

  // ✅ MEJORADO: Aplicar colores CSS con mejor logging
  const applyThemeColors = useCallback((colors, themeName) => {
    console.log('🎨 Aplicando colores del tema:', themeName, colors);
    
    const root = document.documentElement;
    
    // Aplicar variables CSS
    Object.entries(colors).forEach(([key, value]) => {
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

    console.log('✅ Colores aplicados correctamente al DOM');
  }, []);

  // ✅ MEJORADO: Cambiar tema con mejor manejo de estados
  const changeTheme = useCallback(async (themeName, newCustomColors = null) => {
    setIsLoading(true);
    
    try {
      console.log('🔄 ThemeContext - Cambiando tema:', { themeName, newCustomColors });
      
      // Simular delay para mejor UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Actualizar estado local
      setCurrentTheme(themeName);
      
      if (themeName === 'custom' && newCustomColors) {
        setCustomColors(newCustomColors);
        await saveThemeToAPI(themeName, newCustomColors);
        applyThemeColors(newCustomColors, themeName);
      } else {
        const themeColors = predefinedThemes[themeName]?.colors || predefinedThemes.blue.colors;
        await saveThemeToAPI(themeName);
        applyThemeColors(themeColors, themeName);
      }

      console.log('✅ Tema cambiado exitosamente');
    } catch (error) {
      console.error('❌ Error cambiando tema:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveThemeToAPI, applyThemeColors]);

  // Actualizar colores personalizados con persistencia en API
  const updateCustomColors = useCallback(async (newColors) => {
    try {
      const updatedColors = { ...customColors, ...newColors };
      setCustomColors(updatedColors);
      
      if (currentTheme === 'custom') {
        applyThemeColors(updatedColors, 'custom');
        await saveThemeToAPI('custom', updatedColors);
      }
    } catch (error) {
      console.error('❌ Error actualizando colores personalizados:', error);
      throw error;
    }
  }, [customColors, currentTheme, applyThemeColors, saveThemeToAPI]);

  // Obtener clases CSS para elementos específicos
  const getThemeClasses = useCallback((element, variant = 'default') => {
    const baseClasses = {
      sidebar: {
        default: 'bg-sidebar text-white border-r border-border',
        hover: 'hover:bg-sidebar-hover',
      },
      windowHeader: {
        default: 'bg-header text-header-text border-b border-border',
        hover: 'hover:bg-primary-dark',
      },
      button: {
        primary: 'bg-primary hover:bg-primary-dark text-white border-primary',
        secondary: 'bg-surface hover:bg-primary-lighter text-primary border-border',
        success: 'bg-success hover:bg-green-600 text-white',
        warning: 'bg-warning hover:bg-yellow-600 text-white',
        danger: 'bg-error hover:bg-red-600 text-white',
      },
      card: {
        default: 'bg-surface border-border shadow-sm',
        hover: 'hover:bg-primary-lighter',
        selected: 'bg-primary-lighter border-primary',
      },
      input: {
        default: 'bg-surface border-border focus:border-primary focus:ring-primary',
        error: 'bg-surface border-error focus:border-error focus:ring-error',
        success: 'bg-surface border-success focus:border-success focus:ring-success',
      },
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

  // ✅ MEJORADO: Función para refrescar tema desde la API
  const refreshThemeFromAPI = useCallback(async () => {
    try {
      console.log('🔄 Refrescando tema desde API...');
      setIsLoading(true);
      await loadThemeFromAPI();
    } catch (error) {
      console.error('❌ Error refrescando tema:', error);
      throw error;
    }
  }, [loadThemeFromAPI]);

  // ✅ MEJORADO: Efecto para cargar tema al inicializar
  useEffect(() => {
    let isMounted = true;
    
    const initializeTheme = async () => {
      try {
        console.log('🎨 ThemeContext - Inicializando tema...');
        const themeData = await loadThemeFromAPI();
        
        if (isMounted) {
          // Aplicar tema inmediatamente
          const colors = themeData.theme === 'custom' 
            ? themeData.colors 
            : predefinedThemes[themeData.theme]?.colors || predefinedThemes.blue.colors;
          
          applyThemeColors(colors, themeData.theme);
        }
      } catch (error) {
        console.error('❌ Error inicializando tema:', error);
        
        // En caso de error, aplicar tema por defecto
        if (isMounted) {
          const defaultColors = predefinedThemes.blue.colors;
          applyThemeColors(defaultColors, 'blue');
          setIsInitialized(true);
          setIsInitialLoading(false);
        }
      }
    };

    initializeTheme();
    
    return () => {
      isMounted = false;
    };
  }, [loadThemeFromAPI, applyThemeColors]);

  // ✅ NUEVO: Efecto para detectar cambios de tema en tiempo real
  useEffect(() => {
    if (isInitialized && !isInitialLoading) {
      const colors = getCurrentThemeColors();
      applyThemeColors(colors, currentTheme);
    }
  }, [getCurrentThemeColors, applyThemeColors, currentTheme, isInitialized, isInitialLoading]);

  // ✅ NUEVO: Efecto para limpiar estados de carga después de un tiempo
  useEffect(() => {
    if (isInitialized && !isLoading) {
      const timer = setTimeout(() => {
        setLoadingStage('complete');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, isLoading]);

  // Valor del contexto
  const contextValue = {
    // Estado
    currentTheme,
    customColors,
    isLoading,
    isInitialized,
    
    // ✅ NUEVOS: Estados específicos de carga
    isInitialLoading,
    loadingStage,
    lastLoadTime,
    
    // Temas disponibles
    predefinedThemes,
    
    // Funciones principales
    changeTheme,
    updateCustomColors,
    refreshThemeFromAPI,
    
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