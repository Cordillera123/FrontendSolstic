// src/components/Windows/OficinasWindow.jsx - CRUD DE OFICINAS CON PERMISOS
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useButtonPermissions } from "../../hooks/useButtonPermissions";
import { adminService } from "../../services/apiService";
import { getCurrentUser } from "../../context/AuthContext";
import Icon from "../UI/Icon";

// ===== COMPONENTE OficinaForm =====
const OficinaForm = React.memo(
  ({ editingOficina, loading, onSave, onCancel, showMessage }) => {
    console.log("🔵 OficinaForm render - editingOficina:", editingOficina?.oficin_codigo || "null");

    // Estados para validación y animaciones
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);

    // Estados para los selects
    const [tiposOficina, setTiposOficina] = useState([]);
    const [instituciones, setInstituciones] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [cantones, setCantones] = useState([]);
    const [parroquias, setParroquias] = useState([]);
    const [loadingSelects, setLoadingSelects] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState(() => {
      if (editingOficina) {
        console.log("🟢 Inicializando con datos existentes");
        return {
          oficin_nombre: editingOficina.oficin_nombre || "",
          oficin_instit_codigo: editingOficina.oficin_instit_codigo || "",
          oficin_tofici_codigo: editingOficina.oficin_tofici_codigo || "",
          oficin_parroq_codigo: editingOficina.oficin_parroq_codigo || "",
          oficin_direccion: editingOficina.oficin_direccion || "",
          oficin_telefono: editingOficina.oficin_telefono || "",
          oficin_diremail: editingOficina.oficin_diremail || "",
          oficin_codocntrl: editingOficina.oficin_codocntrl || "",
          oficin_ctractual: editingOficina.oficin_ctractual || 1,
          oficin_eregis_codigo: editingOficina.oficin_eregis_codigo || "",
          oficin_rucoficina: editingOficina.oficin_rucoficina || "",
          oficin_codresapertura: editingOficina.oficin_codresapertura || "",
          oficin_fechaapertura: editingOficina.oficin_fechaapertura || "",
          oficin_fechacierre: editingOficina.oficin_fechacierre || "",
          oficin_codrescierre: editingOficina.oficin_codrescierre || "",
          oficin_fecharescierre: editingOficina.oficin_fecharescierre || "",
        };
      } else {
        console.log("🟡 Inicializando formulario vacío");
        return {
          oficin_nombre: "",
          oficin_instit_codigo: "",
          oficin_tofici_codigo: "",
          oficin_parroq_codigo: "",
          oficin_direccion: "",
          oficin_telefono: "",
          oficin_diremail: "",
          oficin_codocntrl: "",
          oficin_ctractual: 1,
          oficin_eregis_codigo: "",
          oficin_rucoficina: "",
          oficin_codresapertura: "",
          oficin_fechaapertura: "",
          oficin_fechacierre: "",
          oficin_codrescierre: "",
          oficin_fecharescierre: "",
        };
      }
    });

    // Cargar datos para los selects
    const loadSelectData = useCallback(async () => {
      setLoadingSelects(true);
      try {
        console.log("🔄 Cargando datos para selects...");
        
        const [tiposResult, institucionesResult, provinciasResult] = await Promise.all([
          adminService.tiposOficina.getActivos(),
          adminService.instituciones.listar(),
          adminService.provincias.listar(),
        ]);

        if (tiposResult.status === "success") {
          setTiposOficina(tiposResult.data || []);
        }
        if (institucionesResult.status === "success") {
          setInstituciones(institucionesResult.data || []);
        }
        if (provinciasResult.status === "success") {
          setProvincias(provinciasResult.data || []);
        }

        console.log("✅ Datos de selects cargados:", {
          tipos: tiposResult.data?.length || 0,
          instituciones: institucionesResult.data?.length || 0,
          provincias: provinciasResult.data?.length || 0,
        });

      } catch (error) {
        console.error("❌ Error cargando datos de selects:", error);
        showMessage("error", "Error al cargar datos para formulario");
      } finally {
        setLoadingSelects(false);
      }
    }, [showMessage]);

    // Cargar cantones cuando cambie la provincia
    const loadCantonesByProvincia = useCallback(async (provinciaId) => {
      if (!provinciaId) {
        setCantones([]);
        setParroquias([]);
        return;
      }

      try {
        console.log("🔄 Cargando cantones para provincia:", provinciaId);
        const result = await adminService.cantones.getByProvincia(provinciaId);
        
        if (result.status === "success") {
          setCantones(result.data || []);
        }
      } catch (error) {
        console.error("❌ Error cargando cantones:", error);
        setCantones([]);
      }
    }, []);

    // Cargar parroquias cuando cambie el cantón
    const loadParroquiasByCanton = useCallback(async (cantonId) => {
      if (!cantonId) {
        setParroquias([]);
        return;
      }

      try {
        console.log("🔄 Cargando parroquias para cantón:", cantonId);
        const result = await adminService.parroquias.getByCanton(cantonId);
        
        if (result.status === "success") {
          setParroquias(result.data || []);
        }
      } catch (error) {
        console.error("❌ Error cargando parroquias:", error);
        setParroquias([]);
      }
    }, []);

    // Efecto para actualizar formulario cuando cambie editingOficina
    useEffect(() => {
      console.log("🔄 useEffect ejecutado - editingOficina cambió:", editingOficina?.oficin_codigo || "null");

      if (editingOficina) {
        setFormData({
          oficin_nombre: editingOficina.oficin_nombre || "",
          oficin_instit_codigo: editingOficina.oficin_instit_codigo || "",
          oficin_tofici_codigo: editingOficina.oficin_tofici_codigo || "",
          oficin_parroq_codigo: editingOficina.oficin_parroq_codigo || "",
          oficin_direccion: editingOficina.oficin_direccion || "",
          oficin_telefono: editingOficina.oficin_telefono || "",
          oficin_diremail: editingOficina.oficin_diremail || "",
          oficin_codocntrl: editingOficina.oficin_codocntrl || "",
          oficin_ctractual: editingOficina.oficin_ctractual || 1,
          oficin_eregis_codigo: editingOficina.oficin_eregis_codigo || "",
          oficin_rucoficina: editingOficina.oficin_rucoficina || "",
          oficin_codresapertura: editingOficina.oficin_codresapertura || "",
          oficin_fechaapertura: editingOficina.oficin_fechaapertura || "",
          oficin_fechacierre: editingOficina.oficin_fechacierre || "",
          oficin_codrescierre: editingOficina.oficin_codrescierre || "",
          oficin_fecharescierre: editingOficina.oficin_fecharescierre || "",
        });
      } else {
        setFormData({
          oficin_nombre: "",
          oficin_instit_codigo: "",
          oficin_tofici_codigo: "",
          oficin_parroq_codigo: "",
          oficin_direccion: "",
          oficin_telefono: "",
          oficin_diremail: "",
          oficin_codocntrl: "",
          oficin_ctractual: 1,
          oficin_eregis_codigo: "",
          oficin_rucoficina: "",
          oficin_codresapertura: "",
          oficin_fechaapertura: "",
          oficin_fechacierre: "",
          oficin_codrescierre: "",
          oficin_fecharescierre: "",
        });
      }

      setFormErrors({});
      setShowSuccess(false);
      setIsSubmitting(false);
    }, [editingOficina?.oficin_codigo]);

    // Cargar datos de selects al montar
    useEffect(() => {
      loadSelectData();
    }, [loadSelectData]);

    // Validación en tiempo real
    const validateField = useCallback((field, value) => {
      const errors = { ...formErrors };

      switch (field) {
        case "oficin_nombre":
          if (!value?.trim()) {
            errors.oficin_nombre = "El nombre es requerido";
          } else if (value.length < 3) {
            errors.oficin_nombre = "El nombre debe tener al menos 3 caracteres";
          } else if (value.length > 60) {
            errors.oficin_nombre = "El nombre no puede exceder 60 caracteres";
          } else {
            delete errors.oficin_nombre;
          }
          break;
        case "oficin_direccion":
          if (!value?.trim()) {
            errors.oficin_direccion = "La dirección es requerida";
          } else if (value.length > 80) {
            errors.oficin_direccion = "La dirección no puede exceder 80 caracteres";
          } else {
            delete errors.oficin_direccion;
          }
          break;
        case "oficin_telefono":
          if (!value?.trim()) {
            errors.oficin_telefono = "El teléfono es requerido";
          } else if (value.length > 30) {
            errors.oficin_telefono = "El teléfono no puede exceder 30 caracteres";
          } else {
            delete errors.oficin_telefono;
          }
          break;
        case "oficin_diremail":
          if (!value?.trim()) {
            errors.oficin_diremail = "El email es requerido";
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.oficin_diremail = "Formato de email inválido";
          } else if (value.length > 120) {
            errors.oficin_diremail = "El email no puede exceder 120 caracteres";
          } else {
            delete errors.oficin_diremail;
          }
          break;
        case "oficin_rucoficina":
          if (!value?.trim()) {
            errors.oficin_rucoficina = "El RUC es requerido";
          } else if (value.length !== 13) {
            errors.oficin_rucoficina = "El RUC debe tener 13 dígitos";
          } else if (!/^\d+$/.test(value)) {
            errors.oficin_rucoficina = "El RUC solo debe contener números";
          } else {
            delete errors.oficin_rucoficina;
          }
          break;
        case "oficin_instit_codigo":
          if (!value) {
            errors.oficin_instit_codigo = "La institución es requerida";
          } else {
            delete errors.oficin_instit_codigo;
          }
          break;
        case "oficin_tofici_codigo":
          if (!value) {
            errors.oficin_tofici_codigo = "El tipo de oficina es requerido";
          } else {
            delete errors.oficin_tofici_codigo;
          }
          break;
        case "oficin_parroq_codigo":
          if (!value) {
            errors.oficin_parroq_codigo = "La parroquia es requerida";
          } else {
            delete errors.oficin_parroq_codigo;
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
      
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Validar en tiempo real
      validateField(field, value);

      // Manejar cascadas de selects geográficos
      if (field === "oficin_parroq_codigo") {
        // Cuando se selecciona una parroquia, necesitamos cargar sus datos padre
        const selectedParroquia = parroquias.find(p => p.value === parseInt(value));
        if (selectedParroquia) {
          // Cargar cantones y provincias padre si es necesario
          console.log("📍 Parroquia seleccionada:", selectedParroquia);
        }
      }
    }, [validateField, parroquias]);

    // Manejador de cambio de provincia (para cascada)
    const handleProvinciaChange = useCallback((provinciaId) => {
      console.log("🌍 Provincia cambiada:", provinciaId);
      
      // Limpiar campos dependientes
      setFormData(prev => ({
        ...prev,
        oficin_parroq_codigo: "",
      }));
      
      setCantones([]);
      setParroquias([]);
      
      if (provinciaId) {
        loadCantonesByProvincia(provinciaId);
      }
    }, [loadCantonesByProvincia]);

    // Manejador de cambio de cantón (para cascada)
    const handleCantonChange = useCallback((cantonId) => {
      console.log("🏘️ Cantón cambiado:", cantonId);
      
      // Limpiar parroquia
      setFormData(prev => ({
        ...prev,
        oficin_parroq_codigo: "",
      }));
      
      setParroquias([]);
      
      if (cantonId) {
        loadParroquiasByCanton(cantonId);
      }
    }, [loadParroquiasByCanton]);

    // Manejador de envío
    const handleSubmit = useCallback(async (e) => {
      e.preventDefault();

      // Validación final
      const requiredFields = [
        "oficin_nombre", "oficin_instit_codigo", "oficin_tofici_codigo",
        "oficin_parroq_codigo", "oficin_direccion", "oficin_telefono",
        "oficin_diremail", "oficin_rucoficina"
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        const fieldNames = {
          oficin_nombre: "Nombre",
          oficin_instit_codigo: "Institución",
          oficin_tofici_codigo: "Tipo de Oficina",
          oficin_parroq_codigo: "Parroquia",
          oficin_direccion: "Dirección",
          oficin_telefono: "Teléfono",
          oficin_diremail: "Email",
          oficin_rucoficina: "RUC"
        };
        const missingNames = missingFields.map(field => fieldNames[field]).join(", ");
        setFormErrors({ [missingFields[0]]: `Campos requeridos: ${missingNames}` });
        showMessage("error", `Campos requeridos: ${missingNames}`);
        return;
      }

      setIsSubmitting(true);
      setFormErrors({});

      try {
        console.log("📤 Enviando datos:", formData);
        await onSave(formData, editingOficina);

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      } catch (error) {
        console.error("❌ Error en submit:", error);
        setFormErrors({ submit: error.message || "Error al guardar" });
      } finally {
        setIsSubmitting(false);
      }
    }, [formData, editingOficina, onSave, showMessage]);

    const handleCancel = useCallback(() => {
      setIsSubmitting(true);
      setTimeout(() => {
        onCancel();
        setIsSubmitting(false);
      }, 300);
    }, [onCancel]);

    // Verificar validez del formulario
    const isFormValid = useMemo(() => {
      const requiredFields = [
        "oficin_nombre", "oficin_instit_codigo", "oficin_tofici_codigo",
        "oficin_parroq_codigo", "oficin_direccion", "oficin_telefono",
        "oficin_diremail", "oficin_rucoficina"
      ];
      
      const hasAllRequired = requiredFields.every(field => formData[field]);
      const hasNoErrors = Object.keys(formErrors).length === 0;
      
      return hasAllRequired && hasNoErrors;
    }, [formData, formErrors]);

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm transition-all duration-300 hover:shadow-md relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 transition-all duration-300 ${
                editingOficina ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
              }`}>
              <Icon name={editingOficina ? "Edit" : "Plus"} size={20} className="transition-transform duration-300 hover:scale-110" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {editingOficina ? `Editar Oficina` : "Crear Nueva Oficina"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingOficina ? "Modifica los datos de la oficina" : "Complete los campos para crear una nueva oficina"}
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

        {/* Loading de selects */}
        {loadingSelects && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-600 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
              Cargando datos del formulario...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <Icon name="Building" size={16} className="mr-2" />
              Información Básica
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nombre de la Oficina *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.oficin_nombre || ""}
                    onChange={(e) => handleInputChange("oficin_nombre", e.target.value)}
                    className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.oficin_nombre
                        ? "border-red-300 bg-red-50"
                        : formData.oficin_nombre?.trim()
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Ej: Oficina Principal Quito"
                    disabled={loading || isSubmitting}
                    maxLength={60}
                    autoComplete="off"
                  />
                  {formData.oficin_nombre?.trim() && !formErrors.oficin_nombre && (
                    <div className="absolute right-3 top-3.5">
                      <Icon name="Check" size={16} className="text-green-500" />
                    </div>
                  )}
                </div>
                {formErrors.oficin_nombre && (
                  <p className="text-sm text-red-600 flex items-center animate-shake">
                    <Icon name="AlertCircle" size={14} className="mr-1" />
                    {formErrors.oficin_nombre}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formData.oficin_nombre?.length || 0}/60 caracteres
                </p>
              </div>

              {/* RUC */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  RUC de la Oficina *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.oficin_rucoficina || ""}
                    onChange={(e) => handleInputChange("oficin_rucoficina", e.target.value.replace(/\D/g, ''))}
                    className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.oficin_rucoficina
                        ? "border-red-300 bg-red-50"
                        : formData.oficin_rucoficina?.length === 13
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="1234567890001"
                    disabled={loading || isSubmitting}
                    maxLength={13}
                    autoComplete="off"
                  />
                  {formData.oficin_rucoficina?.length === 13 && !formErrors.oficin_rucoficina && (
                    <div className="absolute right-3 top-3.5">
                      <Icon name="Check" size={16} className="text-green-500" />
                    </div>
                  )}
                </div>
                {formErrors.oficin_rucoficina && (
                  <p className="text-sm text-red-600 flex items-center animate-shake">
                    <Icon name="AlertCircle" size={14} className="mr-1" />
                    {formErrors.oficin_rucoficina}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formData.oficin_rucoficina?.length || 0}/13 dígitos
                </p>
              </div>
            </div>
          </div>

          {/* Clasificación */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <Icon name="Tags" size={16} className="mr-2" />
              Clasificación
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Institución */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Institución *
                </label>
                <select
                  value={formData.oficin_instit_codigo || ""}
                  onChange={(e) => handleInputChange("oficin_instit_codigo", e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.oficin_instit_codigo
                      ? "border-red-300 bg-red-50"
                      : formData.oficin_instit_codigo
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  disabled={loading || isSubmitting || loadingSelects}
                >
                  <option value="">Seleccione una institución</option>
                  {instituciones.map((inst) => (
                    <option key={inst.value} value={inst.value}>
                      {inst.label}
                    </option>
                  ))}
                </select>
                {formErrors.oficin_instit_codigo && (
                  <p className="text-sm text-red-600 flex items-center animate-shake">
                    <Icon name="AlertCircle" size={14} className="mr-1" />
                    {formErrors.oficin_instit_codigo}
                  </p>
                )}
              </div>

              {/* Tipo de Oficina */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Oficina *
                </label>
                <select
                  value={formData.oficin_tofici_codigo || ""}
                  onChange={(e) => handleInputChange("oficin_tofici_codigo", e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.oficin_tofici_codigo
                      ? "border-red-300 bg-red-50"
                      : formData.oficin_tofici_codigo
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  disabled={loading || isSubmitting || loadingSelects}
                >
                  <option value="">Seleccione un tipo</option>
                  {tiposOficina.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
                {formErrors.oficin_tofici_codigo && (
                  <p className="text-sm text-red-600 flex items-center animate-shake">
                    <Icon name="AlertCircle" size={14} className="mr-1" />
                    {formErrors.oficin_tofici_codigo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ubicación Geográfica */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <Icon name="MapPin" size={16} className="mr-2" />
              Ubicación Geográfica
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Provincia */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Provincia *
                </label>
                <select
                  value={provincias.find(p => cantones.some(c => parroquias.some(par => par.canton_codigo === c.value && c.provincia_codigo === p.value)))?.value || ""}
                  onChange={(e) => handleProvinciaChange(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 hover:border-gray-400"
                  disabled={loading || isSubmitting || loadingSelects}
                >
                  <option value="">Seleccione provincia</option>
                  {provincias.map((prov) => (
                    <option key={prov.value} value={prov.value}>
                      {prov.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantón */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Cantón *
                </label>
                <select
                  value={cantones.find(c => parroquias.some(p => p.canton_codigo === c.value))?.value || ""}
                  onChange={(e) => handleCantonChange(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 hover:border-gray-400"
                  disabled={loading || isSubmitting || loadingSelects || cantones.length === 0}
                >
                  <option value="">Seleccione cantón</option>
                  {cantones.map((canton) => (
                    <option key={canton.value} value={canton.value}>
                      {canton.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parroquia */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Parroquia *
                </label>
                <select
                  value={formData.oficin_parroq_codigo || ""}
                  onChange={(e) => handleInputChange("oficin_parroq_codigo", e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.oficin_parroq_codigo
                      ? "border-red-300 bg-red-50"
                      : formData.oficin_parroq_codigo
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  disabled={loading || isSubmitting || loadingSelects || parroquias.length === 0}
                >
                  <option value="">Seleccione parroquia</option>
                  {parroquias.map((parr) => (
                    <option key={parr.value} value={parr.value}>
                      {parr.label}
                    </option>
                  ))}
                </select>
                {formErrors.oficin_parroq_codigo && (
                  <p className="text-sm text-red-600 flex items-center animate-shake">
                    <Icon name="AlertCircle" size={14} className="mr-1" />
                    {formErrors.oficin_parroq_codigo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <Icon name="Phone" size={16} className="mr-2" />
              Información de Contacto
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dirección */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Dirección *
                </label>
                <div className="relative">
                  <textarea
                    value={formData.oficin_direccion || ""}
                    onChange={(e) => handleInputChange("oficin_direccion", e.target.value)}
                    className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.oficin_direccion
                        ? "border-red-300 bg-red-50"
                        : formData.oficin_direccion?.trim()
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Ej: Av. Amazonas N24-03 y Colón"
                    disabled={loading || isSubmitting}
                    maxLength={80}
                    rows={2}
                  />
                  {formData.oficin_direccion?.trim() && !formErrors.oficin_direccion && (
                    <div className="absolute right-3 top-3">
                      <Icon name="Check" size={16} className="text-green-500" />
                    </div>
                  )}
                </div>
                {formErrors.oficin_direccion && (
                  <p className="text-sm text-red-600 flex items-center animate-shake">
                    <Icon name="AlertCircle" size={14} className="mr-1" />
                    {formErrors.oficin_direccion}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formData.oficin_direccion?.length || 0}/80 caracteres
                </p>
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.oficin_telefono || ""}
                    onChange={(e) => handleInputChange("oficin_telefono", e.target.value)}
                    className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.oficin_telefono
                        ? "border-red-300 bg-red-50"
                        : formData.oficin_telefono?.trim()
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="Ej: 02-2234567"
                    disabled={loading || isSubmitting}
                    maxLength={30}
                    autoComplete="tel"
                  />
                  {formData.oficin_telefono?.trim() && !formErrors.oficin_telefono && (
                    <div className="absolute right-3 top-3.5">
                      <Icon name="Check" size={16} className="text-green-500" />
                    </div>
                  )}
                </div>
                {formErrors.oficin_telefono && (
                  <p className="text-sm text-red-600 flex items-center animate-shake">
                    <Icon name="AlertCircle" size={14} className="mr-1" />
                    {formErrors.oficin_telefono}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.oficin_diremail || ""}
                    onChange={(e) => handleInputChange("oficin_diremail", e.target.value)}
                    className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.oficin_diremail
                        ? "border-red-300 bg-red-50"
                        : formData.oficin_diremail?.trim() && !formErrors.oficin_diremail
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="oficina@empresa.com"
                    disabled={loading || isSubmitting}
                    maxLength={120}
                    autoComplete="email"
                  />
                  {formData.oficin_diremail?.trim() && !formErrors.oficin_diremail && (
                    <div className="absolute right-3 top-3.5">
                      <Icon name="Check" size={16} className="text-green-500" />
                    </div>
                  )}
                </div>
                {formErrors.oficin_diremail && (
                  <p className="text-sm text-red-600 flex items-center animate-shake">
                    <Icon name="AlertCircle" size={14} className="mr-1" />
                    {formErrors.oficin_diremail}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <Icon name="Settings" size={16} className="mr-2" />
              Estado y Configuración
            </h4>
            
            <div className="space-y-4">
              {/* Estado Actual */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Estado de la Oficina
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="oficin_ctractual"
                      value={1}
                      checked={formData.oficin_ctractual === 1}
                      onChange={(e) => handleInputChange("oficin_ctractual", parseInt(e.target.value))}
                      className="mr-2"
                      disabled={loading || isSubmitting}
                    />
                    <span className="text-sm text-green-600 flex items-center">
                      <Icon name="CheckCircle" size={16} className="mr-1" />
                      Activa
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="oficin_ctractual"
                      value={0}
                      checked={formData.oficin_ctractual === 0}
                      onChange={(e) => handleInputChange("oficin_ctractual", parseInt(e.target.value))}
                      className="mr-2"
                      disabled={loading || isSubmitting}
                    />
                    <span className="text-sm text-red-600 flex items-center">
                      <Icon name="XCircle" size={16} className="mr-1" />
                      Inactiva
                    </span>
                  </label>
                </div>
              </div>

              {/* Código de Control */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Código de Control
                  </label>
                  <input
                    type="text"
                    value={formData.oficin_codocntrl || ""}
                    onChange={(e) => handleInputChange("oficin_codocntrl", e.target.value)}
                    className="w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 hover:border-gray-400"
                    placeholder="Código interno"
                    disabled={loading || isSubmitting}
                    maxLength={20}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha de Apertura
                  </label>
                  <input
                    type="date"
                    value={formData.oficin_fechaapertura || ""}
                    onChange={(e) => handleInputChange("oficin_fechaapertura", e.target.value)}
                    className="w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 hover:border-gray-400"
                    disabled={loading || isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || isSubmitting || !isFormValid}
              className={`relative flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 transform ${
                isFormValid && !isSubmitting
                  ? editingOficina
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {editingOficina ? "Actualizando..." : "Creando..."}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Icon name={editingOficina ? "Save" : "Plus"} size={16} className="mr-2 transition-transform duration-300 group-hover:scale-110" />
                  {editingOficina ? "Actualizar Oficina" : "Crear Oficina"}
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
                {editingOficina ? "Actualizando oficina..." : "Creando oficina..."}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

OficinaForm.displayName = "OficinaForm";

// ===== COMPONENTE PRINCIPAL =====
const OficinasWindow = ({ 
  showMessage: externalShowMessage,
  menuId = 25, // ✅ ID del menú para oficinas (men_id de tu tabla)
  title = "Gestión de Oficinas" 
}) => {
  // Obtener usuario actual
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.usu_id;

  console.log("🔍 OficinasWindow - Usuario actual:", {
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
  const [oficinas, setOficinas] = useState([]);
  const [showOficinaForm, setShowOficinaForm] = useState(false);
  const [editingOficina, setEditingOficina] = useState(null);
  const [formKey, setFormKey] = useState(0);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({
    instit_codigo: "",
    tofici_codigo: "",
    parroq_codigo: "",
    solo_activas: false
  });
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Función para mostrar mensajes
  const showMessage = useCallback((type, text) => {
    console.log("📢 OficinasWindow - Mensaje:", type, text);
    if (externalShowMessage) {
      externalShowMessage(type, text);
    } else {
      setMessage({ type, text });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  }, [externalShowMessage]);

  // ✅ FUNCIÓN PARA CARGAR OFICINAS
  const loadOficinas = useCallback(async (page = 1, customFilters = {}) => {
    console.log("🔍 loadOficinas iniciado");

    if (!canRead) {
      console.log("❌ Sin permisos de lectura");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Cargando oficinas...");

      const params = {
        page,
        per_page: perPage,
        search: searchTerm,
        ...filters,
        ...customFilters
      };

      console.log("📤 Params enviados:", params);

      const result = await adminService.oficinas.getAll(params);
      console.log("📥 Respuesta completa oficinas:", result);

      if (result?.status === "success" && result?.data) {
        let oficinasData = [];
        let paginationInfo = {};

        // Manejar diferentes formatos de respuesta paginada
        if (result.data.data && Array.isArray(result.data.data)) {
          // Formato Laravel paginado
          oficinasData = result.data.data;
          paginationInfo = {
            current_page: result.data.current_page || 1,
            last_page: result.data.last_page || 1,
            total: result.data.total || 0,
            per_page: result.data.per_page || perPage
          };
        } else if (Array.isArray(result.data)) {
          // Array directo
          oficinasData = result.data;
          paginationInfo = {
            current_page: 1,
            last_page: 1,
            total: result.data.length,
            per_page: result.data.length
          };
        } else {
          console.warn("⚠️ Formato inesperado de datos:", result.data);
          oficinasData = [];
          paginationInfo = { current_page: 1, last_page: 1, total: 0, per_page: perPage };
        }

        setOficinas(oficinasData);
        setCurrentPage(paginationInfo.current_page);
        setTotalPages(paginationInfo.last_page);
        setTotalRecords(paginationInfo.total);

        console.log("✅ Oficinas cargadas:", {
          total: paginationInfo.total,
          current_page: paginationInfo.current_page,
          oficinas: oficinasData.length
        });
      } else {
        console.error("❌ Error en respuesta oficinas:", result);
        setOficinas([]);
        showMessage("error", result?.message || "Error al cargar oficinas");
      }
    } catch (error) {
      console.error("❌ Error loading oficinas:", error);
      setOficinas([]);
      showMessage("error", "Error al cargar oficinas: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, [canRead, showMessage, perPage, searchTerm, filters]);

  // ✅ FUNCIÓN PARA GUARDAR OFICINA
  const handleOficinaSave = useCallback(async (formData, editingOficina) => {
    console.log("💾 OficinasWindow - Guardando oficina:", formData);

    if (editingOficina && !canUpdate) {
      console.log("❌ OficinasWindow - UPDATE denegado");
      showMessage("error", "No tienes permisos para actualizar oficinas");
      throw new Error("Sin permisos para actualizar");
    }

    if (!editingOficina && !canCreate) {
      console.log("❌ OficinasWindow - CREATE denegado");
      showMessage("error", "No tienes permisos para crear oficinas");
      throw new Error("Sin permisos para crear");
    }

    setLoading(true);

    try {
      console.log("📤 OficinasWindow - Datos a enviar:", formData);

      let result;
      
      if (editingOficina) {
        // ✅ ACTUALIZAR OFICINA EXISTENTE
        console.log("🔄 Actualizando oficina ID:", editingOficina.oficin_codigo);
        result = await adminService.oficinas.update(editingOficina.oficin_codigo, formData);
        showMessage("success", "Oficina actualizada correctamente");
        console.log("✅ OficinasWindow - Oficina actualizada:", result);
      } else {
        // ✅ CREAR NUEVA OFICINA
        console.log("➕ Creando nueva oficina");
        result = await adminService.oficinas.create(formData);
        showMessage("success", "Oficina creada correctamente");
        console.log("✅ OficinasWindow - Oficina creada:", result);
      }

      // Recargar datos
      await loadOficinas(currentPage);
      
      // Cerrar formulario
      setShowOficinaForm(false);
      setEditingOficina(null);
      setFormKey((prev) => prev + 1);
      
    } catch (error) {
      console.error("❌ OficinasWindow - Error guardando oficina:", error);
      
      let errorMessage = "Error al guardar la oficina";
      
      // Manejo de errores específicos
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = [];

        Object.keys(errors).forEach((field) => {
          const fieldErrors = errors[field];
          const fieldName = {
            oficin_nombre: "Nombre",
            oficin_rucoficina: "RUC",
            oficin_diremail: "Email",
            oficin_instit_codigo: "Institución",
            oficin_tofici_codigo: "Tipo de Oficina",
            oficin_parroq_codigo: "Parroquia"
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
  }, [showMessage, loadOficinas, currentPage, canUpdate, canCreate]);

  // ✅ FUNCIÓN PARA CREAR NUEVA OFICINA
  const handleNewOficina = useCallback(() => {
    if (!canCreate) {
      console.log("❌ OficinasWindow - CREATE denegado para nueva oficina");
      showMessage("error", "No tienes permisos para crear oficinas");
      return;
    }

    console.log("➕ OficinasWindow - Nueva oficina - Permiso concedido");
    setEditingOficina(null);
    setShowOficinaForm(true);
    setFormKey((prev) => prev + 1);
  }, [canCreate, showMessage]);

  // ✅ FUNCIÓN PARA EDITAR OFICINA
  const handleEditOficina = useCallback((oficina) => {
    if (!canUpdate) {
      console.log("❌ OficinasWindow - UPDATE denegado para editar oficina");
      showMessage("error", "No tienes permisos para editar oficinas");
      return;
    }

    console.log("✏️ OficinasWindow - Editar oficina - Permiso concedido:", oficina.oficin_codigo);
    setEditingOficina(oficina);
    setShowOficinaForm(true);
    setFormKey((prev) => prev + 1);
  }, [canUpdate, showMessage]);

  // ✅ FUNCIÓN PARA ELIMINAR OFICINA
  const handleDeleteOficina = useCallback(async (oficina) => {
    if (!canDelete) {
      console.log("❌ OficinasWindow - DELETE denegado");
      showMessage("error", "No tienes permisos para eliminar oficinas");
      return;
    }

    const confirmMessage = `¿Estás seguro de eliminar la oficina "${oficina.oficin_nombre}"?\n\nEsta acción no se puede deshacer y se verificará que no tenga usuarios asignados.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      console.log("🗑️ OficinasWindow - Eliminando oficina - Permiso concedido:", oficina.oficin_codigo);
      
      const result = await adminService.oficinas.delete(oficina.oficin_codigo);
      
      if (result?.status === "success") {
        showMessage("success", result.message || "Oficina eliminada correctamente");
      } else {
        showMessage("error", result?.message || "Error al eliminar oficina");
      }
      
      await loadOficinas(currentPage);
    } catch (error) {
      console.error("❌ OficinasWindow - Error eliminando oficina:", error);
      let errorMessage = "Error al eliminar oficina";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message?.includes("usuarios asignados")) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showMessage("error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [canDelete, showMessage, loadOficinas, currentPage]);

  // ✅ FUNCIÓN PARA CANCELAR FORMULARIO
  const handleOficinaCancel = useCallback(() => {
    console.log("❌ OficinasWindow - Cancelando formulario");
    setShowOficinaForm(false);
    setEditingOficina(null);
    setFormKey((prev) => prev + 1);
  }, []);

  // Función para manejar cambio de filtros
  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1); // Reset página al cambiar filtros
  }, []);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      instit_codigo: "",
      tofici_codigo: "",
      parroq_codigo: "",
      solo_activas: false
    });
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  // Función para manejar cambio de página
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    loadOficinas(page);
  }, [loadOficinas]);

  // Función de búsqueda y filtrado (sin filtrado local, se hace en servidor)
  const debouncedSearch = useMemo(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "" || Object.values(filters).some(v => v !== "" && v !== false)) {
        loadOficinas(1);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm, filters, loadOficinas]);

  // Función para manejar ordenamiento
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Aplicar ordenamiento local a los datos ya cargados
  const sortedOficinas = useMemo(() => {
    if (!Array.isArray(oficinas) || !sortConfig.key) return oficinas;
    
    return [...oficinas].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [oficinas, sortConfig]);

  // Función para ver usuarios de una oficina
  const handleVerUsuarios = useCallback(async (oficina) => {
    try {
      console.log("👥 Viendo usuarios de oficina:", oficina.oficin_codigo);
      const result = await adminService.oficinas.getUsuarios(oficina.oficin_codigo);
      
      if (result?.status === "success") {
        // Aquí podrías abrir un modal o navegar a otra vista
        console.log("📊 Usuarios de oficina:", result.data);
        showMessage("info", `La oficina "${oficina.oficin_nombre}" tiene ${result.data.resumen?.total_usuarios || 0} usuarios`);
      }
    } catch (error) {
      console.error("❌ Error obteniendo usuarios:", error);
      showMessage("error", "Error al obtener usuarios de la oficina");
    }
  }, [showMessage]);

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log("🔄 OficinasWindow - useEffect mount");
    if (canRead) {
      loadOficinas();
    }
  }, [loadOficinas, canRead]);

  // Efecto para la búsqueda
  useEffect(() => {
    return debouncedSearch;
  }, [debouncedSearch]);

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
              No tienes permisos para acceder a la gestión de oficinas
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
                <Icon name="Building2" size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600 mt-1">
                  Administra las oficinas del sistema financiero
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

          {/* Estadísticas rápidas */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon name="Building2" size={20} className="text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Oficinas</p>
                  <p className="text-xl font-semibold text-gray-900">{totalRecords}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Icon name="CheckCircle" size={20} className="text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Activas</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {oficinas.filter(o => o.oficin_ctractual === 1).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Icon name="XCircle" size={20} className="text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Inactivas</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {oficinas.filter(o => o.oficin_ctractual === 0).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Icon name="Users" size={20} className="text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Con Usuarios</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {oficinas.filter(o => o.cantidad_usuarios_total > 0).length}
                  </p>
                </div>
              </div>
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

        {/* Formulario de Oficina (Crear/Editar) */}
        {showOficinaForm && (
          <OficinaForm
            key={formKey}
            editingOficina={editingOficina}
            loading={loading}
            onSave={handleOficinaSave}
            onCancel={handleOficinaCancel}
            showMessage={showMessage}
          />
        )}

        {/* Sección de Filtros y Búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center">
              <Icon name="Filter" size={18} className="mr-2" />
              Filtros y Búsqueda
            </h3>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Búsqueda general */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Búsqueda General
                </label>
                <div className="relative">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, dirección, RUC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {/* Filtro por Estado */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  value={filters.solo_activas ? "activas" : "todas"}
                  onChange={(e) => handleFilterChange("solo_activas", e.target.value === "activas")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todas">Todas las oficinas</option>
                  <option value="activas">Solo activas</option>
                </select>
              </div>

              {/* Filtro por Institución */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Institución
                </label>
                <select
                  value={filters.instit_codigo}
                  onChange={(e) => handleFilterChange("instit_codigo", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las instituciones</option>
                  {/* Aquí cargarías las instituciones disponibles */}
                </select>
              </div>

              {/* Filtro por Tipo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Oficina
                </label>
                <select
                  value={filters.tofici_codigo}
                  onChange={(e) => handleFilterChange("tofici_codigo", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los tipos</option>
                  {/* Aquí cargarías los tipos disponibles */}
                </select>
              </div>

              {/* Botones de acción */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Acciones
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Icon name="RotateCcw" size={14} className="inline mr-1" />
                    Limpiar
                  </button>
                  <button
                    onClick={() => loadOficinas(1)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Icon name="Search" size={14} className="inline mr-1" />
                    Buscar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Oficinas */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">
                Lista de Oficinas ({totalRecords})
              </h3>
              
              {/* Selector de registros por página */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Mostrar:</label>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                    loadOficinas(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600">registros</span>
              </div>
            </div>

            {/* Botón CREATE */}
            {canCreate ? (
              <button
                onClick={handleNewOficina}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                disabled={loading}
                title="Crear nueva oficina"
              >
                <Icon 
                  name="Plus" 
                  size={16} 
                  className="mr-2 transition-transform duration-300 group-hover:rotate-90" 
                />
                Nueva Oficina
              </button>
            ) : (
              <div
                className="flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                title="Sin permisos para crear oficinas"
              >
                <Icon name="Lock" size={16} className="mr-2" />
                Sin Permisos
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <span className="text-gray-600">Cargando oficinas...</span>
              </div>
            </div>
          ) : !Array.isArray(oficinas) || oficinas.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Icon
                  name="Building2"
                  size={48}
                  className="mx-auto mb-4 text-gray-300"
                />
                <p className="text-gray-500 mb-2">No hay oficinas registradas</p>
                {canCreate && (
                  <p className="text-sm text-gray-400 mt-2">Haz clic en "Nueva Oficina" para crear una</p>
                )}
                {!Array.isArray(oficinas) && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-sm mx-auto">
                    <p className="text-xs text-red-600">
                      Error: Datos recibidos no válidos ({typeof oficinas})
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Tabla de Oficinas */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('oficin_codigo')}
                      >
                        <div className="flex items-center">
                          Código
                          {sortConfig.key === 'oficin_codigo' && (
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
                        onClick={() => handleSort('oficin_nombre')}
                      >
                        <div className="flex items-center">
                          Oficina
                          {sortConfig.key === 'oficin_nombre' && (
                            <Icon 
                              name={sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                              size={14} 
                              className="ml-1" 
                            />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuarios
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedOficinas.map((oficina) => (
                      <tr key={oficina.oficin_codigo} className="hover:bg-gray-50 transition-colors">
                        {/* COLUMNA CÓDIGO */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              oficina.oficin_ctractual === 1 ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              <span className={`font-medium text-sm ${
                                oficina.oficin_ctractual === 1 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {oficina.oficin_codigo}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                ID: {oficina.oficin_codigo}
                              </div>
                              <div className="text-sm text-gray-500">
                                {oficina.tofici_descripcion || 'Tipo no definido'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* COLUMNA OFICINA */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {oficina.oficin_nombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                {oficina.instit_nombre || 'Institución no definida'}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                RUC: {oficina.oficin_rucoficina}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* COLUMNA UBICACIÓN */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {oficina.oficin_direccion}
                          </div>
                          <div className="text-sm text-gray-500">
                            {[
                              oficina.parroq_nombre,
                              oficina.canton_nombre,
                              oficina.provin_nombre
                            ].filter(Boolean).join(', ')}
                          </div>
                        </td>

                        {/* COLUMNA CONTACTO */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Icon name="Phone" size={14} className="mr-1 text-gray-400" />
                            {oficina.oficin_telefono}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Icon name="Mail" size={14} className="mr-1 text-gray-400" />
                            {oficina.oficin_diremail}
                          </div>
                        </td>

                        {/* COLUMNA USUARIOS */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {oficina.cantidad_usuarios_activos || 0}
                            </div>
                            <div className="text-sm text-gray-500 ml-1">
                              / {oficina.cantidad_usuarios_total || 0}
                            </div>
                            {(oficina.cantidad_usuarios_total || 0) > 0 && (
                              <button
                                onClick={() => handleVerUsuarios(oficina)}
                                className="ml-2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                title="Ver usuarios"
                              >
                                <Icon name="Users" size={14} />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* COLUMNA ESTADO */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            oficina.oficin_ctractual === 1
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <Icon 
                              name={oficina.oficin_ctractual === 1 ? "CheckCircle" : "XCircle"} 
                              size={12} 
                              className="mr-1" 
                            />
                            {oficina.oficin_ctractual === 1 ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>

                        {/* COLUMNA ACCIONES */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Botón VER */}
                            <button
                              onClick={() => console.log('Ver detalles:', oficina)}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                              title={`Ver detalles de ${oficina.oficin_nombre}`}
                            >
                              <Icon name="Eye" size={16} />
                            </button>

                            {/* Botón EDITAR */}
                            {canUpdate ? (
                              <button
                                onClick={() => handleEditOficina(oficina)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                                disabled={loading}
                                title={`Editar ${oficina.oficin_nombre}`}
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
                                onClick={() => handleDeleteOficina(oficina)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                                disabled={loading || (oficina.cantidad_usuarios_total || 0) > 0}
                                title={
                                  (oficina.cantidad_usuarios_total || 0) > 0
                                    ? `No se puede eliminar: tiene ${oficina.cantidad_usuarios_total} usuarios`
                                    : `Eliminar ${oficina.oficin_nombre}`
                                }
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

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <span>
                        Mostrando {((currentPage - 1) * perPage) + 1} a {Math.min(currentPage * perPage, totalRecords)} de {totalRecords} registros
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Botón Anterior */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon name="ChevronLeft" size={16} />
                      </button>

                      {/* Números de página */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      {/* Botón Siguiente */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon name="ChevronRight" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer con información de depuración */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Debug Info:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Usuario: {currentUser?.usu_nom} (ID: {currentUserId})</div>
              <div>Permisos: C:{canCreate ? '✓' : '✗'} R:{canRead ? '✓' : '✗'} U:{canUpdate ? '✓' : '✗'} D:{canDelete ? '✓' : '✗'}</div>
              <div>Oficinas cargadas: {oficinas.length}</div>
              <div>Total registros: {totalRecords}</div>
              <div>Página actual: {currentPage}/{totalPages}</div>
              <div>Registros por página: {perPage}</div>
              <div>Búsqueda: "{searchTerm}"</div>
              <div>Filtros activos: {JSON.stringify(filters)}</div>
              <div>Ordenamiento: {sortConfig.key} ({sortConfig.direction})</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OficinasWindow;