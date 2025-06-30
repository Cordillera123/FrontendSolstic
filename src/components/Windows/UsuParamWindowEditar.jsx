import React, { useState, useEffect, useCallback } from "react";
// import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";

const UsuParamWindowEditar = ({
  editingUsuario = null,
  onSave,
  onCancel,
  showMessage = (type, message) => console.log(`${type}: ${message}`),
  loading = false,
  perfiles = [],
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    usu_nom: "",
    usu_ape: "",
    usu_cor: "",
    usu_ced: "",
    usu_con: "",
    usu_con_confirmation: "",
    per_id: "",
    est_id: 1,
    usu_deshabilitado: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Inicializar formulario con datos del usuario a editar
  useEffect(() => {
    console.log("🔄 UsuParamWindowEditar - Inicializando formulario");
    console.log("📝 editingUsuario:", editingUsuario);

    if (editingUsuario) {
      // Modo edición - cargar datos existentes
      console.log("✏️ Modo edición - Cargando datos del usuario");
      setFormData({
        usu_nom: editingUsuario.usu_nom || "",
        usu_ape: editingUsuario.usu_ape || "",
        usu_cor: editingUsuario.usu_cor || "",
        usu_ced: editingUsuario.usu_ced || "",
        usu_con: "", // No pre-cargar contraseña por seguridad
        usu_con_confirmation: "",
        per_id: editingUsuario.per_id?.toString() || "",
        est_id: editingUsuario.est_id || 1,
        usu_deshabilitado: Boolean(
          editingUsuario.usu_deshabilitado === true ||
          editingUsuario.usu_deshabilitado === 1 ||
          editingUsuario.usu_deshabilitado === "1" ||
          editingUsuario.usu_deshabilitado === "true"
        ),
      });
    } else {
      // Modo creación - formulario vacío
      console.log("➕ Modo creación - Formulario vacío");
      setFormData({
        usu_nom: "",
        usu_ape: "",
        usu_cor: "",
        usu_ced: "",
        usu_con: "",
        usu_con_confirmation: "",
        per_id: "",
        est_id: 1,
        usu_deshabilitado: false,
      });
    }

    // Limpiar errores al cambiar de modo
    setErrors({});
    setShowSuccess(false);
  }, [editingUsuario]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = useCallback((field, value) => {
    console.log(`📝 Campo ${field} cambiado a:`, value);
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  // Validar formulario
  const validateForm = useCallback(() => {
    console.log("🔍 Validando formulario...");
    const newErrors = {};

    // Validaciones básicas
    if (!formData.usu_nom?.trim()) {
      newErrors.usu_nom = "El nombre es requerido";
    } else if (formData.usu_nom.trim().length < 2) {
      newErrors.usu_nom = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.usu_ape?.trim()) {
      newErrors.usu_ape = "El apellido es requerido";
    } else if (formData.usu_ape.trim().length < 2) {
      newErrors.usu_ape = "El apellido debe tener al menos 2 caracteres";
    }

    if (!formData.usu_cor?.trim()) {
      newErrors.usu_cor = "El email es requerido";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.usu_cor.trim())) {
        newErrors.usu_cor = "Formato de email inválido";
      }
    }

    if (!formData.per_id) {
      newErrors.per_id = "Debe seleccionar un perfil";
    }

    // Validaciones de contraseña
    if (!editingUsuario) {
      // Usuario nuevo - contraseña requerida
      if (!formData.usu_con) {
        newErrors.usu_con = "La contraseña es requerida";
      } else if (formData.usu_con.length < 6) {
        newErrors.usu_con = "La contraseña debe tener al menos 6 caracteres";
      }

      if (!formData.usu_con_confirmation) {
        newErrors.usu_con_confirmation = "Confirme la contraseña";
      } else if (formData.usu_con !== formData.usu_con_confirmation) {
        newErrors.usu_con_confirmation = "Las contraseñas no coinciden";
      }
    } else {
      // Usuario existente - contraseña opcional
      if (formData.usu_con) {
        if (formData.usu_con.length < 6) {
          newErrors.usu_con = "La contraseña debe tener al menos 6 caracteres";
        }
        
        if (!formData.usu_con_confirmation) {
          newErrors.usu_con_confirmation = "Confirme la nueva contraseña";
        } else if (formData.usu_con !== formData.usu_con_confirmation) {
          newErrors.usu_con_confirmation = "Las contraseñas no coinciden";
        }
      }
    }

    console.log("🔍 Errores de validación:", newErrors);
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  }, [formData, editingUsuario]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    console.log("📤 Enviando formulario...");

    if (!validateForm()) {
      console.log("❌ Formulario inválido");
      showMessage("error", "Por favor corrige los errores en el formulario");
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos para envío
      const dataToSend = {
        usu_nom: formData.usu_nom.trim(),
        usu_ape: formData.usu_ape.trim(),
        usu_cor: formData.usu_cor.trim().toLowerCase(),
        usu_ced: formData.usu_ced?.trim() || null,
        per_id: parseInt(formData.per_id),
        est_id: parseInt(formData.est_id),
        usu_deshabilitado: formData.usu_deshabilitado,
      };

      // Solo incluir contraseña si se proporcionó
      if (formData.usu_con) {
        dataToSend.usu_con = formData.usu_con;
        dataToSend.usu_con_confirmation = formData.usu_con_confirmation;
      }

      console.log("📤 Datos a enviar:", dataToSend);

      // Llamar a la función de guardado del componente padre
      await onSave(dataToSend, editingUsuario);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      console.log("✅ Usuario guardado correctamente");

    } catch (error) {
      console.error("❌ Error al guardar usuario:", error);
      
      // Manejar errores de validación del backend
      if (error.response?.data?.errors) {
        const backendErrors = {};
        Object.keys(error.response.data.errors).forEach(field => {
          backendErrors[field] = error.response.data.errors[field][0];
        });
        setErrors(backendErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingUsuario, validateForm, onSave, showMessage]);

  // Manejar cancelación
  const handleCancel = useCallback(() => {
    console.log("❌ Cancelando edición");
    setIsSubmitting(true);
    setTimeout(() => {
      onCancel();
      setIsSubmitting(false);
    }, 300);
  }, [onCancel]);

  // Verificar si hay cambios comparando con los datos originales
  const hasChanges = React.useMemo(() => {
    if (!editingUsuario) return true; // Modo creación siempre tiene "cambios"

    return Object.keys(formData).some(key => {
      if (key === "usu_con" || key === "usu_con_confirmation") {
        // Para contraseñas, si hay valor significa que quiere cambiarla
        return Boolean(formData[key]);
      }
      
      const currentValue = formData[key];
      const originalValue = editingUsuario[key];
      
      // Normalizar valores para comparación
      const current = currentValue ?? "";
      const original = originalValue ?? "";
      
      return current !== original;
    });
  }, [formData, editingUsuario]);

  // Verificar si el formulario es válido
  const isFormValid = React.useMemo(() => {
    const requiredFields = ["usu_nom", "usu_ape", "usu_cor", "per_id"];
    
    // Verificar campos requeridos
    const hasAllRequired = requiredFields.every(field => formData[field]?.trim());
    
    // Para usuarios nuevos, verificar contraseña
    if (!editingUsuario) {
      const hasPassword = formData.usu_con && formData.usu_con_confirmation;
      return hasAllRequired && hasPassword && Object.keys(errors).length === 0;
    }
    
    // Para edición, no requerir contraseña
    return hasAllRequired && Object.keys(errors).length === 0;
  }, [formData, editingUsuario, errors]);

  const resetForm = useCallback(() => {
    if (editingUsuario) {
      setFormData({
        usu_nom: editingUsuario.usu_nom || "",
        usu_ape: editingUsuario.usu_ape || "",
        usu_cor: editingUsuario.usu_cor || "",
        usu_ced: editingUsuario.usu_ced || "",
        usu_con: "",
        usu_con_confirmation: "",
        per_id: editingUsuario.per_id?.toString() || "",
        est_id: editingUsuario.est_id || 1,
        usu_deshabilitado: Boolean(
          editingUsuario.usu_deshabilitado === true ||
          editingUsuario.usu_deshabilitado === 1 ||
          editingUsuario.usu_deshabilitado === "1" ||
          editingUsuario.usu_deshabilitado === "true"
        ),
      });
      setErrors({});
      showMessage("info", "Cambios revertidos");
    }
  }, [editingUsuario, showMessage]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header compacto */}
      <div className="flex-shrink-0 bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
              <Icon name={editingUsuario ? "Edit2" : "Plus"} size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {editingUsuario ? "Editar Usuario" : "Crear Usuario"}
              </h2>
              <p className="text-slate-600 text-sm flex items-center gap-2">
                {editingUsuario && (
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                    ID: {editingUsuario.usu_id}
                  </span>
                )}
                <span className="text-slate-600">
                  {editingUsuario ? `${editingUsuario.usu_nom} ${editingUsuario.usu_ape}` : "Nuevo usuario"}
                </span>
                {/* {hasChanges && editingUsuario && (
                //   <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                //     <Icon name="AlertTriangle" size={12} />
                //     Sin guardar
                //   </span>
                )} */}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes de estado compactos */}
      {(Object.keys(errors).length > 0 || showSuccess) && (
        <div className="flex-shrink-0 px-4 pt-2 pb-1">
          {Object.keys(errors).length > 0 && (
            <div className="p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-center gap-1">
              <Icon name="AlertCircle" size={12} />
              Por favor corrige los errores en el formulario
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
                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.usu_nom
                        ? "border-red-300 bg-red-50"
                        : formData.usu_nom?.trim()
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Nombre del usuario"
                    disabled={loading || isSubmitting}
                    maxLength={50}
                  />
                  {formData.usu_nom?.trim() && !errors.usu_nom && (
                    <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                  )}
                </div>
                {errors.usu_nom && (
                  <p className="text-xs text-red-600 mt-1">{errors.usu_nom}</p>
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
                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.usu_ape
                        ? "border-red-300 bg-red-50"
                        : formData.usu_ape?.trim()
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Apellido del usuario"
                    disabled={loading || isSubmitting}
                    maxLength={50}
                  />
                  {formData.usu_ape?.trim() && !errors.usu_ape && (
                    <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                  )}
                </div>
                {errors.usu_ape && (
                  <p className="text-xs text-red-600 mt-1">{errors.usu_ape}</p>
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
                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.usu_cor
                        ? "border-red-300 bg-red-50"
                        : formData.usu_cor?.trim() && !errors.usu_cor
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="usuario@ejemplo.com"
                    disabled={loading || isSubmitting}
                    maxLength={100}
                  />
                  {formData.usu_cor?.trim() && !errors.usu_cor && (
                    <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                  )}
                </div>
                {errors.usu_cor && (
                  <p className="text-xs text-red-600 mt-1">{errors.usu_cor}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula
                </label>
                <input
                  type="text"
                  value={formData.usu_ced}
                  onChange={(e) => handleInputChange("usu_ced", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                  placeholder="Cédula (opcional)"
                  disabled={loading || isSubmitting}
                  maxLength={20}
                />
              </div>
            </div>

            {/* Fila 3: Perfil y Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Perfil <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.per_id}
                  onChange={(e) => handleInputChange("per_id", e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.per_id
                      ? "border-red-300 bg-red-50"
                      : formData.per_id
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                  }`}
                  disabled={loading || isSubmitting}
                >
                  <option value="">Seleccionar perfil</option>
                  {Array.isArray(perfiles) && perfiles.map((perfil) => (
                    <option key={perfil.per_id} value={perfil.per_id}>
                      {perfil.per_nom}
                    </option>
                  ))}
                </select>
                {errors.per_id && (
                  <p className="text-xs text-red-600 mt-1">{errors.per_id}</p>
                )}
              </div>

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
                      disabled={loading || isSubmitting}
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
                      className="w-4 h-4 text-red-600"
                      disabled={loading || isSubmitting}
                    />
                    <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                      <Icon name="XCircle" size={14} />
                      Inactivo
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sección de contraseña */}
            {editingUsuario && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2 flex items-center gap-1">
                  <Icon name="Info" size={14} />
                  Cambio de contraseña (opcional)
                </p>
                <p className="text-xs text-blue-700">
                  Deja estos campos vacíos si no deseas cambiar la contraseña actual
                </p>
              </div>
            )}

            {/* Fila 4: Contraseñas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUsuario ? "Nueva Contraseña" : "Contraseña"} {!editingUsuario && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.usu_con}
                    onChange={(e) => handleInputChange("usu_con", e.target.value)}
                    className={`w-full px-3 py-2.5 pr-10 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.usu_con
                        ? "border-red-300 bg-red-50"
                        : formData.usu_con && !errors.usu_con
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder={editingUsuario ? "Nueva contraseña (opcional)" : "Mínimo 6 caracteres"}
                    disabled={loading || isSubmitting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <Icon 
                      name={showPassword ? "EyeOff" : "Eye"} 
                      size={16} 
                      className="text-gray-400 hover:text-gray-600" 
                    />
                  </button>
                </div>
                {errors.usu_con && (
                  <p className="text-xs text-red-600 mt-1">{errors.usu_con}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUsuario ? "Confirmar Nueva Contraseña" : "Confirmar Contraseña"} {!editingUsuario && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    value={formData.usu_con_confirmation}
                    onChange={(e) => handleInputChange("usu_con_confirmation", e.target.value)}
                    className={`w-full px-3 py-2.5 pr-10 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.usu_con_confirmation
                        ? "border-red-300 bg-red-50"
                        : formData.usu_con_confirmation && !errors.usu_con_confirmation
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Confirme la contraseña"
                    disabled={loading || isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <Icon 
                      name={showPasswordConfirm ? "EyeOff" : "Eye"} 
                      size={16} 
                      className="text-gray-400 hover:text-gray-600" 
                    />
                  </button>
                </div>
                {errors.usu_con_confirmation && (
                  <p className="text-xs text-red-600 mt-1">{errors.usu_con_confirmation}</p>
                )}
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="text-xs space-y-0.5">
                    <li>• El email será usado para el inicio de sesión</li>
                    <li>• {editingUsuario ? "Deje los campos de contraseña vacíos para mantener la actual" : "La contraseña debe tener al menos 6 caracteres"}</li>
                    <li>• {editingUsuario ? "Si cambia la contraseña, debe confirmarla" : "Debe confirmar la contraseña"}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Indicador de cambios */}
            {/* {hasChanges && editingUsuario && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-1">
                <Icon name="AlertTriangle" size={12} />
                Hay cambios sin guardar
              </div>
            )} */}
          </div>

          {/* Botones de acción - Siempre en la parte inferior */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || isSubmitting || !isFormValid || (editingUsuario && !hasChanges)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                  isFormValid && (!editingUsuario || hasChanges) && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transform"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                title={editingUsuario && !hasChanges ? "No hay cambios para guardar" : ""}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {editingUsuario ? "Actualizando Usuario..." : "Creando Usuario..."}
                  </>
                ) : (
                  <>
                    <Icon name={editingUsuario ? "Save" : "Plus"} size={16} />
                    {editingUsuario 
                      ? (hasChanges ? "Guardar Cambios" : "Sin Cambios")
                      : "Crear Usuario"
                    }
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading || isSubmitting}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:text-gray-800 hover:scale-105 transform hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
              >
                <Icon name="X" size={16} />
                Cancelar
              </button>

              {hasChanges && editingUsuario && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading || isSubmitting}
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
              {editingUsuario ? "Actualizando usuario..." : "Creando usuario..."}
            </span>
          </div>
        </div>  
      )}
    </div>
  );
};

export default UsuParamWindowEditar;