// src/context/AuthContext.jsx - CORREGIDO para evitar recargas
import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/authService';

// Crear contexto
const AuthContext = createContext();

// Proveedor de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

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
        } else {
          console.log('❌ AuthContext: No hay usuario en localStorage');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error al cargar usuario:', error);
        // ✅ Si hay error, limpiar datos SIN recargar página
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
  }, []);

  // ✅ FUNCIÓN LOGIN CORREGIDA - NO causa recargas en errores
  const login = async (email, password) => {
    console.log('🔐 AuthContext.login iniciado para:', email);

    try {
      // ✅ NO setLoading(true) aquí - se maneja en el componente
      console.log('📡 AuthContext: Llamando a AuthService.login...');

      const userData = await AuthService.login(email, password);
      console.log('✅ AuthContext: Login exitoso, datos recibidos:', userData);

      // ✅ Actualizar estado solo si el login fue exitoso
      setUser(userData);
      setPermissions(userData.permisos || []);

      console.log('✅ AuthContext: Estado actualizado correctamente');
      return userData;

    } catch (error) {
      console.error('❌ AuthContext: Error en login:', error);

      // ✅ CRÍTICO: Limpiar estado pero NO recargar página
      setUser(null);
      setPermissions([]);

      // ✅ CRÍTICO: Re-lanzar el error EXACTAMENTE como viene
      // para que el componente Login lo maneje
      throw error;
    }
    // ✅ NO finally aquí - el loading se maneja en el componente
  };

  // ✅ Función para cerrar sesión
  const logout = async () => {
    console.log('🚪 AuthContext: Cerrando sesión...');

    try {
      setLoading(true);
      await AuthService.logout();
      setUser(null);
      setPermissions([]);
      console.log('✅ AuthContext: Logout exitoso');
    } catch (error) {
      console.error('❌ AuthContext: Error en logout:', error);
      // ✅ Limpiar estado aunque falle
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Función para actualizar datos del usuario
  const refreshUser = async () => {
    try {
      console.log('🔄 AuthContext: Actualizando datos del usuario...');
      const updatedData = await AuthService.refreshUserData();
      if (updatedData) {
        const newUserData = {
          ...user,
          ...updatedData.user
        };
        setUser(newUserData);
        setPermissions(updatedData.permisos || []);
        console.log('✅ AuthContext: Datos del usuario actualizados');
        return newUserData;
      }
    } catch (error) {
      console.error('❌ AuthContext: Error al actualizar usuario:', error);
    }
    return null;
  };

  // ✅ Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (menuId, submenuId = null, optionId = null) => {
    if (!permissions || permissions.length === 0) return false;

    return permissions.some(menu => {
      if (menu.men_id !== menuId) return false;

      if (!submenuId && !optionId) {
        return true; // Solo verificar menú principal
      }

      if (submenuId && !optionId) {
        // Verificar submenú
        return menu.submenus?.some(sub => sub.sub_id === submenuId);
      }

      if (submenuId && optionId) {
        // Verificar opción específica
        const submenu = menu.submenus?.find(sub => sub.sub_id === submenuId);
        return submenu?.opciones?.some(opt => opt.opc_id === optionId);
      }

      return false;
    });
  };

  // ✅ Función para obtener menús permitidos
  const getAllowedMenus = () => {
    return permissions || [];
  };

  // ✅ Función para verificar token (útil para rutas protegidas)
  const verifyToken = async () => {
    try {
      if (!AuthService.isAuthenticated()) {
        return false;
      }

      // ✅ Si tienes un endpoint para verificar token, úsalo aquí
      // const result = await AuthService.verifyToken();
      // return result.success;

      // ✅ Por ahora, verificar si hay usuario en localStorage
      return !!AuthService.getCurrentUser();

    } catch (error) {
      console.error('Error verificando token:', error);
      // ✅ Si falla la verificación, cerrar sesión
      setUser(null);
      setPermissions([]);
      return false;
    }
  };

  // ✅ Valores del contexto con isAuthenticated calculado
  const contextValue = {
    user,
    permissions,
    isAuthenticated: !!user && !!AuthService.isAuthenticated(),
    loading,
    login,
    logout,
    refreshUser,
    hasPermission,
    getAllowedMenus,
    verifyToken
  };

  // ✅ Debug info en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 AuthContext render:', {
      hasUser: !!user,
      userEmail: user?.email,
      isAuthenticated: !!user && !!AuthService.isAuthenticated(),
      loading,
      permissionsCount: permissions.length
    });
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const getCurrentUser = () => {
  try {
    // Opción 1: Desde localStorage (igual que tu AuthContext)
    const userStr = localStorage.getItem('user_data'); // Usa la misma clave que tu AuthContext
    if (userStr) {
      const user = JSON.parse(userStr);

      // ✅ NORMALIZAR: Asegurar estructura compatible con tu sistema
      return {
        usu_id: user.usu_id || user.id || user.userId,
        usu_nom: user.usu_nom || user.nombre || user.name,
        usu_ape: user.usu_ape || user.apellido || user.lastname,
        usu_cor: user.usu_cor || user.email,
        per_id: user.per_id || user.perfilId || user.profileId,
        ...user // Mantener todos los campos originales
      };
    }

    console.warn('getCurrentUser: No hay usuario en localStorage');
    return null;
  } catch (error) {
    console.error('getCurrentUser: Error parsing user data:', error);
    // Limpiar datos corruptos
    localStorage.removeItem('user_data');
    return null;
  }
};
export default AuthContext;