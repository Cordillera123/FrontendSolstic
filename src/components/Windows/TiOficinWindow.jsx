// src/components/Windows/TiOficinWindow.jsx - COMPLETO Y CORREGIDO
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useButtonPermissions } from "../../hooks/useButtonPermissions";
import { adminService } from "../../services/apiService";
import { getCurrentUser } from "../../context/AuthContext";
import Icon from "../UI/Icon";

// ===== COMPONENTE TipoOficinaForm =====
const TipoOficinaForm = React.memo(
  ({ editingTipo, loading, onSave, onCancel, showMessage }) => {
    console.log("🔵 TipoOficinaForm render - editingTipo:", editingTipo?.tofici_codigo || "null");

    // Estados para validación y animaciones
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState(() => {
      if (editingTipo) {
        console.log("🟢 Inicializando con datos existentes");
        return {
          tofici_descripcion: editingTipo.tofici_descripcion || "",
          tofici_abreviatura: editingTipo.tofici_abreviatura || "",
        };
      } else {
        console.log("🟡 Inicializando formulario vacío");
        return {
          tofici_descripcion: "",
          tofici_abreviatura: "",
        };
      }
    });

    // Efecto para actualizar formulario cuando cambie editingTipo
    useEffect(() => {
      console.log("🔄 useEffect ejecutado - editingTipo cambió:", editingTipo?.tofici_codigo || "null");

      if (editingTipo) {
        setFormData({
          tofici_descripcion: editingTipo.tofici_descripcion || "",
          tofici_abreviatura: editingTipo.tofici_abreviatura || "",
        });
      } else {
        setFormData({
          tofici_descripcion: "",
          tofici_abreviatura: "",
        });
      }

      setFormErrors({});
      setShowSuccess(false);
      setIsSubmitting(false);
    }, [editingTipo?.tofici_codigo]);

    // Validación en tiempo real
    const validateField = useCallback((field, value) => {
      const errors = { ...formErrors };

      switch (field) {
        case "tofici_descripcion":
          if (!value?.trim()) {
            errors.tofici_descripcion = "La descripción es requerida";
          } else if (value.length < 3) {
            errors.tofici_descripcion = "La descripción debe tener al menos 3 caracteres";
          } else if (value.length > 40) {
            errors.tofici_descripcion = "La descripción no puede exceder 40 caracteres";
          } else {
            delete errors.tofici_descripcion;
          }
          break;
        case "tofici_abreviatura":
          if (!value?.trim()) {
            errors.tofici_abreviatura = "La abreviatura es requerida";
          } else if (value.length < 2) {
            errors.tofici_abreviatura = "La abreviatura debe tener al menos 2 caracteres";
          } else if (value.length > 10) {
            errors.tofici_abreviatura = "La abreviatura no puede exceder 10 caracteres";
          } else {
            delete errors.tofici_abreviatura;
          }
          break;
        default:
          break;
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    }, [formErrors]);

    // Manejador de cambios
    const handleInputChange = useCallback((field, value) => {
      console.log("⌨️ Escribiendo:", field, "=", value);
      
      // Procesamiento especial por campo
      let processedValue = value;
      if (field === "tofici_abreviatura") {
        processedValue = value.toUpperCase();
      }
      
      setFormData((prev) => ({
        ...prev,
        [field]: processedValue,
      }));

      // Validar en tiempo real
      validateField(field, processedValue);
    }, [validateField]);

    // Manejador de envío
    const handleSubmit = useCallback(async (e) => {
      e.preventDefault();

      // Validación final
      const requiredFields = ["tofici_descripcion", "tofici_abreviatura"];
      const missingFields = requiredFields.filter(field => !formData[field]?.trim());
      
      if (missingFields.length > 0) {
        const fieldNames = {
          tofici_descripcion: "Descripción",
          tofici_abreviatura: "Abreviatura"
        };
        const missingNames = missingFields.map(field => fieldNames[field]).join(", ");
        setFormErrors({ [missingFields[0]]: `Campos requeridos: ${missingNames}` });
        showMessage("error", `Campos requeridos: ${missingNames}`);
        return;
      }

      setIsSubmitting(true);
      setFormErrors({});

      try {
        const dataToSend = {
          tofici_descripcion: formData.tofici_descripcion.trim(),
          tofici_abreviatura: formData.tofici_abreviatura.trim().toUpperCase(),
        };

        console.log("📤 Enviando datos:", dataToSend);
        await onSave(dataToSend, editingTipo);

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      } catch (error) {
        console.error("❌ Error en submit:", error);
        setFormErrors({ submit: error.message || "Error al guardar" });
      } finally {
        setIsSubmitting(false);
      }
    }, [formData, editingTipo, onSave, showMessage]);

    const handleCancel = useCallback(() => {
      setIsSubmitting(true);
      setTimeout(() => {
        onCancel();
        setIsSubmitting(false);
      }, 300);
    }, [onCancel]);

    // Verificar validez del formulario
    const isFormValid = useMemo(() => {
      return formData.tofici_descripcion?.trim() && 
             formData.tofici_abreviatura?.trim() && 
             Object.keys(formErrors).length === 0;
    }, [formData.tofici_descripcion, formData.tofici_abreviatura, formErrors]);

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm transition-all duration-300 hover:shadow-md relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 transition-all duration-300 ${
                editingTipo ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
              }`}>
              <Icon name={editingTipo ? "Edit" : "Plus"} size={20} className="transition-transform duration-300 hover:scale-110" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {editingTipo ? `Editar Tipo de Oficina` : "Crear Nuevo Tipo de Oficina"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingTipo ? "Modifica los datos del tipo de oficina" : "Complete los campos para crear un nuevo tipo"}
              </p>
            </div>
          </div>

          {/* Indicadores de estado */}
          {isSubmitting && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm font-medium">Procesando...</span>
            </div>
          )}

          {showSuccess && (
            <div className="flex items-center space-x-2 text-green-600 animate-bounce">
              <Icon name="CheckCircle" size={16} />
              <span className="text-sm font-medium">¡Éxito!</span>
            </div>
          )}
        </div>

        {/* Mostrar errores de submit */}
        {formErrors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center">
              <Icon name="AlertCircle" size={14} className="mr-2" />
              {formErrors.submit}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Descripción */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Descripción *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.tofici_descripcion || ""}
                  onChange={(e) => handleInputChange("tofici_descripcion", e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.tofici_descripcion
                      ? "border-red-300 bg-red-50"
                      : formData.tofici_descripcion?.trim()
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="Ej: Matriz, Sucursal, Agencia..."
                  disabled={loading || isSubmitting}
                  maxLength={40}
                  autoComplete="off"
                />
                {formData.tofici_descripcion?.trim() && !formErrors.tofici_descripcion && (
                  <div className="absolute right-3 top-3.5">
                    <Icon name="Check" size={16} className="text-green-500" />
                  </div>
                )}
              </div>
              {formErrors.tofici_descripcion && (
                <p className="text-sm text-red-600 flex items-center animate-shake">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {formErrors.tofici_descripcion}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formData.tofici_descripcion?.length || 0}/40 caracteres
              </p>
            </div>

            {/* Abreviatura */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Abreviatura *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.tofici_abreviatura || ""}
                  onChange={(e) => handleInputChange("tofici_abreviatura", e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.tofici_abreviatura
                      ? "border-red-300 bg-red-50"
                      : formData.tofici_abreviatura?.trim()
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="Ej: MTZ, SUC, AGE..."
                  disabled={loading || isSubmitting}
                  maxLength={10}
                  autoComplete="off"
                  style={{ textTransform: 'uppercase' }}
                />
                {formData.tofici_abreviatura?.trim() && !formErrors.tofici_abreviatura && (
                  <div className="absolute right-3 top-3.5">
                    <Icon name="Check" size={16} className="text-green-500" />
                  </div>
                )}
              </div>
              {formErrors.tofici_abreviatura && (
                <p className="text-sm text-red-600 flex items-center animate-shake">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {formErrors.tofici_abreviatura}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formData.tofici_abreviatura?.length || 0}/10 caracteres (mayúsculas)
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || isSubmitting || !isFormValid}
              className={`relative flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 transform ${
                isFormValid && !isSubmitting
                  ? editingTipo
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {editingTipo ? "Actualizando..." : "Creando..."}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Icon name={editingTipo ? "Save" : "Plus"} size={16} className="mr-2 transition-transform duration-300 group-hover:scale-110" />
                  {editingTipo ? "Actualizar Tipo" : "Crear Tipo"}
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={loading || isSubmitting}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium transition-all duration-300 hover:bg-gray-200 hover:text-gray-800 transform hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center">
                <Icon name="X" size={16} className="mr-2" />
                Cancelar
              </div>
            </button>
          </div>
        </form>

        {/* Overlay de carga */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-50 rounded-xl flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-gray-700 font-medium">
                {editingTipo ? "Actualizando tipo..." : "Creando tipo..."}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

TipoOficinaForm.displayName = "TipoOficinaForm";

// ===== COMPONENTE PRINCIPAL =====
const TiOficinWindow = ({ 
  showMessage: externalShowMessage,
  menuId = 27, // ID del menú para tipos de oficina
  title = "Gestión de Tipos de Oficina" 
}) => {
  // Obtener usuario actual
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.usu_id;

  console.log("🔍 TipoOficinaWindow - Usuario actual:", {
    usu_id: currentUserId,
    usu_nom: currentUser?.usu_nom,
    per_id: currentUser?.per_id,
  });

  // Hook de permisos
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    loading: permissionsLoading,
    error: permissionsError,
  } = useButtonPermissions(menuId, null, true, "menu");

  // Estados del componente
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [tiposOficina, setTiposOficina] = useState([]);
  const [showTipoForm, setShowTipoForm] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Función para mostrar mensajes
  const showMessage = useCallback((type, text) => {
    console.log("📢 TipoOficinaWindow - Mensaje:", type, text);
    if (externalShowMessage) {
      externalShowMessage(type, text);
    } else {
      setMessage({ type, text });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  }, [externalShowMessage]);

  // ✅ FUNCIÓN CORREGIDA PARA CARGAR TIPOS DE OFICINA
  const loadTiposOficina = useCallback(async () => {
    console.log("🔍 loadTiposOficina iniciado");

    if (!canRead) {
      console.log("❌ Sin permisos de lectura");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Cargando tipos de oficina...");

      // ✅ INTENTAR MÚLTIPLES RUTAS DE SERVICIO
      let result;
      
      // Opción 1: Servicio específico de tipos de oficina
      if (adminService?.tiposOficina?.getAll) {
        console.log("🟢 Usando adminService.tiposOficina.getAll");
        result = await adminService.tiposOficina.getAll();
      }
      // Opción 2: Servicio genérico con endpoint específico
      else if (adminService?.get) {
        console.log("🟡 Usando adminService.get genérico");
        result = await adminService.get('/tipos-oficina');
      }
      // Opción 3: Usar fetch directo como respaldo
      else {
        console.log("🔴 Usando fetch directo como respaldo");
        const response = await fetch('/api/tipos-oficina', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
      }

      console.log("📥 Respuesta completa tipos oficina:", result);

      if (result?.status === "success" && result?.data) {
        let tiposData = [];

        if (Array.isArray(result.data)) {
          tiposData = result.data;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          tiposData = result.data.data;
        } else {
          console.warn("⚠️ Formato inesperado de datos:", result.data);
          tiposData = [];
        }

        setTiposOficina(tiposData);
        console.log("✅ Tipos de oficina cargados:", tiposData.length);
      } else {
        console.error("❌ Error en respuesta tipos oficina:", result);
        setTiposOficina([]);
        showMessage("error", result?.message || "Error al cargar tipos de oficina");
      }
    } catch (error) {
      console.error("❌ Error loading tipos oficina:", error);
      setTiposOficina([]);
      showMessage("error", "Error al cargar tipos de oficina: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, [canRead, showMessage]);

  // ✅ FUNCIÓN CORREGIDA PARA GUARDAR TIPO DE OFICINA
  const handleTipoSave = useCallback(async (formData, editingTipo) => {
    console.log("💾 TipoOficinaWindow - Guardando tipo:", formData);

    if (editingTipo && !canUpdate) {
      console.log("❌ TipoOficinaWindow - UPDATE denegado");
      showMessage("error", "No tienes permisos para actualizar tipos de oficina");
      throw new Error("Sin permisos para actualizar");
    }

    if (!editingTipo && !canCreate) {
      console.log("❌ TipoOficinaWindow - CREATE denegado");
      showMessage("error", "No tienes permisos para crear tipos de oficina");
      throw new Error("Sin permisos para crear");
    }

    setLoading(true);

    try {
      console.log("📤 TipoOficinaWindow - Datos a enviar:", formData);

      let result;
      
      if (editingTipo) {
        // ✅ ACTUALIZAR TIPO EXISTENTE
        console.log("🔄 Actualizando tipo ID:", editingTipo.tofici_codigo);
        
        if (adminService?.tiposOficina?.update) {
          result = await adminService.tiposOficina.update(editingTipo.tofici_codigo, formData);
        } else if (adminService?.put) {
          result = await adminService.put(`/tipos-oficina/${editingTipo.tofici_codigo}`, formData);
        } else {
          const response = await fetch(`/api/tipos-oficina/${editingTipo.tofici_codigo}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });
          result = await response.json();
        }
        
        showMessage("success", "Tipo de oficina actualizado correctamente");
        console.log("✅ TipoOficinaWindow - Tipo actualizado:", result);
      } else {
        // ✅ CREAR NUEVO TIPO
        console.log("➕ Creando nuevo tipo");
        
        if (adminService?.tiposOficina?.create) {
          result = await adminService.tiposOficina.create(formData);
        } else if (adminService?.post) {
          result = await adminService.post('/tipos-oficina', formData);
        } else {
          const response = await fetch('/api/tipos-oficina', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });
          result = await response.json();
        }
        
        showMessage("success", "Tipo de oficina creado correctamente");
        console.log("✅ TipoOficinaWindow - Tipo creado:", result);
      }

      // Recargar datos
      await loadTiposOficina();
      
      // Cerrar formulario
      setShowTipoForm(false);
      setEditingTipo(null);
      setFormKey((prev) => prev + 1);
      
    } catch (error) {
      console.error("❌ TipoOficinaWindow - Error guardando tipo:", error);
      
      let errorMessage = "Error al guardar el tipo de oficina";
      
      // Manejo de errores específicos
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = [];

        Object.keys(errors).forEach((field) => {
          const fieldErrors = errors[field];
          const fieldName = {
            tofici_descripcion: "Descripción",
            tofici_abreviatura: "Abreviatura",
          }[field] || field;

          fieldErrors.forEach((errorMsg) => {
            if (errorMsg.includes("unique") || errorMsg.includes("already been taken")) {
              errorMessages.push(`${fieldName}: Ya existe en el sistema`);
            } else if (errorMsg.includes("required")) {
              errorMessages.push(`${fieldName}: Es requerido`);
            } else {
              errorMessages.push(`${fieldName}: ${errorMsg}`);
            }
          });
        });

        errorMessage = errorMessages.join("\n");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showMessage("error", errorMessage);
      throw error; // Re-lanzar para que el formulario pueda manejarlo
    } finally {
      setLoading(false);
    }
  }, [showMessage, loadTiposOficina, canUpdate, canCreate]);

  // ✅ FUNCIÓN PARA CREAR NUEVO TIPO
  const handleNewTipo = useCallback(() => {
    if (!canCreate) {
      console.log("❌ TipoOficinaWindow - CREATE denegado para nuevo tipo");
      showMessage("error", "No tienes permisos para crear tipos de oficina");
      return;
    }

    console.log("➕ TipoOficinaWindow - Nuevo tipo - Permiso concedido");
    setEditingTipo(null);
    setShowTipoForm(true);
    setFormKey((prev) => prev + 1);
  }, [canCreate, showMessage]);

  // ✅ FUNCIÓN PARA EDITAR TIPO
  const handleEditTipo = useCallback((tipo) => {
    if (!canUpdate) {
      console.log("❌ TipoOficinaWindow - UPDATE denegado para editar tipo");
      showMessage("error", "No tienes permisos para editar tipos de oficina");
      return;
    }

    console.log("✏️ TipoOficinaWindow - Editar tipo - Permiso concedido:", tipo.tofici_codigo);
    setEditingTipo(tipo);
    setShowTipoForm(true);
    setFormKey((prev) => prev + 1);
  }, [canUpdate, showMessage]);

  // ✅ FUNCIÓN CORREGIDA PARA ELIMINAR TIPO
  const handleDeleteTipo = useCallback(async (tipo) => {
    if (!canDelete) {
      console.log("❌ TipoOficinaWindow - DELETE denegado");
      showMessage("error", "No tienes permisos para eliminar tipos de oficina");
      return;
    }

    const confirmMessage = `¿Estás seguro de eliminar el tipo de oficina "${tipo.tofici_descripcion}"?\n\nEsta acción no se puede deshacer.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      console.log("🗑️ TipoOficinaWindow - Eliminando tipo - Permiso concedido:", tipo.tofici_codigo);
      
      let result;
      
      if (adminService?.tiposOficina?.delete) {
        result = await adminService.tiposOficina.delete(tipo.tofici_codigo);
      } else if (adminService?.delete) {
        result = await adminService.delete(`/tipos-oficina/${tipo.tofici_codigo}`);
      } else {
        const response = await fetch(`/api/tipos-oficina/${tipo.tofici_codigo}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
      }
      
      if (result?.status === "success") {
        showMessage("success", result.message || "Tipo de oficina eliminado correctamente");
      } else {
        showMessage("error", result?.message || "Error al eliminar tipo de oficina");
      }
      
      await loadTiposOficina();
    } catch (error) {
      console.error("❌ TipoOficinaWindow - Error eliminando tipo:", error);
      let errorMessage = "Error al eliminar tipo de oficina";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message?.includes("oficina(s) asociada(s)")) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showMessage("error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [canDelete, showMessage, loadTiposOficina]);

  // ✅ FUNCIÓN PARA CANCELAR FORMULARIO
  const handleTipoCancel = useCallback(() => {
    console.log("❌ TipoOficinaWindow - Cancelando formulario");
    setShowTipoForm(false);
    setEditingTipo(null);
    setFormKey((prev) => prev + 1);
  }, []);

  // Función de búsqueda y filtrado
  const filteredTipos = useMemo(() => {
    if (!Array.isArray(tiposOficina)) return [];
    
    let filtered = tiposOficina.filter(tipo => 
      tipo.tofici_descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tipo.tofici_abreviatura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tipo.tofici_codigo?.toString().includes(searchTerm)
    );

    // Aplicar ordenamiento
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [tiposOficina, searchTerm, sortConfig]);

  // Función para manejar ordenamiento
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Componente de lista de tipos memoizado
  const TiposList = useMemo(() => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            Lista de Tipos de Oficina ({filteredTipos.length})
          </h3>
          
          {/* Barra de búsqueda */}
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tipos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Botón CREATE */}
        {canCreate ? (
          <button
            onClick={handleNewTipo}
            className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
            disabled={loading}
            title="Crear nuevo tipo de oficina"
          >
            <Icon 
              name="Plus" 
              size={20} 
              className="transition-transform duration-300 group-hover:rotate-90" 
            />
          </button>
        ) : (
          <div
            className="w-10 h-10 bg-gray-300 text-gray-500 rounded-lg flex items-center justify-center cursor-not-allowed"
            title="Sin permisos para crear tipos de oficina"
          >
            <Icon name="Lock" size={16} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <span className="text-gray-600">Cargando tipos de oficina...</span>
          </div>
        </div>
      ) : !Array.isArray(tiposOficina) || tiposOficina.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Icon
              name="FileText"
              size={48}
              className="mx-auto mb-4 text-gray-300"
            />
            <p className="text-gray-500 mb-2">No hay tipos de oficina registrados</p>
            {canCreate && (
              <p className="text-sm text-gray-400 mt-2">Haz clic en el botón + para crear un nuevo tipo</p>
            )}
            {!Array.isArray(tiposOficina) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-sm mx-auto">
                <p className="text-xs text-red-600">
                  Error: Datos recibidos no válidos ({typeof tiposOficina})
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Verificar estructura de respuesta del backend
                </p>
              </div>
            )}
          </div>
        </div>
      ) : filteredTipos.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Icon
              name="Search"
              size={48}
              className="mx-auto mb-4 text-gray-300"
            />
            <p className="text-gray-500 mb-2">
              No se encontraron tipos que coincidan con "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Limpiar búsqueda
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('tofici_codigo')}
                >
                  <div className="flex items-center">
                    Código
                    {sortConfig.key === 'tofici_codigo' && (
                      <Icon 
                        name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                        size={14} 
                        className="ml-1" 
                      />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('tofici_descripcion')}
                >
                  <div className="flex items-center">
                    Descripción
                    {sortConfig.key === 'tofici_descripcion' && (
                      <Icon 
                        name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                        size={14} 
                        className="ml-1" 
                      />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('tofici_abreviatura')}
                >
                  <div className="flex items-center">
                    Abreviatura
                    {sortConfig.key === 'tofici_abreviatura' && (
                      <Icon 
                        name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                        size={14} 
                        className="ml-1" 
                      />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTipos.map((tipo) => (
                <tr key={tipo.tofici_codigo} className="hover:bg-gray-50 transition-colors">
                  {/* COLUMNA CÓDIGO */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-medium text-sm">
                          {tipo.tofici_codigo}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          ID: {tipo.tofici_codigo}
                        </div>
                        <div className="text-sm text-gray-500">
                          Tipo de Oficina
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* COLUMNA DESCRIPCIÓN */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {tipo.tofici_descripcion}
                    </div>
                    <div className="text-sm text-gray-500">
                      {tipo.tofici_descripcion?.length || 0} caracteres
                    </div>
                  </td>

                  {/* COLUMNA ABREVIATURA */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {tipo.tofici_abreviatura}
                    </span>
                  </td>

                  {/* COLUMNA ACCIONES */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Botón EDITAR */}
                      {canUpdate ? (
                        <button
                          onClick={() => handleEditTipo(tipo)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                          disabled={loading}
                          title={`Editar ${tipo.tofici_descripcion}`}
                        >
                          <Icon name="Edit" size={16} />
                        </button>
                      ) : (
                        <div
                          className="p-2 text-gray-400 cursor-not-allowed"
                          title="Sin permisos para editar"
                        >
                          <Icon name="Lock" size={16} />
                        </div>
                      )}

                      {/* Botón ELIMINAR */}
                      {canDelete ? (
                        <button
                          onClick={() => handleDeleteTipo(tipo)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                          disabled={loading}
                          title={`Eliminar ${tipo.tofici_descripcion}`}
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      ) : (
                        <div
                          className="p-2 text-gray-400 cursor-not-allowed"
                          title="Sin permisos para eliminar"
                        >
                          <Icon name="Lock" size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  ), [filteredTipos, searchTerm, sortConfig, canUpdate, canDelete, loading, handleEditTipo, handleDeleteTipo, handleNewTipo, handleSort]);

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log("🔄 TipoOficinaWindow - useEffect mount");
    if (canRead) {
      loadTiposOficina();
    }
  }, [loadTiposOficina, canRead]);

  // Manejo de errores de permisos
  if (permissionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 max-w-md mx-auto">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Icon name="AlertTriangle" size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error de Permisos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {permissionsError.message || "No tienes permisos para acceder a esta sección"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cargando permisos
  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Sin permisos de lectura
  if (!canRead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-md mx-auto">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <Icon name="Lock" size={24} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Acceso Denegado
            </h3>
            <p className="text-sm text-gray-600">
              No tienes permisos para acceder a la gestión de tipos de oficina
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Principal */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl mr-4">
                <Icon name="Building" size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600 mt-1">
                  Administra los tipos de oficina del sistema
                </p>
              </div>
            </div>

            {/* Indicadores de permisos */}
            <div className="flex items-center space-x-2">
              {canCreate && (
                <div className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                  <Icon name="Plus" size={14} className="mr-1" />
                  Crear
                </div>
              )}
              {canUpdate && (
                <div className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  <Icon name="Edit" size={14} className="mr-1" />
                  Editar
                </div>
              )}
              {canDelete && (
                <div className="flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                  <Icon name="Trash2" size={14} className="mr-1" />
                  Eliminar
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mensaje de notificación */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            message.type === "success"
              ? "bg-green-50 border-green-400 text-green-700"
              : message.type === "error"
              ? "bg-red-50 border-red-400 text-red-700"
              : "bg-blue-50 border-blue-400 text-blue-700"
          } animate-slide-down`}>
            <div className="flex items-center">
              <Icon
                name={
                  message.type === "success"
                    ? "CheckCircle"
                    : message.type === "error"
                    ? "AlertCircle"
                    : "Info"
                }
                size={20}
                className="mr-2"
              />
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Formulario de Tipo (Crear/Editar) */}
        {showTipoForm && (
          <TipoOficinaForm
            key={formKey}
            editingTipo={editingTipo}
            loading={loading}
            onSave={handleTipoSave}
            onCancel={handleTipoCancel}
            showMessage={showMessage}
          />
        )}

        {/* Lista de Tipos */}
        {TiposList}

        {/* Footer con información de depuración */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Debug Info:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Usuario: {currentUser?.usu_nom} (ID: {currentUserId})</div>
              <div>Permisos: C:{canCreate ? '✓' : '✗'} R:{canRead ? '✓' : '✗'} U:{canUpdate ? '✓' : '✗'} D:{canDelete ? '✓' : '✗'}</div>
              <div>Tipos cargados: {tiposOficina.length}</div>
              <div>Tipos filtrados: {filteredTipos.length}</div>
              <div>Búsqueda: "{searchTerm}"</div>
              <div>Ordenamiento: {sortConfig.key} ({sortConfig.direction})</div>
              <div>Servicios disponibles:</div>
              <div className="ml-4 text-gray-500">
                • adminService.tiposOficina: {adminService?.tiposOficina ? '✓' : '✗'}
              </div>
              <div className="ml-4 text-gray-500">
                • adminService.tiposOficina.getAll: {adminService?.tiposOficina?.getAll ? '✓' : '✗'}
              </div>
              <div className="ml-4 text-gray-500">
                • adminService.tiposOficina.create: {adminService?.tiposOficina?.create ? '✓' : '✗'}
              </div>
              <div className="ml-4 text-gray-500">
                • adminService.tiposOficina.update: {adminService?.tiposOficina?.update ? '✓' : '✗'}
              </div>
              <div className="ml-4 text-gray-500">
                • adminService.tiposOficina.delete: {adminService?.tiposOficina?.delete ? '✓' : '✗'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TiOficinWindow;