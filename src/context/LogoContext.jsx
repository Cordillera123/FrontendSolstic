// src/context/LogoContext.jsx - FUNCIÓN UPLOADLOGO CORREGIDA
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LogoContext = createContext();

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo debe ser usado dentro de un LogoProvider');
  }
  return context;
};

export const LogoProvider = ({ children }) => {
  const [logoData, setLogoData] = useState({
    principal: {
      id: 1,
      url: '/storage/logos/general/logo-default.png',
      nombre: 'COAC PRINCIPAL',
      activo: true
    },
    login: null,
    sidebar: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FUNCIÓN CORREGIDA para obtener el token de autenticación
  const getAuthToken = useCallback(() => {
    console.log('🔍 LogoContext - Buscando token de autenticación...');
    
    // ✅ CORRECCIÓN PRINCIPAL: Usar la misma clave que apiService.js
    const primaryToken = localStorage.getItem("auth_token"); // Clave principal del sistema
    if (primaryToken) {
      console.log('✅ LogoContext - Token encontrado en localStorage con clave "auth_token"');
      return primaryToken;
    }

    // ✅ FALLBACKS: Buscar con otras claves posibles
    const fallbackKeys = [
      'token',           // Tu clave anterior
      'access_token',    // Laravel Sanctum común
      'user_token',      // Otra variante
      'api_token',       // API token
      'sanctum_token'    // Sanctum específico
    ];
    
    console.log('⚠️ LogoContext - Token principal no encontrado, buscando fallbacks...');
    
    // Buscar en localStorage
    for (const key of fallbackKeys) {
      const token = localStorage.getItem(key);
      if (token && token.length > 10) {
        console.log(`✅ LogoContext - Token encontrado en localStorage con clave "${key}"`);
        return token;
      }
    }
    
    // Buscar en sessionStorage
    for (const key of ['auth_token', ...fallbackKeys]) {
      const token = sessionStorage.getItem(key);
      if (token && token.length > 10) {
        console.log(`✅ LogoContext - Token encontrado en sessionStorage con clave "${key}"`);
        return token;
      }
    }
    
    // ✅ DEBUGGING: Mostrar qué hay en el storage
    console.log('🔍 LogoContext - Inspeccionando localStorage...');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value?.substring(0, 30)}...`);
    }
    
    console.log('❌ LogoContext - No se encontró token de autenticación');
    return null;
  }, []);

  // Función para cargar logos de forma pública (sin autenticación)
  const loadLogosPublic = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🎨 LogoContext - Cargando logos públicamente...');
      
      const response = await fetch('/api/logos/by-ubicacion', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const token = getAuthToken();
        if (token) {
          console.log('🔑 LogoContext - Reintentando con token...');
          return await loadLogosWithAuth();
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 LogoContext - Datos recibidos del backend:', data);
      
      if (data.status === 'success') {
        const logosData = data.data;
        
        // ✅ CORRECCIÓN: Procesar correctamente la estructura de datos
        // El backend devuelve: { principal: {...}, login: {...}, sidebar: {...} }
        // Donde "principal" en realidad viene de "general" en el backend
        const processedLogos = {
          principal: logosData.principal ? {
            id: logosData.principal.logo_id,
            url: logosData.principal.logo_url_completa,
            nombre: logosData.principal.logo_nombre,
            activo: logosData.principal.logo_activo,
            logo_tamaño_formateado: logosData.principal.logo_tamaño_formateado,
            logo_dimensiones: logosData.principal.logo_dimensiones
          } : {
            id: 1,
            url: '/storage/logos/general/logo-default.png',
            nombre: 'COAC PRINCIPAL',
            activo: true
          },
          
          login: logosData.login ? {
            id: logosData.login.logo_id,
            url: logosData.login.logo_url_completa,
            nombre: logosData.login.logo_nombre,
            activo: logosData.login.logo_activo,
            logo_tamaño_formateado: logosData.login.logo_tamaño_formateado,
            logo_dimensiones: logosData.login.logo_dimensiones
          } : null,
          
          sidebar: logosData.sidebar ? {
            id: logosData.sidebar.logo_id,
            url: logosData.sidebar.logo_url_completa,
            nombre: logosData.sidebar.logo_nombre,
            activo: logosData.sidebar.logo_activo,
            logo_tamaño_formateado: logosData.sidebar.logo_tamaño_formateado,
            logo_dimensiones: logosData.sidebar.logo_dimensiones
          } : null
        };

        console.log('✅ LogoContext - Logos procesados:', processedLogos);
        setLogoData(processedLogos);
        setIsInitialized(true);
      }
      
    } catch (error) {
      console.error('❌ LogoContext - Error al cargar logos públicamente:', error);
      setError(error.message);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken]);

  // Función para cargar logos con autenticación
  const loadLogosWithAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        console.log('⚠️ LogoContext - No hay token, usando carga pública...');
        return await loadLogosPublic();
      }
      
      console.log('🎨 LogoContext - Cargando logos con autenticación...');
      console.log('🔑 LogoContext - Token a usar:', token.substring(0, 20) + '...');
      
      const response = await fetch('/api/logos/by-ubicacion', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 LogoContext - Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ LogoContext - Error en respuesta autenticada:', errorData);
        
        if (response.status === 401) {
          console.log('🔑 LogoContext - Token inválido, intentando carga pública...');
          return await loadLogosPublic();
        }
        
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        const logosData = data.data;
        
        // ✅ CORRECCIÓN: Misma lógica que loadLogosPublic
        const processedLogos = {
          principal: logosData.principal ? {
            id: logosData.principal.logo_id,
            url: logosData.principal.logo_url_completa,
            nombre: logosData.principal.logo_nombre,
            activo: logosData.principal.logo_activo,
            logo_tamaño_formateado: logosData.principal.logo_tamaño_formateado,
            logo_dimensiones: logosData.principal.logo_dimensiones
          } : {
            id: 1,
            url: '/storage/logos/general/logo-default.png',
            nombre: 'COAC PRINCIPAL',
            activo: true
          },
          
          login: logosData.login ? {
            id: logosData.login.logo_id,
            url: logosData.login.logo_url_completa,
            nombre: logosData.login.logo_nombre,
            activo: logosData.login.logo_activo,
            logo_tamaño_formateado: logosData.login.logo_tamaño_formateado,
            logo_dimensiones: logosData.login.logo_dimensiones
          } : null,
          
          sidebar: logosData.sidebar ? {
            id: logosData.sidebar.logo_id,
            url: logosData.sidebar.logo_url_completa,
            nombre: logosData.sidebar.logo_nombre,
            activo: logosData.sidebar.logo_activo,
            logo_tamaño_formateado: logosData.sidebar.logo_tamaño_formateado,
            logo_dimensiones: logosData.sidebar.logo_dimensiones
          } : null
        };

        setLogoData(processedLogos);
        setIsInitialized(true);
        
        console.log('✅ LogoContext - Logos cargados con autenticación:', processedLogos);
      }
      
    } catch (error) {
      console.error('❌ LogoContext - Error al cargar logos con auth:', error);
      console.log('🔄 LogoContext - Fallback a carga pública...');
      await loadLogosPublic();
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken, loadLogosPublic]);

  // ✅ Función unificada para recargar logos
  const reloadLogos = useCallback(async () => {
    const token = getAuthToken();
    if (token) {
      await loadLogosWithAuth();
    } else {
      await loadLogosPublic();
    }
  }, [getAuthToken, loadLogosWithAuth, loadLogosPublic]);

  // ✅ FUNCIÓN CORREGIDA para realizar peticiones autenticadas
  const apiRequest = useCallback(async (url, options = {}) => {
    const token = getAuthToken();
    
    console.log('🔑 LogoContext - Token disponible:', !!token);
    console.log('🌐 LogoContext - URL solicitada:', url);
    
    if (!token) {
      console.error('❌ LogoContext - No hay token disponible');
      
      const errorMessage = `No se encontró token de autenticación. 

Posibles causas:
1. La sesión ha expirado - Vuelva a iniciar sesión
2. El token se almacenó con una clave diferente
3. Hay un problema con el sistema de autenticación

Información técnica:
- Buscando con clave: "auth_token" (principal)
- Claves alternativas verificadas: token, access_token, user_token
- Verifique que haya iniciado sesión correctamente`;
      
      throw new Error(errorMessage);
    }
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };

    // ✅ CORRECCIÓN: No agregar Content-Type para FormData
    if (!(options.body instanceof FormData)) {
      defaultOptions.headers['Content-Type'] = 'application/json';
    }

    console.log('📡 LogoContext - Enviando petición con headers:', {
      ...defaultOptions.headers,
      Authorization: `Bearer ${token.substring(0, 20)}...` // Log parcial del token
    });

    const response = await fetch(`/api${url}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });

    console.log('📥 LogoContext - Respuesta recibida:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ LogoContext - Error en respuesta:', errorData);
      
      if (response.status === 401) {
        console.log('🔑 LogoContext - Token inválido o expirado');
        throw new Error('Sesión expirada. Por favor, vuelva a iniciar sesión.');
      }
      
      // ✅ MEJORAR manejo de errores del servidor
      const errorMessage = errorData.message || errorData.errors || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  }, [getAuthToken]);

  // ✅ FUNCIÓN UPLOADLOGO COMPLETAMENTE CORREGIDA
  const uploadLogo = useCallback(async (file, ubicacion = 'general', options = {}) => {
    try {
      console.log('📤 LogoContext - Iniciando subida de logo:', { 
        file: file.name, 
        ubicacion,
        size: file.size,
        type: file.type
      });

      if (!file) {
        throw new Error('No se ha seleccionado ningún archivo');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no permitido. Use JPEG, PNG, GIF o WebP');
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. Máximo 2MB');
      }

      // ✅ Crear FormData correctamente
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('ubicacion', ubicacion);
      formData.append('establecer_principal', 'true');
      
      if (options.nombre) {
        formData.append('nombre', options.nombre);
      }
      
      if (options.descripcion) {
        formData.append('descripcion', options.descripcion);
      }

      console.log('📝 LogoContext - FormData creado:', {
        ubicacion,
        establecer_principal: 'true',
        nombre: options.nombre,
        descripcion: options.descripcion
      });

      // ✅ CORRECCIÓN CRÍTICA: Usar la ruta correcta
      const response = await apiRequest('/logos/upload', {
        method: 'POST',
        body: formData
        // ✅ IMPORTANTE: No incluir Content-Type para FormData
      });

      console.log('📥 LogoContext - Respuesta de subida:', response);

      if (response.status === 'success') {
        const nuevoLogo = response.data;
        
        // ✅ CORRECCIÓN CRÍTICA: Actualizar el estado INMEDIATAMENTE con la nueva imagen
        const logoActualizado = {
          id: nuevoLogo.logo_id,
          url: nuevoLogo.logo_url_completa,
          nombre: nuevoLogo.logo_nombre,
          activo: nuevoLogo.logo_activo,
          logo_tamaño_formateado: nuevoLogo.logo_tamaño_formateado,
          logo_dimensiones: nuevoLogo.logo_dimensiones,
          principal: nuevoLogo.logo_principal
        };

        // ✅ ACTUALIZACIÓN INMEDIATA DEL ESTADO
        setLogoData(prev => {
          const newState = {
            ...prev,
            [ubicacion]: logoActualizado
          };
          console.log('🔄 LogoContext - Estado actualizado inmediatamente:', newState);
          return newState;
        });

        console.log('✅ LogoContext - Logo subido exitosamente:', logoActualizado);
        
        // ✅ RECARGAR LOGOS EN SEGUNDO PLANO
        setTimeout(async () => {
          console.log('🔄 LogoContext - Recargando logos en segundo plano...');
          try {
            const token = getAuthToken();
            if (token) {
              await loadLogosWithAuth();
            } else {
              await loadLogosPublic();
            }
          } catch (reloadError) {
            console.warn('⚠️ Error al recargar logos en segundo plano:', reloadError);
            // No hacer nada, el estado ya está actualizado
          }
        }, 10000);
        
        return logoActualizado;
      } else {
        throw new Error(response.message || 'Error desconocido al subir logo');
      }

    } catch (error) {
      console.error('❌ LogoContext - Error al subir logo:', error);
      setError(error.message);
      throw error;
    }
  }, [apiRequest, getAuthToken, loadLogosWithAuth, loadLogosPublic]);

  // Eliminar logo (requiere autenticación)
  const deleteLogo = useCallback(async (logoId, ubicacion = 'general') => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🗑️ LogoContext - Eliminando logo:', { logoId, ubicacion });

      const response = await apiRequest(`/logos/${logoId}`, {
        method: 'DELETE'
      });

      if (response.status === 'success') {
        await reloadLogos();
        console.log('✅ LogoContext - Logo eliminado exitosamente');
      }

    } catch (error) {
      console.error('❌ LogoContext - Error al eliminar logo:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apiRequest, reloadLogos]);

  // Establecer logo como principal (requiere autenticación)
  const setPrincipal = useCallback(async (logoId, ubicacion = 'general') => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('⭐ LogoContext - Estableciendo logo como principal:', { logoId, ubicacion });

      const response = await apiRequest(`/logos/${logoId}/set-principal`, {
        method: 'POST'
      });

      if (response.status === 'success') {
        await reloadLogos();
        console.log('✅ LogoContext - Logo establecido como principal');
      }

    } catch (error) {
      console.error('❌ LogoContext - Error al establecer logo principal:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apiRequest, reloadLogos]);

  // Obtener logo por ubicación
  const getLogo = useCallback((ubicacion = 'principal') => {
    const logo = logoData[ubicacion];
    if (!logo) {
      return logoData.principal;
    }
    return logo;
  }, [logoData]);

  // Obtener URL del logo
  const getLogoUrl = useCallback((ubicacion = 'principal') => {
    const logo = getLogo(ubicacion);
    return logo?.url || '/storage/logos/general/logo-default.png';
  }, [getLogo]);

  // Obtener configuración de logos (requiere autenticación)
  const getConfig = useCallback(async () => {
    try {
      const response = await apiRequest('/logos/config');
      return response.data;
    } catch (error) {
      console.error('❌ LogoContext - Error al obtener configuración:', error);
      return {};
    }
  }, [apiRequest]);

  // ✅ Cargar logos al inicializar
  useEffect(() => {
    let mounted = true;

    const initializeLogos = async () => {
      console.log('🚀 LogoContext - Inicializando carga de logos...');
      
      try {
        if (mounted) {
          await loadLogosPublic();
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ LogoContext - Error en inicialización:', error);
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    };

    initializeLogos();

    return () => {
      mounted = false;
    };
  }, [loadLogosPublic]);

  // ✅ ESCUCHAR CAMBIOS EN EL TOKEN (usando la clave correcta)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token' && e.newValue) {
        console.log('🔑 LogoContext - Token "auth_token" detectado, actualizando a versión autenticada...');
        setTimeout(() => {
          loadLogosWithAuth();
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadLogosWithAuth]);

  // Limpiar errores automáticamente
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  const value = {
    // Estados
    logoData,
    isLoading,
    isInitialized,
    error,
    
    // Métodos
    uploadLogo,
    deleteLogo,
    setPrincipal,
    getLogo,
    getLogoUrl,
    getConfig,
    reloadLogos
  };

  return (
    <LogoContext.Provider value={value}>
      {children}
    </LogoContext.Provider>
  );
};