// src/services/authService.js - Corregido para manejo de errores
import { authService as apiAuth } from './apiService';

const AuthService = {
  // ✅ Iniciar sesión usando la API real
  login: async (email, password) => {
    try {
      console.log('🔐 AuthService.login iniciado para:', email);

      const result = await apiAuth.login({ email, password });
      console.log('📡 AuthService: Respuesta de API:', result);

      if (result.success || result.status === 'success') {
        const userData = result.data || result;
        console.log('✅ AuthService: Login exitoso, procesando datos...');

        // ✅ Estructura de datos normalizada
        const normalizedUser = {
          id: userData.user.id,
          username: userData.user.email,
          fullName: userData.user.nombre,
          email: userData.user.email,
          cedula: userData.user.cedula,
          perfil: userData.user.perfil,
          estado: userData.user.estado,
          token: userData.access_token,
          permisos: userData.permisos || []
        };

        console.log('✅ AuthService: Usuario normalizado:', normalizedUser);
        return normalizedUser;

      } else {
        // ✅ Manejo de errores específicos de la API
        const errorMessage = result.message || 'Error en la autenticación';
        console.error('❌ AuthService: Error de API:', errorMessage);
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ AuthService: Error en login:', error);

      // ✅ Manejo específico de errores HTTP
      if (error.message?.includes('401')) {
        throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
      } else if (error.message?.includes('403')) {
        throw new Error('Usuario inactivo o suspendido. Contacta al administrador.');
      } else if (error.message?.includes('422')) {
        throw new Error('Datos de acceso incorrectos. Verifica el formato del email.');
      } else if (error.message?.includes('500')) {
        throw new Error('Error del servidor. Intenta de nuevo más tarde.');
      } else if (error.message?.includes('Network Error')) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }

      // ✅ Preservar el mensaje original si es descriptivo
      throw new Error(error.message || 'Error de conexión con el servidor');
    }
  },

  // ✅ Cerrar sesión usando la API
  logout: async () => {
    try {
      console.log('🚪 AuthService: Cerrando sesión...');
      await apiAuth.logout();
      console.log('✅ AuthService: Logout exitoso');
    } catch (error) {
      console.error('❌ AuthService: Error en logout:', error);
      // ✅ Limpiar localStorage aunque falle la API
      this.clearLocalData();
    }
  },

  // ✅ Limpiar datos locales manualmente
  clearLocalData: () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_permissions');
      console.log('🧹 AuthService: Datos locales limpiados');
    } catch (error) {
      console.error('Error limpiando localStorage:', error);
    }
  },

  // ✅ Verificar si hay una sesión activa
  isAuthenticated: () => {
    try {
      return apiAuth.isAuthenticated();
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      return false;
    }
  },

  // ✅ Obtener usuario actual con manejo de errores
  getCurrentUser: () => {
    try {
      const userData = apiAuth.getUserData();

      if (userData) {
        return {
          id: userData.id,
          username: userData.email,
          fullName: userData.nombre,
          email: userData.email,
          cedula: userData.cedula,
          perfil: userData.perfil,
          estado: userData.estado,
          permisos: apiAuth.getUserPermissions() || []
        };
      }

      return null;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  },

  // ✅ Obtener permisos del usuario
  getUserPermissions: () => {
    try {
      return apiAuth.getUserPermissions() || [];
    } catch (error) {
      console.error('Error obteniendo permisos:', error);
      return [];
    }
  },

  // ✅ Actualizar datos del usuario desde la API
  refreshUserData: async () => {
    try {
      console.log('🔄 AuthService: Actualizando datos del usuario...');
      const result = await apiAuth.getCurrentUser();

      if (result && (result.success || result.status === 'success')) {
        console.log('✅ AuthService: Datos actualizados exitosamente');
        return result.data || result;
      }

      console.log('⚠️ AuthService: No se pudieron actualizar los datos');
      return null;
    } catch (error) {
      console.error('❌ AuthService: Error al actualizar datos:', error);
      return null;
    }
  },

  // ✅ NUEVO: Método para probar diferentes contraseñas (SOLO para debugging)
  testPasswords: async (email, passwords = ['123456', 'password', 'admin', 'test123']) => {
    console.log(`🧪 Probando contraseñas para ${email}...`);

    for (const password of passwords) {
      try {
        console.log(`🔑 Probando: "${password}"`);
        const result = await this.login(email, password);

        if (result) {
          console.log(`✅ ¡CONTRASEÑA CORRECTA! "${password}"`);
          return { password, success: true, result };
        }
      } catch (error) {
        console.log(`❌ "${password}" no funciona:`, error.message);
      }
    }

    console.log('❌ Ninguna contraseña funcionó');
    return { success: false };
  },
  // Agregar al final de AuthService, antes del export
  // ✅ NUEVO: Verificar horario de usuario activo
  verifyActiveSchedule: async () => {
    try {
      console.log('🕐 AuthService: Verificando horario activo...');
      const result = await apiAuth.verifyActiveSchedule();

      if (result && (result.success || result.status === 'success')) {
        return {
          success: true,
          data: result.data,
          shouldLogout: result.data?.debe_cerrar_sesion || false
        };
      }

      return {
        success: false,
        shouldLogout: result?.data?.debe_cerrar_sesion || false,
        message: result?.message || 'Error verificando horario'
      };
    } catch (error) {
      console.error('❌ AuthService: Error verificando horario:', error);

      // Si es error 403, probablemente debe cerrar sesión
      if (error.message?.includes('403')) {
        return {
          success: false,
          shouldLogout: true,
          message: error.message
        };
      }

      return {
        success: false,
        shouldLogout: false,
        message: error.message
      };
    }
  },

  // ✅ NUEVO: Extraer información de horario del usuario
  getScheduleInfo: () => {
    try {
      const userData = apiAuth.getUserData();
      return userData?.horario_info || null;
    } catch (error) {
      console.error('Error obteniendo info de horario:', error);
      return null;
    }
  }

};


export default AuthService;