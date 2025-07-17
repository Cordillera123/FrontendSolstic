// services/apiService.js - COMPLETAMENTE CORREGIDO Y OPTIMIZADO
import axios from "axios";
import { getCurrentUser } from "../context/AuthContext";

// Configuración base de axios
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor para agregar token a las requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
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
      console.log("🔒 apiService: Token inválido detectado");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("user_permissions");
    }
    return Promise.reject(error);
  }
);

// ===== UTILIDADES =====
export const apiUtils = {
  handleApiError(error) {
    console.error("🔍 apiUtils.handleApiError:", error);

    if (error.response) {
      const errorData = {
        message: error.response.data?.message || "Error del servidor",
        status: error.response.status,
        errors: error.response.data?.errors || {},
      };
      return errorData;
    } else if (error.request) {
      return {
        message: "Error de conexión con el servidor",
        status: 0,
      };
    } else {
      return {
        message: error.message || "Error inesperado",
        status: -1,
      };
    }
  },

  buildQueryParams(params) {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ""
      ) {
        query.append(key, params[key]);
      }
    });
    return query.toString();
  },
};

// ===== SERVICIOS DE AUTENTICACIÓN =====
export const authService = {
  // ✅ Iniciar sesión usando la API
  verifyActiveSchedule: async () => {
    try {
      console.log('🕐 API: Verificando horario activo del usuario...');
      
      const response = await apiClient.get('/auth/verificar-horario-activo');
      console.log('📥 API: Respuesta de verificación de horario:', response.data);

      return {
        success: response.data.status === 'success',
        data: response.data,
        message: response.data.message,
        shouldLogout: response.data.debe_cerrar_sesion || false
      };
    } catch (error) {
      console.error('❌ API: Error verificando horario activo:', error);
      
      // Manejo específico de errores de horario
      if (error.response) {
        const errorData = error.response.data;
        return {
          success: false,
          data: errorData,
          message: errorData.message || 'Error verificando horario',
          shouldLogout: errorData.debe_cerrar_sesion || false
        };
      }
      
      throw {
        status: "error",
        message: apiUtils.handleApiError(error).message,
        shouldLogout: false
      };
    }
  },
  async login(credentials) {
    try {
      const response = await apiClient.post("/login", {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.data?.access_token) {
        localStorage.setItem("auth_token", response.data.access_token);
        localStorage.setItem("user_data", JSON.stringify(response.data.user));
        localStorage.setItem(
          "user_permissions",
          JSON.stringify(response.data.permisos || [])
        );

        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        message: response.data?.message || "Error en el login",
      };
    } catch (error) {
      let errorMessage = "Error de conexión";

      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = "Credenciales inválidas";
            break;
          case 403:
            errorMessage = "Usuario inactivo o sin permisos";
            break;
          case 422:
            errorMessage = error.response.data?.message || "Datos inválidos";
            break;
          default:
            errorMessage =
              error.response.data?.message || `Error ${error.response.status}`;
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
      await apiClient.post("/logout");
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("user_permissions");
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");
    return !!(token && userData);
  },

  getUserData() {
    try {
      const userData = localStorage.getItem("user_data");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parseando user_data:", error);
      localStorage.removeItem("user_data");
      return null;
    }
  },

  getUserPermissions() {
    try {
      const permissions = localStorage.getItem("user_permissions");
      return permissions ? JSON.parse(permissions) : [];
    } catch (error) {
      console.error("Error parseando user_permissions:", error);
      localStorage.removeItem("user_permissions");
      return [];
    }
  },
};

// ===== SERVICIOS DE ICONOS =====
export const iconService = {
  async getAllIcons() {
    try {
      const response = await apiClient.get("/icons");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Error al obtener iconos",
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
        message:
          error.response?.data?.message ||
          "Error al obtener iconos por categoría",
      };
    }
  },
};

// ===== SERVICIOS DE MENÚ =====
export const menuService = {
  async getUserMenu() {
    try {
      const response = await apiClient.get("/user-menu");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Error al obtener menú del usuario",
      };
    }
  },

  async toggleMenuDirectWindow(menuId, config) {
    try {
      const response = await apiClient.put(
        `/menu/${menuId}/direct-window`,
        config
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al actualizar configuración de menú",
      };
    }
  },

  async toggleSubmenuDirectWindow(submenuId, config) {
    try {
      const response = await apiClient.put(
        `/submenu/${submenuId}/direct-window`,
        config
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al actualizar configuración de submenú",
      };
    }
  },

  async updateOptionComponent(optionId, config) {
    try {
      const response = await apiClient.put(
        `/option/${optionId}/component`,
        config
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al actualizar componente de opción",
      };
    }
  },
};

