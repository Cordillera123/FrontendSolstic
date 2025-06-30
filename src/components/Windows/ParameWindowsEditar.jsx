// src/components/Windows/ParameWindowsEditar.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { adminService, iconService } from "../../services/apiService";
import Icon from "../UI/Icon";
import IconSelector from "../UI/IconSelector";

const ParameWindowsEditar = ({ 
  editingMenu,
  onSave, 
  onCancel, 
  showMessage, 
  loading: externalLoading,
  icons = []
}) => {
  console.log("🔵 ParameWindowsEditar - Renderizando con menú:", editingMenu?.men_id || "null");

  // Estados para validación y carga
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Estado del formulario - inicializado con datos del menú
  const [formData, setFormData] = useState(() => {
    if (editingMenu) {
      console.log("🔄 Inicializando formulario con datos de menú:", editingMenu.men_id);
      return {
        men_nom: editingMenu.men_nom || "",
        ico_id: editingMenu.ico_id || "",
        men_componente: editingMenu.men_componente || "",
        men_eje: editingMenu.men_eje || 1,
        men_ventana_directa: Boolean(editingMenu.men_ventana_directa),
      };
    } else {
      console.log("🟡 No hay menú para editar");
      return {
        men_nom: "",
        ico_id: "",
        men_componente: "",
        men_eje: 1,
        men_ventana_directa: false,
      };
    }
  });

  // Efecto para actualizar formulario cuando cambie editingMenu
  useEffect(() => {
    console.log("🔄 useEffect ejecutado - editingMenu cambió:", editingMenu?.men_id || "null");

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

    setFormErrors({});
    setShowSuccess(false);
    setIsSubmitting(false);
  }, [editingMenu?.men_id]);

  // Validación en tiempo real mejorada
  const validateField = useCallback(
    (field, value) => {
      const errors = { ...formErrors };

      switch (field) {
        case "men_nom":
          if (!value?.trim()) {
            errors.men_nom = "El nombre del menú es requerido";
          } else if (value.length < 3) {
            errors.men_nom = "El nombre debe tener al menos 3 caracteres";
          } else if (value.length > 50) {
            errors.men_nom = "Máximo 50 caracteres";
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

  // Manejador de cambios optimizado
  const handleInputChange = useCallback(
    (field, value) => {
      console.log("⌨️ Escribiendo:", field, "=", value);
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Validar en tiempo real
      validateField(field, value);
    },
    [validateField]
  );

  // Manejador de envío mejorado
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!editingMenu) {
        showMessage("error", "No hay menú para actualizar");
        return;
      }

      // Validación final
      if (!formData.men_nom?.trim()) {
        setFormErrors({ men_nom: "El nombre del menú es requerido" });
        showMessage("error", "El nombre del menú es requerido");
        return;
      }

      if (!hasChanges) {
        showMessage("info", "No hay cambios para guardar");
        return;
      }

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
          men_est: true, // Mantener activo
        };

        console.log("📤 Enviando datos:", dataToSend);
        await onSave(dataToSend, editingMenu);

        // Mostrar éxito
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);

      } catch (error) {
        console.error("❌ Error en submit:", error);
        setFormErrors({ submit: error.message || "Error al actualizar menú" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, editingMenu, onSave, showMessage]
  );

  const handleCancel = useCallback(() => {
    setIsSubmitting(true);
    setTimeout(() => {
      onCancel();
      setIsSubmitting(false);
    }, 300);
  }, [onCancel]);

  const resetForm = useCallback(() => {
    if (editingMenu) {
      setFormData({
        men_nom: editingMenu.men_nom || "",
        ico_id: editingMenu.ico_id || "",
        men_componente: editingMenu.men_componente || "",
        men_eje: editingMenu.men_eje || 1,
        men_ventana_directa: Boolean(editingMenu.men_ventana_directa),
      });
      setFormErrors({});
      showMessage("info", "Cambios revertidos");
    }
  }, [editingMenu, showMessage]);

  // Verificar validez del formulario
  const isFormValid = useMemo(() => {
    return formData.men_nom?.trim() && Object.keys(formErrors).length === 0;
  }, [formData.men_nom, formErrors]);

  // Verificar si hay cambios
  const hasChanges = useMemo(() => {
    if (!editingMenu) return false;

    return Object.keys(formData).some(key => {
      const currentValue = formData[key];
      const originalValue = editingMenu[key];
      const current = currentValue ?? "";
      const original = originalValue ?? "";
      return current !== original;
    });
  }, [formData, editingMenu]);

  // Renderizado de error si no hay menú
  if (!editingMenu) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No hay menú para editar</h2>
          <p className="text-gray-500 mb-6">Seleccione un menú de la lista para editarlo</p>
          <button 
            onClick={onCancel} 
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Volver a la Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header compacto con información del menú */}
      <div className="flex-shrink-0 bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
              <Icon name="Edit" size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Editar Menú</h2>
              <p className="text-slate-600 text-sm flex items-center gap-2">
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                  ID: {editingMenu.men_id}
                </span>
                <span className="text-slate-600">{editingMenu.men_nom}</span>
                {hasChanges && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <Icon name="AlertTriangle" size={12} />
                    Sin guardar
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes de estado compactos */}
      {(formErrors.submit || showSuccess) && (
        <div className="flex-shrink-0 px-4 pt-2 pb-1">
          {formErrors.submit && (
            <div className="p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-center gap-1">
              <Icon name="AlertCircle" size={12} />
              {formErrors.submit}
            </div>
          )}

          {showSuccess && (
            <div className="p-1.5 bg-green-50 border border-green-200 rounded text-xs text-green-600 flex items-center gap-1 animate-bounce">
              <Icon name="CheckCircle" size={12} />
              ¡Menú actualizado exitosamente!
            </div>
          )}
        </div>
      )}

      {/* Contenido del formulario - Optimizado para llenar el espacio */}
      <div className="flex-1 flex flex-col p-4">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Fila 1: Nombre del Menú */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Menú <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.men_nom || ""}
                  onChange={(e) => handleInputChange("men_nom", e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.men_nom
                      ? "border-red-300 bg-red-50"
                      : formData.men_nom?.trim()
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="Ingrese el nombre del menú"
                  disabled={externalLoading || isSubmitting}
                  autoComplete="off"
                  maxLength={50}
                />
                {formData.men_nom?.trim() && !formErrors.men_nom && (
                  <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                )}
              </div>
              {formErrors.men_nom && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <Icon name="AlertCircle" size={12} className="mr-1" />
                  {formErrors.men_nom}
                </p>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {formData.men_nom?.length || 0}/50 caracteres
              </div>
            </div>

            {/* Fila 2: Icono y Componente */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icono
                </label>
                <IconSelector
                  icons={icons}
                  selectedIcon={formData.ico_id}
                  onSelect={(iconId) => handleInputChange("ico_id", iconId)}
                  placeholder="Seleccionar icono"
                  disabled={externalLoading || isSubmitting}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Elige un icono para representar visualmente el menú
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Componente
                </label>
                <input
                  type="text"
                  value={formData.men_componente || ""}
                  onChange={(e) => handleInputChange("men_componente", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                  placeholder="Ej: ParameWindows"
                  disabled={externalLoading || isSubmitting}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Nombre del componente React (opcional)
                </div>
              </div>
            </div>

            {/* Fila 3: Orden de Ejecución */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden de Ejecución
              </label>
              <input
                type="number"
                min="1"
                max="9"
                value={formData.men_eje || 1}
                onChange={(e) => handleInputChange("men_eje", parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.men_eje
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                disabled={externalLoading || isSubmitting}
              />
              {formErrors.men_eje && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <Icon name="AlertCircle" size={12} className="mr-1" />
                  {formErrors.men_eje}
                </p>
              )}
            </div>

            {/* Vista previa del icono */}
            {/* {formData.ico_id && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
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
            )} */}

            {/* Ventana Directa */}
            <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.men_ventana_directa)}
                  onChange={(e) => handleInputChange("men_ventana_directa", e.target.checked)}
                  className="mr-3 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                  disabled={externalLoading || isSubmitting}
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

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="text-xs space-y-0.5">
                    <li>• El nombre del menú es obligatorio</li>
                    <li>• El icono es opcional pero recomendado para la interfaz</li>
                    <li>• El orden de ejecución determina la posición en el menú</li>
                    <li>• El componente debe corresponder a un archivo React válido</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Indicador de cambios */}
            {/* {!hasChanges && (
              <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 flex items-center gap-1">
                <Icon name="Info" size={12} />
                No hay cambios para guardar
              </div>
            )} */}
          </div>

          {/* Botones de acción - Siempre en la parte inferior */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={externalLoading || isSubmitting || !isFormValid || !hasChanges}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                  isFormValid && hasChanges && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transform"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                title={!hasChanges ? "No hay cambios para guardar" : ""}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={16} />
                    {hasChanges ? "Guardar Cambios" : "Sin Cambios"}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={externalLoading || isSubmitting}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:text-gray-800 hover:scale-105 transform hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
              >
                <Icon name="X" size={16} />
                Cancelar
              </button>

              {hasChanges && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={externalLoading || isSubmitting}
                  className="px-3 py-3 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-yellow-200 hover:text-yellow-800 hover:scale-105 transform hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
                  title="Revertir cambios"
                >
                  <Icon name="RotateCcw" size={16} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Overlay de loading */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex items-center gap-3 border">
            <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-700 font-medium text-lg">
              Actualizando menú...
            </span>
          </div>
        </div>  
      )}
    </div>
  );
};

export default ParameWindowsEditar;