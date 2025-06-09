// src/hooks/useButtonPermissions.js - COMPLETAMENTE CORREGIDO
import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../services/apiService';

/**
 * Hook personalizado para manejar permisos de botones CRUD
 * @param {number} menuId - ID del menú para verificar permisos (para ventanas directas)
 * @param {number} opcionId - ID de la opción para verificar permisos (para opciones regulares)
 * @param {boolean} autoLoad - Si debe cargar automáticamente los permisos (default: true)
 * @param {'menu'|'option'} type - Tipo de consulta: 'menu' para ventanas directas, 'option' para opciones
 * @returns {object} - Estados y funciones para manejar permisos de botones
 */
export const useButtonPermissions = (menuId, opcionId = null, autoLoad = true, type = 'menu') => {
  // ===== ESTADOS =====
  const [buttonPermissions, setButtonPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Determinar el ID a usar según el tipo
  const targetId = type === 'menu' ? menuId : opcionId;

  // ===== CARGAR PERMISOS =====
  const loadButtonPermissions = useCallback(async () => {
    if (!targetId) {
      console.log('❌ Hook: No hay targetId para cargar permisos');
      setButtonPermissions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Hook: Cargando permisos de botones para ${type}:`, targetId);
      
      let result;
      if (type === 'menu') {
        result = await adminService.buttonUtils.getMyMenuButtonPermissions(targetId);
      } else {
        result = await adminService.buttonUtils.getMyButtonPermissions(targetId);
      }
      
      if (result.status === 'success') {
        console.log('✅ Hook: Permisos cargados:', result.data);
        setButtonPermissions(result.data || []);
        setLastFetch(new Date());
        
        // ✅ DEBUG: Verificar permisos específicos después de cargar
        console.log('✅ canCreate:', result.data?.find(btn => btn.bot_codigo === 'CREATE')?.has_permission || false);
        console.log('✅ canRead:', result.data?.find(btn => btn.bot_codigo === 'READ')?.has_permission || false);
        console.log('✅ canUpdate:', result.data?.find(btn => btn.bot_codigo === 'UPDATE')?.has_permission || false);
        console.log('❌ canDelete:', result.data?.find(btn => btn.bot_codigo === 'DELETE')?.has_permission || false);
      } else {
        console.log('❌ Hook: Error en respuesta:', result);
        setError('Error al cargar permisos de botones');
        setButtonPermissions([]);
      }
    } catch (err) {
      console.error('❌ Hook: Error loading button permissions:', err);
      setError(err.message || 'Error al cargar permisos de botones');
      setButtonPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [targetId, type]);

  // ===== EFECTOS =====
  useEffect(() => {
    if (autoLoad && targetId && !lastFetch) {
      loadButtonPermissions();
    }
  }, [autoLoad, targetId, loadButtonPermissions, lastFetch]);

  // ===== FUNCIONES UTILITARIAS MEMOIZADAS =====
  
  // Verificar si tiene permiso para un botón específico
  const hasButtonPermission = useCallback((buttonCode) => {
    if (!buttonCode || !Array.isArray(buttonPermissions)) return false;
    
    const permission = buttonPermissions.find(btn => btn.bot_codigo === buttonCode);
    const hasPermission = permission?.has_permission === true;
    
    // Solo logear si no es PRINT para evitar spam
    if (buttonCode !== 'PRINT') {
      console.log(`🔍 Hook: Verificando permiso ${buttonCode}:`, hasPermission, permission);
    }
    return hasPermission;
  }, [buttonPermissions]);

  // Obtener información de un botón específico
  const getButtonInfo = useCallback((buttonCode) => {
    if (!buttonCode || !Array.isArray(buttonPermissions)) return null;
    
    const permission = buttonPermissions.find(btn => btn.bot_codigo === buttonCode);
    return permission?.has_permission ? permission : null;
  }, [buttonPermissions]);

  // Función para refrescar permisos
  const refreshPermissions = useCallback(() => {
    if (targetId) {
      setLastFetch(null);
      loadButtonPermissions();
    }
  }, [loadButtonPermissions, targetId]);

  // Obtener todos los botones permitidos
  const getAllowedButtons = useCallback(() => {
    if (!Array.isArray(buttonPermissions)) return [];
    
    return buttonPermissions.filter(btn => btn.has_permission === true);
  }, [buttonPermissions]);

  // ✅ CORRECCIÓN: Verificar permisos para operaciones CRUD comunes (códigos en mayúsculas)
  const canCreate = useMemo(() => hasButtonPermission('CREATE'), [hasButtonPermission]);
  const canRead = useMemo(() => hasButtonPermission('READ') || hasButtonPermission('READ'), [hasButtonPermission]);
  const canUpdate = useMemo(() => hasButtonPermission('UPDATE'), [hasButtonPermission]);
  const canDelete = useMemo(() => hasButtonPermission('DELETE'), [hasButtonPermission]);
  const canExport = useMemo(() => hasButtonPermission('EXPORT'), [hasButtonPermission]);
  const canSearch = useMemo(() => hasButtonPermission('SEARCH'), [hasButtonPermission]);
  const canRefresh = useMemo(() => hasButtonPermission('REFRESH'), [hasButtonPermission]);

  // Obtener botones organizados por categoría
  const buttonsByCategory = useMemo(() => {
    const categories = {
      crud: [],
      utility: [],
      navigation: [],
      permissions: [],
      other: []
    };

    const allowedButtons = getAllowedButtons();

    allowedButtons.forEach(button => {
      const code = button.bot_codigo;
      
      if (['CREATE', 'read', 'UPDATE', 'DELETE'].includes(code)) {
        categories.crud.push(button);
      } else if (['EXPORT', 'PRINT', 'DUPLICATE'].includes(code)) {
        categories.utility.push(button);
      } else if (['SEARCH', 'REFRESH', 'BACK'].includes(code)) {
        categories.navigation.push(button);
      } else if (['ASSIGN_PERMISSIONS', 'COPY_PERMISSIONS'].includes(code)) {
        categories.permissions.push(button);
      } else {
        categories.other.push(button);
      }
    });

    return categories;
  }, [getAllowedButtons]);

  // Verificar si el usuario puede realizar acciones masivas
  const canPerformBulkActions = useMemo(() => {
    return canDelete || canUpdate || hasButtonPermission('TOGGLE');
  }, [canDelete, canUpdate, hasButtonPermission]);

  // ===== FUNCIÓN PARA VERIFICAR PERMISO ESPECÍFICO =====
  const checkButtonPermission = useCallback(async (buttonCode) => {
    if (!targetId) return false;

    try {
      if (type === 'menu') {
        return await adminService.buttonUtils.checkMenuButtonPermission(targetId, buttonCode);
      } else {
        return await adminService.buttonUtils.checkButtonPermission(targetId, buttonCode);
      }
    } catch (error) {
      console.error('Error checking button permission:', error);
      return false;
    }
  }, [targetId, type]);

  // Funciones para verificar múltiples permisos
  const hasAnyPermission = useCallback((buttonCodes = []) => {
    if (!Array.isArray(buttonCodes) || buttonCodes.length === 0) return false;
    return buttonCodes.some(code => hasButtonPermission(code));
  }, [hasButtonPermission]);

  const hasAllPermissions = useCallback((buttonCodes = []) => {
    if (!Array.isArray(buttonCodes) || buttonCodes.length === 0) return false;
    return buttonCodes.every(code => hasButtonPermission(code));
  }, [hasButtonPermission]);

  // Estadísticas mejoradas
  const permissionStats = useMemo(() => {
    const total = buttonPermissions.length;
    const allowed = getAllowedButtons().length;
    const denied = total - allowed;
    
    return {
      total,
      allowed,
      denied,
      hasAnyPermission: allowed > 0,
      isEmpty: total === 0
    };
  }, [buttonPermissions, getAllowedButtons]);

  // ===== RETURN DEL HOOK =====
  return {
    // Estados principales
    buttonPermissions,
    loading,
    error,
    lastFetch,

    // Compatibilidad con DynamicActionButtons
    permissions: buttonPermissions, // Alias para DynamicActionButtons
    isReady: !loading && !error && lastFetch !== null,

    // Funciones principales
    loadButtonPermissions,
    refreshPermissions,
    hasButtonPermission,
    getButtonInfo,
    checkButtonPermission,
    getAllowedButtons,

    // Funciones para verificación múltiple
    hasAnyPermission,
    hasAllPermissions,

    // Permisos CRUD específicos
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    canSearch,
    canRefresh,

    // Datos organizados
    buttonsByCategory,
    canPerformBulkActions,

    // Estadísticas mejoradas
    stats: permissionStats,
    totalButtons: buttonPermissions.length,
    hasCrudPermissions: canCreate || canRead || canUpdate || canDelete,
    hasUtilityPermissions: canExport || hasButtonPermission('PRINT'),
    
    // Helper para logs de debug
    debugInfo: {
      targetId,
      type,
      totalPermissions: buttonPermissions.length,
      allowedPermissions: getAllowedButtons().length,
      availableButtons: buttonPermissions.map(btn => btn.bot_codigo),
      allowedButtons: getAllowedButtons().map(btn => btn.bot_codigo),
      loading,
      error,
      lastFetch,
      autoLoad
    }
  };
};