// ===== SERVICIOS CRUD PARA ADMINISTRACIÓN =====
export const adminService = {

  horariosUsuarios: {
    /**
     * Obtener horarios de un usuario específico
     * GET /api/usuarios/{usuarioId}/horarios
     */
    async getHorarios(usuarioId, params = {}) {
      try {
        console.log("🕐 HorariosUsuario API - Obteniendo horarios del usuario:", usuarioId);

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ? 
          `/usuarios/${usuarioId}/horarios?${queryString}` : 
          `/usuarios/${usuarioId}/horarios`;

        const response = await apiClient.get(url);
        console.log("📥 HorariosUsuario API - Respuesta:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horarios de usuario obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.getHorarios:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * Crear/actualizar horario personalizado para un día específico
     * POST /api/usuarios/{usuarioId}/horarios
     */
    async crearHorario(usuarioId, horarioData) {
      try {
        console.log("🕐 HorariosUsuario API - Creando horario:", { usuarioId, horarioData });

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const response = await apiClient.post(`/usuarios/${usuarioId}/horarios`, horarioData);
        console.log("📥 HorariosUsuario API - Horario creado:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horario personalizado creado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.crearHorario:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Crear/actualizar múltiples horarios de una vez
     * POST /api/usuarios/{usuarioId}/horarios/batch
     */
    async crearHorariosBatch(usuarioId, horariosData) {
      try {
        console.log("🕐 HorariosUsuario API - Creando horarios batch:", { usuarioId, horariosData });

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const response = await apiClient.post(`/usuarios/${usuarioId}/horarios/batch`, {
          horarios: horariosData.horarios || horariosData,
          sobrescribir_existentes: horariosData.sobrescribir_existentes !== false,
          validar_contra_oficina: horariosData.validar_contra_oficina !== false,
          forzar_creacion: horariosData.forzar_creacion || false
        });

        console.log("📥 HorariosUsuario API - Horarios batch creados:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horarios personalizados creados correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.crearHorariosBatch:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Clonar horarios desde la oficina del usuario
     * POST /api/usuarios/{usuarioId}/horarios/clonar-oficina
     */
    async clonarDesdeOficina(usuarioId, opciones = {}) {
      try {
        console.log("📋 HorariosUsuario API - Clonando desde oficina:", { usuarioId, opciones });

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const response = await apiClient.post(`/usuarios/${usuarioId}/horarios/clonar-oficina`, {
          sobrescribir_existentes: opciones.sobrescribir !== false,
          solo_dias_activos: opciones.soloActivos !== false,
          ajuste_minutos_entrada: opciones.ajusteEntrada || 0,
          ajuste_minutos_salida: opciones.ajusteSalida || 0
        });

        console.log("📥 HorariosUsuario API - Horarios clonados:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horarios clonados desde oficina correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.clonarDesdeOficina:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Validar si un usuario puede acceder en un momento específico
     * GET /api/usuarios/{usuarioId}/validar-acceso?fecha=YYYY-MM-DD&hora=HH:MM
     */
    async validarAcceso(usuarioId, fecha, hora) {
      try {
        console.log("🕐 HorariosUsuario API - Validando acceso:", { usuarioId, fecha, hora });

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const params = { fecha, hora };
        const queryString = apiUtils.buildQueryParams(params);
        const response = await apiClient.get(`/usuarios/${usuarioId}/validar-acceso?${queryString}`);

        console.log("📥 HorariosUsuario API - Validación:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Validación completada",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.validarAcceso:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * Obtener horario actual efectivo del usuario
     * GET /api/usuarios/{usuarioId}/horario-actual
     */
    async getHorarioActual(usuarioId) {
      try {
        console.log("🕐 HorariosUsuario API - Obteniendo horario actual:", usuarioId);

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const response = await apiClient.get(`/usuarios/${usuarioId}/horario-actual`);
        console.log("📥 HorariosUsuario API - Horario actual:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horario actual obtenido correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.getHorarioActual:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * Obtener horarios de mi usuario autenticado
     * GET /api/usuarios/me/horarios
     */
    async getMisHorarios(params = {}) {
      try {
        console.log("🕐 HorariosUsuario API - Obteniendo mis horarios");

        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ? 
          `/usuarios/me/horarios?${queryString}` : 
          `/usuarios/me/horarios`;

        const response = await apiClient.get(url);
        console.log("📥 HorariosUsuario API - Mis horarios:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Mis horarios obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.getMisHorarios:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * Obtener mi horario actual
     * GET /api/usuarios/me/horario-actual
     */
    async getMiHorarioActual() {
      try {
        console.log("🕐 HorariosUsuario API - Obteniendo mi horario actual");

        const response = await apiClient.get("/usuarios/me/horario-actual");
        console.log("📥 HorariosUsuario API - Mi horario actual:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Mi horario actual obtenido correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.getMiHorarioActual:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * Eliminar horario personalizado de un día específico
     * DELETE /api/usuarios/{usuarioId}/horarios/{diaId}
     */
    async eliminarHorario(usuarioId, diaId) {
      try {
        console.log("🗑️ HorariosUsuario API - Eliminando horario:", { usuarioId, diaId });

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        if (!diaId || isNaN(diaId) || diaId < 1 || diaId > 7) {
          throw new Error("ID de día inválido (debe ser 1-7)");
        }

        const response = await apiClient.delete(`/usuarios/${usuarioId}/horarios/${diaId}`);
        console.log("📥 HorariosUsuario API - Horario eliminado:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Horario personalizado eliminado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.eliminarHorario:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Eliminar todos los horarios personalizados de un usuario
     * DELETE /api/usuarios/{usuarioId}/horarios
     */
    async eliminarTodosLosHorarios(usuarioId) {
      try {
        console.log("🗑️ HorariosUsuario API - Eliminando todos los horarios:", usuarioId);

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const response = await apiClient.delete(`/usuarios/${usuarioId}/horarios`);
        console.log("📥 HorariosUsuario API - Todos los horarios eliminados:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Todos los horarios personalizados eliminados correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.eliminarTodosLosHorarios:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Transferir usuario a nueva oficina y reasignar horarios
     * POST /api/usuarios/{usuarioId}/transferir-oficina
     */
    async transferirOficina(usuarioId, transferData) {
      try {
        console.log("🏢 HorariosUsuario API - Transfiriendo oficina:", { usuarioId, transferData });

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const response = await apiClient.post(`/usuarios/${usuarioId}/transferir-oficina`, transferData);
        console.log("📥 HorariosUsuario API - Transferencia completada:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Usuario transferido correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.transferirOficina:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Copiar horarios de un usuario a otro
     * POST /api/usuarios/{usuarioOrigenId}/horarios/copiar/{usuarioDestinoId}
     */
    async copiarHorarios(usuarioOrigenId, usuarioDestinoId, opciones = {}) {
      try {
        console.log("📋 HorariosUsuario API - Copiando horarios:", {
          usuarioOrigenId,
          usuarioDestinoId,
          opciones
        });

        if (!usuarioOrigenId || isNaN(usuarioOrigenId)) {
          throw new Error("ID de usuario origen inválido");
        }

        if (!usuarioDestinoId || isNaN(usuarioDestinoId)) {
          throw new Error("ID de usuario destino inválido");
        }

        const response = await apiClient.post(
          `/usuarios/${usuarioOrigenId}/horarios/copiar/${usuarioDestinoId}`,
          {
            sobrescribir_existentes: opciones.sobrescribir !== false,
            validar_contra_oficina_destino: opciones.validarOficina !== false
          }
        );

        console.log("📥 HorariosUsuario API - Horarios copiados:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horarios copiados correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.copiarHorarios:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * ===== HORARIOS TEMPORALES =====
     */

    /**
     * Crear horario temporal para un usuario
     * POST /api/usuarios/{usuarioId}/horarios/temporal
     */
    async crearHorarioTemporal(usuarioId, horarioTemporalData) {
      try {
        console.log("⏰ HorariosUsuario API - Creando horario temporal:", { usuarioId, horarioTemporalData });

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const response = await apiClient.post(`/usuarios/${usuarioId}/horarios/temporal`, horarioTemporalData);
        console.log("📥 HorariosUsuario API - Horario temporal creado:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horario temporal creado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.crearHorarioTemporal:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Obtener horarios temporales de un usuario
     * GET /api/usuarios/{usuarioId}/horarios/temporales
     */
    async getHorariosTemporales(usuarioId, params = {}) {
      try {
        console.log("📅 HorariosUsuario API - Obteniendo horarios temporales:", { usuarioId, params });

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ? 
          `/usuarios/${usuarioId}/horarios/temporales?${queryString}` : 
          `/usuarios/${usuarioId}/horarios/temporales`;

        const response = await apiClient.get(url);
        console.log("📥 HorariosUsuario API - Horarios temporales:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horarios temporales obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.getHorariosTemporales:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * Eliminar horario temporal específico
     * DELETE /api/usuarios/{usuarioId}/horarios/temporal/{temporalId}
     */
    async eliminarHorarioTemporal(usuarioId, temporalId, eliminarTodoPeriodo = false) {
      try {
        console.log("🗑️ HorariosUsuario API - Eliminando horario temporal:", { usuarioId, temporalId, eliminarTodoPeriodo });

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        if (!temporalId || isNaN(temporalId)) {
          throw new Error("ID de horario temporal inválido");
        }

        const response = await apiClient.delete(`/usuarios/${usuarioId}/horarios/temporal/${temporalId}`, {
          data: { eliminar_todo_periodo: eliminarTodoPeriodo }
        });

        console.log("📥 HorariosUsuario API - Horario temporal eliminado:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Horario temporal eliminado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.eliminarHorarioTemporal:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Obtener horario efectivo para una fecha específica (incluye temporales)
     * GET /api/usuarios/{usuarioId}/horario-efectivo?fecha=YYYY-MM-DD
     */
    async getHorarioEfectivoFecha(usuarioId, fecha) {
      try {
        console.log("🕐 HorariosUsuario API - Obteniendo horario efectivo:", { usuarioId, fecha });

        if (!usuarioId || isNaN(usuarioId)) {
          throw new Error("ID de usuario inválido");
        }

        const params = { fecha };
        const queryString = apiUtils.buildQueryParams(params);
        const response = await apiClient.get(`/usuarios/${usuarioId}/horario-efectivo?${queryString}`);

        console.log("📥 HorariosUsuario API - Horario efectivo:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horario efectivo obtenido correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.getHorarioEfectivoFecha:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * ===== ESTADÍSTICAS Y UTILIDADES =====
     */

    /**
     * Obtener estadísticas de horarios personalizados
     * GET /api/horarios/usuarios/estadisticas
     */
    async getEstadisticasUsuarios(params = {}) {
      try {
        console.log("📊 HorariosUsuario API - Obteniendo estadísticas");

        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ? 
          `/horarios/usuarios/estadisticas?${queryString}` : 
          `/horarios/usuarios/estadisticas`;

        const response = await apiClient.get(url);
        console.log("📥 HorariosUsuario API - Estadísticas:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Estadísticas obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.getEstadisticasUsuarios:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * Limpiar horarios temporales vencidos
     * DELETE /api/usuarios/horarios/temporales/limpiar-vencidos
     */
    async limpiarHorariosVencidos(diasVencimiento = 30) {
      try {
        console.log("🧹 HorariosUsuario API - Limpiando horarios vencidos:", diasVencimiento);

        const response = await apiClient.delete("/usuarios/horarios/temporales/limpiar-vencidos", {
          data: { dias_vencimiento: diasVencimiento }
        });

        console.log("📥 HorariosUsuario API - Horarios vencidos limpiados:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horarios vencidos limpiados correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horariosUsuarios.limpiarHorariosVencidos:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * ===== MÉTODOS DE UTILIDAD =====
     */

    /**
     * Formatear horarios para componentes de calendario
     */
    formatHorariosParaCalendario(horariosPorDia) {
      const eventos = [];
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      horariosPorDia.forEach(dia => {
        if (dia.horario_efectivo) {
          const color = dia.origen_horario === 'TEMPORAL' ? '#f59e0b' : 
                       dia.origen_horario === 'PERSONALIZADO' ? '#10b981' : '#6b7280';

          eventos.push({
            id: `horario-usuario-${dia.dia_codigo}`,
            title: `${diasSemana[dia.dia_codigo]} - ${dia.horario_efectivo.hora_entrada} - ${dia.horario_efectivo.hora_salida}`,
            daysOfWeek: [dia.dia_codigo === 7 ? 0 : dia.dia_codigo],
            startTime: dia.horario_efectivo.hora_entrada,
            endTime: dia.horario_efectivo.hora_salida,
            backgroundColor: color,
            borderColor: color,
            textColor: '#ffffff',
            extendedProps: {
              diaData: dia,
              origen: dia.origen_horario,
              esTemporalActivo: dia.es_temporal_activo,
              prioridad: dia.prioridad_horario
            }
          });
        }
      });

      return eventos;
    },

    /**
     * Validar formato de horario temporal
     */
    validarHorarioTemporal(horarioData) {
      const errores = [];

      // Validar fechas
      if (!horarioData.fecha_inicio) {
        errores.push('Fecha de inicio es requerida');
      }

      if (!horarioData.fecha_fin) {
        errores.push('Fecha de fin es requerida');
      }

      if (horarioData.fecha_inicio && horarioData.fecha_fin) {
        const fechaInicio = new Date(horarioData.fecha_inicio);
        const fechaFin = new Date(horarioData.fecha_fin);
        
        if (fechaFin < fechaInicio) {
          errores.push('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }

      // Validar horarios
      if (!horarioData.horarios || horarioData.horarios.length === 0) {
        errores.push('Debe especificar al menos un día con horario');
      }

      // Validar motivo y tipo
      if (!horarioData.motivo || horarioData.motivo.trim().length === 0) {
        errores.push('El motivo del horario temporal es requerido');
      }

      if (!horarioData.tipo_temporal) {
        errores.push('El tipo de horario temporal es requerido');
      }

      return {
        valido: errores.length === 0,
        errores: errores
      };
    },

    /**
     * Obtener tipos de horarios temporales disponibles
     */
    getTiposTemporales() {
      return [
        { value: 'VACACIONES', label: 'Vacaciones', color: '#10b981' },
        { value: 'PERMISO_MEDICO', label: 'Permiso Médico', color: '#ef4444' },
        { value: 'PROYECTO_ESPECIAL', label: 'Proyecto Especial', color: '#3b82f6' },
        { value: 'CAPACITACION', label: 'Capacitación', color: '#8b5cf6' },
        { value: 'OTRO', label: 'Otro', color: '#6b7280' }
      ];
    }
  },

  horariosOficinas: {
    // ✅ OBTENER HORARIOS DE UNA OFICINA
    async getHorarios(oficinaId) {
      try {
        console.log("🕐 Horarios API - Obteniendo horarios de oficina:", oficinaId);

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        const response = await apiClient.get(`/oficinas/${oficinaId}/horarios`);
        console.log("📥 Horarios API - Respuesta:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horarios obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.getHorarios:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    // ✅ CREAR/ACTUALIZAR HORARIO INDIVIDUAL
    async crearHorario(oficinaId, horarioData) {
      try {
        console.log("🕐 Horarios API - Creando horario:", { oficinaId, horarioData });

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        const response = await apiClient.post(`/oficinas/${oficinaId}/horarios`, horarioData);
        console.log("📥 Horarios API - Horario creado:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horario creado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.crearHorario:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ CREAR/ACTUALIZAR MÚLTIPLES HORARIOS
    async crearHorariosBatch(oficinaId, horariosData) {
      try {
        console.log("🕐 Horarios API - Creando horarios batch:", { oficinaId, horariosData });

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        const response = await apiClient.post(`/oficinas/${oficinaId}/horarios/batch`, {
          horarios: horariosData.horarios || horariosData,
          sobrescribir_existentes: horariosData.sobrescribir_existentes !== false
        });

        console.log("📥 Horarios API - Horarios batch creados:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horarios creados correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.crearHorariosBatch:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ ELIMINAR HORARIO DE UN DÍA ESPECÍFICO
    async eliminarHorario(oficinaId, diaId) {
      try {
        console.log("🕐 Horarios API - Eliminando horario:", { oficinaId, diaId });

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        if (!diaId || isNaN(diaId) || diaId < 1 || diaId > 7) {
          throw new Error("ID de día inválido (debe ser 1-7)");
        }

        const response = await apiClient.delete(`/oficinas/${oficinaId}/horarios/${diaId}`);
        console.log("📥 Horarios API - Horario eliminado:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Horario eliminado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.eliminarHorario:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ ACTIVAR/DESACTIVAR HORARIO DE UN DÍA
    async toggleHorario(oficinaId, diaId) {
      try {
        console.log("🕐 Horarios API - Toggle horario:", { oficinaId, diaId });

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        if (!diaId || isNaN(diaId) || diaId < 1 || diaId > 7) {
          throw new Error("ID de día inválido (debe ser 1-7)");
        }

        const response = await apiClient.put(`/oficinas/${oficinaId}/horarios/${diaId}/toggle`);
        console.log("📥 Horarios API - Toggle realizado:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Estado de horario cambiado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.toggleHorario:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ OBTENER PLANTILLAS DE HORARIOS
    async getPlantillas() {
      try {
        console.log("🕐 Horarios API - Obteniendo plantillas");

        const response = await apiClient.get("/horarios/plantillas");
        console.log("📥 Horarios API - Plantillas:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Plantillas obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.getPlantillas:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: [],
        };
      }
    },

    // ✅ APLICAR PLANTILLA A OFICINA
    async aplicarPlantilla(oficinaId, plantillaId, sobrescribir = true) {
      try {
        console.log("🕐 Horarios API - Aplicando plantilla:", { oficinaId, plantillaId, sobrescribir });

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        if (!plantillaId) {
          throw new Error("ID de plantilla requerido");
        }

        const response = await apiClient.post(`/oficinas/${oficinaId}/horarios/aplicar-plantilla`, {
          plantilla_id: plantillaId,
          sobrescribir_existentes: sobrescribir
        });

        console.log("📥 Horarios API - Plantilla aplicada:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Plantilla aplicada correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.aplicarPlantilla:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ COPIAR HORARIOS ENTRE OFICINAS
    async copiarHorarios(oficinaOrigenId, oficinaDestinoId, opciones = {}) {
      try {
        console.log("🕐 Horarios API - Copiando horarios:", {
          oficinaOrigenId,
          oficinaDestinoId,
          opciones
        });

        if (!oficinaOrigenId || isNaN(oficinaOrigenId)) {
          throw new Error("ID de oficina origen inválido");
        }

        if (!oficinaDestinoId || isNaN(oficinaDestinoId)) {
          throw new Error("ID de oficina destino inválido");
        }

        const response = await apiClient.post(
          `/oficinas/${oficinaOrigenId}/horarios/copiar/${oficinaDestinoId}`,
          {
            sobrescribir_existentes: opciones.sobrescribir !== false,
            copiar_solo_activos: opciones.soloActivos || false
          }
        );

        console.log("📥 Horarios API - Horarios copiados:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Horarios copiados correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.copiarHorarios:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ OBTENER VISTA CALENDARIO
    async getCalendario(oficinaId, mes = null, anio = null) {
      try {
        console.log("🕐 Horarios API - Obteniendo calendario:", { oficinaId, mes, anio });

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        const params = {};
        if (mes) params.mes = mes;
        if (anio) params.anio = anio;

        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ?
          `/oficinas/${oficinaId}/calendario?${queryString}` :
          `/oficinas/${oficinaId}/calendario`;

        const response = await apiClient.get(url);
        console.log("📥 Horarios API - Calendario:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Calendario obtenido correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.getCalendario:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    // ✅ VERIFICAR CONFLICTOS
    async verificarConflictos(oficinaId) {
      try {
        console.log("🕐 Horarios API - Verificando conflictos:", oficinaId);

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        const response = await apiClient.get(`/oficinas/${oficinaId}/verificar-conflictos`);
        console.log("📥 Horarios API - Conflictos:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Verificación completada",
        };
      } catch (error) {
        console.error("❌ Error en horarios.verificarConflictos:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    // ✅ OBTENER ESTADÍSTICAS GENERALES
    async getEstadisticasGenerales() {
      try {
        console.log("🕐 Horarios API - Obteniendo estadísticas generales");

        const response = await apiClient.get("/horarios/estadisticas");
        console.log("📥 Horarios API - Estadísticas:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Estadísticas obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.getEstadisticasGenerales:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    // ✅ VALIDAR HORARIO ESPECÍFICO
    async validarHorario(oficinaId, fecha, hora) {
      try {
        console.log("🕐 Horarios API - Validando horario:", { oficinaId, fecha, hora });

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        const params = { fecha, hora };
        const queryString = apiUtils.buildQueryParams(params);
        const response = await apiClient.get(`/oficinas/${oficinaId}/validar-horario?${queryString}`);

        console.log("📥 Horarios API - Validación:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Validación completada",
        };
      } catch (error) {
        console.error("❌ Error en horarios.validarHorario:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    // ✅ OBTENER PRÓXIMOS HORARIOS
    async getProximosHorarios(oficinaId, dias = 7) {
      try {
        console.log("🕐 Horarios API - Obteniendo próximos horarios:", { oficinaId, dias });

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        const params = { dias };
        const queryString = apiUtils.buildQueryParams(params);
        const response = await apiClient.get(`/oficinas/${oficinaId}/proximos-horarios?${queryString}`);

        console.log("📥 Horarios API - Próximos horarios:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Próximos horarios obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.getProximosHorarios:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    // ✅ ELIMINAR TODOS LOS HORARIOS DE UNA OFICINA
    async eliminarTodosLosHorarios(oficinaId) {
      try {
        console.log("🕐 Horarios API - Eliminando todos los horarios:", oficinaId);

        if (!oficinaId || isNaN(oficinaId)) {
          throw new Error("ID de oficina inválido");
        }

        const response = await apiClient.delete(`/oficinas/${oficinaId}/horarios`);
        console.log("📥 Horarios API - Todos los horarios eliminados:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Todos los horarios eliminados correctamente",
        };
      } catch (error) {
        console.error("❌ Error en horarios.eliminarTodosLosHorarios:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ MÉTODOS DE UTILIDAD

    // Formatear horarios para FullCalendar
    formatHorariosParaCalendar(horariosPorDia) {
      const eventos = [];
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      horariosPorDia.forEach(dia => {
        if (dia.tiene_horario) {
          eventos.push({
            id: `horario-${dia.dia_codigo}`,
            title: `${diasSemana[dia.dia_codigo]} - ${dia.formato_visual}`,
            daysOfWeek: [dia.dia_codigo === 7 ? 0 : dia.dia_codigo], // FullCalendar usa 0=Domingo
            startTime: dia.hora_inicio,
            endTime: dia.hora_fin,
            backgroundColor: dia.activo ? '#10b981' : '#ef4444',
            borderColor: dia.activo ? '#059669' : '#dc2626',
            textColor: '#ffffff',
            extendedProps: {
              diaData: dia,
              activo: dia.activo,
              jornada: dia.jornada
            }
          });
        }
      });

      return eventos;
    },

    // Convertir datos de FullCalendar a formato API
    convertirEventoCalendarToAPI(evento, diaCode) {
      return {
        dia_codigo: diaCode,
        hora_inicio: evento.startTime || '08:00',
        hora_fin: evento.endTime || '17:00',
        activo: true
      };
    },

    // Validar formato de horario
    validarFormatoHorario: (horaInicio, horaFin) => {
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!horaRegex.test(horaInicio)) {
      return { valido: false, error: 'Formato de hora de inicio inválido (debe ser HH:MM)' };
    }
    
    if (!horaRegex.test(horaFin)) {
      return { valido: false, error: 'Formato de hora de fin inválido (debe ser HH:MM)' };
    }

    // Convertir a minutos para comparar
    const convertirAMinutos = (hora) => {
      const [horas, minutos] = hora.split(':').map(Number);
      return horas * 60 + minutos;
    };

    const minutosInicio = convertirAMinutos(horaInicio);
    const minutosFin = convertirAMinutos(horaFin);

    // Permitir horarios que cruzan medianoche
    if (minutosInicio >= minutosFin) {
      const diferenciaMinutos = (24 * 60 - minutosInicio) + minutosFin;
      if (diferenciaMinutos < 60) {
        return { valido: false, error: 'El horario debe tener al menos 1 hora de duración' };
      }
      if (diferenciaMinutos > 18 * 60) {
        return { valido: false, error: 'El horario no puede durar más de 18 horas' };
      }
    } else {
      const diferenciaMinutos = minutosFin - minutosInicio;
      if (diferenciaMinutos < 60) {
        return { valido: false, error: 'El horario debe tener al menos 1 hora de duración' };
      }
      if (diferenciaMinutos > 18 * 60) {
        return { valido: false, error: 'El horario no puede durar más de 18 horas' };
      }
    }

    return { valido: true };
  },
  },
  configuraciones: {
    // Obtener todas las configuraciones
    getAll: async () => {
      try {
        const response = await apiClient.get("/configs");
        return response.data;
      } catch (error) {
        console.error("Error obteniendo configuraciones:", error);
        throw error;
      }
    },

    // Obtener configuración por ID
    getById: async (id) => {
      try {
        const response = await apiClient.get(`/configs/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Error obteniendo configuración ${id}:`, error);
        throw error;
      }
    },

    // Crear nueva configuración
    create: async (data) => {
      try {
        const response = await apiClient.post("/configs", data);
        return response.data;
      } catch (error) {
        console.error("Error creando configuración:", error);
        throw error;
      }
    },

    // Actualizar configuración
    update: async (id, data) => {
      try {
        const response = await apiClient.put(`/configs/${id}`, data);
        return response.data;
      } catch (error) {
        console.error(`🚨 Error actualizando configuración ${id}:`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    },

    // Eliminar configuración
    delete: async (id) => {
      try {
        const response = await apiClient.delete(`/configs/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Error eliminando configuración ${id}:`, error);
        throw error;
      }
    },

    // Obtener configuración por nombre (método específico)
    getByName: async (configName) => {
      try {
        console.log(`🔍 Obteniendo configuración por nombre: ${configName}`);
        const response = await apiClient.get(`/configs`, {
          params: { conf_nom: configName },
        });

        console.log(`📥 Respuesta de configuración ${configName}:`, response.data);

        // ✅ NORMALIZAR: Asegurar que siempre devolvemos el formato correcto
        let normalizedResponse = {
          status: "success",
          data: [],
          message: "Configuración obtenida correctamente"
        };

        if (response.data) {
          if (response.data.status === "success" && response.data.data) {
            normalizedResponse.data = Array.isArray(response.data.data)
              ? response.data.data
              : [response.data.data];
            normalizedResponse.message = response.data.message || normalizedResponse.message;
          } else if (Array.isArray(response.data)) {
            normalizedResponse.data = response.data;
          } else if (response.data.data) {
            normalizedResponse.data = Array.isArray(response.data.data)
              ? response.data.data
              : [response.data.data];
          }
        }

        // ✅ Si no encontramos la configuración, usar valores por defecto
        if (normalizedResponse.data.length === 0) {
          console.log(`⚠️ Configuración ${configName} no encontrada, usando valor por defecto`);

          const defaultValue = configName === 'sistema_tema_actual' ? 'blue' : '{}';

          // Fallback: devolver valor por defecto
          normalizedResponse.data = [{
            conf_nom: configName,
            conf_detalle: defaultValue
          }];
          normalizedResponse.message = "Usando valor por defecto";
        }

        console.log(`✅ Configuración ${configName} normalizada:`, normalizedResponse);
        return normalizedResponse;
      } catch (error) {
        console.error(`❌ Error obteniendo configuración ${configName}:`, error);

        // ✅ FALLBACK: Devolver valor por defecto en caso de error
        const defaultValue = configName === 'sistema_tema_actual' ? 'blue' : '{}';

        return {
          status: "success",
          data: [{
            conf_nom: configName,
            conf_detalle: defaultValue
          }],
          message: "Usando valor por defecto por error de conexión"
        };
      }
    },

    // Actualizar valor de configuración específica
    updateValue: async (configName, newValue) => {
      try {
        const response = await apiClient.patch(`/configs/update-by-name`, {
          conf_nom: configName,
          conf_detalle: newValue,
        });
        return response.data;
      } catch (error) {
        console.error(`Error actualizando valor de ${configName}:`, error);
        throw error;
      }
    },
  },

  // apiService.js - Sección oficinas CORREGIDA sin duplicados
  oficinas: {
    // ✅ MÉTODO PRINCIPAL PARA OBTENER TODAS LAS OFICINAS
    async getAll(params = {}) {
      try {
        console.log("🔍 Oficinas API - Obteniendo todas las oficinas con params:", params);

        // ✅ LIMPIAR PARÁMETROS VACÍOS
        const cleanParams = {};
        Object.keys(params).forEach(key => {
          if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
            cleanParams[key] = params[key];
          }
        });

        console.log("🔍 Oficinas API - Parámetros limpios:", cleanParams);

        const queryString = apiUtils.buildQueryParams(cleanParams);
        const url = queryString ? `/oficinas?${queryString}` : "/oficinas";

        console.log("🔍 Oficinas API - URL final:", url);

        const response = await apiClient.get(url);
        console.log("📥 Oficinas API - Respuesta:", response.data);

        // ✅ NORMALIZACIÓN: Manejar diferentes formatos de respuesta
        let normalizedResponse = {
          status: "success",
          data: null,
          message: "Oficinas obtenidas correctamente",
        };

        if (response.data) {
          if (response.data.status === "success" && response.data.data) {
            normalizedResponse.data = response.data.data;
            normalizedResponse.message = response.data.message || normalizedResponse.message;
            normalizedResponse.debug_info = response.data.debug_info;
          } else if (Array.isArray(response.data)) {
            normalizedResponse.data = response.data;
          } else if (response.data.data) {
            normalizedResponse.data = response.data.data;
          } else {
            console.warn("⚠️ Formato de respuesta inesperado:", response.data);
            normalizedResponse.data = response.data;
          }
        }

        console.log("✅ Oficinas API - Respuesta normalizada:", normalizedResponse);
        return normalizedResponse;
      } catch (error) {
        console.error("❌ Error en oficinas.getAll:", error);
        console.error("❌ Error response:", error.response?.data);
        console.error("❌ Error status:", error.response?.status);

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },


    // ✅ MÉTODO PARA OBTENER OFICINAS ACTIVAS
    async getActivas(params = {}) {
      try {
        console.log("🔍 Oficinas API - Obteniendo oficinas activas");
        const activeParams = { ...params, solo_activas: true };
        return await this.getAll(activeParams);
      } catch (error) {
        console.error("❌ Error en oficinas.getActivas:", error);
        throw error;
      }
    },

    // ✅ MÉTODO PARA LISTAR OFICINAS (para selects)
    async listar(params = {}) {
      try {
        console.log("🔍 Oficinas API - Obteniendo lista para selects:", params);

        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ? `/oficinas/listar?${queryString}` : "/oficinas/listar";

        const response = await apiClient.get(url);
        console.log("📥 Oficinas API - Lista:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data || [],
          message: response.data.message || "Lista de oficinas obtenida correctamente",
        };
      } catch (error) {
        console.error("❌ Error en oficinas.listar:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: [],
        };
      }
    },

    // ✅ MÉTODO PARA OBTENER UNA OFICINA POR ID
    async getById(id) {
      try {
        console.log("🔍 Oficinas API - Obteniendo oficina por ID:", id);

        if (!id || isNaN(id)) {
          throw new Error("ID de oficina inválido");
        }

        const response = await apiClient.get(`/oficinas/${id}`);
        console.log("📥 Oficinas API - Oficina obtenida:", response.data);

        return {
          success: response.data.status === 'success',
          data: response.data.data || response.data,
          message: response.data.message || "Oficina obtenida correctamente",
        };
      } catch (error) {
        console.error("❌ Error en oficinas.getById:", error);
        const apiError = apiUtils.handleApiError(error);
        return {
          success: false,
          data: null,
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ MÉTODO PARA CREAR OFICINA
    async create(data) {
      try {
        console.log("🔍 Oficinas API - Creando oficina:", data);

        // Validaciones básicas
        if (!data.oficin_nombre || !data.oficin_instit_codigo || !data.oficin_tofici_codigo) {
          throw new Error("Nombre, institución y tipo de oficina son requeridos");
        }

        const response = await apiClient.post("/oficinas", data);
        console.log("📥 Oficinas API - Oficina creada:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Oficina creada correctamente",
        };
      } catch (error) {
        console.error("❌ Error en oficinas.create:", error);
        console.error("❌ Error details:", error.response?.data);

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ MÉTODO PARA ACTUALIZAR OFICINA
    async update(id, data) {
      try {
        console.log("🔍 Oficinas API - Actualizando oficina:", id, data);

        if (!id || isNaN(id)) {
          throw new Error("ID de oficina inválido");
        }

        if (!data.oficin_nombre || !data.oficin_instit_codigo || !data.oficin_tofici_codigo) {
          throw new Error("Nombre, institución y tipo de oficina son requeridos");
        }

        const response = await apiClient.put(`/oficinas/${id}`, data);
        console.log("📥 Oficinas API - Oficina actualizada:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Oficina actualizada correctamente",
        };
      } catch (error) {
        console.error("❌ Error en oficinas.update:", error);
        console.error("❌ Error details:", error.response?.data);

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ MÉTODO PARA ELIMINAR OFICINA
    async delete(id) {
      try {
        console.log("🔍 Oficinas API - Eliminando oficina:", id);

        if (!id || isNaN(id)) {
          throw new Error("ID de oficina inválido");
        }

        const response = await apiClient.delete(`/oficinas/${id}`);
        console.log("📥 Oficinas API - Oficina eliminada:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Oficina eliminada correctamente",
        };
      } catch (error) {
        console.error("❌ Error en oficinas.delete:", error);
        console.error("❌ Error details:", error.response?.data);

        const apiError = apiUtils.handleApiError(error);

        let errorMessage = apiError.message;

        if (error.response?.status === 422) {
          // Error por usuarios asignados
          errorMessage = error.response.data?.message || "No se puede eliminar: la oficina tiene usuarios asignados";
        } else if (error.response?.status === 404) {
          errorMessage = "Oficina no encontrada";
        } else if (errorMessage.includes("constraint") || errorMessage.includes("foreign key")) {
          errorMessage = "No se puede eliminar: existen registros dependientes";
        }

        throw {
          status: "error",
          message: errorMessage,
          errors: apiError.errors,
        };
      }
    },

    // ✅ MÉTODO PARA OBTENER USUARIOS DE UNA OFICINA
    async getUsuarios(id, params = {}) {
      try {
        console.log("🔍 Oficinas API - Obteniendo usuarios de oficina:", id, params);

        if (!id || isNaN(id)) {
          throw new Error("ID de oficina inválido");
        }

        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ? `/oficinas/${id}/usuarios?${queryString}` : `/oficinas/${id}/usuarios`;

        const response = await apiClient.get(url);
        console.log("📥 Oficinas API - Usuarios de oficina:", response.data);

        return {
          success: response.data.status === 'success',
          data: response.data.data || response.data,
          message: response.data.message || "Usuarios de oficina obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en oficinas.getUsuarios:", error);
        const apiError = apiUtils.handleApiError(error);
        return {
          success: false,
          data: null,
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ✅ MÉTODO PARA OBTENER ESTADÍSTICAS
    async getStats() {
      try {
        console.log("🔍 Oficinas API - Obteniendo estadísticas");

        const response = await apiClient.get("/oficinas/stats");

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Estadísticas obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error obteniendo estadísticas de oficinas:", error);
        // Fallback: calcular estadísticas básicas
        try {
          const allOficinas = await this.getAll();
          return {
            status: "success",
            data: {
              total: allOficinas.data?.total || 0,
              activas: allOficinas.data?.current_page
                ? allOficinas.data.data?.filter((o) => o.oficin_ctractual === 1).length || 0
                : 0,
            },
            message: "Estadísticas básicas calculadas",
          };
        } catch (fallbackError) {
          console.error("❌ Error en fallback de estadísticas:", fallbackError);
          return {
            status: "success",
            data: { total: 0, activas: 0 },
            message: "Estadísticas no disponibles",
          };
        }
      }
    },

    // ✅ MÉTODOS DE UTILIDAD PARA FILTROS
    async getByInstitucion(institucionId, params = {}) {
      try {
        console.log("🔍 Oficinas API - Filtrando por institución:", institucionId);
        const filterParams = {
          ...params,
          instit_codigo: institucionId
        };
        return await this.getAll(filterParams);
      } catch (error) {
        console.error("❌ Error filtrando oficinas por institución:", error);
        throw error;
      }
    },

    async getByTipo(tipoId, params = {}) {
      try {
        console.log("🔍 Oficinas API - Filtrando por tipo:", tipoId);
        const filterParams = {
          ...params,
          tofici_codigo: tipoId
        };
        return await this.getAll(filterParams);
      } catch (error) {
        console.error("❌ Error filtrando oficinas por tipo:", error);
        throw error;
      }
    },

    async getByParroquia(parroquiaId, params = {}) {
      try {
        console.log("🔍 Oficinas API - Filtrando por parroquia:", parroquiaId);
        const filterParams = { ...params, parroq_codigo: parroquiaId };
        return await this.getAll(filterParams);
      } catch (error) {
        console.error("❌ Error filtrando oficinas por parroquia:", error);
        throw error;
      }
    },

    async search(searchTerm, params = {}) {
      try {
        console.log("🔍 Oficinas API - Búsqueda:", searchTerm, params);
        const searchParams = {
          ...params,
          search: searchTerm
        };
        return await this.getAll(searchParams);
      } catch (error) {
        console.error("❌ Error en búsqueda de oficinas:", error);
        throw error;
      }
    },
  },

  // ===== AGREGAR TAMBIÉN ESTOS SERVICIOS AUXILIARES =====

  // Servicios para los selects/dropdowns de oficinas
  instituciones: {
    async getAll() {
      try {
        console.log("🔍 Instituciones API - Obteniendo todas");
        const response = await apiClient.get("/instituciones");

        return {
          status: "success",
          data: response.data.data || response.data || [],
          message:
            response.data.message || "Instituciones obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error en instituciones.getAll:", error);
        console.error("❌ Response status:", error.response?.status);
        console.error("❌ Response data:", error.response?.data);

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: [],
        };
      }
    },

    async listar() {
      try {
        console.log("🔍 Instituciones API - Lista para selects");

        // ✅ CORRECCIÓN: Manejar el error 500 con fallback
        let response;
        try {
          response = await apiClient.get("/instituciones/listar");
        } catch (error) {
          if (error.response?.status === 500) {
            console.warn(
              "⚠️ Endpoint /instituciones/listar falló, intentando endpoint alternativo..."
            );
            // Intentar con el endpoint general y transformar los datos
            response = await apiClient.get("/instituciones");

            // Transformar datos al formato esperado para selects
            if (response.data) {
              const instituciones = response.data.data || response.data || [];
              const transformedData = instituciones.map((inst) => ({
                value: inst.instit_codigo,
                label: inst.instit_nombre,
              }));

              return {
                status: "success",
                data: transformedData,
                message:
                  "Lista de instituciones obtenida correctamente (fallback)",
              };
            }
          }
          throw error; // Re-lanzar si no es error 500
        }

        return {
          status: "success",
          data: response.data.data || response.data || [],
          message: "Lista de instituciones obtenida correctamente",
        };
      } catch (error) {
        console.error("❌ Error en instituciones.listar:", error);
        console.error("❌ Error completo:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });

        const apiError = apiUtils.handleApiError(error);

        // ✅ FALLBACK FINAL: Datos de ejemplo para desarrollo
        if (process.env.NODE_ENV === "development") {
          console.warn("🔄 Usando datos de fallback para desarrollo");
          return {
            status: "success",
            data: [
              { value: 1, label: "Banco Central del Ecuador" },
              { value: 2, label: "Superintendencia de Bancos" },
              { value: 3, label: "IESS" },
            ],
            message: "Datos de fallback (desarrollo)",
          };
        }

        throw {
          status: "error",
          message: apiError.message,
          data: [],
        };
      }
    },
  },

  parroquias: {
    async getAll() {
      try {
        console.log("🔍 Parroquias API - Obteniendo todas");
        const response = await apiClient.get("/parroquias");

        return {
          status: "success",
          data: response.data.data || response.data || [],
          message:
            response.data.message || "Parroquias obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error en parroquias.getAll:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: [],
        };
      }
    },

    async listar() {
      try {
        console.log("🔍 Parroquias API - Lista para selects");
        const response = await apiClient.get("/parroquias/listar");

        return {
          status: "success",
          data: response.data.data || response.data || [],
          message: "Lista de parroquias obtenida correctamente",
        };
      } catch (error) {
        console.error("❌ Error en parroquias.listar:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          data: [],
        };
      }
    },

    async getByCanton(cantonId) {
      try {
        console.log("🔍 Parroquias API - Por cantón:", cantonId);
        const response = await apiClient.get(`/parroquias/canton/${cantonId}`);

        return {
          status: "success",
          data: response.data.data || response.data || [],
          message: "Parroquias por cantón obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error en parroquias.getByCanton:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          data: [],
        };
      }
    },
  },

  cantones: {
    async getAll() {
      try {
        console.log("🔍 Cantones API - Obteniendo todos");
        const response = await apiClient.get("/cantones");

        return {
          status: "success",
          data: response.data.data || response.data || [],
          message: response.data.message || "Cantones obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en cantones.getAll:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: [],
        };
      }
    },

    async getByProvincia(provinciaId) {
      try {
        console.log("🔍 Cantones API - Por provincia:", provinciaId);
        const response = await apiClient.get(
          `/cantones/provincia/${provinciaId}`
        );

        return {
          status: "success",
          data: response.data.data || response.data || [],
          message: "Cantones por provincia obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en cantones.getByProvincia:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          data: [],
        };
      }
    },
  },

  provincias: {
    async getAll() {
      try {
        console.log("🔍 Provincias API - Obteniendo todas");
        const response = await apiClient.get("/provincias");

        return {
          status: "success",
          data: response.data.data || response.data || [],
          message:
            response.data.message || "Provincias obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error en provincias.getAll:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: [],
        };
      }
    },

    async listar() {
      try {
        console.log("🔍 Provincias API - Lista para selects");

        let response;
        try {
          response = await apiClient.get("/provincias/listar");
        } catch (error) {
          if (
            error.response?.status === 500 ||
            error.response?.status === 404
          ) {
            console.warn(
              "⚠️ Endpoint /provincias/listar falló, usando endpoint alternativo..."
            );
            response = await apiClient.get("/provincias");

            // Transformar datos
            if (response.data) {
              const provincias = response.data.data || response.data || [];
              const transformedData = provincias.map((prov) => ({
                value: prov.provin_codigo,
                label: prov.provin_nombre,
              }));

              return {
                status: "success",
                data: transformedData,
                message:
                  "Lista de provincias obtenida correctamente (fallback)",
              };
            }
          }
          throw error;
        }

        return {
          status: "success",
          data: response.data.data || response.data || [],
          message: "Lista de provincias obtenida correctamente",
        };
      } catch (error) {
        console.error("❌ Error en provincias.listar:", error);

        // Fallback para desarrollo
        if (process.env.NODE_ENV === "development") {
          return {
            status: "success",
            data: [
              { value: 1, label: "Pichincha" },
              { value: 2, label: "Guayas" },
              { value: 3, label: "Azuay" },
              { value: 4, label: "Cotopaxi" },
            ],
            message: "Datos de fallback (desarrollo)",
          };
        }

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          data: [],
        };
      }
    },
  },
  tiposOficina: {
    async getAll() {
      try {
        console.log("🔍 TiposOficina API - Obteniendo todos los tipos");

        const response = await apiClient.get("/tipos-oficina");
        console.log("📥 TiposOficina API - Respuesta:", response.data);

        // ✅ NORMALIZACIÓN MEJORADA
        let normalizedResponse = {
          status: "success",
          data: [],
          message: "Tipos de oficina obtenidos correctamente",
        };

        if (response.data) {
          if (response.data.success === true && response.data.data) {
            // Formato del TipoOficinaController: { success: true, data: [...] }
            normalizedResponse.data = Array.isArray(response.data.data)
              ? response.data.data
              : [];
            normalizedResponse.message =
              response.data.message || normalizedResponse.message;
          } else if (response.data.status === "success" && response.data.data) {
            // Formato estándar: { status: 'success', data: [...] }
            normalizedResponse.data = Array.isArray(response.data.data)
              ? response.data.data
              : [];
          } else if (Array.isArray(response.data)) {
            // Array directo
            normalizedResponse.data = response.data;
          } else {
            console.warn("⚠️ Formato inesperado TiposOficina:", response.data);
            normalizedResponse.data = [];
          }
        }

        console.log(
          "✅ TiposOficina API - Respuesta normalizada:",
          normalizedResponse
        );
        return normalizedResponse;
      } catch (error) {
        console.error("❌ Error en tiposOficina.getAll:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: [],
        };
      }
    },

    async getActivos() {
      try {
        console.log("🔍 TiposOficina API - Obteniendo tipos activos");

        const response = await apiClient.get("/tipos-oficina/activos");
        console.log("📥 TiposOficina API - Tipos activos:", response.data);

        // ✅ MANEJAR AMBOS FORMATOS DE RESPUESTA
        let data = [];
        if (response.data.success === true && response.data.data) {
          // Formato TipoOficinaController
          data = response.data.data;
        } else if (response.data.status === "success" && response.data.data) {
          // Formato estándar
          data = response.data.data;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        }

        return {
          status: "success",
          data: data || [],
          message:
            response.data.message || "Tipos activos obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en tiposOficina.getActivos:", error);

        // ✅ FALLBACK: Intentar con endpoint general
        try {
          console.warn("🔄 Intentando fallback con endpoint general...");
          const fallbackResult = await this.getAll();
          return {
            status: "success",
            data: fallbackResult.data.map((tipo) => ({
              value: tipo.tofici_codigo,
              label: tipo.tofici_descripcion,
              abreviatura: tipo.tofici_abreviatura,
            })),
            message: "Tipos activos obtenidos (fallback)",
          };
        } catch (fallbackError) {
          console.error("❌ Error en fallback tipos oficina:", fallbackError);

          // ✅ DATOS DE DESARROLLO
          if (process.env.NODE_ENV === "development") {
            return {
              status: "success",
              data: [
                { value: 1, label: "Oficina Principal", abreviatura: "PRIN" },
                { value: 2, label: "Sucursal", abreviatura: "SUC" },
                { value: 3, label: "Agencia", abreviatura: "AGE" },
              ],
              message: "Datos de fallback (desarrollo)",
            };
          }

          const apiError = apiUtils.handleApiError(error);
          throw {
            status: "error",
            message: apiError.message,
            errors: apiError.errors,
            data: [],
          };
        }
      }
    },

    async getById(id) {
      try {
        console.log("🔍 TiposOficina API - Obteniendo tipo por ID:", id);

        if (!id || isNaN(id)) {
          throw new Error("ID de tipo de oficina inválido");
        }

        const response = await apiClient.get(`/tipos-oficina/${id}`);
        console.log("📥 TiposOficina API - Tipo obtenido:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message:
            response.data.message || "Tipo de oficina obtenido correctamente",
        };
      } catch (error) {
        console.error("❌ Error en tiposOficina.getById:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async create(data) {
      try {
        console.log("🔍 TiposOficina API - Creando tipo:", data);

        if (!data.tofici_descripcion || !data.tofici_abreviatura) {
          throw new Error("Descripción y abreviatura son requeridas");
        }

        const cleanData = {
          tofici_descripcion: data.tofici_descripcion.trim(),
          tofici_abreviatura: data.tofici_abreviatura.trim().toUpperCase(),
        };

        const response = await apiClient.post("/tipos-oficina", cleanData);
        console.log("📥 TiposOficina API - Tipo creado:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message:
            response.data.message || "Tipo de oficina creado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en tiposOficina.create:", error);
        console.error("❌ Error details:", error.response?.data);

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async update(id, data) {
      try {
        console.log("🔍 TiposOficina API - Actualizando tipo:", id, data);

        if (!id || isNaN(id)) {
          throw new Error("ID de tipo de oficina inválido");
        }

        if (!data.tofici_descripcion || !data.tofici_abreviatura) {
          throw new Error("Descripción y abreviatura son requeridas");
        }

        const cleanData = {
          tofici_descripcion: data.tofici_descripcion.trim(),
          tofici_abreviatura: data.tofici_abreviatura.trim().toUpperCase(),
        };

        const response = await apiClient.put(`/tipos-oficina/${id}`, cleanData);
        console.log("📥 TiposOficina API - Tipo actualizado:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message:
            response.data.message ||
            "Tipo de oficina actualizado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en tiposOficina.update:", error);
        console.error("❌ Error details:", error.response?.data);

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async delete(id) {
      try {
        console.log("🔍 TiposOficina API - Eliminando tipo:", id);

        if (!id || isNaN(id)) {
          throw new Error("ID de tipo de oficina inválido");
        }

        const response = await apiClient.delete(`/tipos-oficina/${id}`);
        console.log("📥 TiposOficina API - Tipo eliminado:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message:
            response.data.message || "Tipo de oficina eliminado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en tiposOficina.delete:", error);
        console.error("❌ Error details:", error.response?.data);

        const apiError = apiUtils.handleApiError(error);

        let errorMessage = apiError.message;

        if (error.response?.status === 409) {
          errorMessage =
            "No se puede eliminar: existen oficinas asociadas a este tipo";
        } else if (error.response?.status === 404) {
          errorMessage = "Tipo de oficina no encontrado";
        } else if (
          errorMessage.includes("constraint") ||
          errorMessage.includes("foreign key")
        ) {
          errorMessage = "No se puede eliminar: existen registros dependientes";
        }

        throw {
          status: "error",
          message: errorMessage,
          errors: apiError.errors,
        };
      }
    },

    async checkUsage(id) {
      try {
        console.log("🔍 TiposOficina API - Verificando uso del tipo:", id);

        if (!id || isNaN(id)) {
          throw new Error("ID de tipo de oficina inválido");
        }

        const response = await apiClient.get(`/tipos-oficina/${id}/usage`);

        return {
          status: "success",
          data: response.data.data || { canDelete: true, usageCount: 0 },
          message: response.data.message || "Verificación completada",
        };
      } catch (error) {
        console.error("❌ Error verificando uso del tipo:", error);
        return {
          status: "success",
          data: { canDelete: true, usageCount: 0 },
          message: "Verificación no disponible",
        };
      }
    },

    async getStats() {
      try {
        console.log("🔍 TiposOficina API - Obteniendo estadísticas");

        const response = await apiClient.get("/tipos-oficina/stats");

        return {
          status: "success",
          data: response.data.data || response.data,
          message:
            response.data.message || "Estadísticas obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error obteniendo estadísticas:", error);
        const allTypes = await this.getAll();
        return {
          status: "success",
          data: {
            total: allTypes.data?.length || 0,
            activos: allTypes.data?.length || 0,
          },
          message: "Estadísticas básicas calculadas",
        };
      }
    },
  },
  // Menús

  menus: {
    async getAll() {
      const response = await apiClient.get("/menus");
      return response.data;
    },

    async getById(id) {
      const response = await apiClient.get(`/menus/${id}`);
      return response.data;
    },

    async create(data) {
      const response = await apiClient.post("/menus", data);
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
      const response = await apiClient.get("/submenus");
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
      const response = await apiClient.post("/submenus", data);
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
      const response = await apiClient.get("/options");
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
      const response = await apiClient.post("/options", data);
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

  directModules: {
    // Obtener todos los perfiles con sus módulos directos
    async getPerfilesWithDirectModules() {
      try {
        console.log(
          "🔍 DirectModules - Obteniendo perfiles con módulos directos"
        );
        const response = await apiClient.get("/direct-modules/perfiles");
        console.log("📥 DirectModules - Respuesta perfiles:", response.data);

        return {
          status: "success",
          data: response.data.perfiles || [],
          message: response.data.message || "Perfiles obtenidos correctamente",
        };
      } catch (error) {
        console.error(
          "❌ Error obteniendo perfiles con módulos directos:",
          error
        );
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // Obtener módulos directos para un perfil específico
    async getModulosDirectosForPerfil(perfilId) {
      try {
        console.log(
          "🔍 DirectModules - Obteniendo módulos para perfil:",
          perfilId
        );
        const response = await apiClient.get(
          `/direct-modules/perfiles/${perfilId}`
        );
        console.log("📥 DirectModules - Módulos del perfil:", response.data);

        return {
          status: "success",
          data: response.data.modulos_directos || [],
          perfil: response.data.perfil,
          message: response.data.message || "Módulos obtenidos correctamente",
        };
      } catch (error) {
        console.error(
          "❌ Error obteniendo módulos directos para perfil:",
          error
        );
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // Toggle acceso a un módulo directo específico
    async toggleModuloDirectoAccess(perfilId, moduleData) {
      try {
        console.log("🔄 DirectModules - Toggle acceso módulo:", {
          perfilId,
          moduleData,
        });
        const response = await apiClient.post(
          `/direct-modules/perfiles/${perfilId}/toggle`,
          moduleData
        );
        console.log("📥 DirectModules - Toggle resultado:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Acceso modificado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en toggle módulo directo:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // Asignación masiva de módulos directos
    async asignacionMasiva(perfilId, asignacionData) {
      try {
        console.log("🚀 DirectModules - Asignación masiva:", {
          perfilId,
          asignacionData,
        });
        const response = await apiClient.post(
          `/direct-modules/perfiles/${perfilId}/asignacion-masiva`,
          asignacionData
        );
        console.log(
          "📥 DirectModules - Resultado asignación masiva:",
          response.data
        );

        return {
          status: "success",
          data: response.data.estadisticas || {},
          message: response.data.message || "Asignación masiva completada",
        };
      } catch (error) {
        console.error("❌ Error en asignación masiva:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // Copiar configuración entre perfiles
    async copiarConfiguracion(configData) {
      try {
        console.log("📋 DirectModules - Copiando configuración:", configData);
        const response = await apiClient.post(
          "/direct-modules/copiar-configuracion",
          configData
        );
        console.log("📥 DirectModules - Resultado copia:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message:
            response.data.message || "Configuración copiada correctamente",
        };
      } catch (error) {
        console.error("❌ Error copiando configuración:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // Método de conveniencia para verificar si un perfil tiene acceso a un módulo
    async verificarAccesoModulo(perfilId, moduleData) {
      try {
        const result = await this.getModulosDirectosForPerfil(perfilId);
        if (result.status === "success") {
          const modulo = result.data.find(
            (m) =>
              m.men_id === moduleData.men_id &&
              m.sub_id === moduleData.sub_id &&
              m.opc_id === moduleData.opc_id
          );
          return modulo ? modulo.tiene_acceso : false;
        }
        return false;
      } catch (error) {
        console.error("❌ Error verificando acceso módulo:", error);
        return false;
      }
    },

    // Obtener estadísticas generales de módulos directos
    async getEstadisticasGenerales() {
      try {
        const result = await this.getPerfilesWithDirectModules();
        if (result.status === "success") {
          const perfiles = result.data;
          const estadisticas = {
            total_perfiles: perfiles.length,
            perfiles_con_acceso: perfiles.filter(
              (p) => p.estadisticas?.modulos_con_acceso > 0
            ).length,
            promedio_modulos_por_perfil:
              perfiles.reduce(
                (acc, p) => acc + (p.estadisticas?.modulos_con_acceso || 0),
                0
              ) / perfiles.length,
            total_asignaciones: perfiles.reduce(
              (acc, p) => acc + (p.estadisticas?.modulos_con_acceso || 0),
              0
            ),
          };
          return {
            status: "success",
            data: estadisticas,
          };
        }
        throw new Error("Error obteniendo estadísticas");
      } catch (error) {
        console.error("❌ Error obteniendo estadísticas generales:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },
  },

  // ✅ REEMPLAZAR la sección usuarios en tu apiService.js con este código corregido

  usuarios: {
    // ===== MÉTODOS EXISTENTES DE GESTIÓN DE USUARIOS =====
    async getAll(params = {}) {
      try {
        console.log("🔍 Usuarios API - Enviando params:", params);
        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ? `/usuarios?${queryString}` : "/usuarios";

        const response = await apiClient.get(url);
        console.log("📥 Usuarios API - Respuesta RAW:", response);
        console.log("📥 Usuarios API - Response.data:", response.data);

        // ✅ NORMALIZAR RESPUESTA: Convertir siempre al formato estándar
        let normalizedResponse = {
          status: "success",
          data: null,
          message: "Usuarios obtenidos correctamente",
        };

        // Verificar diferentes estructuras de respuesta del backend
        if (response.data) {
          if (response.data.status === "success") {
            // Formato: { status: 'success', data: {...} }
            normalizedResponse.data = response.data.data;
            normalizedResponse.message =
              response.data.message || normalizedResponse.message;
          } else if (Array.isArray(response.data)) {
            // Formato: [array directo]
            normalizedResponse.data = response.data;
          } else if (response.data.data) {
            // Formato: { data: {...} } (paginación Laravel)
            normalizedResponse.data = response.data.data;
          } else {
            // Formato inesperado
            console.warn(
              "⚠️ Formato de respuesta inesperado usuarios:",
              response.data
            );
            normalizedResponse.data = response.data;
          }
        }

        console.log(
          "✅ Usuarios API - Respuesta normalizada:",
          normalizedResponse
        );
        return normalizedResponse;
      } catch (error) {
        console.error("❌ Error en usuarios.getAll:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async getActive(params = {}) {
      try {
        console.log("🔍 Usuarios API - Obteniendo usuarios activos");
        const activeParams = { ...params, incluir_deshabilitados: false };
        return await this.getAll(activeParams);
      } catch (error) {
        console.error("❌ Error en usuarios.getActive:", error);
        throw error;
      }
    },

    async getAllIncludingDisabled(params = {}) {
      try {
        console.log(
          "🔍 Usuarios API - Obteniendo todos los usuarios (incluyendo deshabilitados)"
        );
        const allParams = { ...params, incluir_deshabilitados: true };
        return await this.getAll(allParams);
      } catch (error) {
        console.error("❌ Error en usuarios.getAllIncludingDisabled:", error);
        throw error;
      }
    },

    async getDisabled(params = {}) {
      try {
        console.log("🔍 Usuarios API - Obteniendo usuarios deshabilitados");
        const disabledParams = {
          ...params,
          incluir_deshabilitados: true,
          activo: false,
        };
        return await this.getAll(disabledParams);
      } catch (error) {
        console.error("❌ Error en usuarios.getDisabled:", error);
        throw error;
      }
    },

    async getById(id) {
      try {
        const response = await apiClient.get(`/usuarios/${id}`);
        return {
          status: "success",
          data: response.data.data || response.data,
          message: "Usuario obtenido correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.getById:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async create(data) {
      try {
        console.log("🔍 Usuarios API - Creando usuario:", data);
        const response = await apiClient.post("/usuarios", data);
        console.log("📥 Usuarios API - Usuario creado:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Usuario creado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.create:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async update(id, data) {
      try {
        console.log("🔍 Usuarios API - Actualizando usuario:", id, data);
        const response = await apiClient.put(`/usuarios/${id}`, data);
        console.log("📥 Usuarios API - Usuario actualizado:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Usuario actualizado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.update:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async delete(id) {
      try {
        console.log("🔍 Usuarios API - Desactivando usuario:", id);
        const response = await apiClient.delete(`/usuarios/${id}`);
        console.log("📥 Usuarios API - Usuario desactivado:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Usuario desactivado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.delete:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async reactivate(id) {
      try {
        console.log("🔍 Usuarios API - Reactivando usuario:", id);
        const response = await apiClient.patch(`/usuarios/${id}/reactivate`);
        console.log("📥 Usuarios API - Usuario reactivado:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Usuario reactivado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.reactivate:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async disable(id) {
      try {
        console.log("🔍 Usuarios API - Deshabilitando usuario:", id);
        return await this.delete(id);
      } catch (error) {
        console.error("❌ Error en usuarios.disable:", error);
        throw error;
      }
    },

    async enable(id) {
      try {
        console.log("🔍 Usuarios API - Habilitando usuario:", id);
        return await this.reactivate(id);
      } catch (error) {
        console.error("❌ Error en usuarios.enable:", error);
        throw error;
      }
    },

    async toggleStatus(id) {
      try {
        const response = await apiClient.put(`/usuarios/${id}/toggle-status`);
        return {
          status: "success",
          data: response.data.data || response.data,
          message:
            response.data.message || "Estado de usuario cambiado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.toggleStatus:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    isDisabled(usuario) {
      return usuario?.usu_deshabilitado === true;
    },

    isEnabled(usuario) {
      return usuario?.usu_deshabilitado === false;
    },

    async getStats() {
      try {
        console.log("🔍 Usuarios API - Obteniendo estadísticas");
        const response = await apiClient.get("/usuarios/stats");

        return {
          status: "success",
          data: response.data.data || response.data,
          message: "Estadísticas obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.getStats:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async search(searchParams) {
      try {
        console.log("🔍 Usuarios API - Búsqueda avanzada:", searchParams);
        const response = await apiClient.get("/usuarios/search", {
          params: searchParams,
        });

        return {
          status: "success",
          data: response.data.data || response.data,
          message: "Búsqueda completada correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.search:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ===== ✅ NUEVOS MÉTODOS DEL USUARIO LOGUEADO =====

    /**
     * Obtener información completa del usuario logueado
     */
    async getMe() {
      try {
        console.log(
          "🔍 Usuario API - Obteniendo información completa del usuario logueado"
        );

        const response = await apiClient.get("/usuario/me");
        console.log("📥 Usuario API - Información completa:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message:
            response.data.message ||
            "Información del usuario obtenida correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.getMe:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * Obtener información básica del usuario logueado (más rápido)
     */
    async getMeBasica() {
      try {
        console.log(
          "🔍 Usuario API - Obteniendo información básica del usuario logueado"
        );

        const response = await apiClient.get("/usuario/me/basica");
        console.log("📥 Usuario API - Información básica:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message:
            response.data.message ||
            "Información básica del usuario obtenida correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.getMeBasica:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * Obtener solo la institución del usuario logueado
     */
    async getMeInstitucion() {
      try {
        console.log(
          "🔍 Usuario API - Obteniendo institución del usuario logueado"
        );

        const response = await apiClient.get("/usuario/me/institucion");
        console.log("📥 Usuario API - Institución:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message:
            response.data.message ||
            "Institución del usuario obtenida correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.getMeInstitucion:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
     * Obtener solo la oficina del usuario logueado
     */
    async getMeOficina() {
      try {
        console.log("🔍 Usuario API - Obteniendo oficina del usuario logueado");

        const response = await apiClient.get("/usuario/me/oficina");
        console.log("📥 Usuario API - Oficina:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message:
            response.data.message ||
            "Oficina del usuario obtenida correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.getMeOficina:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
          data: null,
        };
      }
    },

    /**
   * Obtener perfiles que el usuario autenticado puede ver
   */
    async getPerfilesPermitidos() {
      try {
        console.log("🔍 Usuario API - Obteniendo perfiles permitidos");
        const response = await apiClient.get("/usuarios/perfiles-permitidos");

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Perfiles permitidos obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.getPerfilesPermitidos:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Obtener perfiles para el filtro en el listado de usuarios
     */
    async getPerfilesParaFiltro() {
      try {
        console.log("🔍 Usuario API - Obteniendo perfiles para filtro");
        const response = await apiClient.get("/usuarios/perfiles-para-filtro");

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Perfiles para filtro obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.getPerfilesParaFiltro:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Asignar permisos de visibilidad de perfiles a un usuario
     */
    async asignarPerfilVisibilidad(usuarioId, perfilesIds) {
      try {
        console.log("🔍 Usuario API - Asignando visibilidad de perfiles:", { usuarioId, perfilesIds });

        const response = await apiClient.post(
          `/usuarios/${usuarioId}/asignar-perfil-visibilidad`,
          { perfiles_ids: perfilesIds }
        );

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Visibilidad de perfiles asignada correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.asignarPerfilVisibilidad:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Obtener perfiles visibles para un usuario específico
     * NOTA: Este endpoint aún no existe en el backend, pero el frontend lo necesita
     */
    async getPerfilesVisiblesUsuario(usuarioId) {
      try {
        console.log("🔍 Usuario API - Obteniendo perfiles visibles del usuario:", usuarioId);

        const response = await apiClient.get(`/usuarios/${usuarioId}/perfiles-visibles`);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Perfiles visibles obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.getPerfilesVisiblesUsuario:", error);

        // Si el endpoint no existe (404), devolver array vacío en lugar de error
        if (error.response?.status === 404) {
          console.warn("⚠️ Endpoint perfiles-visibles no implementado, devolviendo array vacío");
          return {
            status: "success",
            data: [],
            message: "Endpoint no implementado, sin perfiles visibles configurados",
          };
        }

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    // ===== MÉTODOS HELPER PARA VISIBILIDAD =====

    /**
     * Verificar si un usuario puede ver un perfil específico
     */
    async puedeVerPerfil(usuarioId, perfilId) {
      try {
        const result = await this.getPerfilesVisiblesUsuario(usuarioId);
        if (result.status === "success" && Array.isArray(result.data)) {
          return result.data.some(perfil => perfil.per_id === perfilId);
        }
        return false;
      } catch (error) {
        console.error("❌ Error verificando visibilidad de perfil:", error);
        return false;
      }
    },

    /**
     * Obtener estadísticas de visibilidad de perfiles
     */
    async getEstadisticasVisibilidad() {
      try {
        console.log("🔍 Usuario API - Obteniendo estadísticas de visibilidad");

        // Este endpoint tampoco existe aún, pero sería útil para dashboards
        const response = await apiClient.get("/usuarios/estadisticas-visibilidad");

        return {
          status: "success",
          data: response.data.data || response.data,
          message: "Estadísticas de visibilidad obtenidas correctamente",
        };
      } catch (error) {
        console.error("❌ Error en usuarios.getEstadisticasVisibilidad:", error);

        // Devolver datos por defecto si el endpoint no existe
        if (error.response?.status === 404) {
          return {
            status: "success",
            data: {
              total_usuarios: 0,
              usuarios_con_visibilidad_configurada: 0,
              perfiles_mas_visibles: [],
            },
            message: "Endpoint no implementado, datos por defecto",
          };
        }

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },
    /**
     * ✅ MÉTODO OPTIMIZADO: Obtener resumen rápido del usuario (solo lo esencial para UI)
     * Este método procesa los datos que ya vienen del backend correctamente
     */
    async getMeResumen() {
      try {
        console.log("🔍 Usuario API - Obteniendo resumen del usuario");

        // Usar el endpoint básico que es más rápido
        const result = await this.getMeBasica();

        if (result.status === "success" && result.data) {
          const userData = result.data;

          console.log("🔍 Datos originales del backend:", userData);

          // ✅ FORMATEAR CORRECTAMENTE según la respuesta real del backend
          const resumen = {
            nombre_usuario: userData.nombre_usuario || "Usuario",
            email: userData.usu_cor || "",
            perfil: userData.perfil || "Sin perfil",
            institucion: {
              // ✅ CORREGIR: Usar los campos reales del backend
              nombre: (
                userData.institucion?.instit_nombre || "Sin institución"
              ).trim(),
              codigo: userData.institucion?.instit_codigo || null,
            },
            oficina: {
              // ✅ CORREGIR: Usar los campos reales del backend
              nombre: (userData.oficina?.oficin_nombre || "Sin oficina").trim(),
              codigo: userData.oficina?.oficin_codigo || null,
              tipo: (userData.oficina?.tipo_oficina || "").trim(),
              completa: (
                userData.oficina?.oficina_completa || "Sin oficina asignada"
              ).trim(),
            },
            tiene_oficina: userData.tiene_oficina_asignada || false,
            ubicacion_laboral: (
              userData.oficina?.oficina_completa || "Sin ubicación asignada"
            ).trim(),
          };

          console.log("✅ Usuario API - Resumen formateado:", resumen);
          return {
            status: "success",
            data: resumen,
            message: "Resumen del usuario obtenido correctamente",
          };
        }

        throw new Error("No se pudo obtener información del usuario");
      } catch (error) {
        console.error("❌ Error en usuarios.getMeResumen:", error);
        return {
          status: "error",
          message: error.message || "Error al obtener resumen del usuario",
          data: {
            nombre_usuario: "Usuario",
            email: "",
            perfil: "Sin perfil",
            institucion: { nombre: "Sin institución", codigo: null },
            oficina: {
              nombre: "Sin oficina",
              codigo: null,
              tipo: "",
              completa: "Sin oficina asignada",
            },
            tiene_oficina: false,
            ubicacion_laboral: "Sin ubicación asignada",
          },
        };
      }
    },
  },

  // ✅ CORRECCIÓN: Perfiles con manejo robusto de respuestas
  perfiles: {
    async getAll() {
      try {
        console.log("🔍 Perfiles API - Obteniendo todos los perfiles");
        const response = await apiClient.get("/perfiles");
        console.log("📥 Perfiles API - Respuesta RAW:", response);
        console.log("📥 Perfiles API - Response.data:", response.data);

        // ✅ NORMALIZAR RESPUESTA: Convertir siempre al formato estándar
        let normalizedResponse = {
          status: "success",
          data: null,
          message: "Perfiles obtenidos correctamente",
        };

        // Verificar diferentes estructuras de respuesta del backend
        if (response.data) {
          if (response.data.status === "success") {
            // Formato: { status: 'success', data: {...} }
            normalizedResponse.data = response.data.data;
            normalizedResponse.message =
              response.data.message || normalizedResponse.message;
          } else if (Array.isArray(response.data)) {
            // Formato: [array directo]
            normalizedResponse.data = response.data;
          } else if (response.data.data) {
            // Formato: { data: {...} } (paginación Laravel)
            normalizedResponse.data = response.data.data;
          } else {
            // Formato inesperado
            console.warn(
              "⚠️ Formato de respuesta inesperado perfiles:",
              response.data
            );
            normalizedResponse.data = response.data;
          }
        }

        // Asegurar que data sea un array
        if (!Array.isArray(normalizedResponse.data)) {
          console.warn(
            "⚠️ Perfiles: data no es array, convirtiendo:",
            normalizedResponse.data
          );
          normalizedResponse.data = [];
        }

        console.log(
          "✅ Perfiles API - Respuesta normalizada:",
          normalizedResponse
        );
        return normalizedResponse;
      } catch (error) {
        console.error("❌ Error en perfiles.getAll:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async create(perfilData) {
      try {
        console.log("🔍 Perfiles API - Creando perfil:", perfilData);
        const response = await apiClient.post("/perfiles", perfilData);
        console.log("📥 Perfiles API - Perfil creado:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Perfil creado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en perfiles.create:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async update(perfilId, perfilData) {
      try {
        console.log(
          "🔍 Perfiles API - Actualizando perfil:",
          perfilId,
          perfilData
        );
        const response = await apiClient.put(
          `/perfiles/${perfilId}`,
          perfilData
        );
        console.log("📥 Perfiles API - Perfil actualizado:", response.data);

        return {
          status: "success",
          data: response.data.data || response.data,
          message: response.data.message || "Perfil actualizado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en perfiles.update:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async delete(perfilId) {
      try {
        console.log("🔍 Perfiles API - Eliminando perfil:", perfilId);
        const response = await apiClient.delete(`/perfiles/${perfilId}`);
        console.log("📥 Perfiles API - Perfil eliminado:", response.data);

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Perfil eliminado correctamente",
        };
      } catch (error) {
        console.error("❌ Error en perfiles.delete:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },
  },
  // ✅ REEMPLAZA tu sección userButtonPermissions con este código actualizado

  userButtonPermissions: {
    /**
     * Obtener usuarios de un perfil específico
     */
    async getUsersByProfile(perfilId) {
      try {
        console.log(
          "🔍 UserButtonPermissions - Obteniendo usuarios del perfil:",
          perfilId
        );
        // ✅ CORRECCIÓN: URL actualizada para coincidir con las rutas
        const response = await apiClient.get(
          `/user-button-permissions/profiles/${perfilId}/users`
        );
        console.log(
          "📥 UserButtonPermissions - Usuarios del perfil:",
          response.data
        );

        return {
          status: "success",
          usuarios: response.data.usuarios || response.data.data || [],
          perfil: response.data.perfil || null,
          total_usuarios: response.data.total_usuarios || 0,
          message: response.data.message || "Usuarios obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error obteniendo usuarios del perfil:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * ✅ ACTUALIZADO: Obtener estructura de permisos de botones para un usuario
     */
    async getUserButtonPermissions(usuarioId) {
      try {
        console.log(
          "🔍 UserButtonPermissions - Obteniendo permisos del usuario:",
          usuarioId
        );

        const response = await apiClient.get(
          `/user-button-permissions/users/${usuarioId}`
        );

        console.log("📥 UserButtonPermissions - Respuesta RAW:", response);
        console.log("📥 UserButtonPermissions - Response.data:", response.data);

        if (response.data.status === "success") {
          const { usuario, menu_structure, debug_info } = response.data;

          console.log("✅ UserButtonPermissions - Usuario:", usuario);
          console.log("📊 UserButtonPermissions - Debug Info:", debug_info);
          console.log(
            "🎛️ UserButtonPermissions - Módulos accesibles:",
            menu_structure.length
          );

          // ✅ PROCESAR CORRECTAMENTE LA ESTRUCTURA DE MÓDULOS
          const processedStructure = menu_structure.map((menu) => {
            console.log(
              `📋 Procesando menú: ${menu.men_nom} (ID: ${menu.men_id})`
            );

            // Procesar botones del menú (si es ventana directa)
            const menuButtons =
              menu.botones?.map((boton) => {
                const hasPermission = boton.has_permission === true;

                console.log(
                  `  🔘 Botón ${boton.bot_codigo}: ${hasPermission ? "✅ PERMITIDO" : "❌ DENEGADO"
                  }`,
                  {
                    profile_permission: boton.profile_permission,
                    is_customized: boton.is_customized,
                    customization_type: boton.customization_type,
                    final_permission: hasPermission,
                  }
                );

                return {
                  ...boton,
                  // ✅ USAR EL PERMISO EFECTIVO CALCULADO POR EL BACKEND
                  hasPermission: hasPermission,
                  canUse: hasPermission, // Alias para compatibilidad
                  isEnabled: hasPermission, // Otro alias
                };
              }) || [];

            // Procesar submenús
            const processedSubmenus =
              menu.submenus?.map((submenu) => ({
                ...submenu,
                botones:
                  submenu.botones?.map((boton) => {
                    const hasPermission = boton.has_permission === true;
                    return {
                      ...boton,
                      hasPermission: hasPermission,
                      canUse: hasPermission,
                      isEnabled: hasPermission,
                    };
                  }) || [],
                opciones:
                  submenu.opciones?.map((opcion) => ({
                    ...opcion,
                    botones:
                      opcion.botones?.map((boton) => {
                        const hasPermission = boton.has_permission === true;
                        return {
                          ...boton,
                          hasPermission: hasPermission,
                          canUse: hasPermission,
                          isEnabled: hasPermission,
                        };
                      }) || [],
                  })) || [],
              })) || [];

            return {
              ...menu,
              botones: menuButtons,
              submenus: processedSubmenus,
            };
          });

          console.log(
            "🎯 UserButtonPermissions - Estructura procesada:",
            processedStructure
          );

          return {
            success: true,
            usuario: usuario,
            menuStructure: processedStructure,
            debugInfo: debug_info,
            // ✅ MÉTRICAS ÚTILES PARA EL FRONTEND
            summary: {
              totalModules: processedStructure.length,
              totalButtons: processedStructure.reduce((total, menu) => {
                const menuButtons = menu.botones?.length || 0;
                const submenuButtons =
                  menu.submenus?.reduce(
                    (subTotal, sub) => subTotal + (sub.botones?.length || 0),
                    0
                  ) || 0;
                return total + menuButtons + submenuButtons;
              }, 0),
              allowedButtons: processedStructure.reduce((total, menu) => {
                const menuAllowed =
                  menu.botones?.filter((b) => b.hasPermission).length || 0;
                const submenuAllowed =
                  menu.submenus?.reduce(
                    (subTotal, sub) =>
                      subTotal +
                      (sub.botones?.filter((b) => b.hasPermission).length || 0),
                    0
                  ) || 0;
                return total + menuAllowed + submenuAllowed;
              }, 0),
            },
          };
        }

        throw new Error("Respuesta inválida del servidor");
      } catch (error) {
        console.error("❌ Error al obtener permisos de usuario:", error);

        if (error.response?.status === 404) {
          throw new Error("Usuario no encontrado");
        }

        if (error.response?.status === 403) {
          throw new Error("No tienes permisos para acceder a esta información");
        }

        throw new Error(`Error al obtener permisos: ${error.message}`);
      }
    },

    /**
     * ✅ NUEVO: Obtener permisos efectivos de un usuario para DynamicActionButtons
     */
    async getUserEffectivePermissions(usuarioId, opcId) {
      try {
        console.log(
          "🔍 UserButtonPermissions - Obteniendo permisos efectivos:",
          { usuarioId, opcId }
        );
        const response = await apiClient.get(
          `/user-button-permissions/users/${usuarioId}/effective-permissions/${opcId}`
        );
        console.log(
          "📥 UserButtonPermissions - Permisos efectivos:",
          response.data
        );

        return {
          status: "success",
          data: response.data.data || [],
          user_info: response.data.user_info || null,
          message:
            response.data.message ||
            "Permisos efectivos obtenidos correctamente",
        };
      } catch (error) {
        console.error("❌ Error obteniendo permisos efectivos:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Alternar permiso específico de botón para un usuario
     */
    async toggleUserButtonPermission(data) {
      try {
        console.log("🔄 UserButtonPermissions - Alternando permiso:", data);
        const response = await apiClient.post(
          "/user-button-permissions/toggle",
          data
        );
        console.log(
          "📥 UserButtonPermissions - Resultado toggle:",
          response.data
        );

        return {
          status: "success",
          data: response.data.data || null,
          message: response.data.message || "Permiso modificado correctamente",
        };
      } catch (error) {
        console.error("❌ Error alternando permiso de usuario:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Remover personalización específica (volver a herencia del perfil)
     */
    async removeUserCustomization(data) {
      try {
        console.log(
          "🗑️ UserButtonPermissions - Removiendo personalización:",
          data
        );
        const response = await apiClient.delete(
          "/user-button-permissions/remove-customization",
          { data }
        );
        console.log(
          "📥 UserButtonPermissions - Personalización removida:",
          response.data
        );

        return {
          status: "success",
          data: response.data.data || null,
          removed: response.data.removed || false,
          message:
            response.data.message || "Personalización removida correctamente",
        };
      } catch (error) {
        console.error("❌ Error removiendo personalización:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Resetear todas las personalizaciones de un usuario
     */
    async resetUserCustomizations(usuarioId) {
      try {
        console.log(
          "🔄 UserButtonPermissions - Reseteando personalizaciones del usuario:",
          usuarioId
        );
        const response = await apiClient.delete(
          `/user-button-permissions/users/${usuarioId}/reset`
        );
        console.log(
          "📥 UserButtonPermissions - Personalizaciones reseteadas:",
          response.data
        );

        return {
          status: "success",
          customizations_removed: response.data.customizations_removed || 0,
          message:
            response.data.message ||
            "Personalizaciones reseteadas correctamente",
        };
      } catch (error) {
        console.error("❌ Error reseteando personalizaciones:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * Copiar personalizaciones entre usuarios
     */
    async copyUserCustomizations(data) {
      try {
        console.log(
          "📋 UserButtonPermissions - Copiando personalizaciones:",
          data
        );
        const response = await apiClient.post(
          "/user-button-permissions/copy",
          data
        );
        console.log(
          "📥 UserButtonPermissions - Personalizaciones copiadas:",
          response.data
        );

        return {
          status: "success",
          data: response.data.data || null,
          message:
            response.data.message || "Personalizaciones copiadas correctamente",
        };
      } catch (error) {
        console.error("❌ Error copiando personalizaciones:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * ✅ NUEVO: Verificar permiso específico de botón para un usuario
     */
    async checkUserButtonPermission(usuarioId, opcId, buttonCode) {
      try {
        console.log("🔍 UserButtonPermissions - Verificando permiso:", {
          usuarioId,
          opcId,
          buttonCode,
        });
        const response = await apiClient.post(
          `/user-button-permissions/users/${usuarioId}/check-permission`,
          {
            opc_id: opcId,
            bot_codigo: buttonCode,
          }
        );
        console.log("📥 UserButtonPermissions - Verificación:", response.data);

        return (
          response.data.status === "success" && response.data.has_permission
        );
      } catch (error) {
        console.error("❌ Error verificando permiso:", error);
        return false;
      }
    },

    /**
     * ✅ NUEVO: Verificar permiso de botón de menú para un usuario
     */
    async checkUserMenuButtonPermission(usuarioId, menuId, buttonCode) {
      try {
        console.log("🔍 UserButtonPermissions - Verificando permiso de menú:", {
          usuarioId,
          menuId,
          buttonCode,
        });
        const response = await apiClient.post(
          `/user-button-permissions/users/${usuarioId}/check-menu-permission`,
          {
            men_id: menuId,
            bot_codigo: buttonCode,
          }
        );
        console.log(
          "📥 UserButtonPermissions - Verificación de menú:",
          response.data
        );

        return (
          response.data.status === "success" && response.data.has_permission
        );
      } catch (error) {
        console.error("❌ Error verificando permiso de menú:", error);
        return false;
      }
    },
  },

  /**
   * ✅ NUEVO: Servicio para obtener permisos efectivos (usado por DynamicActionButtons)
   */
  buttonUtils: {
    /**
     * ✅ NUEVO: Obtener permisos efectivos del usuario actual para una opción
     */
    async getMySubmenuButtonPermissions(menuId, submenuId) {
      try {
        console.log(`🔍 apiService: Obteniendo permisos de submenu ${submenuId} en menú ${menuId}`);

        const response = await apiClient.get(`/submenu-button-permissions/${menuId}/${submenuId}`);

        if (response.data?.status === 'success' || response.data?.success === true) {
          console.log('✅ apiService: Permisos de submenu obtenidos:', response.data);
          return response.data;
        } else {
          console.error('❌ apiService: Error en respuesta de permisos de submenu:', response.data);
          throw new Error(response.data?.message || 'Error al obtener permisos de submenu');
        }
      } catch (error) {
        console.error('❌ Error obteniendo permisos de submenu:', error);
        console.error('❌ Error details:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        throw error;
      }
    },

    /**
     * Verificar permiso específico de botón en submenu
     */
    async checkSubmenuButtonPermission(menuId, submenuId, buttonCode) {
      try {
        console.log(`🔍 apiService: Verificando permiso ${buttonCode} en submenu ${submenuId}`);

        const response = await apiClient.post('/check-submenu-button-permission', {
          men_id: menuId,
          sub_id: submenuId,
          bot_codigo: buttonCode
        });

        return response.data?.has_permission || false;
      } catch (error) {
        console.error('❌ Error verificando permiso de submenu:', error);
        return false;
      }
    },


    async getMyButtonPermissions(opcId) {
      try {
        // Obtener usuario actual desde el sistema de autenticación
        const currentUser = getCurrentUser();
        if (!currentUser?.usu_id) {
          throw new Error("Usuario no autenticado");
        }

        const result =
          await adminService.userButtonPermissions.getUserEffectivePermissions(
            currentUser.usu_id,
            opcId
          );
        return result;
      } catch (error) {
        console.error("Error obteniendo permisos del usuario:", error);
        return { status: "error", message: error.message, data: [] };
      }
    },

    /**
     * ✅ NUEVO: Obtener permisos efectivos de un usuario específico
     */
    async getUserEffectivePermissions(usuarioId, opcId) {
      return adminService.userButtonPermissions.getUserEffectivePermissions(
        usuarioId,
        opcId
      );
    },

    /**
     * ✅ NUEVO: Verificar permiso específico de botón para un usuario
     */
    async checkUserButtonPermission(usuarioId, opcId, buttonCode) {
      return adminService.userButtonPermissions.checkUserButtonPermission(
        usuarioId,
        opcId,
        buttonCode
      );
    },

    /**
     * ✅ NUEVO: Verificar permiso del usuario actual
     */
    async checkButtonPermission(
      usuarioId,
      moduleId,
      buttonCode,
      moduleType = "menu"
    ) {
      try {
        console.log(
          `🔍 Verificando permiso: Usuario ${usuarioId}, Módulo ${moduleId}, Botón ${buttonCode}`
        );

        const permissions = await this.getUserButtonPermissions(usuarioId);

        if (!permissions.success) {
          return false;
        }

        // Buscar el módulo y botón específicos
        for (const menu of permissions.menuStructure) {
          // Verificar botones del menú principal
          if (menu.men_id === moduleId && moduleType === "menu") {
            const button = menu.botones?.find(
              (b) => b.bot_codigo === buttonCode
            );
            if (button) {
              console.log(
                `✅ Botón encontrado: ${button.hasPermission ? "PERMITIDO" : "DENEGADO"
                }`
              );
              return button.hasPermission;
            }
          }

          // Verificar botones de submenús
          for (const submenu of menu.submenus || []) {
            if (submenu.sub_id === moduleId && moduleType === "submenu") {
              const button = submenu.botones?.find(
                (b) => b.bot_codigo === buttonCode
              );
              if (button) {
                console.log(
                  `✅ Botón encontrado en submenú: ${button.hasPermission ? "PERMITIDO" : "DENEGADO"
                  }`
                );
                return button.hasPermission;
              }
            }

            // Verificar botones de opciones
            for (const opcion of submenu.opciones || []) {
              if (opcion.opc_id === moduleId && moduleType === "opcion") {
                const button = opcion.botones?.find(
                  (b) => b.bot_codigo === buttonCode
                );
                if (button) {
                  console.log(
                    `✅ Botón encontrado en opción: ${button.hasPermission ? "PERMITIDO" : "DENEGADO"
                    }`
                  );
                  return button.hasPermission;
                }
              }
            }
          }
        }

        console.log("❌ Botón no encontrado");
        return false;
      } catch (error) {
        console.error("❌ Error al verificar permiso de botón:", error);
        return false;
      }
    },
    /**
     * ✅ NUEVO: Para ventanas directas de menús
     */
    async getMyMenuButtonPermissions(menuId) {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser?.usu_id) {
          throw new Error("Usuario no autenticado");
        }

        // Para menús, usar el endpoint específico (cuando esté disponible)
        // Por ahora, usar la misma lógica que las opciones
        const result =
          await adminService.userButtonPermissions.getUserEffectivePermissions(
            currentUser.usu_id,
            menuId
          );
        return result;
      } catch (error) {
        console.error("Error obteniendo permisos de menú:", error);
        return { status: "error", message: error.message, data: [] };
      }
    },

    /**
     * ✅ NUEVO: Verificar permiso de menú
     */
    async checkMenuButtonPermission(menuId, buttonCode) {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser?.usu_id) {
          return false;
        }

        return await adminService.userButtonPermissions.checkUserMenuButtonPermission(
          currentUser.usu_id,
          menuId,
          buttonCode
        );
      } catch (error) {
        console.error("Error verificando permiso de menú:", error);
        return false;
      }
    },
  },
  // ✅ CORRECCIÓN: buttonUtils con getMyMenuButtonPermissions mejorado
  buttonUtils: {
    // ✅ MÉTODO PARA OPCIONES REGULARES
    async getMySubmenuAsMenuPermissions(submenuId) {
      try {
        console.log(`🔍 apiService: Obteniendo permisos de submenu ${submenuId} como menú`);

        const response = await apiClient.get(`/submenu-button-permissions/${submenuId}`);

        if (response.data?.status === 'success' || response.data?.success === true) {
          console.log('✅ apiService: Permisos de submenu obtenidos:', response.data);
          return response.data;
        } else {
          console.error('❌ apiService: Error en respuesta de permisos de submenu:', response.data);
          throw new Error(response.data?.message || 'Error al obtener permisos de submenu');
        }
      } catch (error) {
        console.error('❌ Error obteniendo permisos de submenu como menú:', error);
        console.error('❌ Error details:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        throw error;
      }
    },
    async getMyButtonPermissions(opcionId) {
      try {
        console.log(
          "🔍 Obteniendo mis permisos de botones para opción:",
          opcionId
        );
        const response = await apiClient.get(
          `/my-button-permissions/${opcionId}`
        );
        console.log("📥 ButtonPermissions - Respuesta:", response.data);

        return {
          status: "success",
          data: response.data.botones_permitidos || [],
        };
      } catch (error) {
        console.error("❌ Error obteniendo mis permisos de botones:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          data: [],
        };
      }
    },

    // ✅ MÉTODO PARA MENÚS DIRECTOS - CORRECTAMENTE UBICADO Y MEJORADO
    async getMyMenuButtonPermissions(menuId) {
      try {
        console.log(
          "🔍 Obteniendo permisos de botones para menú directo:",
          menuId
        );
        const response = await apiClient.get(
          `/my-menu-button-permissions/${menuId}`
        );

        console.log("📥 MenuButtonPermissions - Respuesta RAW:", response);
        console.log("📥 MenuButtonPermissions - Response.data:", response.data);
        console.log(
          "📥 MenuButtonPermissions - botones_permitidos:",
          response.data?.botones_permitidos
        );

        // ✅ NORMALIZAR RESPUESTA
        let normalizedResponse = {
          status: "success",
          data: [],
          message: "Permisos obtenidos correctamente",
        };

        if (response.data) {
          if (
            response.data.botones_permitidos &&
            Array.isArray(response.data.botones_permitidos)
          ) {
            normalizedResponse.data = response.data.botones_permitidos;
          } else if (Array.isArray(response.data)) {
            normalizedResponse.data = response.data;
          } else {
            console.warn(
              "⚠️ Formato inesperado MenuButtonPermissions:",
              response.data
            );
            normalizedResponse.data = [];
          }
        }

        console.log(
          "✅ MenuButtonPermissions - Respuesta normalizada:",
          normalizedResponse
        );
        return normalizedResponse;
      } catch (error) {
        console.error("❌ Error obteniendo permisos de menú directo:", error);
        console.error("❌ Error details:", error.response?.data);
        console.error("❌ Error status:", error.response?.status);

        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          data: [],
        };
      }
    },

    // Verificar permiso de botón para opción
    async checkButtonPermission(opcionId, buttonCode) {
      try {
        console.log("🔍 Verificando permiso de botón:", {
          opcionId,
          buttonCode,
        });
        const response = await apiClient.post("/check-button-permission", {
          opc_id: opcionId,
          bot_codigo: buttonCode,
        });

        return response.data.has_permission || false;
      } catch (error) {
        console.error("❌ Error verificando permiso de botón:", error);
        return false;
      }
    },

    // Verificar permiso de botón para menú directo
    async checkMenuButtonPermission(menuId, buttonCode) {
      try {
        console.log("🔍 Verificando permiso de botón para menú:", {
          menuId,
          buttonCode,
        });
        const response = await apiClient.post("/check-menu-button-permission", {
          men_id: menuId,
          bot_codigo: buttonCode,
        });

        return response.data.has_permission || false;
      } catch (error) {
        console.error("❌ Error verificando permiso de menú:", error);
        return false;
      }
    },

    // Verificar múltiples permisos
    async checkMultipleButtonPermissions(permissions) {
      try {
        console.log("🔍 Verificando múltiples permisos:", permissions);
        const response = await apiClient.post(
          "/permissions/validate-multiple-buttons",
          {
            permissions,
          }
        );

        return {
          status: "success",
          data: response.data.permissions || [],
        };
      } catch (error) {
        console.error("❌ Error verificando múltiples permisos:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          data: [],
        };
      }
    },

    // Obtener todos los permisos del usuario actual
    async getMyAllButtonPermissions() {
      try {
        console.log("🔍 Obteniendo todos mis permisos de botones");
        const response = await apiClient.get("/my-permissions");

        return {
          status: "success",
          data: response.data.permissions || [],
        };
      } catch (error) {
        console.error("❌ Error obteniendo todos mis permisos:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          data: [],
        };
      }
    },
    async getUserEffectivePermissions(usuarioId, opcId = null) {
      try {
        console.log(
          "🔍 UserButtonPermissions - Obteniendo permisos efectivos:",
          { usuarioId, opcId }
        );
        let endpoint = `/user-button-permissions/users/${usuarioId}/effective-permissions`;
        if (opcId) {
          endpoint += `?opc_id=${opcId}`;
        }

        const response = await apiClient.get(endpoint);
        console.log(
          "📥 UserButtonPermissions - Permisos efectivos:",
          response.data
        );

        return {
          status: "success",
          data: response.data.permissions || response.data.data || [],
          message:
            response.data.message ||
            "Permisos efectivos obtenidos correctamente",
        };
      } catch (error) {
        console.error(
          "❌ Error obteniendo permisos efectivos del usuario:",
          error
        );
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    /**
     * NUEVO: Verificar permiso específico de botón para cualquier usuario
     */
    async checkUserButtonPermission(usuarioId, opcId, buttonCode) {
      try {
        console.log(
          "🔍 UserButtonPermissions - Verificando permiso específico:",
          { usuarioId, opcId, buttonCode }
        );
        const response = await apiClient.post(
          "/user-button-permissions/check",
          {
            usu_id: usuarioId,
            opc_id: opcId,
            bot_codigo: buttonCode,
          }
        );
        console.log(
          "📥 UserButtonPermissions - Resultado verificación:",
          response.data
        );

        return response.data.has_permission || false;
      } catch (error) {
        console.error("❌ Error verificando permiso específico:", error);
        return false;
      }
    },
  },

  // Botones
  buttons: {
    async getAll() {
      try {
        const response = await apiClient.get("/buttons");
        return {
          status: "success",
          data: response.data,
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async getAllWithUsage() {
      try {
        const response = await apiClient.get("/buttons/with-usage");
        return {
          status: "success",
          data: response.data,
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async getByOption(opcionId) {
      try {
        const response = await apiClient.get(`/buttons/option/${opcionId}`);
        return {
          status: "success",
          data: response.data,
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async create(data) {
      try {
        const response = await apiClient.post("/buttons", data);
        return {
          status: "success",
          data: response.data,
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async update(id, data) {
      try {
        const response = await apiClient.put(`/buttons/${id}`, data);
        return {
          status: "success",
          data: response.data,
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async delete(id) {
      try {
        const response = await apiClient.delete(`/buttons/${id}`);
        return {
          status: "success",
          data: response.data,
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async toggleStatus(id) {
      try {
        const response = await apiClient.put(`/buttons/${id}/toggle-status`);
        return {
          status: "success",
          data: response.data,
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async assignToOption(opcionId, botonIds) {
      try {
        const response = await apiClient.post(
          `/buttons/assign-option/${opcionId}`,
          {
            boton_ids: botonIds,
          }
        );
        return {
          status: "success",
          data: response.data,
        };
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },
  },

  // Permisos de botones
  buttonPermissions: {
    async getProfileButtonPermissions(perfilId) {
      try {
        console.log(
          "🔍 Llamando getProfileButtonPermissions con perfilId:",
          perfilId
        );
        const response = await apiClient.get(
          `/button-permissions/profiles/${perfilId}/direct-windows`
        );
        console.log("📥 Respuesta completa buttonPermissions:", response.data);

        return {
          status: "success",
          message: response.data.message,
          menu_structure: response.data.menu_structure || [],
          perfil: response.data.perfil,
          debug_info: response.data.debug_info,
        };
      } catch (error) {
        console.error("❌ Error en getProfileButtonPermissions:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async getDirectWindowsWithButtons(perfilId) {
      try {
        console.log(
          "🔍 Obteniendo ventanas directas con botones para perfil:",
          perfilId
        );
        const response = await apiClient.get(
          `/button-permissions/profiles/${perfilId}/direct-windows`
        );

        return {
          status: "success",
          data: response.data,
        };
      } catch (error) {
        console.error("❌ Error obteniendo ventanas directas:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async toggleButtonPermission(data) {
      try {
        console.log("🔄 Cambiando permiso de botón:", data);
        const response = await apiClient.post(
          "/button-permissions/toggle",
          data
        );

        return {
          status: "success",
          message: response.data.message,
        };
      } catch (error) {
        console.error("❌ Error en toggleButtonPermission:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },
  },

  // Permisos generales
  permissions: {
    async getProfiles() {
      try {
        const response = await apiClient.get("/permissions/profiles");
        return response.data;
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },
    async configuracionMasivaBotones(opciones = {}) {
      try {
        console.log("🚀 Configuración masiva de botones:", opciones);
        const response = await apiClient.post(
          "/permissions/configuracion-masiva-botones",
          opciones
        );

        return {
          status: "success",
          data: response.data.estadisticas,
          message: response.data.message,
        };
      } catch (error) {
        console.error("❌ Error en configuración masiva:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async diagnosticarPerfil(perfilId) {
      try {
        console.log("🔍 Diagnosticando perfil:", perfilId);
        const response = await apiClient.get(
          `/perfiles/${perfilId}/diagnosticar-modulos-directos`
        );

        return {
          status: "success",
          data: response.data.diagnostico,
          message: response.data.message,
        };
      } catch (error) {
        console.error("❌ Error en diagnóstico:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async asignarPermisosBasicos(perfilId, opciones = {}) {
      try {
        console.log(
          "🚀 Asignando permisos básicos a perfil:",
          perfilId,
          opciones
        );
        const response = await apiClient.post(
          `/perfiles/${perfilId}/asignar-permisos-basicos`,
          opciones
        );

        return {
          status: "success",
          data: response.data.data,
          message: response.data.message,
        };
      } catch (error) {
        console.error("❌ Error asignando permisos básicos:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },
    async inicializarModulosDirectos(perfilId) {
      try {
        console.log("🚀 Inicializando módulos directos para perfil:", perfilId);
        const response = await apiClient.post(
          `/perfiles/${perfilId}/inicializar-modulos-directos`
        );

        return {
          status: "success",
          message: response.data.message,
          data: response.data.data || response.data,
        };
      } catch (error) {
        console.error("❌ Error inicializando módulos directos:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },
    async getModulosDirectosDisponibles(perfilId) {
      try {
        console.log("🔍 Obteniendo módulos directos para perfil:", perfilId);
        const response = await apiClient.get(
          `/perfiles/${perfilId}/modulos-directos-disponibles`
        );

        return {
          status: "success",
          data: response.data,
        };
      } catch (error) {
        console.error("❌ Error obteniendo módulos directos:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async toggleAccesoBotones(data) {
      try {
        console.log("🔄 Toggle acceso botones:", data);
        const response = await apiClient.post(
          `/perfiles/${data.per_id}/toggle-acceso-botones`,
          {
            men_id: data.men_id,
            sub_id: data.sub_id || null,
            opc_id: data.opc_id || null,
            grant_access: data.grant_access,
          }
        );

        return {
          status: "success",
          message: response.data.message,
          data: response.data.data,
        };
      } catch (error) {
        console.error("❌ Error en toggle acceso botones:", error);
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },
    async getMenuStructureWithPermissions(perfilId) {
      try {
        const response = await apiClient.get(
          `/permissions/menu-structure/${perfilId}`
        );
        return response.data;
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },

    async togglePermission(permissionData) {
      try {
        const response = await apiClient.post(
          "/permissions/toggle",
          permissionData
        );
        return response.data;
      } catch (error) {
        const apiError = apiUtils.handleApiError(error);
        throw {
          status: "error",
          message: apiError.message,
          errors: apiError.errors,
        };
      }
    },
  },
};
export default apiClient;
