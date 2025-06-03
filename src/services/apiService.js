// services/apiService.js - CORREGIDO SIN RECARGAS
import axios from 'axios';

// Configuración base de axios
const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Cambiar por tu URL correcta

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

// ✅ INTERCEPTOR CORREGIDO - SIN REDIRECCIÓN AUTOMÁTICA
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ CRÍTICO: NO redirigir automáticamente
    // Dejar que el AuthContext maneje los errores 401
    if (error.response?.status === 401) {
      console.log('🔒 apiService: Token inválido detectado, será manejado por AuthContext');
      // ✅ Solo limpiar localStorage, SIN redirigir
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_permissions');
      
      // ✅ NO hacer window.location.href = '/login'
      // El AuthContext y React Router manejarán la navegación
    }
    
    // ✅ Siempre rechazar el error para que lo manejen los componentes
    return Promise.reject(error);
  }
);

// ===== SERVICIOS DE AUTENTICACIÓN CORREGIDOS =====
export const authService = {
  // ✅ Login corregido con mejor manejo de errores
  async login(credentials) {
    try {
      console.log('📡 apiService.login: Enviando request...');
      
      const response = await apiClient.post('/login', {
        email: credentials.email,
        password: credentials.password,
      });

      console.log('📥 apiService.login: Respuesta recibida:', response.status);

      if (response.data?.access_token) {
        console.log('✅ apiService.login: Token recibido, guardando datos...');
        
        // Guardar token y datos del usuario
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        localStorage.setItem('user_permissions', JSON.stringify(response.data.permisos || []));

        return {
          success: true,
          data: response.data,
        };
      }

      console.log('❌ apiService.login: No se recibió token');
      return {
        success: false,
        message: response.data?.message || 'Error en el login',
      };
      
    } catch (error) {
      console.error('❌ apiService.login: Error capturado:', error);
      
      // ✅ Mejorar el manejo de errores específicos
      let errorMessage = 'Error de conexión';
      let errorDetails = {};
      
      if (error.response) {
        // Error del servidor
        console.log('📍 Error del servidor:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Error del servidor (${error.response.status})`;
        errorDetails = error.response.data?.errors || {};
        
        // ✅ Mensajes específicos por código de estado
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
          case 429:
            errorMessage = 'Demasiados intentos. Espere unos minutos';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
          default:
            errorMessage = error.response.data?.message || `Error ${error.response.status}`;
        }
      } else if (error.request) {
        // Error de red
        console.log('📍 Error de red:', error.request);
        errorMessage = 'Error de conexión con el servidor';
      } else {
        // Error de configuración
        console.log('📍 Error de configuración:', error.message);
        errorMessage = 'Error inesperado';
      }

      return {
        success: false,
        message: errorMessage,
        errors: errorDetails,
      };
    }
  },

  // ✅ Logout corregido
  async logout() {
    try {
      console.log('🚪 apiService.logout: Cerrando sesión...');
      await apiClient.post('/logout');
      console.log('✅ apiService.logout: Logout exitoso en servidor');
    } catch (error) {
      console.error('❌ apiService.logout: Error en servidor:', error);
      // Continuar con la limpieza local aunque falle el servidor
    } finally {
      // ✅ Siempre limpiar localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_permissions');
      console.log('🧹 apiService.logout: LocalStorage limpiado');
    }
  },

  // ✅ Obtener información del usuario actual
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/user');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener usuario',
      };
    }
  },

  // ✅ Verificar si el usuario está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    return !!(token && userData);
  },

  // ✅ Obtener datos del usuario desde localStorage
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

  // ✅ Obtener permisos del usuario desde localStorage
  getUserPermissions() {
    try {
      const permissions = localStorage.getItem('user_permissions');
      return permissions ? JSON.parse(permissions) : [];
    } catch (error) {
      console.error('Error parseando user_permissions:', error);
      localStorage.removeItem('user_permissions');
      return [];
    }
  },
};

// ===== SERVICIOS DE ICONOS =====
export const iconService = {
  // Obtener todos los iconos
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

  // Obtener iconos por categoría
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
  },
};

