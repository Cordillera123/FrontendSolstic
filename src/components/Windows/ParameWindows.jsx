// src/components/Windows/ParameWindows.jsx - MIGRADO A BOTONES PARAMETRIZADOS
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useButtonPermissions } from "../../hooks/useButtonPermissions";
import { adminService, iconService } from "../../services/apiService";
import Icon from "../UI/Icon";
import {
  SubmenuForm,
  SubmenusList,
  useSubmenuManagement,
} from "./SubmenuComponents";
import {
  OptionForm,
  OptionsList,
  useOptionManagement,
} from "./OptionComponents";
import IconSelector from "../UI/IconSelector";
// ✅ Componente MenuForm completamente independiente
const MenuForm = React.memo(
  ({ editingMenu, icons, loading, onSave, onCancel, showMessage }) => {
    console.log(
      "🔵 MenuForm render - editingMenu:",
      editingMenu?.men_id || "null"
    );

    // Estados adicionales para animaciones
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);

    // Estado del formulario con inicialización inmediata
    const [formData, setFormData] = useState(() => {
      if (editingMenu) {
        console.log("🟢 Inicializando con datos existentes");
        return {
          men_nom: editingMenu.men_nom || "",
          ico_id: editingMenu.ico_id || "",
          men_componente: editingMenu.men_componente || "",
          men_eje: editingMenu.men_eje || 1,
          men_ventana_directa: Boolean(editingMenu.men_ventana_directa),
        };
      } else {
        console.log("🟡 Inicializando formulario vacío");
        return {
          men_nom: "",
          ico_id: "",
          men_componente: "",
          men_eje: 1,
          men_ventana_directa: false,
        };
      }
    });

    // Solo actualizar cuando cambie editingMenu
    useEffect(() => {
      console.log(
        "🔄 useEffect ejecutado - editingMenu cambió:",
        editingMenu?.men_id || "null"
      );

      if (editingMenu) {
        setFormData({
          men_nom: editingMenu.men_nom || "",
          ico_id: editingMenu.ico_id || "",
          men_componente: editingMenu.men_componente || "",
          men_eje: editingMenu.men_eje || 1,
          men_ventana_directa: Boolean(editingMenu.men_ventana_directa),
        });
      } else {
        setFormData({
          men_nom: "",
          ico_id: "",
          men_componente: "",
          men_eje: 1,
          men_ventana_directa: false,
        });
      }

      // Limpiar estados de animación cuando cambie el menú
      setFormErrors({});
      setShowSuccess(false);
      setIsSubmitting(false);
    }, [editingMenu?.men_id]);

    // Validación en tiempo real
    const validateField = useCallback(
      (field, value) => {
        const errors = { ...formErrors };

        switch (field) {
          case "men_nom":
            if (!value?.trim()) {
              errors.men_nom = "El nombre del menú es requerido";
            } else if (value.length < 3) {
              errors.men_nom = "El nombre debe tener al menos 3 caracteres";
            } else {
              delete errors.men_nom;
            }
            break;
          case "men_eje":
            if (value < 1 || value > 9) {
              errors.men_eje = "El orden debe estar entre 1 y 9";
            } else {
              delete errors.men_eje;
            }
            break;
          default:
            break;
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
      },
      [formErrors]
    );

    // Manejadores estables con useCallback
    const handleInputChange = useCallback(
      (field, value) => {
        console.log("⌨️ Escribiendo:", field, "=", value);
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));

        // Validar campo en tiempo real
        validateField(field, value);
      },
      [validateField]
    );

    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();

        // Validación final
        if (!formData.men_nom?.trim()) {
          setFormErrors({ men_nom: "El nombre del menú es requerido" });
          showMessage("error", "El nombre del menú es requerido");
          return;
        }

        // Activar estado de carga
        setIsSubmitting(true);
        setFormErrors({});

        try {
          const dataToSend = {
            ...formData,
            men_nom: formData.men_nom.trim(),
            ico_id: formData.ico_id || null,
            men_componente: formData.men_componente?.trim() || null,
            men_eje: parseInt(formData.men_eje) || 1,
            men_ventana_directa: Boolean(formData.men_ventana_directa),
          };

          // Simular un pequeño delay para mostrar la animación
          await new Promise((resolve) => setTimeout(resolve, 800));

          await onSave(dataToSend, editingMenu);

          // Mostrar éxito brevemente
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 1500);
        } catch (error) {
          console.error("Error en submit:", error);
        } finally {
          setIsSubmitting(false);
        }
      },
      [formData, editingMenu, onSave, showMessage]
    );

    const handleCancel = useCallback(() => {
      // Animación de salida suave
      setIsSubmitting(true);
      setTimeout(() => {
        onCancel();
        setIsSubmitting(false);
      }, 300);
    }, [onCancel]);

    // Verificar si el formulario es válido
    const isFormValid = useMemo(() => {
      return formData.men_nom?.trim() && Object.keys(formErrors).length === 0;
    }, [formData.men_nom, formErrors]);

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm transition-all duration-300 hover:shadow-md">
        {/* Header mejorado */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div
              className={`p-2 rounded-lg mr-3 transition-all duration-300 ${
                editingMenu
                  ? "bg-blue-100 text-blue-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <Icon
                name={editingMenu ? "Edit" : "Plus"}
                size={20}
                className="transition-transform duration-300 hover:scale-110"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {editingMenu
                  ? `Editar Menú #${editingMenu.men_id}`
                  : "Crear Nuevo Menú"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingMenu
                  ? "Modifica los datos del menú"
                  : "Complete los campos para crear un nuevo menú"}
              </p>
            </div>
          </div>

          {/* Indicador de progreso */}
          {isSubmitting && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre del Menú */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nombre del Menú *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.men_nom || ""}
                  onChange={(e) => {
                    console.log("🖊️ Input onChange:", e.target.value);
                    handleInputChange("men_nom", e.target.value);
                  }}
                  className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.men_nom
                      ? "border-red-300 bg-red-50"
                      : formData.men_nom?.trim()
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="Ingrese el nombre del menú"
                  disabled={loading || isSubmitting}
                  autoComplete="off"
                />
                {formData.men_nom?.trim() && !formErrors.men_nom && (
                  <div className="absolute right-3 top-3.5">
                    <Icon name="Check" size={16} className="text-green-500" />
                  </div>
                )}
              </div>
              {formErrors.men_nom && (
                <p className="text-sm text-red-600 flex items-center animate-shake">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {formErrors.men_nom}
                </p>
              )}
              <div className="text-xs text-gray-400">
                {formData.men_nom?.length || 0}/50 caracteres
              </div>
            </div>
            {/* Icono */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Icono
              </label>
              <IconSelector
                icons={icons}
                selectedIcon={formData.ico_id}
                onSelect={(iconId) => handleInputChange("ico_id", iconId)}
                placeholder="Seleccionar icono"
                disabled={loading || isSubmitting}
              />
              <div className="text-xs text-gray-500">
                Elige un icono para representar visualmente el menú
              </div>

              {/* Vista previa del icono seleccionado */}
              {formData.ico_id && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg border-2 border-gray-300">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          {icons
                            .find(
                              (icon) =>
                                (icon.ico_id || icon.id) == formData.ico_id
                            )
                            ?.ico_nom?.charAt(0)
                            .toUpperCase() || "?"}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Vista previa del icono
                      </div>
                      <div className="text-xs text-gray-500">
                        {icons.find(
                          (icon) => (icon.ico_id || icon.id) == formData.ico_id
                        )?.ico_nom || "Icono seleccionado"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Componente */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Componente
              </label>
              <input
                type="text"
                value={formData.men_componente || ""}
                onChange={(e) =>
                  handleInputChange("men_componente", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                placeholder="Ej: ParameWindows"
                disabled={loading || isSubmitting}
              />
              <div className="text-xs text-gray-500">
                Nombre del componente React (opcional)
              </div>
            </div>
            {/* Orden de Ejecución */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Orden de Ejecución
              </label>
              <input
                type="number"
                min="1"
                max="9"
                value={formData.men_eje || 1}
                onChange={(e) =>
                  handleInputChange("men_eje", parseInt(e.target.value) || 1)
                }
                className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.men_eje
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                disabled={loading || isSubmitting}
              />
              {formErrors.men_eje && (
                <p className="text-sm text-red-600 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {formErrors.men_eje}
                </p>
              )}
            </div>
          </div>

          {/* Ventana Directa */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.men_ventana_directa)}
                onChange={(e) =>
                  handleInputChange("men_ventana_directa", e.target.checked)
                }
                className="mr-3 w-4 h-4 text-blue-600 transition-all duration-300 focus:ring-2 focus:ring-blue-500 rounded"
                disabled={loading || isSubmitting}
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Ventana Directa
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  El menú se abrirá directamente sin submenús
                </p>
              </div>
            </label>
          </div>

          {/* Botones con animaciones mejoradas */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || isSubmitting || !isFormValid}
              className={`relative flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 transform ${
                isFormValid && !isSubmitting
                  ? editingMenu
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {editingMenu ? "Actualizando..." : "Creando..."}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Icon
                    name={editingMenu ? "Save" : "Plus"}
                    size={16}
                    className="mr-2 transition-transform duration-300 group-hover:scale-110"
                  />
                  {editingMenu ? "Actualizar Menú" : "Crear Menú"}
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
                {editingMenu ? "Actualizando menú..." : "Creando menú..."}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MenuForm.displayName = "MenuForm";

// ✅ Componente principal MIGRADO A BOTONES PARAMETRIZADOS
const ParameWindows = ({ data }) => {
  // ===== CONFIGURACIÓN =====
  const MENU_ID = 1; // ID del menú "Parametrización de Módulos"

  // ===== HOOK DE PERMISOS =====
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    loading: permissionsLoading,
    error: permissionsError,
  } = useButtonPermissions(MENU_ID, null, true, "menu");

  // ===== ESTADOS =====
  const [activeTab, setActiveTab] = useState("menus");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [menus, setMenus] = useState([]);
  const [submenus, setSubmenus] = useState([]);
  const [options, setOptions] = useState([]);
  const [icons, setIcons] = useState([]);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [formKey, setFormKey] = useState(0);

  // ===== FUNCIÓN BÁSICA (PRIMERA) =====
  const showMessage = useCallback((type, text) => {
    console.log("📢 Mensaje:", type, text);
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }, []);

  // ===== FUNCIONES DE CARGA =====
  const loadMenus = useCallback(async () => {
    try {
      console.log("📥 Cargando menús...");
      const result = await adminService.menus.getAll();
      console.log("📋 Menús cargados:", result.menus?.length || 0);
      setMenus(result.menus || []);
    } catch (error) {
      console.error("❌ Error loading menus:", error);
    }
  }, []);

  const loadSubmenus = useCallback(async () => {
    try {
      const result = await adminService.submenus.getAll();
      setSubmenus(result.submenus || []);
    } catch (error) {
      console.error("Error loading submenus:", error);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const result = await adminService.options.getAll();
      setOptions(result.opciones || []);
    } catch (error) {
      console.error("Error loading options:", error);
    }
  }, []);

  const loadIcons = useCallback(async () => {
    try {
      const result = await iconService.getAllIcons();
      setIcons(result.data || []);
    } catch (error) {
      console.error("Error loading icons:", error);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("🚀 Cargando datos iniciales...");
      await Promise.all([
        loadMenus(),
        loadSubmenus(),
        loadOptions(),
        loadIcons(),
      ]);
      console.log("✅ Datos iniciales cargados");
    } catch (error) {
      console.error("❌ Error loading initial data:", error);
      showMessage("error", "Error al cargar datos iniciales");
    } finally {
      setLoading(false);
    }
  }, [loadMenus, loadSubmenus, loadOptions, loadIcons, showMessage]);

  // ===== MANEJADORES DE FORMULARIO CON VALIDACIÓN DE PERMISOS =====
  const handleMenuSave = useCallback(
    async (formData, editingMenu) => {
      console.log("💾 Guardando menú:", formData);

      // ✅ VALIDACIÓN DE PERMISOS
      if (editingMenu && !canUpdate) {
        showMessage("error", "No tienes permisos para actualizar menús");
        return;
      }

      if (!editingMenu && !canCreate) {
        showMessage("error", "No tienes permisos para crear menús");
        return;
      }

      setLoading(true);

      try {
        // Agregar men_est por defecto y limpiar datos
        const cleanData = {
          men_nom: formData.men_nom?.trim(),
          ico_id: formData.ico_id ? parseInt(formData.ico_id) : null,
          men_componente: formData.men_componente?.trim() || null,
          men_eje: parseInt(formData.men_eje) || 1,
          men_ventana_directa: Boolean(formData.men_ventana_directa),
          men_est: true, // Activo por defecto
        };

        console.log("📤 Datos limpios a enviar:", cleanData);

        let result;
        if (editingMenu) {
          result = await adminService.menus.update(
            editingMenu.men_id,
            cleanData
          );
          showMessage("success", "Menú actualizado correctamente");
          console.log("✅ Menú actualizado:", result);
        } else {
          result = await adminService.menus.create(cleanData);
          showMessage("success", "Menú creado correctamente");
          console.log("✅ Menú creado:", result);
        }

        // Recargar datos y cerrar formulario
        await loadMenus();
        setShowMenuForm(false);
        setEditingMenu(null);
        setFormKey((prev) => prev + 1);
      } catch (error) {
        console.error("❌ Error completo:", error);
        console.error("❌ Error response:", error.response?.data);

        let errorMsg = "Error al guardar el menú";

        if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        } else if (error.message) {
          errorMsg = error.message;
        }

        showMessage("error", errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [showMessage, loadMenus, canCreate, canUpdate]
  );

  const handleMenuCancel = useCallback(() => {
    console.log("❌ Cancelando formulario");
    setShowMenuForm(false);
    setEditingMenu(null);
    setFormKey((prev) => prev + 1);
  }, []);

  const handleNewMenu = useCallback(() => {
    // ✅ VALIDACIÓN DE PERMISOS
    if (!canCreate) {
      showMessage("error", "No tienes permisos para crear menús");
      return;
    }

    console.log("➕ Nuevo menú");
    setEditingMenu(null);
    setShowMenuForm(true);
    setFormKey((prev) => prev + 1);
  }, [canCreate, showMessage]);

  const handleEditMenu = useCallback(
    (menu) => {
      // ✅ VALIDACIÓN DE PERMISOS
      if (!canUpdate) {
        showMessage("error", "No tienes permisos para editar menús");
        return;
      }

      console.log("✏️ Editar menú:", menu.men_id);
      setEditingMenu(menu);
      setShowMenuForm(true);
      setFormKey((prev) => prev + 1);
    },
    [canUpdate, showMessage]
  );

  const handleDeleteMenu = useCallback(
    async (menu) => {
      // ✅ VALIDACIÓN DE PERMISOS
      if (!canDelete) {
        showMessage("error", "No tienes permisos para eliminar menús");
        return;
      }

      if (
        !window.confirm(`¿Estás seguro de eliminar el menú "${menu.men_nom}"?`)
      ) {
        return;
      }

      try {
        setLoading(true);
        await adminService.menus.delete(menu.men_id);
        showMessage("success", "Menú eliminado correctamente");
        await loadMenus();
      } catch (error) {
        console.error("❌ Error eliminando menú:", error);
        const errorMsg =
          error.response?.data?.message || "Error al eliminar el menú";
        showMessage("error", errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [canDelete, showMessage, loadMenus]
  );

  const handleTabChange = useCallback((newTab) => {
    console.log("🔄 Cambiar tab:", newTab);
    setActiveTab(newTab);
    setShowMenuForm(false);
    setEditingMenu(null);
    setFormKey((prev) => prev + 1);
  }, []);

  // Hooks para submenús y opciones
  const {
    showSubmenuForm,
    editingSubmenu,
    submenuFormKey,
    handleSubmenuSave,
    handleSubmenuCancel,
    handleNewSubmenu,
    handleEditSubmenu,
    handleDeleteSubmenu,
  } = useSubmenuManagement(showMessage, loadSubmenus);

  const {
    showOptionForm,
    editingOption,
    optionFormKey,
    handleOptionSave,
    handleOptionCancel,
    handleNewOption,
    handleEditOption,
    handleDeleteOption,
  } = useOptionManagement(showMessage, loadOptions);

  // ===== EFFECTS =====
  useEffect(() => {
    console.log("🚀 Iniciando carga de datos");
    if (canRead) {
      loadInitialData();
    }
  }, [loadInitialData, canRead]);

  // ===== COMPONENTES MEMOIZADOS =====
 // FRAGMENTO ACTUALIZADO: Lista de Menús con botón de icono únicamente

  const MenusList = useMemo(
    () => (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Lista de Menús ({menus.length})
          </h3>
<<<<<<< Updated upstream
          {/* ✅ BOTÓN CREATE PARAMETRIZADO */}
          {canCreate && (
=======
          {/* ✅ BOTÓN CREATE CON SOLO ICONO */}
          {effectivePermissions.canCreate ? (
>>>>>>> Stashed changes
            <button
              onClick={handleNewMenu}
              className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
              disabled={loading}
<<<<<<< Updated upstream
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Nuevo Menú
            </button>
=======
              title="Crear nuevo menú"
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
              title="Sin permisos para crear menús"
            >
              <Icon name="Lock" size={16} />
            </div>
>>>>>>> Stashed changes
          )}
        </div>

        {menus.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon
              name="Menu"
              size={48}
              className="mx-auto mb-4 text-gray-300"
            />
            <p>No hay menús registrados</p>
            {effectivePermissions.canCreate && (
              <p className="text-sm text-gray-400 mt-2">Haz clic en el botón + para crear un nuevo menú</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">Nombre</th>
                  <th className="text-left py-2">Componente</th>
                  <th className="text-left py-2">Estado</th>
                  <th className="text-left py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <tr
                    key={menu.men_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 text-xs text-gray-500">
                      #{menu.men_id}
                    </td>
                    <td className="py-2 font-medium">{menu.men_nom}</td>
                    <td className="py-2">
                      {menu.men_componente ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                          {menu.men_componente}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          menu.men_est
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {menu.men_est ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        {/* ✅ BOTÓN UPDATE PARAMETRIZADO */}
                        {canUpdate && (
                          <button
                            onClick={() => handleEditMenu(menu)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                            disabled={loading}
                            title="Editar menú"
<<<<<<< Updated upstream
=======
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                        ) : (
                          <button
                            className="p-2 text-gray-400 cursor-not-allowed rounded-lg"
                            disabled={true}
                            title="Sin permisos para editar"
>>>>>>> Stashed changes
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                        )}
                        {/* ✅ BOTÓN DELETE PARAMETRIZADO */}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteMenu(menu)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                            disabled={loading}
                            title="Eliminar menú"
<<<<<<< Updated upstream
=======
                          >
                            <Icon name="Trash" size={16} />
                          </button>
                        ) : (
                          <button
                            className="p-2 text-gray-400 cursor-not-allowed rounded-lg"
                            disabled={true}
                            title="Sin permisos para eliminar"
>>>>>>> Stashed changes
                          >
                            <Icon name="Trash" size={16} />
                          </button>
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
    ),
    [
      menus,
      loading,
      canCreate,
      canUpdate,
      canDelete,
      handleNewMenu,
      handleEditMenu,
      handleDeleteMenu,
    ]
  );

  const SubmenusListMemo = useMemo(
    () => (
      <SubmenusList
        submenus={submenus}
        loading={loading}
        onNew={handleNewSubmenu}
        onEdit={handleEditSubmenu}
        onDelete={handleDeleteSubmenu}
        showMessage={showMessage}
      />
    ),
    [
      submenus,
      loading,
      handleNewSubmenu,
      handleEditSubmenu,
      handleDeleteSubmenu,
      showMessage,
    ]
  );

  const OptionsListMemo = useMemo(
    () => (
      <OptionsList
        options={options}
        loading={loading}
        onNew={handleNewOption}
        onEdit={handleEditOption}
        onDelete={handleDeleteOption}
        showMessage={showMessage}
      />
    ),
    [
      options,
      loading,
      handleNewOption,
      handleEditOption,
      handleDeleteOption,
      showMessage,
    ]
  );

  // ===== VALIDACIONES DE PERMISOS =====
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  if (permissionsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Icon
            name="AlertCircle"
            size={48}
            className="mx-auto mb-4 text-red-300"
          />
          <p className="text-red-500 mb-2">Error al cargar permisos</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <p className="text-sm text-red-800 mb-2">
              <strong>Error:</strong> {permissionsError}
            </p>
            <ul className="text-xs text-red-700 space-y-1">
              <li>
                • Menu ID:{" "}
                <code className="bg-red-100 px-1 rounded">{MENU_ID}</code>
              </li>
              <li>• Verifica la conexión con el backend</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Icon name="Lock" size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">
            No tienes permisos para acceder a esta sección
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Información de debug:</strong>
            </p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>
                • Menu ID configurado:{" "}
                <code className="bg-yellow-100 px-1 rounded">{MENU_ID}</code>
              </li>
              <li>
                • Permiso READ:{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  {canRead ? "SÍ" : "NO"}
                </code>
              </li>
              <li>
                • Permiso CREATE:{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  {canCreate ? "SÍ" : "NO"}
                </code>
              </li>
              <li>
                • Permiso UPDATE:{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  {canUpdate ? "SÍ" : "NO"}
                </code>
              </li>
              <li>
                • Permiso DELETE:{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  {canDelete ? "SÍ" : "NO"}
                </code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER PRINCIPAL =====
  if (loading && !menus.length && !submenus.length && !options.length) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando módulos...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "menus", name: "Menús", icon: "Menu" },
    { id: "submenus", name: "Submenús", icon: "Layers" },
    { id: "options", name: "Opciones", icon: "Settings" },
  ];

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
          <Icon name="Settings" size={24} className="mr-3 text-blue-600" />
          Parametrización de Módulos
          <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Menu ID: {MENU_ID}
          </span>
        </h2>
        <p className="text-gray-600">
          Gestione la configuración de menús, submenús y opciones del sistema
        </p>
      </div>

      {/* Debug info con permisos */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <strong>Tab:</strong> {activeTab}
          </div>
          <div>
            <strong>Form:</strong> {showMenuForm.toString()}
          </div>
          <div>
            <strong>Editing:</strong> {editingMenu?.men_id || "null"}
          </div>
          <div>
            <strong>Loading:</strong> {loading.toString()}
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-200">
          <strong>Permisos:</strong>
          <span
            className={`ml-2 px-2 py-0.5 rounded ${
              canCreate
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            CREATE: {canCreate ? "SÍ" : "NO"}
          </span>
          <span
            className={`ml-2 px-2 py-0.5 rounded ${
              canRead
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            READ: {canRead ? "SÍ" : "NO"}
          </span>
          <span
            className={`ml-2 px-2 py-0.5 rounded ${
              canUpdate
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            UPDATE: {canUpdate ? "SÍ" : "NO"}
          </span>
          <span
            className={`ml-2 px-2 py-0.5 rounded ${
              canDelete
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            DELETE: {canDelete ? "SÍ" : "NO"}
          </span>
        </div>
      </div>

      {/* Mensajes */}
      {message.text && (
        <div
          className={`mb-4 p-3 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            <Icon
              name={message.type === "success" ? "CheckCircle" : "AlertCircle"}
              size={16}
              className="mr-2"
            />
            {message.text}
          </div>
        </div>
      )}

      {/* Pestañas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                disabled={loading}
              >
                <Icon name={tab.icon} size={16} className="mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <div className="space-y-6">
        {activeTab === "menus" && (
          <>
            {showMenuForm && (
              <MenuForm
                key={formKey}
                editingMenu={editingMenu}
                icons={icons}
                loading={loading}
                onSave={handleMenuSave}
                onCancel={handleMenuCancel}
                showMessage={showMessage}
              />
            )}
            {MenusList}
          </>
        )}

        {activeTab === "submenus" && (
          <>
            {showSubmenuForm && (
              <SubmenuForm
                key={submenuFormKey}
                editingSubmenu={editingSubmenu}
                icons={icons}
                menus={menus}
                loading={loading}
                onSave={handleSubmenuSave}
                onCancel={handleSubmenuCancel}
                showMessage={showMessage}
              />
            )}
            {SubmenusListMemo}
          </>
        )}

        {activeTab === "options" && (
          <>
            {showOptionForm && (
              <OptionForm
                key={optionFormKey}
                editingOption={editingOption}
                icons={icons}
                submenus={submenus}
                loading={loading}
                onSave={handleOptionSave}
                onCancel={handleOptionCancel}
                showMessage={showMessage}
              />
            )}
            {OptionsListMemo}
          </>
        )}
      </div>
    </div>
  );
};

export default ParameWindows;
