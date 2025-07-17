// src/context/AuthContext.jsx - ACTUALIZADO con validación de horarios individuales
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService from '../services/authService';

// Crear contexto
const AuthContext = createContext();

// Proveedor de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // ✅ Estados para manejo de horarios individuales
  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [scheduleStatus, setScheduleStatus] = useState(null);
  const [showTimeoutAlert, setShowTimeoutAlert] = useState(false);
  const [scheduleCheckInterval, setScheduleCheckInterval] = useState(null);

  // ✅ Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('🔍 AuthContext: Verificando usuario existente...');
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          console.log('✅ AuthContext: Usuario encontrado en localStorage:', currentUser.email);
          setUser(currentUser);
          setPermissions(currentUser.permisos || []);

          // ✅ Cargar información de horario individual
          await loadScheduleInfo();

          // ✅ Iniciar verificación periódica de horarios
          startScheduleMonitoring();
        } else {
          console.log('❌ AuthContext: No hay usuario en localStorage');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error al cargar usuario:', error);
        try {
          AuthService.logout();
        } catch (logoutError) {
          console.error('Error en logout durante loadUser:', logoutError);
        }
        setUser(null);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // ✅ Cleanup al desmontar
    return () => {
      if (scheduleCheckInterval) {
        clearInterval(scheduleCheckInterval);
      }
    };
  }, []);

  // ✅ NUEVA FUNCIÓN: Cargar información de horario del usuario
  const loadScheduleInfo = useCallback(async () => {
    try {
      console.log('🕐 AuthContext: Cargando información de horario del usuario...');
      
      // Verificar si es super admin (sin restricciones)
      if (AuthService.isSuperAdmin()) {
        setScheduleStatus({
          estado: 'SUPER_ADMIN',
          mensaje: 'Sin restricciones de horario',
          puede_acceder: true,
          es_super_admin: true
        });
        setScheduleInfo(null);
        return;
      }

      // Obtener estado actual del horario
      const status = await AuthService.getScheduleStatus();
      setScheduleStatus(status);

      // Obtener información detallada del horario
      const info = await AuthService.getMyScheduleInfo();
      setScheduleInfo(info);

      console.log('✅ AuthContext: Información de horario cargada:', { status, info });

      // Mostrar alerta si está cerca del cierre
      if (info?.alerta_cierre_proximo && !showTimeoutAlert) {
        setShowTimeoutAlert(true);
      }

    } catch (error) {
      console.error('❌ AuthContext: Error cargando información de horario:', error);
      // En caso de error, permitir acceso pero sin información de horario
      setScheduleStatus({
        estado: 'ERROR',
        mensaje: 'Error verificando horario',
        puede_acceder: true
      });
      setScheduleInfo(null);
    }
  }, [showTimeoutAlert]);

  // ✅ NUEVA FUNCIÓN: Iniciar monitoreo de horarios individuales
  const startScheduleMonitoring = useCallback(() => {
    // Verificar cada 30 segundos
    const interval = setInterval(async () => {
      try {
        console.log('🔄 AuthContext: Verificación periódica de horario...');
        
        const result = await AuthService.verifyActiveSchedule();

        if (result.shouldLogout) {
          console.log('🚪 AuthContext: Forzando logout por horario individual');
          await forceLogout(result.message || 'Horario de acceso finalizado');
          return;
        }

        if (result.success && result.data) {
          // Actualizar información de horario
          if (result.data.horario_info) {
            setScheduleInfo(result.data.horario_info);
            
            // Actualizar estado
            const newStatus = {
              estado: result.data.horario_info.puede_acceder ? 'DENTRO_HORARIO' : 'FUERA_HORARIO',
              mensaje: result.data.horario_info.mensaje || 'Horario verificado',
              puede_acceder: result.data.horario_info.puede_acceder || false,
              tiempo_restante: result.data.horario_info.tiempo_restante_minutos,
              alerta_cierre: result.data.horario_info.alerta_cierre_proximo || false
            };
            setScheduleStatus(newStatus);

            // ✅ Mostrar alerta si queda poco tiempo
            if (newStatus.alerta_cierre && !showTimeoutAlert) {
              console.log('⚠️ AuthContext: Mostrando alerta de cierre próximo');
              setShowTimeoutAlert(true);
            }
          }
        }
      } catch (error) {
        console.error('❌ AuthContext: Error en monitoreo de horarios:', error);

        // Si hay error crítico, detener monitoreo
        if (error.message?.includes('403') || error.message?.includes('401')) {
          await forceLogout('Sesión expirada');
        }
      }
    }, 30000); // Cada 30 segundos

    setScheduleCheckInterval(interval);
    return interval;
  }, [showTimeoutAlert]);

  // ✅ NUEVA FUNCIÓN: Logout forzado por horario
  const forceLogout = useCallback(async (reason = 'Horario de acceso finalizado') => {
    console.log('🚪 AuthContext: Logout forzado -', reason);

    try {
      // Limpiar interval
      if (scheduleCheckInterval) {
        clearInterval(scheduleCheckInterval);
        setScheduleCheckInterval(null);
      }

      // Cerrar sesión
      await AuthService.logout();
      setUser(null);
      setPermissions([]);
      setScheduleInfo(null);
      setScheduleStatus(null);
      setShowTimeoutAlert(false);

      // Mostrar mensaje al usuario
      alert(`Su sesión ha sido cerrada: ${reason}`);

      // Recargar página para limpiar completamente el estado
      window.location.reload();

    } catch (error) {
      console.error('❌ Error en forceLogout:', error);
      // Forzar recarga aunque falle
      window.location.reload();
    }
  }, [scheduleCheckInterval]);

  // ✅ FUNCIÓN LOGIN actualizada con horarios individuales
  const login = async (email, password) => {
    console.log('🔐 AuthContext.login iniciado para:', email);

    try {
      console.log('📡 AuthContext: Llamando a AuthService.login...');
      const userData = await AuthService.login(email, password);
      console.log('✅ AuthContext: Login exitoso, datos recibidos:', userData);

      setUser(userData);
      setPermissions(userData.permisos || []);

      // ✅ Cargar información de horario individual después del login
      await loadScheduleInfo();

      // ✅ Iniciar monitoreo de horarios
      startScheduleMonitoring();

      console.log('✅ AuthContext: Estado actualizado correctamente');
      return userData;

    } catch (error) {
      console.error('❌ AuthContext: Error en login:', error);
      setUser(null);
      setPermissions([]);
      setScheduleInfo(null);
      setScheduleStatus(null);
      throw error;
    }
  };

  // ✅ Función logout actualizada
  const logout = async () => {
    console.log('🚪 AuthContext: Cerrando sesión...');

    try {
      setLoading(true);

      // Limpiar interval
      if (scheduleCheckInterval) {
        clearInterval(scheduleCheckInterval);
        setScheduleCheckInterval(null);
      }

      await AuthService.logout();
      setUser(null);
      setPermissions([]);
      setScheduleInfo(null);
      setScheduleStatus(null);
      setShowTimeoutAlert(false);

      console.log('✅ AuthContext: Logout exitoso');
    } catch (error) {
      console.error('❌ AuthContext: Error en logout:', error);
      setUser(null);
      setPermissions([]);
      setScheduleInfo(null);
      setScheduleStatus(null);
      setShowTimeoutAlert(false);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Refrescar información de horario
  const refreshScheduleInfo = useCallback(async () => {
    try {
      console.log('🔄 AuthContext: Refrescando información de horario...');
      await loadScheduleInfo();
      return true;
    } catch (error) {
      console.error('❌ AuthContext: Error refrescando horario:', error);
      return false;
    }
  }, [loadScheduleInfo]);

  // ✅ NUEVA FUNCIÓN: Validar acceso para fecha/hora específica
  const validateScheduleAccess = async (fecha = null, hora = null) => {
    try {
      return await AuthService.validateScheduleAccess(fecha, hora);
    } catch (error) {
      console.error('❌ AuthContext: Error validando acceso:', error);
      return {
        puede_acceder: false,
        motivo: 'ERROR_VALIDACION'
      };
    }
  };

  // ✅ NUEVA FUNCIÓN: Obtener horario efectivo para una fecha
  const getEffectiveScheduleForDate = async (fecha) => {
    try {
      return await AuthService.getEffectiveScheduleForDate(fecha);
    } catch (error) {
      console.error('❌ AuthContext: Error obteniendo horario efectivo:', error);
      return null;
    }
  };

  // ✅ NUEVA FUNCIÓN: Verificar si el usuario puede acceder ahora
  const canAccessNow = () => {
    // Super admins siempre pueden acceder
    if (scheduleStatus?.es_super_admin) {
      return true;
    }

    // Verificar estado del horario
    return scheduleStatus?.puede_acceder || false;
  };

  // ✅ NUEVA FUNCIÓN: Obtener tiempo restante de sesión
  const getTimeRemaining = () => {
    if (scheduleStatus?.es_super_admin) {
      return null; // Sin límite para super admins
    }

    return scheduleInfo?.tiempo_restante_minutos || null;
  };

  // ✅ NUEVA FUNCIÓN: Verificar si debe mostrar alerta de cierre
  const shouldShowTimeoutAlert = () => {
    return !scheduleStatus?.es_super_admin && 
           (showTimeoutAlert || scheduleStatus?.alerta_cierre);
  };

  // ✅ Resto de funciones existentes (actualizadas)
  const refreshUser = async () => {
    try {
      console.log('🔄 AuthContext: Actualizando datos del usuario...');
      const updatedData = await AuthService.refreshUserData();
      if (updatedData) {
        const newUserData = { ...user, ...updatedData.user };
        setUser(newUserData);
        setPermissions(updatedData.permisos || []);

        // Actualizar info de horario
        await loadScheduleInfo();

        console.log('✅ AuthContext: Datos del usuario actualizados');
        return newUserData;
      }
    } catch (error) {
      console.error('❌ AuthContext: Error al actualizar usuario:', error);
    }
    return null;
  };

  const hasPermission = (menuId, submenuId = null, optionId = null) => {
    if (!permissions || permissions.length === 0) return false;

    return permissions.some(menu => {
      if (menu.men_id !== menuId) return false;

      if (!submenuId && !optionId) {
        return true;
      }

      if (submenuId && !optionId) {
        return menu.submenus?.some(sub => sub.sub_id === submenuId);
      }

      if (submenuId && optionId) {
        const submenu = menu.submenus?.find(sub => sub.sub_id === submenuId);
        return submenu?.opciones?.some(opt => opt.opc_id === optionId);
      }

      return false;
    });
  };

  const getAllowedMenus = () => {
    return permissions || [];
  };

  const verifyToken = async () => {
    try {
      if (!AuthService.isAuthenticated()) {
        return false;
      }
      return !!AuthService.getCurrentUser();
    } catch (error) {
      console.error('Error verificando token:', error);
      setUser(null);
      setPermissions([]);
      setScheduleInfo(null);
      setScheduleStatus(null);
      return false;
    }
  };

  // ✅ Valores del contexto expandidos con horarios individuales
  const contextValue = {
    // Estados básicos
    user,
    permissions,
    isAuthenticated: !!user && !!AuthService.isAuthenticated(),
    loading,
    
    // Funciones básicas
    login,
    logout,
    forceLogout,
    refreshUser,
    hasPermission,
    getAllowedMenus,
    verifyToken,
    
    // ✅ NUEVOS: Estados y funciones de horarios individuales
    scheduleInfo,
    scheduleStatus,
    showTimeoutAlert,
    
    // Funciones de horario
    refreshScheduleInfo,
    validateScheduleAccess,
    getEffectiveScheduleForDate,
    canAccessNow,
    getTimeRemaining,
    shouldShowTimeoutAlert,
    
    // Funciones de utilidad
    isSuperAdmin: () => AuthService.isSuperAdmin(),
    
    // Estado del horario
    isWithinSchedule: () => canAccessNow(),
    hasScheduleRestrictions: () => !AuthService.isSuperAdmin(),
    
    // Información adicional
    getScheduleSummary: () => ({
      estado: scheduleStatus?.estado || 'DESCONOCIDO',
      mensaje: scheduleStatus?.mensaje || 'Sin información',
      puede_acceder: canAccessNow(),
      es_super_admin: AuthService.isSuperAdmin(),
      tiempo_restante: getTimeRemaining(),
      alerta_activa: shouldShowTimeoutAlert()
    })
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook personalizado actualizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// ✅ Hook específico para horarios
export const useSchedule = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSchedule debe ser usado dentro de un AuthProvider');
  }
  
  return {
    scheduleInfo: context.scheduleInfo,
    scheduleStatus: context.scheduleStatus,
    canAccessNow: context.canAccessNow,
    isSuperAdmin: context.isSuperAdmin,
    isWithinSchedule: context.isWithinSchedule,
    hasScheduleRestrictions: context.hasScheduleRestrictions,
    getTimeRemaining: context.getTimeRemaining,
    shouldShowTimeoutAlert: context.shouldShowTimeoutAlert,
    refreshScheduleInfo: context.refreshScheduleInfo,
    validateScheduleAccess: context.validateScheduleAccess,
    getEffectiveScheduleForDate: context.getEffectiveScheduleForDate,
    getScheduleSummary: context.getScheduleSummary
  };
};

// ✅ getCurrentUser actualizado para incluir horarios
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        usu_id: user.usu_id || user.id || user.userId,
        usu_nom: user.usu_nom || user.nombre || user.name,
        usu_ape: user.usu_ape || user.apellido || user.lastname,
        usu_cor: user.usu_cor || user.email,
        per_id: user.per_id || user.perfilId || user.profileId,
        oficina_codigo: user.oficina_codigo,
        es_super_admin: user.es_super_admin,
        horario_info: user.horario_info,
        ...user
      };
    }
    return null;
  } catch (error) {
    console.error('getCurrentUser: Error parsing user data:', error);
    localStorage.removeItem('user_data');
    return null;
  }
};

// ✅ NUEVA función para obtener solo información de horario
export const getCurrentUserSchedule = () => {
  try {
    const user = getCurrentUser();
    return user?.horario_info || null;
  } catch (error) {
    console.error('getCurrentUserSchedule: Error getting schedule info:', error);
    return null;
  }
};

// ✅ NUEVA función para verificar si es super admin
export const isCurrentUserSuperAdmin = () => {
  try {
    const user = getCurrentUser();
    return user?.es_super_admin === true || user?.per_id === 3;
  } catch (error) {
    console.error('isCurrentUserSuperAdmin: Error checking super admin:', error);
    return false;
  }
};

export default AuthContext;