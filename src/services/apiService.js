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
  // ===== AGREGAR ESTA SECCIÓN AL OBJETO adminService =====
  // En tu apiService.js, dentro del objeto adminService, agrega:

  // ===== AGREGAR DENTRO DEL OBJETO adminService EN tu apiService.js =====
  // ✅ SERVICIO DE CONFIGURACIONES
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

        const queryString = apiUtils.buildQueryParams(params);
        const url = queryString ? `/oficinas?${queryString}` : "/oficinas";

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
        const filterParams = { ...params, instit_codigo: institucionId };
        return await this.getAll(filterParams);
      } catch (error) {
        console.error("❌ Error filtrando oficinas por institución:", error);
        throw error;
      }
    },

    async getByTipo(tipoId, params = {}) {
      try {
        console.log("🔍 Oficinas API - Filtrando por tipo:", tipoId);
        const filterParams = { ...params, tofici_codigo: tipoId };
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
        console.log("🔍 Oficinas API - Búsqueda:", searchTerm);
        const searchParams = { ...params, search: searchTerm };
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
