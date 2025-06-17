// src/components/Windows/OptionComponents.jsx - MIGRADO A BOTONES PARAMETRIZADOS CON ICONSELECTOR
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useButtonPermissions } from "../../hooks/useButtonPermissions";
import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";
import IconSelector from "../UI/IconSelector"; // ✅ IMPORTAR ICONSELECTOR

// ✅ Componente OptionForm con IconSelector mejorado
const OptionForm = React.memo(
  ({
    editingOption,
    icons,
    submenus,
    loading,
    onSave,
    onCancel,
    showMessage,
  }) => {
    console.log(
      "🟣 OptionForm render - editingOption:",
      editingOption?.opc_id || "null"
    );

    // Estados adicionales para animaciones
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [expandedSubmenus, setExpandedSubmenus] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Estado del formulario con inicialización inmediata
    const [formData, setFormData] = useState(() => {
      if (editingOption) {
        console.log("🟢 Inicializando opción con datos existentes");
        return {
          opc_nom: editingOption.opc_nom || "",
          ico_id: editingOption.ico_id || "",
          opc_componente: editingOption.opc_componente || "",
          opc_eje: editingOption.opc_eje || 1,
          opc_ventana_directa: Boolean(editingOption.opc_ventana_directa),
          submenu_ids: editingOption.submenus?.map((s) => s.sub_id) || [],
        };
      } else {
        console.log("🟡 Inicializando formulario de opción vacío");
        return {
          opc_nom: "",
          ico_id: "",
          opc_componente: "",
          opc_eje: 1,
          opc_ventana_directa: false,
          submenu_ids: [],
        };
      }
    });

    // Solo actualizar cuando cambie editingOption
    useEffect(() => {
      console.log(
        "🔄 OptionForm useEffect - editingOption cambió:",
        editingOption?.opc_id || "null"
      );

      if (editingOption) {
        setFormData({
          opc_nom: editingOption.opc_nom || "",
          ico_id: editingOption.ico_id || "",
          opc_componente: editingOption.opc_componente || "",
          opc_eje: editingOption.opc_eje || 1,
          opc_ventana_directa: Boolean(editingOption.opc_ventana_directa),
          submenu_ids: editingOption.submenus?.map((s) => s.sub_id) || [],
        });
      } else {
        setFormData({
          opc_nom: "",
          ico_id: "",
          opc_componente: "",
          opc_eje: 1,
          opc_ventana_directa: false,
          submenu_ids: [],
        });
      }

      // Limpiar estados de animación cuando cambie la opción
      setFormErrors({});
      setShowSuccess(false);
      setIsSubmitting(false);
      setExpandedSubmenus(false);
      setSearchTerm("");
    }, [editingOption?.opc_id]);

    // Validación en tiempo real
    const validateField = useCallback(
      (field, value) => {
        const errors = { ...formErrors };

        switch (field) {
          case "opc_nom":
            if (!value?.trim()) {
              errors.opc_nom = "El nombre de la opción es requerido";
            } else if (value.length < 3) {
              errors.opc_nom = "El nombre debe tener al menos 3 caracteres";
            } else {
              delete errors.opc_nom;
            }
            break;
          case "opc_eje":
            if (value < 1 || value > 9) {
              errors.opc_eje = "El orden debe estar entre 1 y 9";
            } else {
              delete errors.opc_eje;
            }
            break;
          case "submenu_ids":
            if (!value || value.length === 0) {
              errors.submenu_ids = "Debe seleccionar al menos un submenú";
            } else {
              delete errors.submenu_ids;
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

    // Manejadores estables
    const handleInputChange = useCallback(
      (field, value) => {
        console.log("⌨️ Escribiendo en opción:", field, "=", value);
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));

        // Validar campo en tiempo real
        validateField(field, value);
      },
      [validateField]
    );

    const handleSubmenuToggle = useCallback(
      (submenuId) => {
        console.log("🔀 Toggle submenú:", submenuId);
        setFormData((prev) => {
          const currentSubmenus = prev.submenu_ids || [];
          const newSubmenus = currentSubmenus.includes(submenuId)
            ? currentSubmenus.filter((id) => id !== submenuId)
            : [...currentSubmenus, submenuId];

          console.log("📋 Nuevos submenús seleccionados:", newSubmenus);

          // Validar submenús seleccionados
          validateField("submenu_ids", newSubmenus);

          return {
            ...prev,
            submenu_ids: newSubmenus,
          };
        });
      },
      [validateField]
    );

    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();

        // Validación final
        const finalErrors = {};

        if (!formData.opc_nom?.trim()) {
          finalErrors.opc_nom = "El nombre de la opción es requerido";
        }

        if (!formData.submenu_ids || formData.submenu_ids.length === 0) {
          finalErrors.submenu_ids = "Debe seleccionar al menos un submenú";
        }

        if (Object.keys(finalErrors).length > 0) {
          setFormErrors(finalErrors);
          showMessage("error", "Por favor corrige los errores del formulario");
          return;
        }

        // Activar estado de carga
        setIsSubmitting(true);
        setFormErrors({});

        try {
          const dataToSend = {
            ...formData,
            opc_nom: formData.opc_nom.trim(),
            ico_id: formData.ico_id || null,
            opc_componente: formData.opc_componente?.trim() || null,
            opc_eje: parseInt(formData.opc_eje) || 1,
            opc_ventana_directa: Boolean(formData.opc_ventana_directa),
            submenu_ids: formData.submenu_ids,
          };

          // Simular un pequeño delay para mostrar la animación
          await new Promise((resolve) => setTimeout(resolve, 1000));

          console.log("📤 Enviando datos de opción:", dataToSend);
          await onSave(dataToSend, editingOption);

          // Mostrar éxito brevemente
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 1500);
        } catch (error) {
          console.error("Error en submit opción:", error);
        } finally {
          setIsSubmitting(false);
        }
      },
      [formData, editingOption, onSave, showMessage, validateField]
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
      return (
        formData.opc_nom?.trim() &&
        formData.submenu_ids?.length > 0 &&
        Object.keys(formErrors).length === 0
      );
    }, [formData.opc_nom, formData.submenu_ids, formErrors]);

    // Filtrar submenús por búsqueda
    const filteredSubmenus = useMemo(() => {
      if (!searchTerm.trim()) return submenus;

      return submenus.filter(
        (submenu) =>
          submenu.sub_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submenu.menus?.some((menu) =>
            menu.men_nom.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }, [submenus, searchTerm]);

    // Contar submenús seleccionados
    const selectedSubmenusCount = formData.submenu_ids?.length || 0;

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm transition-all duration-300 hover:shadow-md relative">
        {/* Header mejorado */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div
              className={`p-2 rounded-lg mr-3 transition-all duration-300 ${
                editingOption
                  ? "bg-amber-100 text-amber-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <Icon
                name={editingOption ? "Edit" : "Plus"}
                size={20}
                className="transition-transform duration-300 hover:scale-110"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {editingOption
                  ? `Editar Opción #${editingOption.opc_id}`
                  : "Crear Nueva Opción"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingOption
                  ? "Modifica los datos de la opción"
                  : "Complete los campos para crear una nueva opción"}
              </p>
            </div>
          </div>

          {/* Indicadores de estado */}
          <div className="flex items-center space-x-4">
            {selectedSubmenusCount > 0 && (
              <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                <Icon name="Settings" size={14} />
                <span className="text-sm font-medium">
                  {selectedSubmenusCount} submenú
                  {selectedSubmenusCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {isSubmitting && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre de la Opción */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nombre de la Opción *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.opc_nom || ""}
                  onChange={(e) => {
                    console.log("🖊️ Input opción onChange:", e.target.value);
                    handleInputChange("opc_nom", e.target.value);
                  }}
                  className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    formErrors.opc_nom
                      ? "border-red-300 bg-red-50"
                      : formData.opc_nom?.trim()
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="Ingrese el nombre de la opción"
                  disabled={loading || isSubmitting}
                  autoComplete="off"
                />
                {formData.opc_nom?.trim() && !formErrors.opc_nom && (
                  <div className="absolute right-3 top-3.5">
                    <Icon name="Check" size={16} className="text-green-500" />
                  </div>
                )}
              </div>
              {formErrors.opc_nom && (
                <p className="text-sm text-red-600 flex items-center animate-shake">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {formErrors.opc_nom}
                </p>
              )}
              <div className="text-xs text-gray-400">
                {formData.opc_nom?.length || 0}/50 caracteres
              </div>
            </div>

            {/* ✅ ICONO CON ICONSELECTOR MEJORADO */}
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
                Elige un icono para representar visualmente la opción
              </div>

              {/* ✅ VISTA PREVIA DEL ICONO (igual que en MenuForm y SubmenuForm) */}
              {formData.ico_id && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg border-2 border-gray-300">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <span className="text-amber-600 font-bold text-sm">
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
                value={formData.opc_componente || ""}
                onChange={(e) =>
                  handleInputChange("opc_componente", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent hover:border-gray-400"
                placeholder="Ej: ClientRegistry"
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
                value={formData.opc_eje || 1}
                onChange={(e) =>
                  handleInputChange("opc_eje", parseInt(e.target.value) || 1)
                }
                className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  formErrors.opc_eje
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                disabled={loading || isSubmitting}
              />
              {formErrors.opc_eje && (
                <p className="text-sm text-red-600 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {formErrors.opc_eje}
                </p>
              )}
            </div>
          </div>

          {/* Ventana Directa */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.opc_ventana_directa)}
                onChange={(e) =>
                  handleInputChange("opc_ventana_directa", e.target.checked)
                }
                className="mr-3 w-4 h-4 text-amber-600 transition-all duration-300 focus:ring-2 focus:ring-amber-500 rounded"
                disabled={loading || isSubmitting}
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Ventana Directa
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  La opción se ejecutará directamente al seleccionar
                </p>
              </div>
            </label>
          </div>

          {/* Sección de Asignación de Submenús mejorada */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-700 flex items-center">
                <Icon name="Layers" size={16} className="mr-2 text-amber-600" />
                Asignar a Submenús *
              </h4>
              <div className="flex items-center space-x-3">
                <span
                  className={`text-sm px-3 py-1 rounded-full ${
                    selectedSubmenusCount > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedSubmenusCount} seleccionado
                  {selectedSubmenusCount !== 1 ? "s" : ""}
                </span>
                {submenus.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setExpandedSubmenus(!expandedSubmenus)}
                    className="text-sm text-amber-600 hover:text-amber-700 flex items-center transition-colors duration-300"
                    disabled={isSubmitting}
                  >
                    <Icon
                      name={expandedSubmenus ? "ChevronUp" : "ChevronDown"}
                      size={14}
                      className="mr-1 transition-transform duration-300"
                    />
                    {expandedSubmenus ? "Contraer" : "Expandir"}
                  </button>
                )}
              </div>
            </div>

            <div
              className={`border rounded-lg p-4 transition-all duration-300 ${
                formErrors.submenu_ids
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {submenus.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon
                    name="AlertCircle"
                    size={24}
                    className="mx-auto mb-3 text-gray-300"
                  />
                  <p className="text-sm font-medium">
                    No hay submenús disponibles
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Debe crear submenús primero
                  </p>
                </div>
              ) : (
                <>
                  {/* Buscador de submenús */}
                  {submenus.length > 4 && (
                    <div className="mb-4">
                      <div className="relative">
                        <Icon
                          name="Search"
                          size={16}
                          className="absolute left-3 top-3 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Buscar submenús..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                          disabled={isSubmitting}
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                          >
                            <Icon name="X" size={16} />
                          </button>
                        )}
                      </div>
                      {searchTerm && (
                        <p className="text-xs text-gray-500 mt-2">
                          Mostrando {filteredSubmenus.length} de{" "}
                          {submenus.length} submenús
                        </p>
                      )}
                    </div>
                  )}

                  <div
                    className={`space-y-3 transition-all duration-300 ${
                      submenus.length > 6 && !expandedSubmenus
                        ? "max-h-72 overflow-hidden"
                        : "max-h-96 overflow-y-auto"
                    }`}
                  >
                    {filteredSubmenus.map((submenu, index) => (
                      <div
                        key={submenu.sub_id}
                        className="transition-all duration-300"
                        style={{
                          animationDelay: `${index * 0.05}s`,
                          animation:
                            expandedSubmenus || index < 6
                              ? "fadeInLeft 0.3s ease-out"
                              : "none",
                        }}
                      >
                        <label
                          className={`block p-4 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-101 ${
                            formData.submenu_ids?.includes(submenu.sub_id)
                              ? "bg-amber-100 border-2 border-amber-300 shadow-md"
                              : "bg-white border-2 border-gray-200 hover:border-amber-200 hover:bg-amber-50"
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={
                                formData.submenu_ids?.includes(
                                  submenu.sub_id
                                ) || false
                              }
                              onChange={() =>
                                handleSubmenuToggle(submenu.sub_id)
                              }
                              className="mt-0.5 w-4 h-4 text-amber-600 transition-all duration-300 focus:ring-2 focus:ring-amber-500 rounded"
                              disabled={loading || isSubmitting}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center mb-2">
                                {submenu.ico_nombre && (
                                  <Icon
                                    name={submenu.ico_nombre}
                                    size={14}
                                    className="mr-2 text-gray-500 flex-shrink-0"
                                  />
                                )}
                                <span className="text-sm font-medium text-gray-800 truncate">
                                  {submenu.sub_nom}
                                </span>
                                <span className="ml-2 text-xs text-gray-500 flex-shrink-0">
                                  #{submenu.sub_id}
                                </span>
                                {formData.submenu_ids?.includes(
                                  submenu.sub_id
                                ) && (
                                  <div className="ml-auto">
                                    <Icon
                                      name="Check"
                                      size={14}
                                      className="text-amber-600"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Mostrar menús asociados al submenú */}
                              {submenu.menus && submenu.menus.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-xs text-gray-400 flex-shrink-0">
                                    Menús:
                                  </span>
                                  {submenu.menus.map((menu) => (
                                    <span
                                      key={menu.men_id}
                                      className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs transition-colors duration-300 hover:bg-gray-300"
                                      title={`Menú ID: ${menu.men_id}`}
                                    >
                                      {menu.men_nom}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Mensaje cuando no hay resultados de búsqueda */}
                  {searchTerm && filteredSubmenus.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <Icon
                        name="Search"
                        size={24}
                        className="mx-auto mb-2 text-gray-300"
                      />
                      <p className="text-sm">No se encontraron submenús</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Intenta con otro término de búsqueda
                      </p>
                    </div>
                  )}

                  {/* Mostrar botón "Ver más" si hay muchos elementos */}
                  {submenus.length > 6 && !expandedSubmenus && !searchTerm && (
                    <div className="text-center pt-3 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setExpandedSubmenus(true)}
                        className="text-sm text-amber-600 hover:text-amber-700 flex items-center mx-auto transition-colors duration-300"
                        disabled={isSubmitting}
                      >
                        <Icon name="ChevronDown" size={14} className="mr-1" />
                        Ver {submenus.length - 6} submenús más
                      </button>
                    </div>
                  )}
                </>
              )}

              {formErrors.submenu_ids && (
                <div className="mt-3 text-sm text-red-600 flex items-center animate-shake">
                  <Icon name="AlertTriangle" size={14} className="mr-1" />
                  {formErrors.submenu_ids}
                </div>
              )}
            </div>
          </div>

          {/* Botones con animaciones mejoradas */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || isSubmitting || !isFormValid}
              className={`relative flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 transform ${
                isFormValid && !isSubmitting
                  ? editingOption
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {editingOption ? "Actualizando..." : "Creando..."}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Icon
                    name={editingOption ? "Save" : "Plus"}
                    size={16}
                    className="mr-2 transition-transform duration-300 group-hover:scale-110"
                  />
                  {editingOption ? "Actualizar Opción" : "Crear Opción"}
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
          <div className="absolute inset-0 bg-white bg-opacity-50 rounded-xl flex items-center justify-center z-10">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin h-6 w-6 border-2 border-amber-600 border-t-transparent rounded-full"></div>
              <span className="text-gray-700 font-medium">
                {editingOption ? "Actualizando opción..." : "Creando opción..."}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

OptionForm.displayName = "OptionForm";

// ✅ Componente de Lista de Opciones MIGRADO A BOTONES PARAMETRIZADOS
const OptionsList = React.memo(
  ({ options, loading, onNew, onEdit, onDelete, showMessage }) => {
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

    // ===== VALIDACIONES DE PERMISOS =====
    if (permissionsLoading) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mr-3"></div>
            <span className="text-gray-600">
              Cargando permisos de opciones...
            </span>
          </div>
        </div>
      );
    }

    if (permissionsError) {
      return (
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="text-center py-8">
            <Icon
              name="AlertCircle"
              size={24}
              className="mx-auto mb-3 text-red-300"
            />
            <p className="text-red-600 mb-2">
              Error al cargar permisos de opciones
            </p>
            <p className="text-sm text-red-500">{permissionsError}</p>
          </div>
        </div>
      );
    }

    if (!canRead) {
      return (
        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <div className="text-center py-8">
            <Icon
              name="Lock"
              size={24}
              className="mx-auto mb-3 text-yellow-300"
            />
            <p className="text-yellow-600 mb-2">
              Sin permisos para ver opciones
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left max-w-md mx-auto">
              <p className="text-xs text-yellow-700">
                <strong>Menu ID:</strong> {MENU_ID} |<strong> READ:</strong>{" "}
                {canRead ? "SÍ" : "NO"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Icon name="Settings" size={20} className="mr-2 text-amber-600" />
            Lista de Opciones ({options.length})
            <span className="ml-3 text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
              Menu ID: {MENU_ID}
            </span>
          </h3>
          {/* ✅ BOTÓN CREATE CON SOLO ICONO */}
          {canCreate ? (
            <button
              onClick={onNew}
              className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
              disabled={loading}
              title="Crear nueva opción"
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
              title="Sin permisos para crear opciones"
            >
              <Icon name="Lock" size={16} />
            </div>
          )}
        </div>

        {/* Debug de permisos */}
        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
          <strong>Permisos Opciones:</strong>
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
            read: {canRead ? "SÍ" : "NO"}
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

        {options.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon
              name="Settings"
              size={48}
              className="mx-auto mb-4 text-gray-300"
            />
            <p>No hay opciones registradas</p>
            {canCreate && (
              <p className="text-sm text-gray-400 mt-2">
                Haz clic en el botón + para crear una nueva opción
              </p>
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
                  <th className="text-left py-2">Submenús Asignados</th>
                  <th className="text-left py-2">Ventana Directa</th>
                  <th className="text-left py-2">Estado</th>
                  <th className="text-left py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {options.map((option) => (
                  <tr
                    key={option.opc_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 text-xs text-gray-500">
                      #{option.opc_id}
                    </td>
                    <td className="py-2 font-medium">{option.opc_nom}</td>
                    <td className="py-2">
                      {option.opc_componente ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                          {option.opc_componente}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2">
                      {option.submenus && option.submenus.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {option.submenus.map((submenu) => (
                            <span
                              key={submenu.sub_id}
                              className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                              title={`Submenú ID: ${submenu.sub_id}`}
                            >
                              {submenu.sub_nom}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="py-2">
                      {option.opc_ventana_directa ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Sí
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          option.opc_est
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {option.opc_est ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        {/* ✅ BOTÓN UPDATE MEJORADO */}
                        {canUpdate ? (
                          <button
                            onClick={() => onEdit(option)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                            disabled={loading}
                            title="Editar opción"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                        ) : (
                          <button
                            className="p-2 text-gray-400 cursor-not-allowed rounded-lg"
                            disabled={true}
                            title="Sin permisos para editar"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                        )}
                        {/* ✅ BOTÓN DELETE MEJORADO */}
                        {canDelete ? (
                          <button
                            onClick={() => onDelete(option)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                            disabled={loading}
                            title="Eliminar opción"
                          >
                            <Icon name="Trash" size={16} />
                          </button>
                        ) : (
                          <button
                            className="p-2 text-gray-400 cursor-not-allowed rounded-lg"
                            disabled={true}
                            title="Sin permisos para eliminar"
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
    );
  }
);

OptionsList.displayName = "OptionsList";

// ✅ Hook personalizado para gestión de opciones MIGRADO CON VALIDACIONES DE PERMISOS
const useOptionManagement = (showMessage, loadOptions) => {
  // ===== CONFIGURACIÓN =====
  const MENU_ID = 1; // ID del menú "Parametrización de Módulos"

  // ===== HOOK DE PERMISOS =====
  const { canCreate, canUpdate, canDelete } = useButtonPermissions(
    MENU_ID,
    null,
    true,
    "menu"
  );

  // ===== ESTADOS =====
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [optionFormKey, setOptionFormKey] = useState(0);

  // ===== HANDLERS CON VALIDACIÓN DE PERMISOS =====
  const handleOptionSave = useCallback(
    async (formData, editingOption) => {
      console.log("💾 Guardando opción:", formData);

      // ✅ VALIDACIÓN DE PERMISOS
      if (editingOption && !canUpdate) {
        showMessage("error", "No tienes permisos para actualizar opciones");
        return;
      }

      if (!editingOption && !canCreate) {
        showMessage("error", "No tienes permisos para crear opciones");
        return;
      }

      try {
        const cleanData = {
          opc_nom: formData.opc_nom?.trim(),
          ico_id: formData.ico_id ? parseInt(formData.ico_id) : null,
          opc_componente: formData.opc_componente?.trim() || null,
          opc_eje: parseInt(formData.opc_eje) || 1,
          opc_ventana_directa: Boolean(formData.opc_ventana_directa),
          submenu_ids: formData.submenu_ids || [],
        };

        console.log("📤 Datos limpios de opción a enviar:", cleanData);

        let result;
        if (editingOption) {
          result = await adminService.options.update(
            editingOption.opc_id,
            cleanData
          );
          showMessage("success", "Opción actualizada correctamente");
          console.log("✅ Opción actualizada:", result);
        } else {
          result = await adminService.options.create(cleanData);
          showMessage("success", "Opción creada correctamente");
          console.log("✅ Opción creada:", result);
        }

        await loadOptions();
        setShowOptionForm(false);
        setEditingOption(null);
        setOptionFormKey((prev) => prev + 1);
      } catch (error) {
        console.error("❌ Error completo opción:", error);
        console.error("❌ Error response opción:", error.response?.data);

        let errorMsg = "Error al guardar la opción";

        if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        } else if (error.message) {
          errorMsg = error.message;
        }

        showMessage("error", errorMsg);
      }
    },
    [showMessage, loadOptions, canCreate, canUpdate]
  );

  const handleOptionCancel = useCallback(() => {
    console.log("❌ Cancelando formulario de opción");
    setShowOptionForm(false);
    setEditingOption(null);
    setOptionFormKey((prev) => prev + 1);
  }, []);

  const handleNewOption = useCallback(() => {
    // ✅ VALIDACIÓN DE PERMISOS
    if (!canCreate) {
      showMessage("error", "No tienes permisos para crear opciones");
      return;
    }

    console.log("➕ Nueva opción");
    setEditingOption(null);
    setShowOptionForm(true);
    setOptionFormKey((prev) => prev + 1);
  }, [canCreate, showMessage]);

  const handleEditOption = useCallback(
    (option) => {
      // ✅ VALIDACIÓN DE PERMISOS
      if (!canUpdate) {
        showMessage("error", "No tienes permisos para editar opciones");
        return;
      }

      console.log("✏️ Editar opción:", option.opc_id);
      setEditingOption(option);
      setShowOptionForm(true);
      setOptionFormKey((prev) => prev + 1);
    },
    [canUpdate, showMessage]
  );

  const handleDeleteOption = useCallback(
    async (option) => {
      // ✅ VALIDACIÓN DE PERMISOS
      if (!canDelete) {
        showMessage("error", "No tienes permisos para eliminar opciones");
        return;
      }

      if (!window.confirm(`¿Eliminar la opción "${option.opc_nom}"?`)) {
        return;
      }

      try {
        await adminService.options.delete(option.opc_id);
        showMessage("success", "Opción eliminada correctamente");
        await loadOptions();
      } catch (error) {
        console.error("Error eliminando opción:", error);
        const errorMsg =
          error.response?.data?.message || "Error al eliminar la opción";
        showMessage("error", errorMsg);
      }
    },
    [canDelete, showMessage, loadOptions]
  );

  return {
    showOptionForm,
    editingOption,
    optionFormKey,
    handleOptionSave,
    handleOptionCancel,
    handleNewOption,
    handleEditOption,
    handleDeleteOption,
  };
};

// ✅ Exportar componentes y hook
export { OptionForm, OptionsList, useOptionManagement };
