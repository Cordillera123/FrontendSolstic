// services/apiService.js - COMPLETAMENTE CORREGIDO Y OPTIMIZADO

import axios from 'axios';

// Configuración base de axios
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar token a las requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🔒 apiService: Token inválido detectado');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_permissions');
    }
    return Promise.reject(error);
  }
);

// ===== UTILIDADES =====
export const apiUtils = {
  handleApiError(error) {
    console.error('🔍 apiUtils.handleApiError:', error);

    if (error.response) {
      const errorData = {
        message: error.response.data?.message || 'Error del servidor',
        status: error.response.status,
        errors: error.response.data?.errors || {},
      };
      return errorData;
    } else if (error.request) {
      return {
        message: 'Error de conexión con el servidor',
        status: 0,
      };
    } else {
      return {
        message: error.message || 'Error inesperado',
        status: -1,
      };
    }
  },

  buildQueryParams(params) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    return query.toString();
  }
};

// ===== SERVICIOS DE AUTENTICACIÓN =====
export const authService = {
  async login(credentials) {
    try {
      const response = await apiClient.post('/login', {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.data?.access_token) {
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        localStorage.setItem('user_permissions', JSON.stringify(response.data.permisos || []));

        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Error en el login',
      };
    } catch (error) {
      let errorMessage = 'Error de conexión';

      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Credenciales inválidas';
            break;
          case 403:
            errorMessage = 'Usuario inactivo o sin permisos';
            break;
          case 422:
            errorMessage = error.response.data?.message || 'Datos inválidos';
            break;
          default:
            errorMessage = error.response.data?.message || `Error ${error.response.status}`;
        }
      }

      return {
        success: false,
        message: errorMessage,
        errors: error.response?.data?.errors || {},
      };
    }
  },

  async logout() {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_permissions');
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    return !!(token && userData);
  },

  getUserData() {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parseando user_data:', error);
      localStorage.removeItem('user_data');
      return null;
    }
  },

  getUserPermissions() {
    try {
      const permissions = localStorage.getItem('user_permissions');
      return permissions ? JSON.parse(permissions) : [];
    } catch (error) {
      console.error('Error parseando user_permissions:', error);
      localStorage.removeItem('user_permissions');
      return [];
    }
  }
};

