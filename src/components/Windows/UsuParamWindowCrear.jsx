// src/components/Windows/UsuParamWindowCrear.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";

const UsuParamWindowCrear = ({ 
  editingUsuario, 
  onSave, 
  onCancel, 
  showMessage, 
  loading: externalLoading,
  perfiles = []
}) => {
  console.log("🔵 UsuParamWindowCrear - Renderizando con usuario:", editingUsuario?.usu_id || "null");

  // Estados para validación y carga
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Estado del formulario - inicializado con datos del usuario
  const [formData, setFormData] = useState(() => {
    if (editingUsuario) {
      console.log("🔄 Inicializando formulario con datos de usuario:", editingUsuario.usu_id);
      return {
        usu_nom: editingUsuario.usu_nom || "",
        usu_ape: editingUsuario.usu_ape || "",
        usu_cor: editingUsuario.usu_cor || "",
        usu_con: "",
        usu_ced: editingUsuario.usu_ced || "",
        per_id: editingUsuario.per_id || "",
        est_id: editingUsuario.est_id || 1,
      };
    } else {
      console.log("🟡 Inicializando formulario vacío");
      return {
        usu_nom: "",
        usu_ape: "",
        usu_cor: "",
        usu_con: "",
        usu_ced: "",
        per_id: "",
        est_id: 1,
      };
    }
  });

  // Efecto para actualizar formulario cuando cambie editingUsuario
  useEffect(() => {
    console.log("🔄 useEffect ejecutado - editingUsuario cambió:", editingUsuario?.usu_id || "null");

    if (editingUsuario) {
      setFormData({
        usu_nom: editingUsuario.usu_nom || "",
        usu_ape: editingUsuario.usu_ape || "",
        usu_cor: editingUsuario.usu_cor || "",
        usu_con: "",
        usu_ced: editingUsuario.usu_ced || "",
        per_id: editingUsuario.per_id || "",
        est_id: editingUsuario.est_id || 1,
      });
    } else {
      setFormData({
        usu_nom: "",
        usu_ape: "",
        usu_cor: "",
        usu_con: "",
        usu_ced: "",
        per_id: "",
        est_id: 1,
      });
    }

    setFormErrors({});
    setShowSuccess(false);
    setIsSubmitting(false);
  }, [editingUsuario?.usu_id]);

  // Validación en tiempo real
  const validateField = useCallback((field, value) => {
    const errors = { ...formErrors };

    switch (field) {
      case "usu_nom":
        if (!value?.trim()) {
          errors.usu_nom = "El nombre es requerido";
        } else if (value.length < 2) {
          errors.usu_nom = "Mínimo 2 caracteres";
        } else if (value.length > 50) {
          errors.usu_nom = "Máximo 50 caracteres";
        } else {
          delete errors.usu_nom;
        }
        break;
      case "usu_ape":
        if (!value?.trim()) {
          errors.usu_ape = "El apellido es requerido";
        } else if (value.length < 2) {
          errors.usu_ape = "Mínimo 2 caracteres";
        } else if (value.length > 50) {
          errors.usu_ape = "Máximo 50 caracteres";
        } else {
          delete errors.usu_ape;
        }
        break;
      case "usu_cor":
        if (!value?.trim()) {
          errors.usu_cor = "El email es requerido";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.usu_cor = "Formato inválido";
        } else if (value.length > 100) {
          errors.usu_cor = "Máximo 100 caracteres";
        } else {
          delete errors.usu_cor;
        }
        break;
      case "usu_con":
        if (!editingUsuario && !value?.trim()) {
          errors.usu_con = "La contraseña es requerida";
        } else if (value?.trim() && value.length < 6) {
          errors.usu_con = "Mínimo 6 caracteres";
        } else if (value?.length > 255) {
          errors.usu_con = "Máximo 255 caracteres";
        } else {
          delete errors.usu_con;
        }
        break;
      case "usu_ced":
        if (!value?.trim()) {
          errors.usu_ced = "La cédula es requerida";
        } else if (!/^\d{10}$/.test(value)) {
          errors.usu_ced = "Debe tener 10 dígitos";
        } else {
          delete errors.usu_ced;
        }
        break;
      case "per_id":
        if (!value) {
          errors.per_id = "El perfil es requerido";
        } else {
          delete errors.per_id;
        }
        break;
      default:
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formErrors, editingUsuario]);

  // Manejador de cambios
  const handleInputChange = useCallback((field, value) => {
    console.log("⌨️ Campo cambiado:", field, "=", value);
    
    // Procesamiento especial por campo
    let processedValue = value;
    if (field === "usu_ced") {
      // Solo números para cédula
      processedValue = value.replace(/\D/g, '');
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
    const requiredFields = ["usu_nom", "usu_ape", "usu_cor", "usu_ced", "per_id"];
    
    if (!editingUsuario) {
      requiredFields.push("usu_con");
    }

    const missingFields = requiredFields.filter(field => {
      const value = formData[field];
      if (typeof value === "string") {
        return !value.trim();
      } else if (typeof value === "number") {
        return !value;
      } else {
        return !value;
      }
    });

    if (missingFields.length > 0) {
      const fieldNames = {
        usu_nom: "Nombre",
        usu_ape: "Apellido", 
        usu_cor: "Email",
        usu_con: "Contraseña",
        usu_ced: "Cédula",
        per_id: "Perfil"
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
        usu_nom: formData.usu_nom.trim(),
        usu_ape: formData.usu_ape.trim(),
        usu_cor: formData.usu_cor.trim(),
        usu_ced: formData.usu_ced.trim(),
        per_id: formData.per_id,
        est_id: formData.est_id,
      };

      // Solo incluir contraseña si se proporcionó
      if (formData.usu_con?.trim()) {
        dataToSend.usu_con = formData.usu_con.trim();
      }

      console.log("📤 Enviando datos:", dataToSend);
      await onSave(dataToSend, editingUsuario);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Limpiar formulario después de crear exitosamente (solo para crear)
      if (!editingUsuario) {
        setFormData({
          usu_nom: "",
          usu_ape: "",
          usu_cor: "",
          usu_con: "",
          usu_ced: "",
          per_id: "",
          est_id: 1,
        });
      }

    } catch (error) {
      console.error("❌ Error en submit:", error);
      setFormErrors({ submit: error.message || "Error al guardar usuario" });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingUsuario, onSave, showMessage]);

  const handleCancel = useCallback(() => {
    setIsSubmitting(true);
    setTimeout(() => {
      onCancel();
      setIsSubmitting(false);
    }, 300);
  }, [onCancel]);

  // Verificar validez del formulario
  const isFormValid = useMemo(() => {
    const requiredFields = ["usu_nom", "usu_ape", "usu_cor", "usu_ced", "per_id"];
    
    if (!editingUsuario) {
      requiredFields.push("usu_con");
    }

    const hasAllRequired = requiredFields.every(field => {
      const value = formData[field];
      if (typeof value === "string") {
        return value.trim();
      } else if (typeof value === "number") {
        return value;
      } else {
        return value;
      }
    });
    
    const hasNoErrors = Object.keys(formErrors).length === 0;

    return hasAllRequired && hasNoErrors;
  }, [formData, formErrors, editingUsuario]);

  const hasChanges = useMemo(() => {
    if (!editingUsuario) return true; // Para crear siempre permitir

    return Object.keys(formData).some(key => {
      const currentValue = formData[key];
      const originalValue = editingUsuario[key];
      
      // Excluir contraseña del cambio si está vacía
      if (key === "usu_con" && !currentValue?.trim()) {
        return false;
      }
      
      const current = currentValue ?? "";
      const original = originalValue ?? "";
      return current !== original;
    });
  }, [formData, editingUsuario]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header compacto */}
      <div className="flex-shrink-0 bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
              editingUsuario 
                ? "bg-gradient-to-br from-orange-400 to-orange-500" 
                : "bg-gradient-to-br from-green-400 to-green-500"
            }`}>
              <Icon name={editingUsuario ? "Edit" : "Plus"} size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {editingUsuario ? "Editar Usuario" : "Crear Usuario"}
              </h2>
              <p className="text-slate-600 text-sm flex items-center gap-2">
                {editingUsuario ? (
                  <>
                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                      ID: {editingUsuario.usu_id}
                    </span>
                    <span className="text-slate-600">{editingUsuario.usu_nom} {editingUsuario.usu_ape}</span>
                    {hasChanges && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                        <Icon name="AlertTriangle" size={12} />
                        Sin guardar
                      </span>
                    )}
                  </>
                ) : (
                  "Complete los campos requeridos"
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
              ¡Usuario {editingUsuario ? 'actualizado' : 'creado'} exitosamente!
            </div>
          )}
        </div>
      )}

      {/* Contenido del formulario - Optimizado para llenar el espacio */}
      <div className="flex-1 flex flex-col p-4">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Fila 1: Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.usu_nom}
                    onChange={(e) => handleInputChange("usu_nom", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.usu_nom
                        ? "border-red-300 bg-red-50"
                        : formData.usu_nom?.trim()
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Nombre del usuario"
                    disabled={externalLoading || isSubmitting}
                    maxLength={50}
                  />
                  {formData.usu_nom?.trim() && !formErrors.usu_nom && (
                    <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                  )}
                </div>
                {formErrors.usu_nom && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.usu_nom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.usu_ape}
                    onChange={(e) => handleInputChange("usu_ape", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.usu_ape
                        ? "border-red-300 bg-red-50"
                        : formData.usu_ape?.trim()
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Apellido del usuario"
                    disabled={externalLoading || isSubmitting}
                    maxLength={50}
                  />
                  {formData.usu_ape?.trim() && !formErrors.usu_ape && (
                    <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                  )}
                </div>
                {formErrors.usu_ape && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.usu_ape}</p>
                )}
              </div>
            </div>

            {/* Fila 2: Email y Cédula */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.usu_cor}
                    onChange={(e) => handleInputChange("usu_cor", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.usu_cor
                        ? "border-red-300 bg-red-50"
                        : formData.usu_cor?.trim() && !formErrors.usu_cor
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="correo@ejemplo.com"
                    disabled={externalLoading || isSubmitting}
                    maxLength={100}
                  />
                  {formData.usu_cor?.trim() && !formErrors.usu_cor && (
                    <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                  )}
                </div>
                {formErrors.usu_cor && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.usu_cor}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.usu_ced}
                    onChange={(e) => handleInputChange("usu_ced", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.usu_ced
                        ? "border-red-300 bg-red-50"
                        : formData.usu_ced?.length === 10
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="1234567890"
                    disabled={externalLoading || isSubmitting}
                    maxLength={10}
                  />
                  {formData.usu_ced?.length === 10 && !formErrors.usu_ced && (
                    <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                  )}
                </div>
                {formErrors.usu_ced && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.usu_ced}</p>
                )}
              </div>
            </div>

            {/* Fila 3: Contraseña y Perfil */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUsuario ? "Nueva Contraseña (opcional)" : "Contraseña"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.usu_con}
                    onChange={(e) => handleInputChange("usu_con", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formErrors.usu_con
                        ? "border-red-300 bg-red-50"
                        : formData.usu_con?.trim() && formData.usu_con.length >= 6
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder={editingUsuario ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
                    disabled={externalLoading || isSubmitting}
                    minLength={6}
                  />
                  {formData.usu_con?.trim() && formData.usu_con.length >= 6 && !formErrors.usu_con && (
                    <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                  )}
                </div>
                {formErrors.usu_con && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.usu_con}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Perfil <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.per_id}
                  onChange={(e) => handleInputChange("per_id", e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formErrors.per_id
                      ? "border-red-300 bg-red-50"
                      : formData.per_id
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                  }`}
                  disabled={externalLoading || isSubmitting}
                >
                  <option value="">Seleccionar perfil</option>
                  {Array.isArray(perfiles) &&
                    perfiles.map((perfil) => (
                      <option key={perfil.per_id} value={perfil.per_id}>
                        {perfil.per_nom}
                      </option>
                    ))}
                </select>
                {formErrors.per_id && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.per_id}</p>
                )}
              </div>
            </div>

            {/* Fila 4: Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="est_id"
                    value={1}
                    checked={formData.est_id === 1}
                    onChange={(e) => handleInputChange("est_id", parseInt(e.target.value))}
                    className="w-4 h-4 text-green-600"
                    disabled={externalLoading || isSubmitting}
                  />
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <Icon name="CheckCircle" size={14} />
                    Activo
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="est_id"
                    value={2}
                    checked={formData.est_id === 2}
                    onChange={(e) => handleInputChange("est_id", parseInt(e.target.value))}
                    className="w-4 h-4 text-yellow-600"
                    disabled={externalLoading || isSubmitting}
                  />
                  <span className="text-sm text-yellow-600 font-medium flex items-center gap-1">
                    <Icon name="Pause" size={14} />
                    Inactivo
                  </span>
                </label>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="text-xs space-y-0.5">
                    <li>• La cédula debe tener exactamente 10 dígitos</li>
                    <li>• El email será usado para el inicio de sesión</li>
                    <li>• {editingUsuario ? "Deje la contraseña vacía para mantener la actual" : "La contraseña debe tener al menos 6 caracteres"}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Indicador de cambios para edición */}
            {editingUsuario && !hasChanges && (
              <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 flex items-center gap-1">
                <Icon name="Info" size={12} />
                No hay cambios para guardar
              </div>
            )}
          </div>

          {/* Botones de acción - Siempre en la parte inferior */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={externalLoading || isSubmitting || !isFormValid || (editingUsuario && !hasChanges)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                  isFormValid && (!editingUsuario || hasChanges) && !isSubmitting
                    ? editingUsuario
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transform"
                      : "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transform"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                title={editingUsuario && !hasChanges ? "No hay cambios para guardar" : ""}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {editingUsuario ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  <>
                    <Icon name={editingUsuario ? "Save" : "Plus"} size={16} />
                    {editingUsuario ? "Actualizar Usuario" : "Crear Usuario"}
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
            </div>
          </div>
        </form>
      </div>

      {/* Overlay de loading */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex items-center gap-3 border">
            <div className="animate-spin h-8 w-8 border-3 border-green-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-700 font-medium text-lg">
              {editingUsuario ? "Actualizando usuario..." : "Creando usuario..."}
            </span>
          </div>
        </div>  
      )}
    </div>
  );
};

export default UsuParamWindowCrear;