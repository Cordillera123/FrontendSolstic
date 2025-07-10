// src/context/LogoContext.jsx - COMPLETAMENTE CORREGIDO CON URLs DE IMÁGENES
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LogoContext = createContext();

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo debe ser usado dentro de un LogoProvider');
  }
  return context;
};

// ✅ CONFIGURACIÓN DE URLs DEL BACKEND
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const STORAGE_BASE_URL = 'http://127.0.0.1:8000/storage';

// ✅ FUNCIÓN HELPER para procesar URLs de imágenes
const processImageUrl = (url) => {
  if (!url) return `${STORAGE_BASE_URL}/logos/general/logo-default.png`;
  if (url.startsWith('http')) return url; // Ya es URL completa
  if (url.startsWith('/storage/')) return `http://127.0.0.1:8000${url}`;
  if (url.startsWith('storage/')) return `http://127.0.0.1:8000/${url}`;
  return `${STORAGE_BASE_URL}/${url}`;
};

export const LogoProvider = ({ children }) => {
  const [logoData, setLogoData] = useState({
    principal: {
      id: 1,
      url: `${STORAGE_BASE_URL}/logos/general/logo-default.png`, // ✅ URL COMPLETA
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
      
      // ✅ CORRECCIÓN: URL COMPLETA DEL BACKEND
      const response = await fetch(`${API_BASE_URL}/logos/by-ubicacion`, {
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
      
      if (data.status === 'success') {
        const logosData = data.data;
        
        const processedLogos = {
          principal: logosData.general ? {
            id: logosData.general.logo_id,
            url: processImageUrl(logosData.general.logo_url_completa || logosData.general.logo_url), // ✅ PROCESAR URL
            nombre: logosData.general.logo_nombre,
            activo: logosData.general.logo_activo
          } : logoData.principal,
          
          login: logosData.login ? {
            id: logosData.login.logo_id,
            url: processImageUrl(logosData.login.logo_url_completa || logosData.login.logo_url), // ✅ PROCESAR URL
            nombre: logosData.login.logo_nombre,
            activo: logosData.login.logo_activo
          } : (logosData.general ? {
            id: logosData.general.logo_id,
            url: processImageUrl(logosData.general.logo_url_completa || logosData.general.logo_url), // ✅ PROCESAR URL
            nombre: logosData.general.logo_nombre,
            activo: logosData.general.logo_activo
          } : logoData.principal),
          
          sidebar: logosData.sidebar ? {
            id: logosData.sidebar.logo_id,
            url: processImageUrl(logosData.sidebar.logo_url_completa || logosData.sidebar.logo_url), // ✅ PROCESAR URL
            nombre: logosData.sidebar.logo_nombre,
            activo: logosData.sidebar.logo_activo
          } : (logosData.general ? {
            id: logosData.general.logo_id,
            url: processImageUrl(logosData.general.logo_url_completa || logosData.general.logo_url), // ✅ PROCESAR URL
            nombre: logosData.general.logo_nombre,
            activo: logosData.general.logo_activo
          } : logoData.principal)
        };

        setLogoData(processedLogos);
        setIsInitialized(true);
        
        console.log('✅ LogoContext - Logos cargados públicamente:', processedLogos);
      }
      
    } catch (error) {
      console.error('❌ LogoContext - Error al cargar logos públicamente:', error);
      setError(error.message);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [logoData.principal, getAuthToken]);

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
      
      // ✅ CORRECCIÓN: URL COMPLETA DEL BACKEND
      const response = await fetch(`${API_BASE_URL}/logos/by-ubicacion`, {
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
        
        const processedLogos = {
          principal: logosData.general ? {
            id: logosData.general.logo_id,
            url: processImageUrl(logosData.general.logo_url_completa || logosData.general.logo_url), // ✅ PROCESAR URL
            nombre: logosData.general.logo_nombre,
            activo: logosData.general.logo_activo
          } : logoData.principal,
          
          login: logosData.login ? {
            id: logosData.login.logo_id,
            url: processImageUrl(logosData.login.logo_url_completa || logosData.login.logo_url), // ✅ PROCESAR URL
            nombre: logosData.login.logo_nombre,
            activo: logosData.login.logo_activo
          } : (logosData.general ? {
            id: logosData.general.logo_id,
            url: processImageUrl(logosData.general.logo_url_completa || logosData.general.logo_url), // ✅ PROCESAR URL
            nombre: logosData.general.logo_nombre,
            activo: logosData.general.logo_activo
          } : logoData.principal),
          
          sidebar: logosData.sidebar ? {
            id: logosData.sidebar.logo_id,
            url: processImageUrl(logosData.sidebar.logo_url_completa || logosData.sidebar.logo_url), // ✅ PROCESAR URL
            nombre: logosData.sidebar.logo_nombre,
            activo: logosData.sidebar.logo_activo
          } : (logosData.general ? {
            id: logosData.general.logo_id,
            url: processImageUrl(logosData.general.logo_url_completa || logosData.general.logo_url), // ✅ PROCESAR URL
            nombre: logosData.general.logo_nombre,
            activo: logosData.general.logo_activo
          } : logoData.principal)
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
  }, [getAuthToken, loadLogosPublic, logoData.principal]);

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
      
      // ✅ MENSAJE DE ERROR MÁS ESPECÍFICO
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

    if (!(options.body instanceof FormData)) {
      defaultOptions.headers['Content-Type'] = 'application/json';
    }

    console.log('📡 LogoContext - Enviando petición con headers:', {
      ...defaultOptions.headers,
      Authorization: `Bearer ${token.substring(0, 20)}...` // Log parcial del token
    });

    // ✅ CORRECCIÓN: URL COMPLETA DEL BACKEND
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...defaultOptions,
      ...options
    });

    console.log('📥 LogoContext - Respuesta recibida:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ LogoContext - Error en respuesta:', errorData);
      
      if (response.status === 401) {
        console.log('🔑 LogoContext - Token inválido o expirado');
        throw new Error('Sesión expirada. Por favor, vuelva a iniciar sesión.');
      }
      
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }, [getAuthToken]);

  // Subir nuevo logo (requiere autenticación)
 // src/context/LogoContext.jsx - VERSIÓN CON DEBUG MEJORADO
// Solo reemplaza la función uploadLogo con esta versión para debug

// SOLO REEMPLAZA LA FUNCIÓN uploadLogo en tu LogoContext.jsx con esta versión DEBUG

const uploadLogo = useCallback(async (file, ubicacion = 'general', options = {}) => {
  try {
    setIsLoading(true);
    setError(null);

    console.log('📤 LogoContext - DEBUG - Datos de subida:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      ubicacion: ubicacion,
      options: options
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

    // SOLO REEMPLAZA estas líneas en tu función uploadLogo:

const formData = new FormData();
formData.append('logo', file);
formData.append('ubicacion', ubicacion);
// ✅ CORRECCIÓN: Usar '1' en lugar de 'true' para booleanos en FormData
formData.append('establecer_principal', '1'); // Laravel interpreta '1' como true

if (options.nombre) {
  formData.append('nombre', options.nombre);
}

if (options.descripcion) {
  formData.append('descripcion', options.descripcion);
}

    // ✅ DEBUG: Mostrar exactamente qué se está enviando
    console.log('📤 LogoContext - DEBUG - FormData a enviar:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size}bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    // ✅ NUEVA FUNCIÓN DEBUG: Hacer petición manual para ver errores detallados
    const token = getAuthToken();
    console.log('🔑 LogoContext - DEBUG - Token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

    const response = await fetch(`${API_BASE_URL}/logos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
        // ✅ NO agregar Content-Type para FormData - el navegador lo hace automáticamente
      },
      body: formData
    });

    console.log('📥 LogoContext - DEBUG - Respuesta status:', response.status);
    console.log('📥 LogoContext - DEBUG - Respuesta headers:', Object.fromEntries(response.headers));

    // ✅ CRÍTICO: Leer la respuesta como texto primero para debugging
    const responseText = await response.text();
    console.log('📥 LogoContext - DEBUG - Respuesta RAW:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('📥 LogoContext - DEBUG - Respuesta JSON:', data);
    } catch (parseError) {
      console.error('❌ LogoContext - DEBUG - Error parsing JSON:', parseError);
      throw new Error(`Respuesta inválida del servidor: ${responseText}`);
    }

    if (!response.ok) {
      console.error('❌ LogoContext - DEBUG - Error response status:', response.status);
      console.error('❌ LogoContext - DEBUG - Error data:', data);
      
      // ✅ MOSTRAR ERRORES ESPECÍFICOS DE VALIDACIÓN
      if (data && data.errors) {
        console.error('❌ LogoContext - DEBUG - Errores de validación específicos:');
        Object.keys(data.errors).forEach(field => {
          console.error(`  ${field}:`, data.errors[field]);
        });
        
        // Crear mensaje de error detallado
        const errorMessages = Object.keys(data.errors).map(field => {
          return `${field}: ${data.errors[field].join(', ')}`;
        }).join('\n');
        
        throw new Error(`Errores de validación:\n${errorMessages}`);
      }
      
      throw new Error(data?.message || `Error ${response.status}: ${response.statusText}`);
    }

    console.log('✅ LogoContext - DEBUG - Respuesta exitosa:', data);

    if (data.status === 'success') {
      const nuevoLogo = data.data;
      
      setLogoData(prev => ({
        ...prev,
        [ubicacion]: {
          id: nuevoLogo.logo_id,
          url: processImageUrl(nuevoLogo.logo_url_completa || nuevoLogo.logo_url),
          nombre: nuevoLogo.logo_nombre,
          activo: nuevoLogo.logo_activo,
          principal: nuevoLogo.logo_principal
        }
      }));

      console.log('✅ LogoContext - Logo subido exitosamente:', nuevoLogo);
      return nuevoLogo;
    } else {
      throw new Error(data?.message || 'Respuesta exitosa pero sin datos válidos');
    }

  } catch (error) {
    console.error('❌ LogoContext - DEBUG - Error completo:', error);
    console.error('❌ LogoContext - DEBUG - Error.message:', error.message);
    console.error('❌ LogoContext - DEBUG - Error.stack:', error.stack);
    
    setError(error.message);
    throw error;
  } finally {
    setIsLoading(false);
  }
}, [apiRequest, getAuthToken, processImageUrl]);

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

  // ✅ FUNCIÓN CORREGIDA: Obtener URL del logo con URLs completas
  const getLogoUrl = useCallback((ubicacion = 'principal') => {
    const logo = getLogo(ubicacion);
    const url = logo?.url || `${STORAGE_BASE_URL}/logos/general/logo-default.png`;
    return processImageUrl(url); // ✅ ASEGURAR URL COMPLETA
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
      // ✅ CORRECCIÓN: Escuchar cambios en "auth_token" en lugar de "token"
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
    reloadLogos,
    
    // ✅ NUEVOS HELPERS
    processImageUrl, // Exponer la función helper para uso externo si es necesario
  };

  return (
    <LogoContext.Provider value={value}>
      {children}
    </LogoContext.Provider>
  );
};