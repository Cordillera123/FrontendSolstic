// src/components/Windows/Oficinas/CrearOficinaForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";

const CrearOficinaForm = ({ onSave, onCancel, showMessage, loading: externalLoading }) => {
    console.log("🟢 CrearOficinaForm - Renderizando");

    // Estados para validación y carga
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);

    // Estados para los datos de selects
    const [selectsData, setSelectsData] = useState({
        tiposOficina: [],
        instituciones: [],
        provincias: [],
        cantones: [],
        parroquias: [],
    });

    const [loadingSelects, setLoadingSelects] = useState({
        initial: false,
        cantones: false,
        parroquias: false,
    });

    // Estado del formulario - valores iniciales limpios
    const [formData, setFormData] = useState({
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

    // Estados auxiliares para la cascada geográfica
    const [selectedProvincia, setSelectedProvincia] = useState("");
    const [selectedCanton, setSelectedCanton] = useState("");

    // ✅ FUNCIÓN MEJORADA PARA CARGAR DATOS INICIALES
    const loadInitialData = useCallback(async () => {
        setLoadingSelects(prev => ({ ...prev, initial: true }));

        try {
            console.log("🔄 Cargando datos iniciales para crear oficina...");

            // Cargar datos básicos en paralelo con manejo individual de errores
            const results = await Promise.allSettled([
                adminService.tiposOficina.getActivos().catch(err => {
                    console.error("❌ Error cargando tipos de oficina:", err);
                    return { status: "error", data: [] };
                }),
                adminService.instituciones.listar().catch(err => {
                    console.error("❌ Error cargando instituciones:", err);
                    return { status: "error", data: [] };
                }),
                adminService.provincias.listar().catch(err => {
                    console.error("❌ Error cargando provincias:", err);
                    return { status: "error", data: [] };
                }),
            ]);

            const [tiposResult, institucionesResult, provinciasResult] = results;

            // Procesar resultados con fallbacks
            const newSelectsData = {
                tiposOficina: tiposResult.status === 'fulfilled' && tiposResult.value?.status === "success"
                    ? tiposResult.value.data || []
                    : [],
                instituciones: institucionesResult.status === 'fulfilled' && institucionesResult.value?.status === "success"
                    ? institucionesResult.value.data || []
                    : [],
                provincias: provinciasResult.status === 'fulfilled' && provinciasResult.value?.status === "success"
                    ? provinciasResult.value.data || []
                    : [],
                cantones: [],
                parroquias: [],
            };

            setSelectsData(newSelectsData);

            console.log("✅ Datos iniciales cargados:", {
                tipos: newSelectsData.tiposOficina.length,
                instituciones: newSelectsData.instituciones.length,
                provincias: newSelectsData.provincias.length,
            });

            // Mostrar advertencias si algunos datos no se cargaron
            const warnings = [];
            if (newSelectsData.tiposOficina.length === 0) warnings.push("tipos de oficina");
            if (newSelectsData.instituciones.length === 0) warnings.push("instituciones");
            if (newSelectsData.provincias.length === 0) warnings.push("provincias");

            if (warnings.length > 0) {
                showMessage("warning", `No se pudieron cargar: ${warnings.join(", ")}. Verifique la conexión.`);
            }

        } catch (error) {
            console.error("❌ Error crítico cargando datos iniciales:", error);
            showMessage("error", "Error crítico al cargar datos del formulario");
        } finally {
            setLoadingSelects(prev => ({ ...prev, initial: false }));
        }
    }, [showMessage]);

    // ✅ FUNCIÓN MEJORADA PARA CARGAR CANTONES
    const loadCantonesByProvincia = useCallback(async (provinciaId) => {
        if (!provinciaId) {
            setSelectsData(prev => ({ ...prev, cantones: [], parroquias: [] }));
            setSelectedCanton("");
            setFormData(prev => ({ ...prev, oficin_parroq_codigo: "" }));
            return;
        }

        setLoadingSelects(prev => ({ ...prev, cantones: true }));

        try {
            console.log("🔄 Cargando cantones para provincia:", provinciaId);
            const result = await adminService.cantones.getByProvincia(provinciaId);

            if (result.status === "success") {
                setSelectsData(prev => ({
                    ...prev,
                    cantones: result.data || [],
                    parroquias: []
                }));
                console.log("✅ Cantones cargados:", result.data?.length || 0);
            } else {
                console.warn("⚠️ No se pudieron cargar cantones:", result.message);
                setSelectsData(prev => ({ ...prev, cantones: [], parroquias: [] }));
                showMessage("warning", "No se pudieron cargar los cantones de esta provincia");
            }
        } catch (error) {
            console.error("❌ Error cargando cantones:", error);
            setSelectsData(prev => ({ ...prev, cantones: [], parroquias: [] }));
            showMessage("error", "Error al cargar cantones");
        } finally {
            setLoadingSelects(prev => ({ ...prev, cantones: false }));
            setSelectedCanton("");
            setFormData(prev => ({ ...prev, oficin_parroq_codigo: "" }));
        }
    }, [showMessage]);

    // ✅ FUNCIÓN MEJORADA PARA CARGAR PARROQUIAS
    const loadParroquiasByCanton = useCallback(async (cantonId) => {
        if (!cantonId) {
            setSelectsData(prev => ({ ...prev, parroquias: [] }));
            setFormData(prev => ({ ...prev, oficin_parroq_codigo: "" }));
            return;
        }

        setLoadingSelects(prev => ({ ...prev, parroquias: true }));

        try {
            console.log("🔄 Cargando parroquias para cantón:", cantonId);
            const result = await adminService.parroquias.getByCanton(cantonId);

            if (result.status === "success") {
                setSelectsData(prev => ({ ...prev, parroquias: result.data || [] }));
                console.log("✅ Parroquias cargadas:", result.data?.length || 0);
            } else {
                console.warn("⚠️ No se pudieron cargar parroquias:", result.message);
                setSelectsData(prev => ({ ...prev, parroquias: [] }));
                showMessage("warning", "No se pudieron cargar las parroquias de este cantón");
            }
        } catch (error) {
            console.error("❌ Error cargando parroquias:", error);
            setSelectsData(prev => ({ ...prev, parroquias: [] }));
            showMessage("error", "Error al cargar parroquias");
        } finally {
            setLoadingSelects(prev => ({ ...prev, parroquias: false }));
            setFormData(prev => ({ ...prev, oficin_parroq_codigo: "" }));
        }
    }, [showMessage]);

    // Cargar datos iniciales al montar el componente
    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // ✅ VALIDACIÓN MEJORADA EN TIEMPO REAL
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
                    errors.oficin_rucoficina = "El RUC debe tener exactamente 13 dígitos";
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

    // ✅ MANEJADOR DE CAMBIOS MEJORADO
    const handleInputChange = useCallback((field, value) => {
        console.log("⌨️ Campo cambiado:", field, "=", value);

        setFormData(prev => ({ ...prev, [field]: value }));
        validateField(field, value);
    }, [validateField]);

    // ✅ MANEJADORES DE CASCADA GEOGRÁFICA
    const handleProvinciaChange = useCallback((provinciaId) => {
        console.log("🌍 Provincia seleccionada:", provinciaId);
        setSelectedProvincia(provinciaId);
        setSelectedCanton("");
        setFormData(prev => ({ ...prev, oficin_parroq_codigo: "" }));

        if (provinciaId) {
            loadCantonesByProvincia(provinciaId);
        } else {
            setSelectsData(prev => ({ ...prev, cantones: [], parroquias: [] }));
        }
    }, [loadCantonesByProvincia]);

    const handleCantonChange = useCallback((cantonId) => {
        console.log("🏘️ Cantón seleccionado:", cantonId);
        setSelectedCanton(cantonId);
        setFormData(prev => ({ ...prev, oficin_parroq_codigo: "" }));

        if (cantonId) {
            loadParroquiasByCanton(cantonId);
        } else {
            setSelectsData(prev => ({ ...prev, parroquias: [] }));
        }
    }, [loadParroquiasByCanton]);

    // ✅ VERIFICAR VALIDEZ DEL FORMULARIO
    const isFormValid = React.useMemo(() => {
        const requiredFields = [
            "oficin_nombre", "oficin_instit_codigo", "oficin_tofici_codigo",
            "oficin_parroq_codigo", "oficin_direccion", "oficin_telefono",
            "oficin_diremail", "oficin_rucoficina"
        ];

        const hasAllRequired = requiredFields.every(field => formData[field]);
        const hasNoErrors = Object.keys(formErrors).length === 0;

        return hasAllRequired && hasNoErrors;
    }, [formData, formErrors]);

    // ✅ MANEJADOR DE ENVÍO MEJORADO
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
            showMessage("error", `Campos requeridos: ${missingNames}`);
            return;
        }

        setIsSubmitting(true);
        setFormErrors({});

        try {
            console.log("📤 Creando oficina:", formData);
            await onSave(formData);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);

            // Limpiar formulario después de crear exitosamente
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
            setSelectedProvincia("");
            setSelectedCanton("");
            setSelectsData(prev => ({ ...prev, cantones: [], parroquias: [] }));

        } catch (error) {
            console.error("❌ Error creando oficina:", error);
            setFormErrors({ submit: error.message || "Error al crear oficina" });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, onSave, showMessage]);

    const handleCancel = useCallback(() => {
        console.log("❌ Cancelando creación de oficina");
        setIsSubmitting(true);
        setTimeout(() => {
            onCancel();
            setIsSubmitting(false);
        }, 300);
    }, [onCancel]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
                            <Icon name="Plus" size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Crear Nueva Oficina</h2>
                            <p className="text-green-100 mt-1">Complete los campos para crear una nueva oficina</p>
                        </div>
                    </div>

                    {/* Botón de volver */}
                    <button
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                        <Icon name="ArrowLeft" size={16} className="mr-2" />
                        Volver a la Lista
                    </button>
                </div>

                {/* Indicadores de estado */}
                <div className="mt-4 flex items-center space-x-4">
                    {isSubmitting && (
                        <div className="flex items-center space-x-2 text-white">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span className="text-sm font-medium">Creando oficina...</span>
                        </div>
                    )}

                    {showSuccess && (
                        <div className="flex items-center space-x-2 text-white animate-bounce">
                            <Icon name="CheckCircle" size={16} />
                            <span className="text-sm font-medium">¡Oficina creada exitosamente!</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Formulario */}
            <div className="p-6">
                {/* Mensajes de error */}
                {formErrors.submit && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 flex items-center">
                            <Icon name="AlertCircle" size={16} className="mr-2" />
                            {formErrors.submit}
                        </p>
                    </div>
                )}

                {/* Loading inicial */}
                {loadingSelects.initial && (
                    <div className="text-sm text-blue-600 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                        Cargando datos del formulario...
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Información Básica */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Icon name="Building" size={20} className="mr-2 text-gray-600" />
                            Información Básica
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nombre */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Nombre de la Oficina <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.oficin_nombre}
                                        onChange={(e) => handleInputChange("oficin_nombre", e.target.value)}
                                        className={`w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.oficin_nombre
                                                ? "border-red-300 bg-red-50"
                                                : formData.oficin_nombre?.trim()
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-gray-300 hover:border-gray-400"
                                            }`}
                                        placeholder="Ej: Oficina Principal Quito"
                                        disabled={externalLoading || isSubmitting}
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
                                    <p className="text-sm text-red-600 flex items-center">
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
                                    RUC de la Oficina <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.oficin_rucoficina}
                                        onChange={(e) => handleInputChange("oficin_rucoficina", e.target.value.replace(/\D/g, ''))}
                                        className={`w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.oficin_rucoficina
                                                ? "border-red-300 bg-red-50"
                                                : formData.oficin_rucoficina?.length === 13
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-gray-300 hover:border-gray-400"
                                            }`}
                                        placeholder="1234567890001"
                                        disabled={externalLoading || isSubmitting}
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
                                    <p className="text-sm text-red-600 flex items-center">
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
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Icon name="Tags" size={20} className="mr-2 text-gray-600" />
                            Clasificación
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Institución */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Institución <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.oficin_instit_codigo}
                                    onChange={(e) => handleInputChange("oficin_instit_codigo", e.target.value)}
                                    className={`w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.oficin_instit_codigo
                                            ? "border-red-300 bg-red-50"
                                            : formData.oficin_instit_codigo
                                                ? "border-green-300 bg-green-50"
                                                : "border-gray-300 hover:border-gray-400"
                                        }`}
                                    disabled={externalLoading || isSubmitting || loadingSelects.initial}
                                >
                                    <option value="">Seleccione una institución</option>
                                    {selectsData.instituciones.map((inst) => (
                                        <option key={inst.value} value={inst.value}>
                                            {inst.label}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.oficin_instit_codigo && (
                                    <p className="text-sm text-red-600 flex items-center">
                                        <Icon name="AlertCircle" size={14} className="mr-1" />
                                        {formErrors.oficin_instit_codigo}
                                    </p>
                                )}
                                {selectsData.instituciones.length === 0 && !loadingSelects.initial && (
                                    <p className="text-xs text-amber-600">
                                        ⚠️ No se pudieron cargar las instituciones
                                    </p>
                                )}
                            </div>

                            {/* Tipo de Oficina */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Tipo de Oficina <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.oficin_tofici_codigo}
                                    onChange={(e) => handleInputChange("oficin_tofici_codigo", e.target.value)}
                                    className={`w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.oficin_tofici_codigo
                                            ? "border-red-300 bg-red-50"
                                            : formData.oficin_tofici_codigo
                                                ? "border-green-300 bg-green-50"
                                                : "border-gray-300 hover:border-gray-400"
                                        }`}
                                    disabled={externalLoading || isSubmitting || loadingSelects.initial}
                                >
                                    <option value="">Seleccione un tipo</option>
                                    {selectsData.tiposOficina.map((tipo) => (
                                        <option key={tipo.value} value={tipo.value}>
                                            {tipo.label}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.oficin_tofici_codigo && (
                                    <p className="text-sm text-red-600 flex items-center">
                                        <Icon name="AlertCircle" size={14} className="mr-1" />
                                        {formErrors.oficin_tofici_codigo}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ubicación Geográfica */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Icon name="MapPin" size={20} className="mr-2 text-gray-600" />
                            Ubicación Geográfica
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Provincia */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Provincia <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedProvincia}
                                    onChange={(e) => handleProvinciaChange(e.target.value)}
                                    className="w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent border-gray-300 hover:border-gray-400"
                                    disabled={externalLoading || isSubmitting || loadingSelects.initial}
                                >
                                    <option value="">Seleccione provincia</option>
                                    {selectsData.provincias.map((prov) => (
                                        <option key={prov.value} value={prov.value}>
                                            {prov.label}
                                        </option>
                                    ))}
                                </select>
                                {selectsData.provincias.length === 0 && !loadingSelects.initial && (
                                    <p className="text-xs text-amber-600">
                                        ⚠️ No se pudieron cargar las provincias
                                    </p>
                                )}
                            </div>

                            {/* Cantón */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Cantón <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedCanton}
                                        onChange={(e) => handleCantonChange(e.target.value)}
                                        className="w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent border-gray-300 hover:border-gray-400"
                                        disabled={externalLoading || isSubmitting || loadingSelects.cantones || selectsData.cantones.length === 0}
                                    >
                                        <option value="">Seleccione cantón</option>
                                        {selectsData.cantones.map((canton) => (
                                            <option key={canton.value} value={canton.value}>
                                                {canton.label}
                                            </option>
                                        ))}
                                    </select>
                                    {loadingSelects.cantones && (
                                        <div className="absolute right-3 top-3.5">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                                {!selectedProvincia && (
                                    <p className="text-xs text-gray-500">
                                        Seleccione una provincia primero
                                    </p>
                                )}
                            </div>

                            {/* Parroquia */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Parroquia <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.oficin_parroq_codigo}
                                        onChange={(e) => handleInputChange("oficin_parroq_codigo", e.target.value)}
                                        className={`w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.oficin_parroq_codigo
                                                ? "border-red-300 bg-red-50"
                                                : formData.oficin_parroq_codigo
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-gray-300 hover:border-gray-400"
                                            }`}
                                        disabled={externalLoading || isSubmitting || loadingSelects.parroquias || selectsData.parroquias.length === 0}
                                    >
                                        <option value="">Seleccione parroquia</option>
                                        {selectsData.parroquias.map((parr) => (
                                            <option key={parr.value} value={parr.value}>
                                                {parr.label}
                                            </option>
                                        ))}
                                    </select>
                                    {loadingSelects.parroquias && (
                                        <div className="absolute right-3 top-3.5">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                                {formErrors.oficin_parroq_codigo && (
                                    <p className="text-sm text-red-600 flex items-center">
                                        <Icon name="AlertCircle" size={14} className="mr-1" />
                                        {formErrors.oficin_parroq_codigo}
                                    </p>
                                )}
                                {!selectedCanton && (
                                    <p className="text-xs text-gray-500">
                                        Seleccione un cantón primero
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Información de Contacto */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Icon name="Phone" size={20} className="mr-2 text-gray-600" />
                            Información de Contacto
                        </h3>

                        <div className="space-y-6">
                            {/* Dirección */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Dirección <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={formData.oficin_direccion}
                                        onChange={(e) => handleInputChange("oficin_direccion", e.target.value)}
                                        className={`w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.oficin_direccion
                                                ? "border-red-300 bg-red-50"
                                                : formData.oficin_direccion?.trim()
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-gray-300 hover:border-gray-400"
                                            }`}
                                        placeholder="Ej: Av. Amazonas N24-03 y Colón"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={80}
                                        rows={3}
                                    />
                                    {formData.oficin_direccion?.trim() && !formErrors.oficin_direccion && (
                                        <div className="absolute right-3 top-3">
                                            <Icon name="Check" size={16} className="text-green-500" />
                                        </div>
                                    )}
                                </div>
                                {formErrors.oficin_direccion && (
                                    <p className="text-sm text-red-600 flex items-center">
                                        <Icon name="AlertCircle" size={14} className="mr-1" />
                                        {formErrors.oficin_direccion}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500">
                                    {formData.oficin_direccion?.length || 0}/80 caracteres
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Teléfono */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Teléfono <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.oficin_telefono}
                                            onChange={(e) => handleInputChange("oficin_telefono", e.target.value)}
                                            className={`w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.oficin_telefono
                                                    ? "border-red-300 bg-red-50"
                                                    : formData.oficin_telefono?.trim()
                                                        ? "border-green-300 bg-green-50"
                                                        : "border-gray-300 hover:border-gray-400"
                                                }`}
                                            placeholder="Ej: 02-2234567"
                                            disabled={externalLoading || isSubmitting}
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
                                        <p className="text-sm text-red-600 flex items-center">
                                            <Icon name="AlertCircle" size={14} className="mr-1" />
                                            {formErrors.oficin_telefono}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={formData.oficin_diremail}
                                            onChange={(e) => handleInputChange("oficin_diremail", e.target.value)}
                                            className={`w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.oficin_diremail
                                                    ? "border-red-300 bg-red-50"
                                                    : formData.oficin_diremail?.trim() && !formErrors.oficin_diremail
                                                        ? "border-green-300 bg-green-50"
                                                        : "border-gray-300 hover:border-gray-400"
                                                }`}
                                            placeholder="oficina@empresa.com"
                                            disabled={externalLoading || isSubmitting}
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
                                        <p className="text-sm text-red-600 flex items-center">
                                            <Icon name="AlertCircle" size={14} className="mr-1" />
                                            {formErrors.oficin_diremail}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estado y Configuración */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Icon name="Settings" size={20} className="mr-2 text-gray-600" />
                            Estado y Configuración
                        </h3>

                        <div className="space-y-6">
                            {/* Estado Actual */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Estado de la Oficina
                                </label>
                                <div className="flex items-center space-x-6">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="oficin_ctractual"
                                            value={1}
                                            checked={formData.oficin_ctractual === 1}
                                            onChange={(e) => handleInputChange("oficin_ctractual", parseInt(e.target.value))}
                                            className="mr-2 text-green-600"
                                            disabled={externalLoading || isSubmitting}
                                        />
                                        <span className="text-sm text-green-600 flex items-center font-medium">
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
                                            className="mr-2 text-red-600"
                                            disabled={externalLoading || isSubmitting}
                                        />
                                        <span className="text-sm text-red-600 flex items-center font-medium">
                                            <Icon name="XCircle" size={16} className="mr-1" />
                                            Inactiva
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Campos opcionales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Código de Control
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.oficin_codocntrl}
                                        onChange={(e) => handleInputChange("oficin_codocntrl", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-gray-400"
                                        placeholder="Código interno"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={20}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Fecha de Apertura
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.oficin_fechaapertura}
                                        onChange={(e) => handleInputChange("oficin_fechaapertura", e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-gray-400"
                                        disabled={externalLoading || isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={externalLoading || isSubmitting || !isFormValid || loadingSelects.initial}
                            className={`relative flex-1 px-6 py-4 rounded-lg font-medium transition-all duration-300 transform ${isFormValid && !isSubmitting && !loadingSelects.initial
                                    ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                    Creando Oficina...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <Icon name="Plus" size={18} className="mr-2" />
                                    Crear Oficina
                                </div>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={externalLoading || isSubmitting}
                            className="px-6 py-4 bg-gray-100 text-gray-700 rounded-lg font-medium transition-all duration-300 hover:bg-gray-200 hover:text-gray-800 transform hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-center">
                                <Icon name="X" size={18} className="mr-2" />
                                Cancelar
                            </div>
                        </button>
                    </div>
                </form>
            </div>

            {/* Overlay de loading */}
            {isSubmitting && (
                <div className="absolute inset-0 bg-white bg-opacity-70 rounded-xl flex items-center justify-center z-10">
                    <div className="bg-white p-6 rounded-lg shadow-xl flex items-center space-x-3">
                        <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full"></div>
                        <span className="text-gray-700 font-medium text-lg">
                            Creando oficina...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrearOficinaForm;