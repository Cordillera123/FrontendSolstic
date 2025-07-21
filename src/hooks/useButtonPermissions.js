// src/hooks/useButtonPermissions.js - VERSIÓN CORREGIDA FUNCIONAL

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../services/apiService';

/**
 * ✅ Hook corregido para manejar permisos efectivos (Perfil + Usuario) + Calendario
 * @param {number} targetId - ID del menú o opción 
 * @param {number} opcId - ID de la opción (para compatibilidad)
 * @param {boolean} autoLoad - Si debe cargar automáticamente
 * @param {'menu'|'submenu'|'option'} type - Tipo de consulta
 * @param {number} userId - ID del usuario específico (opcional)
 */
export const useButtonPermissions = (
  targetId,
  opcId = null,
  autoLoad = true,
  type = 'option',
  userId = null
) => {
  // ===== ESTADOS =====
  const [buttonPermissions, setButtonPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // ✅ CORRECCIÓN: Usar la lógica correcta para determinar el ID objetivo
  const effectiveTargetId = useMemo(() => {
    if (type === 'option') {
      return opcId || targetId;
    }
    return targetId;
  }, [targetId, opcId, type]);

  // ===== CARGAR PERMISOS EFECTIVOS =====
  const loadButtonPermissions = useCallback(async () => {
    if (!effectiveTargetId) {
      console.log('❌ Hook: No hay targetId para cargar permisos');
      setButtonPermissions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Hook: Cargando permisos efectivos para ${type}:`, effectiveTargetId, userId ? `(usuario: ${userId})` : '(usuario actual)');

      let result;

      if (userId) {
        // ✅ NUEVO: Cargar permisos para usuario específico
        if (type === 'menu') {
          // Para ventanas directas de menús
          result = await adminService.buttonUtils.getUserMenuPermissions?.(userId, effectiveTargetId) ||
            await adminService.userButtonPermissions.getUserEffectivePermissions(userId, effectiveTargetId);
        } else if (type === 'submenu') {
          // ✅ CORREGIDO: Para submenus de usuario específico
          result = await adminService.buttonUtils.getUserSubmenuPermissions?.(userId, effectiveTargetId) ||
            await adminService.userButtonPermissions.getUserEffectivePermissions(userId, effectiveTargetId);
        } else {
          // Para opciones regulares
          result = await adminService.userButtonPermissions.getUserEffectivePermissions(userId, effectiveTargetId);
        }
        setUserInfo({ userId, isSpecificUser: true });
      } else {
        // ✅ CORREGIDO: Cargar permisos del usuario actual
        if (type === 'menu') {
          result = await adminService.buttonUtils.getMyMenuButtonPermissions(effectiveTargetId);
        } else if (type === 'submenu') {
          // ✅ CORRECCIÓN CRÍTICA: Usar effectiveTargetId en lugar de secondaryId
          result = await adminService.buttonUtils.getMySubmenuAsMenuPermissions?.(effectiveTargetId) ||
            await adminService.buttonUtils.getMyMenuButtonPermissions(effectiveTargetId);
        } else {
          result = await adminService.buttonUtils.getMyButtonPermissions(effectiveTargetId);
        }
        setUserInfo({ userId: 'current', isSpecificUser: false });
      }

      if (result?.status === 'success') {
        // ✅ MEJORADO: Manejar diferentes formatos de respuesta
        let permissions = [];

        if (result.botones_permitidos && Array.isArray(result.botones_permitidos)) {
          // Formato de respuesta del controlador MenuButtonPermissionsController
          permissions = result.botones_permitidos;
        } else if (result.data && Array.isArray(result.data)) {
          // Formato estándar
          permissions = result.data;
        } else if (Array.isArray(result)) {
          // Array directo
          permissions = result;
        }

        console.log('✅ Hook: Permisos efectivos cargados:', {
          total: permissions.length,
          permissions: permissions.map(p => ({
            codigo: p.bot_codigo,
            nombre: p.bot_nom,
            tiene_permiso: p.has_permission
          }))
        });

        setButtonPermissions(permissions);
        setLastFetch(new Date());

        // Debug para permisos CRUD específicos + Calendario
        const debugPermissions = {
          canCreate: permissions.find(btn => btn.bot_codigo === 'CREATE')?.has_permission || false,
          canRead: permissions.find(btn => btn.bot_codigo === 'READ')?.has_permission || false,
          canUpdate: permissions.find(btn => btn.bot_codigo === 'UPDATE')?.has_permission || false,
          canDelete: permissions.find(btn => btn.bot_codigo === 'DELETE')?.has_permission || false,
          canExport: permissions.find(btn => btn.bot_codigo === 'EXPORT')?.has_permission || false,
          // ✅ CRÍTICO: Debug mejorado para calendario
          canViewCalendar: permissions.find(btn => 
            ['CALENDARIO', 'CALENDAR', 'calendario', 'calendar', 'agenda', 'AGENDA'].includes(btn.bot_codigo)
          )?.has_permission || false
        };

        console.log('🔍 Hook: Permisos CRUD + Calendario:', debugPermissions);

        // Log de personalizaciones si es usuario específico
        if (userId) {
          const customized = permissions.filter(btn => btn.is_customized || btn.permission_source === 'usuario');
          if (customized.length > 0) {
            console.log('🎨 Hook: Permisos personalizados:', customized.map(btn => ({
              codigo: btn.bot_codigo,
              fuente: btn.permission_source,
              personalizado: btn.is_customized
            })));
          }
        }
      } else {
        console.log('❌ Hook: Error en respuesta:', result);
        setError(result?.message || 'Error al cargar permisos de botones');
        setButtonPermissions([]);
      }
    } catch (err) {
      console.error('❌ Hook: Error loading button permissions:', err);

      // ✅ MEJORADO: Manejo específico de errores 404
      if (err.response?.status === 404) {
        if (type === 'submenu') {
          setError(`Submenu ${effectiveTargetId} no encontrado o sin permisos configurados`);
        } else if (type === 'menu') {
          setError(`Menú ${effectiveTargetId} no encontrado o no es ventana directa`);
        } else {
          setError(`Opción ${effectiveTargetId} no encontrada`);
        }
      } else {
        setError(err.message || 'Error al cargar permisos de botones');
      }

      setButtonPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveTargetId, type, userId]);

  // ===== EFECTOS =====
  useEffect(() => {
    if (autoLoad && effectiveTargetId) {
      loadButtonPermissions();
    }
  }, [autoLoad, effectiveTargetId, loadButtonPermissions]);

  // Recargar cuando cambie el userId
  useEffect(() => {
    if (effectiveTargetId && userId !== userInfo?.userId) {
      setLastFetch(null);
      loadButtonPermissions();
    }
  }, [userId, effectiveTargetId, loadButtonPermissions, userInfo?.userId]);

  // ===== FUNCIONES UTILITARIAS =====

  /**
   * ✅ CORREGIDO: Verificar permiso con lógica de herencia + soporte calendario
   */
  const hasButtonPermission = useCallback((buttonCode) => {
    if (!buttonCode || !Array.isArray(buttonPermissions)) {
      return false;
    }

    // ✅ NUEVO: Normalizar código de búsqueda (mayúsculas y minúsculas)
    const normalizedCode = buttonCode.toUpperCase();
    const permission = buttonPermissions.find(btn => 
      btn.bot_codigo.toUpperCase() === normalizedCode
    );

    if (!permission) {
      return false;
    }

    // ✅ La lógica de herencia ya está aplicada en el backend
    // has_permission ya incluye: Perfil + Personalización del Usuario
    const hasPermission = permission.has_permission === true;

    // Solo logear para debug (excluir PRINT y REFRESH para evitar spam)
    if (!['PRINT', 'REFRESH'].includes(normalizedCode)) {
      console.log(`🔍 Hook: Permiso ${buttonCode}:`, {
        hasPermission,
        isCustomized: permission.is_customized,
        profilePermission: permission.profile_permission,
        customizationType: permission.customization_type
      });
    }

    return hasPermission;
  }, [buttonPermissions]);

  /**
   * Obtener información completa de un botón
   */
  const getButtonInfo = useCallback((buttonCode) => {
    if (!buttonCode || !Array.isArray(buttonPermissions)) return null;

    const normalizedCode = buttonCode.toUpperCase();
    const permission = buttonPermissions.find(btn => 
      btn.bot_codigo.toUpperCase() === normalizedCode
    );
    return permission || null;
  }, [buttonPermissions]);

  /**
   * ✅ NUEVO: Obtener información de personalización
   */
  const getButtonCustomization = useCallback((buttonCode) => {
    const buttonInfo = getButtonInfo(buttonCode);
    if (!buttonInfo) return null;

    return {
      isCustomized: buttonInfo.is_customized || false,
      customizationType: buttonInfo.customization_type || null,
      profilePermission: buttonInfo.profile_permission,
      userPermission: buttonInfo.has_permission,
      notes: buttonInfo.customization_notes || null,
      isOverride: buttonInfo.profile_permission !== buttonInfo.has_permission
    };
  }, [getButtonInfo]);

  /**
   * Refrescar permisos
   */
  const refreshPermissions = useCallback(() => {
    if (effectiveTargetId) {
      setLastFetch(null);
      loadButtonPermissions();
    }
  }, [loadButtonPermissions, effectiveTargetId]);

  /**
   * Obtener solo botones permitidos
   */
  const getAllowedButtons = useCallback(() => {
    if (!Array.isArray(buttonPermissions)) return [];
    return buttonPermissions.filter(btn => btn.has_permission === true);
  }, [buttonPermissions]);

  /**
   * ✅ NUEVO: Estadísticas de personalización
   */
  const getCustomizationStats = useCallback(() => {
    if (!Array.isArray(buttonPermissions)) {
      return { total: 0, customized: 0, granted: 0, denied: 0 };
    }

    const total = buttonPermissions.length;
    const customized = buttonPermissions.filter(btn => btn.is_customized).length;
    const granted = buttonPermissions.filter(btn => btn.is_customized && btn.customization_type === 'C').length;
    const denied = buttonPermissions.filter(btn => btn.is_customized && btn.customization_type === 'D').length;

    return { total, customized, granted, denied };
  }, [buttonPermissions]);

  // ===== PERMISOS CRUD ESPECÍFICOS + CALENDARIO =====
  const canCreate = useMemo(() => hasButtonPermission('CREATE'), [hasButtonPermission]);
  
  // ✅ CRÍTICO: CORREGIDO - Solo una verificación de READ
  const canRead = useMemo(() => hasButtonPermission('READ') || hasButtonPermission('READ'), [hasButtonPermission]);
  
  const canUpdate = useMemo(() => hasButtonPermission('UPDATE'), [hasButtonPermission]);
  const canDelete = useMemo(() => hasButtonPermission('DELETE'), [hasButtonPermission]);
  
  // ✅ CRÍTICO: CORREGIDO - Error tipográfico en dependencia
  const canExport = useMemo(() => hasButtonPermission('EXPORT'), [hasButtonPermission]);
  
  const canSearch = useMemo(() => hasButtonPermission('SEARCH'), [hasButtonPermission]);
  const canRefresh = useMemo(() => hasButtonPermission('REFRESH'), [hasButtonPermission]);

  // ✅ CRÍTICO: LÓGICA SIMPLE DE CALENDARIO - Solo permiso específico
  const canViewCalendar = useMemo(() => {
    // Verificar múltiples códigos posibles para calendario
    const calendarCodes = ['CALENDARIO', 'calendario', 'CALENDAR', 'calendar', 'agenda', 'AGENDA'];
    
    // Buscar si hay algún permiso específico de calendario
    const hasCalendarPermission = calendarCodes.some(code => hasButtonPermission(code));
    
    console.log('🔍 Hook: Permiso de calendario:', {
      calendarCodes,
      hasCalendarPermission,
      allButtons: buttonPermissions.map(btn => ({
        codigo: btn.bot_codigo,
        permiso: btn.has_permission
      }))
    });
    
    return hasCalendarPermission;
  }, [hasButtonPermission, buttonPermissions]);

  // ===== VERIFICACIÓN MÚLTIPLE =====
  const hasAnyPermission = useCallback((buttonCodes = []) => {
    if (!Array.isArray(buttonCodes) || buttonCodes.length === 0) return false;
    return buttonCodes.some(code => hasButtonPermission(code));
  }, [hasButtonPermission]);

  const hasAllPermissions = useCallback((buttonCodes = []) => {
    if (!Array.isArray(buttonCodes) || buttonCodes.length === 0) return false;
    return buttonCodes.every(code => hasButtonPermission(code));
  }, [hasButtonPermission]);

  // ===== VERIFICACIÓN REMOTA =====
  const checkButtonPermission = useCallback(async (buttonCode) => {
    if (!effectiveTargetId) return false;

    try {
      if (userId) {
        return await adminService.buttonUtils.checkUserButtonPermission(userId, effectiveTargetId, buttonCode);
      } else {
        if (type === 'menu') {
          return await adminService.buttonUtils.checkMenuButtonPermission(effectiveTargetId, buttonCode);
        } else {
          return await adminService.buttonUtils.checkButtonPermission(effectiveTargetId, buttonCode);
        }
      }
    } catch (error) {
      console.error('Error checking button permission:', error);
      return false;
    }
  }, [effectiveTargetId, type, userId]);

  // ===== ESTADÍSTICAS AVANZADAS =====
  const permissionStats = useMemo(() => {
    const total = buttonPermissions.length;
    const allowed = getAllowedButtons().length;
    const denied = total - allowed;
    const customizationStats = getCustomizationStats();

    return {
      total,
      allowed,
      denied,
      hasAnyPermission: allowed > 0,
      isEmpty: total === 0,
      ...customizationStats
    };
  }, [buttonPermissions, getAllowedButtons, getCustomizationStats]);

  // ===== BOTONES POR CATEGORÍA =====
  const buttonsByCategory = useMemo(() => {
    const categories = {
      crud: [],
      utility: [],
      navigation: [],
      permissions: [],
      calendar: [], // ✅ NUEVA CATEGORÍA
      other: []
    };

    const allowedButtons = getAllowedButtons();

    allowedButtons.forEach(button => {
      const code = button.bot_codigo.toUpperCase();

      if (['CREATE', 'READ', 'UPDATE', 'DELETE'].includes(code)) {
        categories.crud.push(button);
      } else if (['EXPORT', 'PRINT', 'DUPLICATE'].includes(code)) {
        categories.utility.push(button);
      } else if (['SEARCH', 'REFRESH', 'BACK'].includes(code)) {
        categories.navigation.push(button);
      } else if (['ASSIGN_PERMISSIONS', 'COPY_PERMISSIONS'].includes(code)) {
        categories.permissions.push(button);
      } else if (['CALENDARIO', 'CALENDAR', 'AGENDA'].includes(code)) {
        // ✅ NUEVA CATEGORÍA CALENDARIO
        categories.calendar.push(button);
      } else {
        categories.other.push(button);
      }
    });

    return categories;
  }, [getAllowedButtons]);

  // ===== RETURN DEL HOOK =====
  return {
    // Estados principales
    buttonPermissions,
    loading,
    error,
    lastFetch,
    userInfo,

    // ✅ COMPATIBILIDAD: Alias para DynamicActionButtons
    permissions: buttonPermissions,
    isReady: !loading && !error && buttonPermissions.length >= 0,

    // Funciones principales
    loadButtonPermissions,
    refreshPermissions,
    hasButtonPermission,
    getButtonInfo,
    checkButtonPermission,
    getAllowedButtons,

    // ✅ NUEVAS: Funciones para personalización
    getButtonCustomization,
    getCustomizationStats,

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

    // ✅ CRÍTICO: Permiso específico para calendario
    canViewCalendar,

    // Datos organizados
    buttonsByCategory,
    canPerformBulkActions: canDelete || canUpdate || hasButtonPermission('TOGGLE'),

    // Estadísticas completas
    stats: permissionStats,
    totalButtons: buttonPermissions.length,
    hasCrudPermissions: canCreate || canRead || canUpdate || canDelete,
    hasUtilityPermissions: canExport || hasButtonPermission('PRINT'),
    hasCalendarPermissions: canViewCalendar,

    // ✅ Helper para logs de debug
    debugInfo: {
      effectiveTargetId,
      type,
      userId,
      isSpecificUser: userInfo?.isSpecificUser || false,
      totalPermissions: buttonPermissions.length,
      allowedPermissions: getAllowedButtons().length,
      customizedPermissions: getCustomizationStats().customized,
      availableButtons: buttonPermissions.map(btn => btn.bot_codigo),
      allowedButtons: getAllowedButtons().map(btn => btn.bot_codigo),
      calendarButtons: buttonPermissions.filter(btn => 
        ['CALENDARIO', 'CALENDAR', 'calendario', 'calendar', 'agenda', 'AGENDA'].includes(btn.bot_codigo)
      ),
      hasCalendarAccess: canViewCalendar,
      loading,
      error,
      lastFetch,
      autoLoad
    }
  };
};