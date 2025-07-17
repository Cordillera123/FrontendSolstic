// src/services/authService.js - CORREGIDO con referencias de función
import { authService as apiAuth, adminService } from './apiService';

const AuthService = {
  // ✅ Login usando la API real
  login: async (email, password) => {
    try {
      console.log('🔐 AuthService.login iniciado para:', email);

      const result = await apiAuth.login({ email, password });
      console.log('📡 AuthService: Respuesta de API:', result);

      if (result.success || result.status === 'success') {
        const userData = result.data || result;
        console.log('✅ AuthService: Login exitoso, procesando datos...');

        // ✅ Estructura de datos normalizada CON información de horario
        const normalizedUser = {
          id: userData.user.id,
          usu_id: userData.user.id,
          username: userData.user.email,
          fullName: userData.user.nombre,
          email: userData.user.email,
          cedula: userData.user.cedula,
          perfil: userData.user.perfil,
          estado: userData.user.estado,
          oficina_codigo: userData.user.oficina_codigo,
          es_super_admin: userData.user.es_super_admin,
          token: userData.access_token,
          permisos: userData.permisos || [],
          horario_info: userData.horario_info || null
        };

        console.log('✅ AuthService: Usuario normalizado:', normalizedUser);
        return normalizedUser;

      } else {
        const errorMessage = result.message || 'Error en la autenticación';
        console.error('❌ AuthService: Error de API:', errorMessage);
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ AuthService: Error en login:', error);

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
      AuthService.clearLocalData();
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

  // ✅ CORREGIDO: Obtener usuario actual
  getCurrentUser: () => {
    try {
      const userData = apiAuth.getUserData();

      if (userData) {
        return {
          id: userData.id,
          usu_id: userData.id,
          username: userData.email,
          fullName: userData.nombre,
          email: userData.email,
          cedula: userData.cedula,
          perfil: userData.perfil,
          estado: userData.estado,
          oficina_codigo: userData.oficina_codigo,
          es_super_admin: userData.es_super_admin,
          permisos: apiAuth.getUserPermissions() || [],
          horario_info: userData.horario_info || null
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

  // ✅ CORREGIDO: Verificar horario de usuario activo
  verifyActiveSchedule: async () => {
  try {
    console.log('🕐 AuthService: Verificando horario activo del usuario...');
    
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !currentUser.usu_id) {
      console.error('❌ AuthService: No hay usuario autenticado');
      return {
        success: false,
        shouldLogout: true,
        message: 'Usuario no autenticado'
      };
    }

    // ✅ Usar el endpoint que funciona
    const response = await fetch('/api/auth/verificar-horario', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json();
        return {
          success: false,
          shouldLogout: errorData.debe_cerrar_sesion || true,
          message: errorData.message || 'Sesión expirada'
        };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      return {
        success: true,
        data: {
          horario_info: result.horario_info,
          debe_cerrar_sesion: result.debe_cerrar_sesion || false
        },
        shouldLogout: result.debe_cerrar_sesion || false,
        message: result.message
      };
    } else {
      return {
        success: false,
        shouldLogout: result.debe_cerrar_sesion || false,
        message: result.message || 'Error verificando horario'
      };
    }
    
  } catch (error) {
    console.error('❌ AuthService: Error crítico verificando horario:', error);
    
    if (error.message?.includes('403') || error.message?.includes('401')) {
      return {
        success: false,
        shouldLogout: true,
        message: 'Sesión expirada'
      };
    }
    
    return {
      success: false,
      shouldLogout: false,
      message: error.message || 'Error verificando horario'
    };
  }
},

  // ✅ CORREGIDO: Obtener información detallada del horario del usuario actual
  getMyScheduleInfo: async () => {
  try {
    console.log('🕐 AuthService: Obteniendo información de mi horario...');
    
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || !currentUser.usu_id) {
      return null;
    }

    // ✅ Usar el endpoint que ya funciona
    const response = await fetch('/api/auth/verificar-horario', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ AuthService: HTTP ${response.status} en verificar-horario`);
      return null;
    }

    const result = await response.json();
    
    if (result.status === 'success' && result.horario_info) {
      console.log('✅ AuthService: Información de horario obtenida:', result.horario_info);
      return result.horario_info;
    }
    
    return null;
  } catch (error) {
    console.error('❌ AuthService: Error obteniendo información de horario:', error);
    return null;
  }
},

  // ✅ CORREGIDO: Validar acceso para fecha y hora específica
  validateScheduleAccess: async (fecha = null, hora = null) => {
    try {
      console.log('🕐 AuthService: Validando acceso para fecha/hora:', { fecha, hora });
      
      const currentUser = AuthService.getCurrentUser(); // ✅ Usar AuthService en lugar de this
      if (!currentUser || !currentUser.usu_id) {
        return {
          puede_acceder: false,
          motivo: 'USUARIO_NO_AUTENTICADO'
        };
      }

      if (!fecha) {
        fecha = new Date().toISOString().split('T')[0];
      }
      if (!hora) {
        hora = new Date().toTimeString().split(' ')[0].substring(0, 5);
      }

      const result = await adminService.horariosUsuarios.validarAcceso(
        currentUser.usu_id, 
        fecha, 
        hora
      );
      
      if (result.status === 'success' && result.data) {
        return result.data;
      }
      
      return {
        puede_acceder: false,
        motivo: 'ERROR_VALIDACION'
      };
    } catch (error) {
      console.error('❌ AuthService: Error validando acceso:', error);
      return {
        puede_acceder: false,
        motivo: 'ERROR_SISTEMA'
      };
    }
  },

  // ✅ CORREGIDO: Obtener mis horarios completos
  getMySchedules: async (params = {}) => {
    try {
      console.log('🕐 AuthService: Obteniendo mis horarios completos...');
      
      const currentUser = AuthService.getCurrentUser(); // ✅ Usar AuthService en lugar de this
      if (!currentUser || !currentUser.usu_id) {
        return null;
      }

      const result = await adminService.horariosUsuarios.getMisHorarios(params);
      
      if (result.status === 'success' && result.data) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ AuthService: Error obteniendo mis horarios:', error);
      return null;
    }
  },

  // ✅ CORREGIDO: Obtener horario efectivo para una fecha específica
  getEffectiveScheduleForDate: async (fecha) => {
    try {
      console.log('🕐 AuthService: Obteniendo horario efectivo para fecha:', fecha);
      
      const currentUser = AuthService.getCurrentUser(); // ✅ Usar AuthService en lugar de this
      if (!currentUser || !currentUser.usu_id) {
        return null;
      }

      const result = await adminService.horariosUsuarios.getHorarioEfectivoFecha(
        currentUser.usu_id, 
        fecha
      );
      
      if (result.status === 'success' && result.data) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ AuthService: Error obteniendo horario efectivo:', error);
      return null;
    }
  },

  // ✅ Extraer información de horario del usuario (compatibilidad)
  getScheduleInfo: () => {
    try {
      const userData = apiAuth.getUserData();
      return userData?.horario_info || null;
    } catch (error) {
      console.error('Error obteniendo info de horario:', error);
      return null;
    }
  },

  // ✅ CORREGIDO: Verificar si el usuario es super admin
  isSuperAdmin: () => {
    try {
      const currentUser = AuthService.getCurrentUser(); // ✅ Usar AuthService en lugar de this
      return currentUser?.es_super_admin === true || currentUser?.per_id === 3;
    } catch (error) {
      console.error('Error verificando super admin:', error);
      return false;
    }
  },

  // ✅ CORREGIDO: Obtener resumen de estado de horario
  getScheduleStatus: async () => {
    try {
      const currentUser = AuthService.getCurrentUser(); // ✅ Usar AuthService en lugar de this
      if (!currentUser) {
        return {
          estado: 'NO_AUTENTICADO',
          mensaje: 'Usuario no autenticado',
          puede_acceder: false
        };
      }

      // Super admins no tienen restricciones
      if (AuthService.isSuperAdmin()) { // ✅ Usar AuthService en lugar de this
        return {
          estado: 'SUPER_ADMIN',
          mensaje: 'Sin restricciones de horario',
          puede_acceder: true,
          es_super_admin: true
        };
      }

      const horarioInfo = await AuthService.getMyScheduleInfo(); // ✅ Usar AuthService en lugar de this
      
      if (!horarioInfo) {
        return {
          estado: 'SIN_HORARIO',
          mensaje: 'Sin configuración de horario',
          puede_acceder: false
        };
      }

      return {
        estado: horarioInfo.puede_acceder ? 'DENTRO_HORARIO' : 'FUERA_HORARIO',
        mensaje: horarioInfo.message || horarioInfo.mensaje || 'Estado obtenido',
        puede_acceder: horarioInfo.puede_acceder || false,
        horario_detalle: horarioInfo.horario_detalle || null,
        tiempo_restante: horarioInfo.tiempo_restante_minutos || null,
        alerta_cierre: horarioInfo.alerta_cierre_proximo || false
      };
    } catch (error) {
      console.error('❌ AuthService: Error obteniendo estado de horario:', error);
      return {
        estado: 'ERROR',
        mensaje: 'Error verificando horario',
        puede_acceder: true
      };
    }
  },

  // ✅ Método para probar diferentes contraseñas (SOLO para debugging)
  testPasswords: async (email, passwords = ['123456', 'password', 'admin', 'test123']) => {
    console.log(`🧪 Probando contraseñas para ${email}...`);

    for (const password of passwords) {
      try {
        console.log(`🔑 Probando: "${password}"`);
        const result = await AuthService.login(email, password); // ✅ Usar AuthService en lugar de this

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
  }
};

export default AuthService;