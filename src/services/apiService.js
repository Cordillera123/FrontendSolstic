// services/apiService.js
import axios from 'axios';

// Configuración base de axios - IMPORTANTE: Usar la misma URL en todo el sistema
const API_BASE_URL = 'http://192.168.200.47:8000/api'; // Cambiar por tu URL correcta

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

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si el token expiró, limpiar localStorage y redirigir al login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_permissions');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== SERVICIOS DE AUTENTICACIÓN =====
export const authService = {
  // Login
  async login(credentials) {
    try {
      const response = await apiClient.post('/login', {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.data?.access_token) {
        // Guardar token y datos del usuario
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        localStorage.setItem('user_permissions', JSON.stringify(response.data.permisos));

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
      return {
        success: false,
        message: error.response?.data?.message || 'Error de conexión',
        errors: error.response?.data?.errors || {},
      };
    }
  },

  // Logout
  async logout() {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar localStorage independientemente del resultado
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_permissions');
    }
  },

  // Obtener información del usuario actual
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/user');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener usuario',
      };
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  },

  // Obtener datos del usuario desde localStorage
  getUserData() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  // Obtener permisos del usuario desde localStorage
  getUserPermissions() {
    const permissions = localStorage.getItem('user_permissions');
    return permissions ? JSON.parse(permissions) : [];
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

  // ===== USUARIOS - NUEVO =====
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

    // ===== MÉTODOS DE PERMISOS (si los implementas más tarde) =====
    
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

  // ===== PERFILES - ACTUALIZADO =====
  perfiles: {
    async getAll() {
      try {
        const response = await apiClient.get('/perfiles');
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    async getById(id) {
      try {
        const response = await apiClient.get(`/perfiles/${id}`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    async create(data) {
      try {
        const response = await apiClient.post('/perfiles', data);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    async update(id, data) {
      try {
        const response = await apiClient.put(`/perfiles/${id}`, data);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    async delete(id) {
      try {
        const response = await apiClient.delete(`/perfiles/${id}`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    // Obtener usuarios de un perfil
    async getUsuarios(id) {
      try {
        const response = await apiClient.get(`/perfiles/${id}/usuarios`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },
  },

  // ===== ESTADOS - NUEVO =====
  estados: {
    async getAll() {
      try {
        const response = await apiClient.get('/estados');
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    async getById(id) {
      try {
        const response = await apiClient.get(`/estados/${id}`);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    async create(data) {
      try {
        const response = await apiClient.post('/estados', data);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    async update(id, data) {
      try {
        const response = await apiClient.put(`/estados/${id}`, data);
        return response.data;
      } catch (error) {
        throw apiUtils.handleApiError(error);
      }
    },

    async delete(id) {
      try {
        const response = await apiClient.delete(`/estados/${id}`);
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
  },
};

// ===== UTILIDADES =====
export const apiUtils = {
  // Manejar errores de API
  handleApiError(error) {
    if (error.response) {
      // El servidor respondió con un código de estado de error
      return {
        message: error.response.data?.message || 'Error del servidor',
        status: error.response.status,
        errors: error.response.data?.errors || {},
      };
    } else if (error.request) {
      // La request se hizo pero no se recibió respuesta
      return {
        message: 'Error de conexión con el servidor',
        status: 0,
      };
    } else {
      // Algo pasó configurando la request
      return {
        message: 'Error inesperado',
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