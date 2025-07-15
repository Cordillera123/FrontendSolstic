// src/context/AuthContext.jsx - EXPANDIDO con validación de horarios
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService from '../services/authService';

// Crear contexto
const AuthContext = createContext();

// Proveedor de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // ✅ NUEVOS estados para manejo de horarios
  const [scheduleInfo, setScheduleInfo] = useState(null);
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

          // ✅ Cargar información de horario
          const horarioInfo = AuthService.getScheduleInfo();
          setScheduleInfo(horarioInfo);

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

  // ✅ NUEVA FUNCIÓN: Iniciar monitoreo de horarios
  const startScheduleMonitoring = useCallback(() => {
    // Verificar cada 30 segundos
    const interval = setInterval(async () => {
      try {
        const result = await AuthService.verifyActiveSchedule();

        if (result.shouldLogout) {
          console.log('🚪 AuthContext: Forzando logout por horario');
          await forceLogout(result.message || 'Horario de acceso finalizado');
          return;
        }

        if (result.success && result.data?.horario_info) {
          const horarioInfo = result.data.horario_info;
          setScheduleInfo(horarioInfo);

          // ✅ Mostrar alerta si queda 1 minuto o menos
          if (horarioInfo.alerta_cierre_proximo && !showTimeoutAlert) {
            console.log('⚠️ AuthContext: Mostrando alerta de cierre próximo');
            setShowTimeoutAlert(true);
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

  // ✅ FUNCIÓN LOGIN actualizada
  const login = async (email, password) => {
    console.log('🔐 AuthContext.login iniciado para:', email);

    try {
      console.log('📡 AuthContext: Llamando a AuthService.login...');
      const userData = await AuthService.login(email, password);
      console.log('✅ AuthContext: Login exitoso, datos recibidos:', userData);

      setUser(userData);
      setPermissions(userData.permisos || []);

      // ✅ Configurar información de horario si está disponible
      if (userData.horario_info) {
        setScheduleInfo(userData.horario_info);

        // Si ya tiene alerta de cierre próximo al hacer login
        if (userData.horario_info.alerta_cierre_proximo) {
          setShowTimeoutAlert(true);
        }
      }

      // ✅ Iniciar monitoreo de horarios
      startScheduleMonitoring();

      console.log('✅ AuthContext: Estado actualizado correctamente');
      return userData;

    } catch (error) {
      console.error('❌ AuthContext: Error en login:', error);
      setUser(null);
      setPermissions([]);
      setScheduleInfo(null);
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
      setShowTimeoutAlert(false);

      console.log('✅ AuthContext: Logout exitoso');
    } catch (error) {
      console.error('❌ AuthContext: Error en logout:', error);
      setUser(null);
      setPermissions([]);
      setScheduleInfo(null);
      setShowTimeoutAlert(false);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resto de funciones existentes (sin cambios)
  const refreshUser = async () => {
    try {
      console.log('🔄 AuthContext: Actualizando datos del usuario...');
      const updatedData = await AuthService.refreshUserData();
      if (updatedData) {
        const newUserData = { ...user, ...updatedData.user };
        setUser(newUserData);
        setPermissions(updatedData.permisos || []);

        // Actualizar info de horario
        if (updatedData.horario_info) {
          setScheduleInfo(updatedData.horario_info);
        }

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
      return false;
    }
  };

  // ✅ Valores del contexto expandidos
  const contextValue = {
    user,
    permissions,
    scheduleInfo,
    isAuthenticated: !!user && !!AuthService.isAuthenticated(),
    loading,
    login,
    logout,
    forceLogout,
    refreshUser,
    hasPermission,
    getAllowedMenus,
    verifyToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {/* ✅ REMOVIDO: El modal ya está integrado en el sidebar
    {showTimeoutAlert && scheduleInfo?.alerta_cierre_proximo && (
      <SessionTimeoutAlert ... />
    )}
    */}
    </AuthContext.Provider>
  );
};

// ✅ Hook personalizado (sin cambios)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// ✅ getCurrentUser (sin cambios)
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

export default AuthContext;