// ===== SERVICIOS DE MENÚ =====
export const menuService = {
  // Obtener menú del usuario
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

  // Actualizar configuración de ventana directa para menú
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

  // Actualizar configuración de ventana directa para submenú
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

  // Actualizar componente de opción
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
  },
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
    },
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
    },
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
    },
  },

  // ===== USUARIOS =====
  usuarios: {
    // Listar usuarios con filtros
    async getAll(params = {}) {
      try {
        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ? `/usuarios?${queryString}` : '/usuarios';
        const response = await apiClient.get(url);
        return {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Obtener usuario específico
    async getById(id) {
      try {
        const response = await apiClient.get(`/usuarios/${id}`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Crear usuario
    async create(data) {
      try {
        const response = await apiClient.post('/usuarios', data);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Actualizar usuario
    async update(id, data) {
      try {
        const response = await apiClient.put(`/usuarios/${id}`, data);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Eliminar usuario
    async delete(id) {
      try {
        const response = await apiClient.delete(`/usuarios/${id}`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Habilitar/Deshabilitar usuario
    async toggleStatus(id) {
      try {
        const response = await apiClient.put(`/usuarios/${id}/toggle-status`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Cambiar contraseña
    async changePassword(id, passwordData) {
      try {
        const response = await apiClient.post(`/usuarios/${id}/change-password`, passwordData);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Restablecer contraseña (admin)
    async resetPassword(id, passwordData) {
      try {
        const response = await apiClient.post(`/usuarios/${id}/reset-password`, passwordData);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Obtener opciones para formularios
    async getFormOptions() {
      try {
        const response = await apiClient.get('/usuarios-form-options');
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Obtener permisos del usuario
    async getPermissions(id) {
      try {
        const response = await apiClient.get(`/usuarios/${id}/permissions`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Obtener permisos detallados del usuario
    async getPermissionsDetail(id) {
      try {
        const response = await apiClient.get(`/usuarios/${id}/permissions-detail`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Asignar permisos específicos al usuario
    async assignPermissions(id, permissionsData) {
      try {
        const response = await apiClient.post(`/usuarios/${id}/assign-permissions`, permissionsData);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Obtener permisos activos del usuario
    async getActivePermissions(id) {
      try {
        const response = await apiClient.get(`/usuarios/${id}/active-permissions`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Copiar permisos entre usuarios
    async copyPermissions(id, copyData) {
      try {
        const response = await apiClient.post(`/usuarios/${id}/copy-permissions`, copyData);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },
  },

  // ===== PERMISOS =====
  permissions: {
    // Obtener todos los perfiles
    async getProfiles() {
      try {
        const response = await apiClient.get('/permissions/profiles');
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Obtener estructura de menús con permisos para un perfil
    async getMenuStructureWithPermissions(perfilId) {
      try {
        const response = await apiClient.get(`/permissions/menu-structure/${perfilId}`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Alternar permiso específico
    async togglePermission(permissionData) {
      try {
        const response = await apiClient.post('/permissions/toggle', permissionData);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Asignación masiva de permisos
    async bulkAssignPermissions(data) {
      try {
        const response = await apiClient.post('/permissions/bulk-assign', data);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Copiar permisos entre perfiles
    async copyPermissions(data) {
      try {
        const response = await apiClient.post('/permissions/copy', data);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Obtener resumen de permisos
    async getPermissionsSummary() {
      try {
        const response = await apiClient.get('/permissions/summary');
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    }
  }
};

// ===== UTILIDADES =====
export const apiUtils = {
  // ✅ Manejar errores de API mejorado
  handleApiError(error) {
    console.error('🔍 apiUtils.handleApiError:', error);
    
    if (error.response) {
      // El servidor respondió con un código de estado de error
      const errorData = {
        message: error.response.data?.message || 'Error del servidor',
        status: error.response.status,
        errors: error.response.data?.errors || {},
      };
      
      console.log('📍 Error del servidor:', errorData);
      return errorData;
    } else if (error.request) {
      // La request se hizo pero no se recibió respuesta
      console.log('📍 Error de red:', error.request);
      return {
        message: 'Error de conexión con el servidor',
        status: 0,
      };
    } else {
      // Algo pasó configurando la request
      console.log('📍 Error de configuración:', error.message);
      return {
        message: error.message || 'Error inesperado',
        status: -1,
      };
    }
  },

  // Construir query params
  buildQueryParams(params) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    return query.toString();
  },
};

export default apiClient;