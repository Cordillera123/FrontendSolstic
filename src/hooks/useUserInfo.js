// hooks/useUserInfo.js - CORREGIDO para evitar bucle infinito
import { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../services/apiService';

/**
 * Hook personalizado para obtener información del usuario logueado
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoLoad - Cargar automáticamente al montar (default: true)
 * @param {boolean} options.basicOnly - Solo información básica (default: true, más rápido)
 * @param {number} options.refreshInterval - Intervalo de actualización en ms (opcional)
 */
export const useUserInfo = (options = {}) => {
  const {
    autoLoad = true,
    basicOnly = true,
    refreshInterval = null
  } = options;

  // Estados
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ✅ NUEVO: Ref para evitar múltiples llamadas
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // ✅ CORREGIR: Función para obtener información del usuario SIN dependencias problemáticas
  const fetchUserInfo = useCallback(async (showLoading = true) => {
    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      console.log('⚠️ useUserInfo - Llamada ya en progreso, ignorando...');
      return;
    }

    try {
      isLoadingRef.current = true;
      
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log('🔍 useUserInfo - Obteniendo información del usuario...');
      
      const result = basicOnly 
        ? await adminService.usuarios.getMeResumen()
        : await adminService.usuarios.getMe();

      if (result.status === 'success') {
        console.log('✅ useUserInfo - Información obtenida:', result.data);
        setUserInfo(result.data);
        setLastUpdated(new Date());
        hasLoadedRef.current = true;
      } else {
        throw new Error(result.message || 'Error al obtener información del usuario');
      }

    } catch (err) {
      console.error('❌ useUserInfo - Error:', err);
      const errorMessage = err.message || 'Error al obtener información del usuario';
      setError(errorMessage);
      
      // ✅ SOLO establecer fallback si no tenemos datos previos
      if (!userInfo) {
        setUserInfo({
          nombre_usuario: 'Usuario',
          email: '',
          perfil: 'Sin perfil',
          institucion: { nombre: 'Sin institución', codigo: null },
          oficina: { nombre: 'Sin oficina', codigo: null, tipo: '', completa: 'Sin oficina asignada' },
          tiene_oficina: false,
          ubicacion_laboral: 'Sin ubicación asignada'
        });
      }
    } finally {
      isLoadingRef.current = false;
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [basicOnly]); // ✅ SOLO basicOnly como dependencia

  // ✅ CORREGIR: Función para obtener solo institución
  const fetchInstitucion = useCallback(async () => {
    try {
      console.log('🔍 useUserInfo - Obteniendo solo institución...');
      const result = await adminService.usuarios.getMeInstitucion();
      
      if (result.status === 'success') {
        setUserInfo(prev => ({
          ...prev,
          institucion: {
            nombre: (result.data.instit_nombre || 'Sin institución').trim(),
            codigo: result.data.instit_codigo || null
          }
        }));
        return result.data;
      }
      
      throw new Error(result.message);
    } catch (err) {
      console.error('❌ useUserInfo - Error obteniendo institución:', err);
      throw err;
    }
  }, []); // ✅ Sin dependencias

  // ✅ CORREGIR: Función para obtener solo oficina
  const fetchOficina = useCallback(async () => {
    try {
      console.log('🔍 useUserInfo - Obteniendo solo oficina...');
      const result = await adminService.usuarios.getMeOficina();
      
      if (result.status === 'success') {
        setUserInfo(prev => ({
          ...prev,
          oficina: {
            nombre: (result.data.oficin_nombre || 'Sin oficina').trim(),
            codigo: result.data.oficin_codigo || null,
            tipo: (result.data.tipo_oficina || '').trim(),
            completa: (result.data.oficina_completa || 'Sin oficina asignada').trim()
          },
          tiene_oficina: !!result.data.oficin_codigo,
          ubicacion_laboral: (result.data.oficina_completa || 'Sin ubicación asignada').trim()
        }));
        return result.data;
      }
      
      throw new Error(result.message);
    } catch (err) {
      console.error('❌ useUserInfo - Error obteniendo oficina:', err);
      throw err;
    }
  }, []); // ✅ Sin dependencias

  // ✅ CORREGIR: Función para refrescar información
  const refresh = useCallback(async () => {
    console.log('🔄 useUserInfo - Refrescando información...');
    await fetchUserInfo(false); // No mostrar loading en refresh
  }, [fetchUserInfo]);

  // ✅ CORREGIR: Efecto para carga automática (SIN DEPENDENCIAS PROBLEMÁTICAS)
  useEffect(() => {
    if (autoLoad && !hasLoadedRef.current && !isLoadingRef.current) {
      console.log('🚀 useUserInfo - Carga inicial automática');
      fetchUserInfo();
    }
  }, [autoLoad]); // ✅ SOLO autoLoad como dependencia

  // ✅ MANTENER: Efecto para actualización automática
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      console.log(`⏰ useUserInfo - Configurando auto-refresh cada ${refreshInterval}ms`);
      const interval = setInterval(() => {
        if (!isLoadingRef.current) {
          refresh();
        }
      }, refreshInterval);
      return () => {
        console.log('⏰ useUserInfo - Limpiando auto-refresh');
        clearInterval(interval);
      };
    }
  }, [refreshInterval, refresh]);

  // ✅ NUEVO: Limpiar refs al desmontar
  useEffect(() => {
    return () => {
      isLoadingRef.current = false;
      hasLoadedRef.current = false;
    };
  }, []);

  // Funciones de utilidad (memoizadas para evitar re-renders)
  const hasOffice = userInfo?.tiene_oficina || false;
  const hasInstitution = !!(userInfo?.institucion?.codigo);
  const fullLocation = userInfo?.ubicacion_laboral || 'Sin ubicación asignada';
  const displayName = userInfo?.nombre_usuario || 'Usuario';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return {
    // Datos principales
    userInfo,
    loading,
    error,
    lastUpdated,

    // Funciones
    fetchUserInfo,
    fetchInstitucion,
    fetchOficina,
    refresh,

    // Utilidades
    hasOffice,
    hasInstitution,
    fullLocation,
    displayName,
    userInitials,

    // Estados derivados para fácil acceso
    institucion: userInfo?.institucion || { nombre: 'Sin institución', codigo: null },
    oficina: userInfo?.oficina || { nombre: 'Sin oficina', codigo: null, tipo: '', completa: 'Sin oficina asignada' },
    perfil: userInfo?.perfil || 'Sin perfil',
    email: userInfo?.email || '',

    // Estado de carga más granular
    isLoading: loading,
    isError: !!error,
    isReady: !loading && !error && !!userInfo,
    isEmpty: !loading && !error && !userInfo
  };
};