// ===== SERVICIOS DE ICONOS =====
export const iconService = {
  async getAllIcons() {
    try {
      const response = await apiClient.get('/icons');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener iconos',
      };
    }
  },

  async getIconsByCategory(category) {
    try {
      const response = await apiClient.get(`/icons/category/${category}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener iconos por categoría',
      };
    }
  }
};

// ===== SERVICIOS DE MENÚ =====
export const menuService = {
  async getUserMenu() {
    try {
      const response = await apiClient.get('/user-menu');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener menú del usuario',
      };
    }
  },

  async toggleMenuDirectWindow(menuId, config) {
    try {
      const response = await apiClient.put(`/menu/${menuId}/direct-window`, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar configuración de menú',
      };
    }
  },

  async toggleSubmenuDirectWindow(submenuId, config) {
    try {
      const response = await apiClient.put(`/submenu/${submenuId}/direct-window`, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar configuración de submenú',
      };
    }
  },

  async updateOptionComponent(optionId, config) {
    try {
      const response = await apiClient.put(`/option/${optionId}/component`, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar componente de opción',
      };
    }
  }
};

// ===== SERVICIOS CRUD PARA ADMINISTRACIÓN =====
export const adminService = {
  // Menús
  menus: {
    async getAll() {
      const response = await apiClient.get('/menus');
      return response.data;
    },

    async getById(id) {
      const response = await apiClient.get(`/menus/${id}`);
      return response.data;
    },

    async create(data) {
      const response = await apiClient.post('/menus', data);
      return response.data;
    },

    async update(id, data) {
      const response = await apiClient.put(`/menus/${id}`, data);
      return response.data;
    },

    async delete(id) {
      const response = await apiClient.delete(`/menus/${id}`);
      return response.data;
    },

    async toggleStatus(id) {
      const response = await apiClient.put(`/menus/${id}/toggle-status`);
      return response.data;
    }
  },

  // Submenús
  submenus: {
    async getAll() {
      const response = await apiClient.get('/submenus');
      return response.data;
    },

    async getById(id) {
      const response = await apiClient.get(`/submenus/${id}`);
      return response.data;
    },

    async getByMenu(menuId) {
      const response = await apiClient.get(`/menus/${menuId}/submenus`);
      return response.data;
    },

    async create(data) {
      const response = await apiClient.post('/submenus', data);
      return response.data;
    },

    async update(id, data) {
      const response = await apiClient.put(`/submenus/${id}`, data);
      return response.data;
    },

    async delete(id) {
      const response = await apiClient.delete(`/submenus/${id}`);
      return response.data;
    },

    async toggleStatus(id) {
      const response = await apiClient.put(`/submenus/${id}/toggle-status`);
      return response.data;
    }
  },

  // Opciones
  options: {
    async getAll() {
      const response = await apiClient.get('/options');
      return response.data;
    },

    async getById(id) {
      const response = await apiClient.get(`/options/${id}`);
      return response.data;
    },

    async getBySubmenu(submenuId) {
      const response = await apiClient.get(`/submenus/${submenuId}/options`);
      return response.data;
    },

    async create(data) {
      const response = await apiClient.post('/options', data);
      return response.data;
    },

    async update(id, data) {
      const response = await apiClient.put(`/options/${id}`, data);
      return response.data;
    },

    async delete(id) {
      const response = await apiClient.delete(`/options/${id}`);
      return response.data;
    },

    async toggleStatus(id) {
      const response = await apiClient.put(`/options/${id}/toggle-status`);
      return response.data;
    }
  },

  directModules: {
    // Obtener todos los perfiles con sus módulos directos
    async getPerfilesWithDirectModules() {
      try {
        console.log('🔍 DirectModules - Obteniendo perfiles con módulos directos');
        const response = await apiClient.get('/direct-modules/perfiles');
        console.log('📥 DirectModules - Respuesta perfiles:', response.data);

        return {
          status: 'success',
          data: response.data.perfiles || [],
          message: response.data.message || 'Perfiles obtenidos correctamente'
        };
      } catch (error) {
        console.error('❌ Error obteniendo perfiles con módulos directos:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    // Obtener módulos directos para un perfil específico
    async getModulosDirectosForPerfil(perfilId) {
      try {
        console.log('🔍 DirectModules - Obteniendo módulos para perfil:', perfilId);
        const response = await apiClient.get(`/direct-modules/perfiles/${perfilId}`);
        console.log('📥 DirectModules - Módulos del perfil:', response.data);

        return {
          status: 'success',
          data: response.data.modulos_directos || [],
          perfil: response.data.perfil,
          message: response.data.message || 'Módulos obtenidos correctamente'
        };
      } catch (error) {
        console.error('❌ Error obteniendo módulos directos para perfil:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    // Toggle acceso a un módulo directo específico
    async toggleModuloDirectoAccess(perfilId, moduleData) {
      try {
        console.log('🔄 DirectModules - Toggle acceso módulo:', { perfilId, moduleData });
        const response = await apiClient.post(`/direct-modules/perfiles/${perfilId}/toggle`, moduleData);
        console.log('📥 DirectModules - Toggle resultado:', response.data);

        return {
          status: 'success',
          data: response.data.data || null,
          message: response.data.message || 'Acceso modificado correctamente'
        };
      } catch (error) {
        console.error('❌ Error en toggle módulo directo:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    // Asignación masiva de módulos directos
    async asignacionMasiva(perfilId, asignacionData) {
      try {
        console.log('🚀 DirectModules - Asignación masiva:', { perfilId, asignacionData });
        const response = await apiClient.post(`/direct-modules/perfiles/${perfilId}/asignacion-masiva`, asignacionData);
        console.log('📥 DirectModules - Resultado asignación masiva:', response.data);

        return {
          status: 'success',
          data: response.data.estadisticas || {},
          message: response.data.message || 'Asignación masiva completada'
        };
      } catch (error) {
        console.error('❌ Error en asignación masiva:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    // Copiar configuración entre perfiles
    async copiarConfiguracion(configData) {
      try {
        console.log('📋 DirectModules - Copiando configuración:', configData);
        const response = await apiClient.post('/direct-modules/copiar-configuracion', configData);
        console.log('📥 DirectModules - Resultado copia:', response.data);

        return {
          status: 'success',
          data: response.data.data || null,
          message: response.data.message || 'Configuración copiada correctamente'
        };
      } catch (error) {
        console.error('❌ Error copiando configuración:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    // Método de conveniencia para verificar si un perfil tiene acceso a un módulo
    async verificarAccesoModulo(perfilId, moduleData) {
      try {
        const result = await this.getModulosDirectosForPerfil(perfilId);
        if (result.status === 'success') {
          const modulo = result.data.find(m => 
            m.men_id === moduleData.men_id && 
            m.sub_id === moduleData.sub_id && 
            m.opc_id === moduleData.opc_id
          );
          return modulo ? modulo.tiene_acceso : false;
        }
        return false;
      } catch (error) {
        console.error('❌ Error verificando acceso módulo:', error);
        return false;
      }
    },

    // Obtener estadísticas generales de módulos directos
    async getEstadisticasGenerales() {
      try {
        const result = await this.getPerfilesWithDirectModules();
        if (result.status === 'success') {
          const perfiles = result.data;
          const estadisticas = {
            total_perfiles: perfiles.length,
            perfiles_con_acceso: perfiles.filter(p => p.estadisticas?.modulos_con_acceso > 0).length,
            promedio_modulos_por_perfil: perfiles.reduce((acc, p) => acc + (p.estadisticas?.modulos_con_acceso || 0), 0) / perfiles.length,
            total_asignaciones: perfiles.reduce((acc, p) => acc + (p.estadisticas?.modulos_con_acceso || 0), 0)
          };
          return {
            status: 'success',
            data: estadisticas
          };
        }
        throw new Error('Error obteniendo estadísticas');
      } catch (error) {
        console.error('❌ Error obteniendo estadísticas generales:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    }
  },

  // ✅ CORRECCIÓN PRINCIPAL: Usuarios con manejo robusto de respuestas
  usuarios: {
    async getAll(params = {}) {
      try {
        console.log('🔍 Usuarios API - Enviando params:', params);
        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ? `/usuarios?${queryString}` : '/usuarios';

        const response = await apiClient.get(url);
        console.log('📥 Usuarios API - Respuesta RAW:', response);
        console.log('📥 Usuarios API - Response.data:', response.data);

        // ✅ NORMALIZAR RESPUESTA: Convertir siempre al formato estándar
        let normalizedResponse = {
          status: 'success',
          data: null,
          message: 'Usuarios obtenidos correctamente'
        };

        // Verificar diferentes estructuras de respuesta del backend
        if (response.data) {
          if (response.data.status === 'success') {
            // Formato: { status: 'success', data: {...} }
            normalizedResponse.data = response.data.data;
            normalizedResponse.message = response.data.message || normalizedResponse.message;
          } else if (Array.isArray(response.data)) {
            // Formato: [array directo]
            normalizedResponse.data = response.data;
          } else if (response.data.data) {
            // Formato: { data: {...} } (paginación Laravel)
            normalizedResponse.data = response.data.data;
          } else {
            // Formato inesperado
            console.warn('⚠️ Formato de respuesta inesperado usuarios:', response.data);
            normalizedResponse.data = response.data;
          }
        }

        console.log('✅ Usuarios API - Respuesta normalizada:', normalizedResponse);
        return normalizedResponse;
      } catch (error) {
        console.error('❌ Error en usuarios.getAll:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async getById(id) {
      try {
        const response = await apiClient.get(`/usuarios/${id}`);
        return {
          status: 'success',
          data: response.data.data || response.data,
          message: 'Usuario obtenido correctamente'
        };
      } catch (error) {
        console.error('❌ Error en usuarios.getById:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async create(data) {
      try {
        console.log('🔍 Usuarios API - Creando usuario:', data);
        const response = await apiClient.post('/usuarios', data);
        console.log('📥 Usuarios API - Usuario creado:', response.data);

        return {
          status: 'success',
          data: response.data.data || response.data,
          message: response.data.message || 'Usuario creado correctamente'
        };
      } catch (error) {
        console.error('❌ Error en usuarios.create:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async update(id, data) {
      try {
        console.log('🔍 Usuarios API - Actualizando usuario:', id, data);
        const response = await apiClient.put(`/usuarios/${id}`, data);
        console.log('📥 Usuarios API - Usuario actualizado:', response.data);

        return {
          status: 'success',
          data: response.data.data || response.data,
          message: response.data.message || 'Usuario actualizado correctamente'
        };
      } catch (error) {
        console.error('❌ Error en usuarios.update:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async delete(id) {
      try {
        console.log('🔍 Usuarios API - Eliminando usuario:', id);
        const response = await apiClient.delete(`/usuarios/${id}`);
        console.log('📥 Usuarios API - Usuario eliminado:', response.data);

        return {
          status: 'success',
          data: response.data.data || null,
          message: response.data.message || 'Usuario eliminado correctamente'
        };
      } catch (error) {
        console.error('❌ Error en usuarios.delete:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async toggleStatus(id) {
      try {
        const response = await apiClient.put(`/usuarios/${id}/toggle-status`);
        return {
          status: 'success',
          data: response.data.data || response.data,
          message: response.data.message || 'Estado de usuario cambiado correctamente'
        };
      } catch (error) {
        console.error('❌ Error en usuarios.toggleStatus:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    }
  },

  // ✅ CORRECCIÓN: Perfiles con manejo robusto de respuestas
  perfiles: {
    async getAll() {
      try {
        console.log('🔍 Perfiles API - Obteniendo todos los perfiles');
        const response = await apiClient.get('/perfiles');
        console.log('📥 Perfiles API - Respuesta RAW:', response);
        console.log('📥 Perfiles API - Response.data:', response.data);

        // ✅ NORMALIZAR RESPUESTA: Convertir siempre al formato estándar
        let normalizedResponse = {
          status: 'success',
          data: null,
          message: 'Perfiles obtenidos correctamente'
        };

        // Verificar diferentes estructuras de respuesta del backend
        if (response.data) {
          if (response.data.status === 'success') {
            // Formato: { status: 'success', data: {...} }
            normalizedResponse.data = response.data.data;
            normalizedResponse.message = response.data.message || normalizedResponse.message;
          } else if (Array.isArray(response.data)) {
            // Formato: [array directo]
            normalizedResponse.data = response.data;
          } else if (response.data.data) {
            // Formato: { data: {...} } (paginación Laravel)
            normalizedResponse.data = response.data.data;
          } else {
            // Formato inesperado
            console.warn('⚠️ Formato de respuesta inesperado perfiles:', response.data);
            normalizedResponse.data = response.data;
          }
        }

        // Asegurar que data sea un array
        if (!Array.isArray(normalizedResponse.data)) {
          console.warn('⚠️ Perfiles: data no es array, convirtiendo:', normalizedResponse.data);
          normalizedResponse.data = [];
        }

        console.log('✅ Perfiles API - Respuesta normalizada:', normalizedResponse);
        return normalizedResponse;
      } catch (error) {
        console.error('❌ Error en perfiles.getAll:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async create(perfilData) {
      try {
        console.log('🔍 Perfiles API - Creando perfil:', perfilData);
        const response = await apiClient.post('/perfiles', perfilData);
        console.log('📥 Perfiles API - Perfil creado:', response.data);

        return {
          status: 'success',
          data: response.data.data || response.data,
          message: response.data.message || 'Perfil creado correctamente'
        };
      } catch (error) {
        console.error('❌ Error en perfiles.create:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async update(perfilId, perfilData) {
      try {
        console.log('🔍 Perfiles API - Actualizando perfil:', perfilId, perfilData);
        const response = await apiClient.put(`/perfiles/${perfilId}`, perfilData);
        console.log('📥 Perfiles API - Perfil actualizado:', response.data);

        return {
          status: 'success',
          data: response.data.data || response.data,
          message: response.data.message || 'Perfil actualizado correctamente'
        };
      } catch (error) {
        console.error('❌ Error en perfiles.update:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async delete(perfilId) {
      try {
        console.log('🔍 Perfiles API - Eliminando perfil:', perfilId);
        const response = await apiClient.delete(`/perfiles/${perfilId}`);
        console.log('📥 Perfiles API - Perfil eliminado:', response.data);

        return {
          status: 'success',
          data: response.data.data || null,
          message: response.data.message || 'Perfil eliminado correctamente'
        };
      } catch (error) {
        console.error('❌ Error en perfiles.delete:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    }
  },

  // ✅ CORRECCIÓN: buttonUtils con getMyMenuButtonPermissions mejorado
  buttonUtils: {
    // ✅ MÉTODO PARA OPCIONES REGULARES
    async getMyButtonPermissions(opcionId) {
      try {
        console.log('🔍 Obteniendo mis permisos de botones para opción:', opcionId);
        const response = await apiClient.get(`/my-button-permissions/${opcionId}`);
        console.log('📥 ButtonPermissions - Respuesta:', response.data);

        return {
          status: 'success',
          data: response.data.botones_permitidos || []
        };
      } catch (error) {
        console.error('❌ Error obteniendo mis permisos de botones:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          data: []
        };
      }
    },

    // ✅ MÉTODO PARA MENÚS DIRECTOS - CORRECTAMENTE UBICADO Y MEJORADO
    async getMyMenuButtonPermissions(menuId) {
      try {
        console.log('🔍 Obteniendo permisos de botones para menú directo:', menuId);
        const response = await apiClient.get(`/my-menu-button-permissions/${menuId}`);

        console.log('📥 MenuButtonPermissions - Respuesta RAW:', response);
        console.log('📥 MenuButtonPermissions - Response.data:', response.data);
        console.log('📥 MenuButtonPermissions - botones_permitidos:', response.data?.botones_permitidos);

        // ✅ NORMALIZAR RESPUESTA
        let normalizedResponse = {
          status: 'success',
          data: [],
          message: 'Permisos obtenidos correctamente'
        };

        if (response.data) {
          if (response.data.botones_permitidos && Array.isArray(response.data.botones_permitidos)) {
            normalizedResponse.data = response.data.botones_permitidos;
          } else if (Array.isArray(response.data)) {
            normalizedResponse.data = response.data;
          } else {
            console.warn('⚠️ Formato inesperado MenuButtonPermissions:', response.data);
            normalizedResponse.data = [];
          }
        }

        console.log('✅ MenuButtonPermissions - Respuesta normalizada:', normalizedResponse);
        return normalizedResponse;
      } catch (error) {
        console.error('❌ Error obteniendo permisos de menú directo:', error);
        console.error('❌ Error details:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          data: []
        };
      }
    },

    // Verificar permiso de botón para opción
    async checkButtonPermission(opcionId, buttonCode) {
      try {
        console.log('🔍 Verificando permiso de botón:', { opcionId, buttonCode });
        const response = await apiClient.post('/check-button-permission', {
          opc_id: opcionId,
          bot_codigo: buttonCode
        });

        return response.data.has_permission || false;
      } catch (error) {
        console.error('❌ Error verificando permiso de botón:', error);
        return false;
      }
    },

    // Verificar permiso de botón para menú directo
    async checkMenuButtonPermission(menuId, buttonCode) {
      try {
        console.log('🔍 Verificando permiso de botón para menú:', { menuId, buttonCode });
        const response = await apiClient.post('/check-menu-button-permission', {
          men_id: menuId,
          bot_codigo: buttonCode
        });

        return response.data.has_permission || false;
      } catch (error) {
        console.error('❌ Error verificando permiso de menú:', error);
        return false;
      }
    },

    // Verificar múltiples permisos
    async checkMultipleButtonPermissions(permissions) {
      try {
        console.log('🔍 Verificando múltiples permisos:', permissions);
        const response = await apiClient.post('/permissions/validate-multiple-buttons', {
          permissions
        });

        return {
          status: 'success',
          data: response.data.permissions || []
        };
      } catch (error) {
        console.error('❌ Error verificando múltiples permisos:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          data: []
        };
      }
    },

    // Obtener todos los permisos del usuario actual
    async getMyAllButtonPermissions() {
      try {
        console.log('🔍 Obteniendo todos mis permisos de botones');
        const response = await apiClient.get('/my-permissions');

        return {
          status: 'success',
          data: response.data.permissions || []
        };
      } catch (error) {
        console.error('❌ Error obteniendo todos mis permisos:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          data: []
        };
      }
    }
  },

  // Botones
  buttons: {
    async getAll() {
      try {
        const response = await apiClient.get('/buttons');
        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async getAllWithUsage() {
      try {
        const response = await apiClient.get('/buttons/with-usage');
        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async getByOption(opcionId) {
      try {
        const response = await apiClient.get(`/buttons/option/${opcionId}`);
        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async create(data) {
      try {
        const response = await apiClient.post('/buttons', data);
        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async update(id, data) {
      try {
        const response = await apiClient.put(`/buttons/${id}`, data);
        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async delete(id) {
      try {
        const response = await apiClient.delete(`/buttons/${id}`);
        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async toggleStatus(id) {
      try {
        const response = await apiClient.put(`/buttons/${id}/toggle-status`);
        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async assignToOption(opcionId, botonIds) {
      try {
        const response = await apiClient.post(`/buttons/assign-option/${opcionId}`, {
          boton_ids: botonIds
        });
        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    }
  },

  // Permisos de botones
  buttonPermissions: {
    async getProfileButtonPermissions(perfilId) {
      try {
        console.log('🔍 Llamando getProfileButtonPermissions con perfilId:', perfilId);
        const response = await apiClient.get(`/button-permissions/profiles/${perfilId}/direct-windows`);
        console.log('📥 Respuesta completa buttonPermissions:', response.data);

        return {
          status: 'success',
          message: response.data.message,
          menu_structure: response.data.menu_structure || [],
          perfil: response.data.perfil,
          debug_info: response.data.debug_info
        };
      } catch (error) {
        console.error('❌ Error en getProfileButtonPermissions:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async getDirectWindowsWithButtons(perfilId) {
      try {
        console.log('🔍 Obteniendo ventanas directas con botones para perfil:', perfilId);
        const response = await apiClient.get(`/button-permissions/profiles/${perfilId}/direct-windows`);

        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        console.error('❌ Error obteniendo ventanas directas:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async toggleButtonPermission(data) {
      try {
        console.log('🔄 Cambiando permiso de botón:', data);
        const response = await apiClient.post('/button-permissions/toggle', data);

        return {
          status: 'success',
          message: response.data.message
        };
      } catch (error) {
        console.error('❌ Error en toggleButtonPermission:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    }
  },

  // Permisos generales
  permissions: {
    async getProfiles() {
      try {
        const response = await apiClient.get('/permissions/profiles');
        return response.data;
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },
    async configuracionMasivaBotones(opciones = {}) {
      try {
        console.log('🚀 Configuración masiva de botones:', opciones);
        const response = await apiClient.post('/permissions/configuracion-masiva-botones', opciones);

        return {
          status: 'success',
          data: response.data.estadisticas,
          message: response.data.message
        };
      } catch (error) {
        console.error('❌ Error en configuración masiva:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async diagnosticarPerfil(perfilId) {
      try {
        console.log('🔍 Diagnosticando perfil:', perfilId);
        const response = await apiClient.get(`/perfiles/${perfilId}/diagnosticar-modulos-directos`);

        return {
          status: 'success',
          data: response.data.diagnostico,
          message: response.data.message
        };
      } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async asignarPermisosBasicos(perfilId, opciones = {}) {
      try {
        console.log('🚀 Asignando permisos básicos a perfil:', perfilId, opciones);
        const response = await apiClient.post(`/perfiles/${perfilId}/asignar-permisos-basicos`, opciones);

        return {
          status: 'success',
          data: response.data.data,
          message: response.data.message
        };
      } catch (error) {
        console.error('❌ Error asignando permisos básicos:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },
    async inicializarModulosDirectos(perfilId) {
      try {
        console.log('🚀 Inicializando módulos directos para perfil:', perfilId);
        const response = await apiClient.post(`/perfiles/${perfilId}/inicializar-modulos-directos`);

        return {
          status: 'success',
          message: response.data.message,
          data: response.data.data || response.data
        };
      } catch (error) {
        console.error('❌ Error inicializando módulos directos:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },
    async getModulosDirectosDisponibles(perfilId) {
      try {
        console.log('🔍 Obteniendo módulos directos para perfil:', perfilId);
        const response = await apiClient.get(`/perfiles/${perfilId}/modulos-directos-disponibles`);

        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        console.error('❌ Error obteniendo módulos directos:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async toggleAccesoBotones(data) {
      try {
        console.log('🔄 Toggle acceso botones:', data);
        const response = await apiClient.post(`/perfiles/${data.per_id}/toggle-acceso-botones`, {
          men_id: data.men_id,
          sub_id: data.sub_id || null,
          opc_id: data.opc_id || null,
          grant_access: data.grant_access
        });

        return {
          status: 'success',
          message: response.data.message,
          data: response.data.data
        };
      } catch (error) {
        console.error('❌ Error en toggle acceso botones:', error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },
    async getMenuStructureWithPermissions(perfilId) {
      try {
        const response = await apiClient.get(`/permissions/menu-structure/${perfilId}`);
        return response.data;
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    },

    async togglePermission(permissionData) {
      try {
        const response = await apiClient.post('/permissions/toggle', permissionData);
        return response.data;
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: 'error',
          message: apiError.message,
          errors: apiError.errors
        };
      }
    }
  }
};


export default apiClient;