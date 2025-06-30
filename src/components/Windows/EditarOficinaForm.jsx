// src/components/Windows/Oficinas/EditarOficinaForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";

const EditarOficinaForm = ({ oficina, onSave, onCancel, showMessage, loading: externalLoading }) => {
    console.log("🔵 EditarOficinaForm - Renderizando con oficina:", oficina?.oficin_codigo);

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

    // Estado del formulario - inicializado con datos de la oficina
    const [formData, setFormData] = useState(() => {
        if (oficina) {
            console.log("🔄 Inicializando formulario con datos de oficina:", oficina.oficin_codigo);
            return {
                oficin_nombre: oficina.oficin_nombre || "",
                oficin_instit_codigo: oficina.oficin_instit_codigo || "",
                oficin_tofici_codigo: oficina.oficin_tofici_codigo || "",
                oficin_parroq_codigo: oficina.oficin_parroq_codigo || "",
                oficin_direccion: oficina.oficin_direccion || "",
                oficin_telefono: oficina.oficin_telefono || "",
                oficin_diremail: oficina.oficin_diremail || "",
                oficin_codocntrl: oficina.oficin_codocntrl || "",
                oficin_ctractual: oficina.oficin_ctractual || 1,
                oficin_eregis_codigo: oficina.oficin_eregis_codigo || "",
                oficin_rucoficina: oficina.oficin_rucoficina || "",
                oficin_codresapertura: oficina.oficin_codresapertura || "",
                oficin_fechaapertura: oficina.oficin_fechaapertura || "",
                oficin_fechacierre: oficina.oficin_fechacierre || "",
                oficin_codrescierre: oficina.oficin_codrescierre || "",
                oficin_fecharescierre: oficina.oficin_fecharescierre || "",
            };
        }
        return {};
    });

    // Estados para la cascada geográfica
    const [selectedProvincia, setSelectedProvincia] = useState("");
    const [selectedCanton, setSelectedCanton] = useState("");

    // FUNCIÓN PARA DETERMINAR UBICACIÓN GEOGRÁFICA ACTUAL
    const determineCurrentLocation = useCallback(async (parroquiaId) => {
        if (!parroquiaId) return;

        try {
            console.log("🔍 Determinando ubicación actual para parroquia:", parroquiaId);
            const result = await adminService.parroquias.getAll();
            if (result.status === "success") {
                const todasParroquias = result.data;
                const parroquia = todasParroquias.find(p => p.parroq_codigo === parseInt(parroquiaId));

                if (parroquia) {
                    const provinciaEncontrada = selectsData.provincias.find(
                        prov => prov.label === parroquia.provin_nombre
                    );

                    if (!provinciaEncontrada) {
                        console.error("❌ No se encontró la provincia:", parroquia.provin_nombre);
                        showMessage("error", "No se pudo encontrar la provincia en los datos");
                        return;
                    }

                    const provinciaId = provinciaEncontrada.value;
                    setSelectedProvincia(provinciaId);

                    const cantonesResult = await adminService.cantones.getByProvincia(provinciaId);
                    if (cantonesResult.status === "success") {
                        setSelectsData(prev => ({ ...prev, cantones: cantonesResult.data || [] }));
                        setSelectedCanton(parroquia.parroq_canton_codigo);

                        const parroquiasResult = await adminService.parroquias.getByCanton(parroquia.parroq_canton_codigo);
                        if (parroquiasResult.status === "success") {
                            setSelectsData(prev => ({ ...prev, parroquias: parroquiasResult.data || [] }));
                            console.log("✅ Ubicación geográfica precargada completamente");
                        }
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error determinando ubicación actual:", error);
            showMessage("error", "Error al cargar la ubicación geográfica");
        }
    }, [selectsData.provincias, showMessage]);

    // FUNCIÓN PARA CARGAR DATOS INICIALES
    const loadInitialData = useCallback(async () => {
        setLoadingSelects(prev => ({ ...prev, initial: true }));

        try {
            console.log("🔄 Cargando datos iniciales para editar oficina...");
            const results = await Promise.allSettled([
                adminService.tiposOficina.getActivos(),
                adminService.instituciones.listar(),
                adminService.provincias.listar(),
            ]);

            const [tiposResult, institucionesResult, provinciasResult] = results;

            const newSelectsData = {
                tiposOficina: tiposResult.status === 'fulfilled' && tiposResult.value?.status === "success"
                    ? tiposResult.value.data || [] : [],
                instituciones: institucionesResult.status === 'fulfilled' && institucionesResult.value?.status === "success"
                    ? institucionesResult.value.data || [] : [],
                provincias: provinciasResult.status === 'fulfilled' && provinciasResult.value?.status === "success"
                    ? provinciasResult.value.data || [] : [],
                cantones: [],
                parroquias: [],
            };

            setSelectsData(newSelectsData);
            console.log("✅ Datos iniciales cargados para edición");
        } catch (error) {
            console.error("❌ Error crítico cargando datos iniciales:", error);
            showMessage("error", "Error crítico al cargar datos del formulario");
        } finally {
            setLoadingSelects(prev => ({ ...prev, initial: false }));
        }
    }, [showMessage]);

    // FUNCIÓN PARA CARGAR CANTONES
    const loadCantonesByProvincia = useCallback(async (provinciaId) => {
        if (!provinciaId) {
            setSelectsData(prev => ({ ...prev, cantones: [], parroquias: [] }));
            setSelectedCanton("");
            setFormData(prev => ({ ...prev, oficin_parroq_codigo: "" }));
            return;
        }

        setLoadingSelects(prev => ({ ...prev, cantones: true }));
        try {
            const result = await adminService.cantones.getByProvincia(provinciaId);
            if (result.status === "success") {
                setSelectsData(prev => ({ ...prev, cantones: result.data || [], parroquias: [] }));
            }
        } catch (error) {
            console.error("❌ Error cargando cantones:", error);
            showMessage("error", "Error al cargar cantones");
        } finally {
            setLoadingSelects(prev => ({ ...prev, cantones: false }));
        }
    }, [showMessage]);

    // FUNCIÓN PARA CARGAR PARROQUIAS
    const loadParroquiasByCanton = useCallback(async (cantonId) => {
        if (!cantonId) {
            setSelectsData(prev => ({ ...prev, parroquias: [] }));
            return;
        }

        setLoadingSelects(prev => ({ ...prev, parroquias: true }));
        try {
            const result = await adminService.parroquias.getByCanton(cantonId);
            if (result.status === "success") {
                setSelectsData(prev => ({ ...prev, parroquias: result.data || [] }));
            }
        } catch (error) {
            console.error("❌ Error cargando parroquias:", error);
            showMessage("error", "Error al cargar parroquias");
        } finally {
            setLoadingSelects(prev => ({ ...prev, parroquias: false }));
        }
    }, [showMessage]);

    // Effects
    useEffect(() => {
        if (oficina) {
            loadInitialData();
        }
    }, [oficina?.oficin_codigo]);

    useEffect(() => {
        if (oficina) {
            setFormData({
                oficin_nombre: oficina.oficin_nombre || "",
                oficin_instit_codigo: oficina.oficin_instit_codigo || "",
                oficin_tofici_codigo: oficina.oficin_tofici_codigo || "",
                oficin_parroq_codigo: oficina.oficin_parroq_codigo || "",
                oficin_direccion: oficina.oficin_direccion || "",
                oficin_telefono: oficina.oficin_telefono || "",
                oficin_diremail: oficina.oficin_diremail || "",
                oficin_codocntrl: oficina.oficin_codocntrl || "",
                oficin_ctractual: oficina.oficin_ctractual || 1,
                oficin_eregis_codigo: oficina.oficin_eregis_codigo || "",
                oficin_rucoficina: oficina.oficin_rucoficina || "",
                oficin_codresapertura: oficina.oficin_codresapertura || "",
                oficin_fechaapertura: oficina.oficin_fechaapertura || "",
                oficin_fechacierre: oficina.oficin_fechacierre || "",
                oficin_codrescierre: oficina.oficin_codrescierre || "",
                oficin_fecharescierre: oficina.oficin_fecharescierre || "",
            });
            setFormErrors({});
        }
    }, [oficina?.oficin_codigo]);

    useEffect(() => {
        if (oficina?.oficin_parroq_codigo && selectsData.provincias.length > 0) {
            determineCurrentLocation(oficina.oficin_parroq_codigo);
        }
    }, [oficina?.oficin_parroq_codigo, selectsData.provincias.length, determineCurrentLocation]);

    // VALIDACIÓN EN TIEMPO REAL
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

    // MANEJADORES
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        validateField(field, value);
    }, [validateField]);

    const handleProvinciaChange = useCallback((provinciaId) => {
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
        setSelectedCanton(cantonId);
        setFormData(prev => ({ ...prev, oficin_parroq_codigo: "" }));

        if (cantonId) {
            loadParroquiasByCanton(cantonId);
        } else {
            setSelectsData(prev => ({ ...prev, parroquias: [] }));
        }
    }, [loadParroquiasByCanton]);

    // VERIFICACIONES
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

    const hasChanges = React.useMemo(() => {
        if (!oficina) return false;

        return Object.keys(formData).some(key => {
            const currentValue = formData[key];
            const originalValue = oficina[key];
            const current = currentValue ?? "";
            const original = originalValue ?? "";
            return current !== original;
        });
    }, [formData, oficina]);

    // MANEJADOR DE ENVÍO
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!oficina) {
            showMessage("error", "No hay oficina para actualizar");
            return;
        }

        if (!hasChanges) {
            showMessage("info", "No hay cambios para guardar");
            return;
        }

        setIsSubmitting(true);
        setFormErrors({});

        try {
            await onSave(formData, oficina);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error("❌ Error actualizando oficina:", error);
            setFormErrors({ submit: error.message || "Error al actualizar oficina" });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, oficina, onSave, showMessage, hasChanges]);

    const handleCancel = useCallback(() => {
        setIsSubmitting(true);
        setTimeout(() => {
            onCancel();
            setIsSubmitting(false);
        }, 300);
    }, [onCancel]);

    // RENDERIZADO
    if (!oficina) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
                <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No hay oficina para editar</h2>
                <p className="text-gray-500 mb-6">Seleccione una oficina de la lista para editarla</p>
                <button onClick={onCancel} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Volver a la Lista
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg relative overflow-hidden">
            {/* Header Compacto */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon name="Edit" size={20} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-white">Editar Oficina</h2>
                            <p className="text-blue-100 text-sm">ID: {oficina.oficin_codigo} - {oficina.oficin_nombre}</p>
                            {hasChanges && (
                                <div className="flex items-center gap-1 text-yellow-200 text-xs mt-1">
                                    <Icon name="AlertCircle" size={12} />
                                    Hay cambios sin guardar
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium"
                        >
                            <Icon name="ArrowLeft" size={16} />
                            Volver
                        </button>
                    </div>
                </div>

                {/* Indicadores de estado */}
                {(isSubmitting || showSuccess) && (
                    <div className="mt-4 flex items-center gap-4">
                        {isSubmitting && (
                            <div className="flex items-center gap-2 text-white">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span className="text-sm font-medium">Actualizando oficina...</span>
                            </div>
                        )}
                        {showSuccess && (
                            <div className="flex items-center gap-2 text-white animate-bounce">
                                <Icon name="CheckCircle" size={16} />
                                <span className="text-sm font-medium">¡Oficina actualizada exitosamente!</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Contenido del formulario */}
            <div className="p-5">
                {/* Mensajes de error */}
                {formErrors.submit && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
                        <Icon name="AlertCircle" size={16} />
                        {formErrors.submit}
                    </div>
                )}

                {/* Loading inicial */}
                {loadingSelects.initial && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        Cargando datos del formulario...
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Información Básica */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                            <Icon name="Building" size={16} className="text-slate-600" />
                            <h3 className="text-base font-semibold text-slate-800">Información Básica</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la Oficina <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.oficin_nombre || ""}
                                        onChange={(e) => handleInputChange("oficin_nombre", e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            formErrors.oficin_nombre ? "border-red-300 bg-red-50" :
                                            formData.oficin_nombre?.trim() ? "border-green-300 bg-green-50" :
                                            "border-gray-300 hover:border-gray-400"
                                        }`}
                                        placeholder="Ej: Oficina Principal Quito"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={60}
                                    />
                                    {formData.oficin_nombre?.trim() && !formErrors.oficin_nombre && (
                                        <div className="absolute right-2 top-2.5">
                                            <Icon name="Check" size={16} className="text-green-500" />
                                        </div>
                                    )}
                                </div>
                                {formErrors.oficin_nombre && (
                                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                        <Icon name="AlertCircle" size={12} />
                                        {formErrors.oficin_nombre}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">{formData.oficin_nombre?.length || 0}/60 caracteres</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    RUC de la Oficina <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.oficin_rucoficina || ""}
                                        onChange={(e) => handleInputChange("oficin_rucoficina", e.target.value.replace(/\D/g, ''))}
                                        className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            formErrors.oficin_rucoficina ? "border-red-300 bg-red-50" :
                                            formData.oficin_rucoficina?.length === 13 ? "border-green-300 bg-green-50" :
                                            "border-gray-300 hover:border-gray-400"
                                        }`}
                                        placeholder="1234567890001"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={13}
                                    />
                                    {formData.oficin_rucoficina?.length === 13 && !formErrors.oficin_rucoficina && (
                                        <div className="absolute right-2 top-2.5">
                                            <Icon name="Check" size={16} className="text-green-500" />
                                        </div>
                                    )}
                                </div>
                                {formErrors.oficin_rucoficina && (
                                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                        <Icon name="AlertCircle" size={12} />
                                        {formErrors.oficin_rucoficina}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">{formData.oficin_rucoficina?.length || 0}/13 dígitos</p>
                            </div>
                        </div>
                    </div>

                    {/* Clasificación */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                            <Icon name="Tags" size={16} className="text-slate-600" />
                            <h3 className="text-base font-semibold text-slate-800">Clasificación</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Institución <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.oficin_instit_codigo || ""}
                                    onChange={(e) => handleInputChange("oficin_instit_codigo", e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        formErrors.oficin_instit_codigo ? "border-red-300 bg-red-50" :
                                        formData.oficin_instit_codigo ? "border-green-300 bg-green-50" :
                                        "border-gray-300 hover:border-gray-400"
                                    }`}
                                    disabled={externalLoading || isSubmitting || loadingSelects.initial}
                                >
                                    <option value="">Seleccione una institución</option>
                                    {selectsData.instituciones.map((inst) => (
                                        <option key={inst.value} value={inst.value}>{inst.label}</option>
                                    ))}
                                </select>
                                {formErrors.oficin_instit_codigo && (
                                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                        <Icon name="AlertCircle" size={12} />
                                        {formErrors.oficin_instit_codigo}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Oficina <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.oficin_tofici_codigo || ""}
                                    onChange={(e) => handleInputChange("oficin_tofici_codigo", e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        formErrors.oficin_tofici_codigo ? "border-red-300 bg-red-50" :
                                        formData.oficin_tofici_codigo ? "border-green-300 bg-green-50" :
                                        "border-gray-300 hover:border-gray-400"
                                    }`}
                                    disabled={externalLoading || isSubmitting || loadingSelects.initial}
                                >
                                    <option value="">Seleccione un tipo</option>
                                    {selectsData.tiposOficina.map((tipo) => (
                                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                    ))}
                                </select>
                                {formErrors.oficin_tofici_codigo && (
                                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                        <Icon name="AlertCircle" size={12} />
                                        {formErrors.oficin_tofici_codigo}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ubicación Geográfica */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                            <Icon name="MapPin" size={16} className="text-slate-600" />
                            <h3 className="text-base font-semibold text-slate-800">Ubicación Geográfica</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Provincia <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedProvincia}
                                    onChange={(e) => handleProvinciaChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                                    disabled={externalLoading || isSubmitting || loadingSelects.initial}
                                >
                                    <option value="">Seleccione provincia</option>
                                    {selectsData.provincias.map((prov) => (
                                        <option key={prov.value} value={prov.value}>{prov.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cantón <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedCanton}
                                        onChange={(e) => handleCantonChange(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                                        disabled={externalLoading || isSubmitting || loadingSelects.cantones || selectsData.cantones.length === 0}
                                    >
                                        <option value="">Seleccione cantón</option>
                                        {selectsData.cantones.map((canton) => (
                                            <option key={canton.value} value={canton.value}>{canton.label}</option>
                                        ))}
                                    </select>
                                    {loadingSelects.cantones && (
                                        <div className="absolute right-2 top-2.5">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Parroquia <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.oficin_parroq_codigo || ""}
                                        onChange={(e) => handleInputChange("oficin_parroq_codigo", e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            formErrors.oficin_parroq_codigo ? "border-red-300 bg-red-50" :
                                            formData.oficin_parroq_codigo ? "border-green-300 bg-green-50" :
                                            "border-gray-300 hover:border-gray-400"
                                        }`}
                                        disabled={externalLoading || isSubmitting || loadingSelects.parroquias || selectsData.parroquias.length === 0}
                                    >
                                        <option value="">Seleccione parroquia</option>
                                        {selectsData.parroquias.map((parr) => (
                                            <option key={parr.value} value={parr.value}>{parr.label}</option>
                                        ))}
                                    </select>
                                    {loadingSelects.parroquias && (
                                        <div className="absolute right-2 top-2.5">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                                {formErrors.oficin_parroq_codigo && (
                                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                        <Icon name="AlertCircle" size={12} />
                                        {formErrors.oficin_parroq_codigo}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Información de Contacto */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                            <Icon name="Phone" size={16} className="text-slate-600" />
                            <h3 className="text-base font-semibold text-slate-800">Información de Contacto</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={formData.oficin_direccion || ""}
                                        onChange={(e) => handleInputChange("oficin_direccion", e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${
                                            formErrors.oficin_direccion ? "border-red-300 bg-red-50" :
                                            formData.oficin_direccion?.trim() ? "border-green-300 bg-green-50" :
                                            "border-gray-300 hover:border-gray-400"
                                        }`}
                                        placeholder="Ej: Av. Amazonas N24-03 y Colón"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={80}
                                        rows={3}
                                    />
                                    {formData.oficin_direccion?.trim() && !formErrors.oficin_direccion && (
                                        <div className="absolute right-2 top-2">
                                            <Icon name="Check" size={16} className="text-green-500" />
                                        </div>
                                    )}
                                </div>
                                {formErrors.oficin_direccion && (
                                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                        <Icon name="AlertCircle" size={12} />
                                        {formErrors.oficin_direccion}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">{formData.oficin_direccion?.length || 0}/80 caracteres</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.oficin_telefono || ""}
                                            onChange={(e) => handleInputChange("oficin_telefono", e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.oficin_telefono ? "border-red-300 bg-red-50" :
                                                formData.oficin_telefono?.trim() ? "border-green-300 bg-green-50" :
                                                "border-gray-300 hover:border-gray-400"
                                            }`}
                                            placeholder="Ej: 02-2234567"
                                            disabled={externalLoading || isSubmitting}
                                            maxLength={30}
                                        />
                                        {formData.oficin_telefono?.trim() && !formErrors.oficin_telefono && (
                                            <div className="absolute right-2 top-2.5">
                                                <Icon name="Check" size={16} className="text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.oficin_telefono && (
                                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                            <Icon name="AlertCircle" size={12} />
                                            {formErrors.oficin_telefono}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={formData.oficin_diremail || ""}
                                            onChange={(e) => handleInputChange("oficin_diremail", e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.oficin_diremail ? "border-red-300 bg-red-50" :
                                                formData.oficin_diremail?.trim() && !formErrors.oficin_diremail ? "border-green-300 bg-green-50" :
                                                "border-gray-300 hover:border-gray-400"
                                            }`}
                                            placeholder="oficina@empresa.com"
                                            disabled={externalLoading || isSubmitting}
                                            maxLength={120}
                                        />
                                        {formData.oficin_diremail?.trim() && !formErrors.oficin_diremail && (
                                            <div className="absolute right-2 top-2.5">
                                                <Icon name="Check" size={16} className="text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.oficin_diremail && (
                                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                            <Icon name="AlertCircle" size={12} />
                                            {formErrors.oficin_diremail}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estado y Configuración */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                            <Icon name="Settings" size={16} className="text-slate-600" />
                            <h3 className="text-base font-semibold text-slate-800">Estado y Configuración</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la Oficina</label>
                                <div className="flex items-center gap-5 mt-1">
                                    <label className="flex items-center gap-1.5">
                                        <input
                                            type="radio"
                                            name="oficin_ctractual_edit"
                                            value={1}
                                            checked={formData.oficin_ctractual === 1}
                                            onChange={(e) => handleInputChange("oficin_ctractual", parseInt(e.target.value))}
                                            className="w-4 h-4 text-blue-600"
                                            disabled={externalLoading || isSubmitting}
                                        />
                                        <span className="text-sm text-green-600 flex items-center gap-1 font-medium">
                                            <Icon name="CheckCircle" size={14} />
                                            Activa
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-1.5">
                                        <input
                                            type="radio"
                                            name="oficin_ctractual_edit"
                                            value={0}
                                            checked={formData.oficin_ctractual === 0}
                                            onChange={(e) => handleInputChange("oficin_ctractual", parseInt(e.target.value))}
                                            className="w-4 h-4 text-red-600"
                                            disabled={externalLoading || isSubmitting}
                                        />
                                        <span className="text-sm text-red-600 flex items-center gap-1 font-medium">
                                            <Icon name="XCircle" size={14} />
                                            Inactiva
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Control</label>
                                    <input
                                        type="text"
                                        value={formData.oficin_codocntrl || ""}
                                        onChange={(e) => handleInputChange("oficin_codocntrl", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                                        placeholder="Código interno"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={20}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Apertura</label>
                                    <input
                                        type="date"
                                        value={formData.oficin_fechaapertura || ""}
                                        onChange={(e) => handleInputChange("oficin_fechaapertura", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                                        disabled={externalLoading || isSubmitting}
                                    />
                                </div>
                                {formData.oficin_ctractual === 0 && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Cierre</label>
                                            <input
                                                type="date"
                                                value={formData.oficin_fechacierre || ""}
                                                onChange={(e) => handleInputChange("oficin_fechacierre", e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                                                disabled={externalLoading || isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Resolución de Cierre</label>
                                            <input
                                                type="text"
                                                value={formData.oficin_codrescierre || ""}
                                                onChange={(e) => handleInputChange("oficin_codrescierre", e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                                                placeholder="Código de resolución"
                                                disabled={externalLoading || isSubmitting}
                                                maxLength={20}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Indicador de cambios */}
                    {hasChanges && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-800">Cambios detectados</h4>
                                    <p className="text-sm text-yellow-700 mt-1">Has realizado cambios en el formulario. Asegúrate de guardar antes de salir.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={externalLoading || isSubmitting || !isFormValid || !hasChanges || loadingSelects.initial}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 min-h-[40px] ${
                                isFormValid && hasChanges && !isSubmitting && !loadingSelects.initial
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                            title={!hasChanges ? "No hay cambios para guardar" : ""}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Actualizando Oficina...
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
                            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:text-gray-800 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] flex items-center justify-center gap-2"
                        >
                            <Icon name="X" size={16} />
                            Cancelar
                        </button>
                        {hasChanges && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (oficina) {
                                        setFormData({
                                            oficin_nombre: oficina.oficin_nombre || "",
                                            oficin_instit_codigo: oficina.oficin_instit_codigo || "",
                                            oficin_tofici_codigo: oficina.oficin_tofici_codigo || "",
                                            oficin_parroq_codigo: oficina.oficin_parroq_codigo || "",
                                            oficin_direccion: oficina.oficin_direccion || "",
                                            oficin_telefono: oficina.oficin_telefono || "",
                                            oficin_diremail: oficina.oficin_diremail || "",
                                            oficin_codocntrl: oficina.oficin_codocntrl || "",
                                            oficin_ctractual: oficina.oficin_ctractual || 1,
                                            oficin_eregis_codigo: oficina.oficin_eregis_codigo || "",
                                            oficin_rucoficina: oficina.oficin_rucoficina || "",
                                            oficin_codresapertura: oficina.oficin_codresapertura || "",
                                            oficin_fechaapertura: oficina.oficin_fechaapertura || "",
                                            oficin_fechacierre: oficina.oficin_fechacierre || "",
                                            oficin_codrescierre: oficina.oficin_codrescierre || "",
                                            oficin_fecharescierre: oficina.oficin_fecharescierre || "",
                                        });
                                        setFormErrors({});
                                        showMessage("info", "Cambios revertidos");
                                    }
                                }}
                                disabled={externalLoading || isSubmitting}
                                className="px-3 py-2.5 bg-yellow-100 text-yellow-700 rounded-md text-sm font-medium transition-all duration-200 hover:bg-yellow-200 hover:text-yellow-800 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] flex items-center justify-center"
                                title="Revertir cambios"
                            >
                                <Icon name="RotateCcw" size={16} />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Overlay de loading */}
            {isSubmitting && (
                <div className="absolute inset-0 bg-white bg-opacity-70 rounded-xl flex items-center justify-center z-10">
                    <div className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-3">
                        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="text-gray-700 font-medium text-lg">Actualizando oficina...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditarOficinaForm;