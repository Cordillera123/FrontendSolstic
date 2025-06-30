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
                    errors.oficin_nombre = "Mínimo 3 caracteres";
                } else if (value.length > 60) {
                    errors.oficin_nombre = "Máximo 60 caracteres";
                } else {
                    delete errors.oficin_nombre;
                }
                break;
            case "oficin_direccion":
                if (!value?.trim()) {
                    errors.oficin_direccion = "La dirección es requerida";
                } else if (value.length > 80) {
                    errors.oficin_direccion = "Máximo 80 caracteres";
                } else {
                    delete errors.oficin_direccion;
                }
                break;
            case "oficin_telefono":
                if (!value?.trim()) {
                    errors.oficin_telefono = "El teléfono es requerido";
                } else if (value.length > 30) {
                    errors.oficin_telefono = "Máximo 30 caracteres";
                } else {
                    delete errors.oficin_telefono;
                }
                break;
            case "oficin_diremail":
                if (!value?.trim()) {
                    errors.oficin_diremail = "El email es requerido";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errors.oficin_diremail = "Formato inválido";
                } else if (value.length > 120) {
                    errors.oficin_diremail = "Máximo 120 caracteres";
                } else {
                    delete errors.oficin_diremail;
                }
                break;
            case "oficin_rucoficina":
                if (!value?.trim()) {
                    errors.oficin_rucoficina = "El RUC es requerido";
                } else if (value.length !== 13) {
                    errors.oficin_rucoficina = "Debe tener 13 dígitos";
                } else if (!/^\d+$/.test(value)) {
                    errors.oficin_rucoficina = "Solo números";
                } else {
                    delete errors.oficin_rucoficina;
                }
                break;
            case "oficin_instit_codigo":
                if (!value) {
                    errors.oficin_instit_codigo = "Requerido";
                } else {
                    delete errors.oficin_instit_codigo;
                }
                break;
            case "oficin_tofici_codigo":
                if (!value) {
                    errors.oficin_tofici_codigo = "Requerido";
                } else {
                    delete errors.oficin_tofici_codigo;
                }
                break;
            case "oficin_parroq_codigo":
                if (!value) {
                    errors.oficin_parroq_codigo = "Requerido";
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

    const resetForm = useCallback(() => {
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
    }, [oficina, showMessage]);

    // RENDERIZADO
    if (!oficina) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-white">
                <div className="text-center">
                    <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No hay oficina para editar</h2>
                    <p className="text-gray-500 mb-6">Seleccione una oficina de la lista para editarla</p>
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
            {/* Header compacto con información de la oficina */}
            <div className="flex-shrink-0 bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                            <Icon name="Edit" size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Editar Oficina</h2>
                            <p className="text-slate-600 text-sm flex items-center gap-2">
                                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                                    ID: {oficina.oficin_codigo}
                                </span>
                                <span className="text-slate-600">{oficina.oficin_nombre}</span>
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
            {(formErrors.submit || loadingSelects.initial || showSuccess) && (
                <div className="flex-shrink-0 px-4 pt-2 pb-1">
                    {formErrors.submit && (
                        <div className="p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-center gap-1">
                            <Icon name="AlertCircle" size={12} />
                            {formErrors.submit}
                        </div>
                    )}

                    {loadingSelects.initial && (
                        <div className="p-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600 flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                            Cargando datos...
                        </div>
                    )}

                    {showSuccess && (
                        <div className="p-1.5 bg-green-50 border border-green-200 rounded text-xs text-green-600 flex items-center gap-1 animate-bounce">
                            <Icon name="CheckCircle" size={12} />
                            ¡Oficina actualizada exitosamente!
                        </div>
                    )}
                </div>
            )}

            {/* Contenido del formulario - Optimizado para llenar el espacio */}
            <div className="flex-1 flex flex-col p-4">
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                        {/* Fila 1: Nombre y RUC */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.oficin_nombre}
                                        onChange={(e) => handleInputChange("oficin_nombre", e.target.value)}
                                        className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            formErrors.oficin_nombre
                                                ? "border-red-300 bg-red-50"
                                                : formData.oficin_nombre?.trim()
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-gray-300 hover:border-gray-400"
                                        }`}
                                        placeholder="Nombre de la oficina"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={60}
                                    />
                                    {formData.oficin_nombre?.trim() && !formErrors.oficin_nombre && (
                                        <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                                    )}
                                </div>
                                {formErrors.oficin_nombre && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.oficin_nombre}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    RUC <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.oficin_rucoficina}
                                        onChange={(e) => handleInputChange("oficin_rucoficina", e.target.value.replace(/\D/g, ''))}
                                        className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            formErrors.oficin_rucoficina
                                                ? "border-red-300 bg-red-50"
                                                : formData.oficin_rucoficina?.length === 13
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-gray-300 hover:border-gray-400"
                                        }`}
                                        placeholder="1234567890001"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={13}
                                    />
                                    {formData.oficin_rucoficina?.length === 13 && !formErrors.oficin_rucoficina && (
                                        <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                                    )}
                                </div>
                                {formErrors.oficin_rucoficina && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.oficin_rucoficina}</p>
                                )}
                            </div>
                        </div>

                        {/* Fila 2: Institución y Tipo */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Institución <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.oficin_instit_codigo}
                                    onChange={(e) => handleInputChange("oficin_instit_codigo", e.target.value)}
                                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        formErrors.oficin_instit_codigo
                                            ? "border-red-300 bg-red-50"
                                            : formData.oficin_instit_codigo
                                                ? "border-green-300 bg-green-50"
                                                : "border-gray-300 hover:border-gray-400"
                                    }`}
                                    disabled={externalLoading || isSubmitting || loadingSelects.initial}
                                >
                                    <option value="">Seleccionar</option>
                                    {selectsData.instituciones.map((inst) => (
                                        <option key={inst.value} value={inst.value}>
                                            {inst.label}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.oficin_instit_codigo && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.oficin_instit_codigo}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.oficin_tofici_codigo}
                                    onChange={(e) => handleInputChange("oficin_tofici_codigo", e.target.value)}
                                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        formErrors.oficin_tofici_codigo
                                            ? "border-red-300 bg-red-50"
                                            : formData.oficin_tofici_codigo
                                                ? "border-green-300 bg-green-50"
                                                : "border-gray-300 hover:border-gray-400"
                                    }`}
                                    disabled={externalLoading || isSubmitting || loadingSelects.initial}
                                >
                                    <option value="">Seleccionar</option>
                                    {selectsData.tiposOficina.map((tipo) => (
                                        <option key={tipo.value} value={tipo.value}>
                                            {tipo.label}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.oficin_tofici_codigo && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.oficin_tofici_codigo}</p>
                                )}
                            </div>
                        </div>

                        {/* Fila 3: Ubicación Geográfica */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Provincia <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedProvincia}
                                    onChange={(e) => handleProvinciaChange(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                                    disabled={externalLoading || isSubmitting || loadingSelects.initial}
                                >
                                    <option value="">Provincia</option>
                                    {selectsData.provincias.map((prov) => (
                                        <option key={prov.value} value={prov.value}>
                                            {prov.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cantón <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedCanton}
                                        onChange={(e) => handleCantonChange(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                                        disabled={externalLoading || isSubmitting || loadingSelects.cantones || selectsData.cantones.length === 0}
                                    >
                                        <option value="">Cantón</option>
                                        {selectsData.cantones.map((canton) => (
                                            <option key={canton.value} value={canton.value}>
                                                {canton.label}
                                            </option>
                                        ))}
                                    </select>
                                    {loadingSelects.cantones && (
                                        <div className="absolute right-2 top-3">
                                            <div className="animate-spin rounded-full h-4 w-4 border border-blue-600 border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Parroquia <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.oficin_parroq_codigo}
                                        onChange={(e) => handleInputChange("oficin_parroq_codigo", e.target.value)}
                                        className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            formErrors.oficin_parroq_codigo
                                                ? "border-red-300 bg-red-50"
                                                : formData.oficin_parroq_codigo
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-gray-300 hover:border-gray-400"
                                        }`}
                                        disabled={externalLoading || isSubmitting || loadingSelects.parroquias || selectsData.parroquias.length === 0}
                                    >
                                        <option value="">Parroquia</option>
                                        {selectsData.parroquias.map((parr) => (
                                            <option key={parr.value} value={parr.value}>
                                                {parr.label}
                                            </option>
                                        ))}
                                    </select>
                                    {loadingSelects.parroquias && (
                                        <div className="absolute right-2 top-3">
                                            <div className="animate-spin rounded-full h-4 w-4 border border-blue-600 border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                                {formErrors.oficin_parroq_codigo && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.oficin_parroq_codigo}</p>
                                )}
                            </div>
                        </div>

                        {/* Fila 4: Dirección */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dirección <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.oficin_direccion}
                                    onChange={(e) => handleInputChange("oficin_direccion", e.target.value)}
                                    className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        formErrors.oficin_direccion
                                            ? "border-red-300 bg-red-50"
                                            : formData.oficin_direccion?.trim()
                                                ? "border-green-300 bg-green-50"
                                                : "border-gray-300 hover:border-gray-400"
                                    }`}
                                    placeholder="Av. Amazonas N24-03 y Colón"
                                    disabled={externalLoading || isSubmitting}
                                    maxLength={80}
                                />
                                {formData.oficin_direccion?.trim() && !formErrors.oficin_direccion && (
                                    <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                                )}
                            </div>
                            {formErrors.oficin_direccion && (
                                <p className="text-xs text-red-600 mt-1">{formErrors.oficin_direccion}</p>
                            )}
                        </div>

                        {/* Fila 5: Teléfono y Email */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Teléfono <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.oficin_telefono}
                                        onChange={(e) => handleInputChange("oficin_telefono", e.target.value)}
                                        className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            formErrors.oficin_telefono
                                                ? "border-red-300 bg-red-50"
                                                : formData.oficin_telefono?.trim()
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-gray-300 hover:border-gray-400"
                                        }`}
                                        placeholder="02-2234567"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={30}
                                    />
                                    {formData.oficin_telefono?.trim() && !formErrors.oficin_telefono && (
                                        <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                                    )}
                                </div>
                                {formErrors.oficin_telefono && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.oficin_telefono}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={formData.oficin_diremail}
                                        onChange={(e) => handleInputChange("oficin_diremail", e.target.value)}
                                        className={`w-full px-3 py-2.5 border rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            formErrors.oficin_diremail
                                                ? "border-red-300 bg-red-50"
                                                : formData.oficin_diremail?.trim() && !formErrors.oficin_diremail
                                                    ? "border-green-300 bg-green-50"
                                                    : "border-gray-300 hover:border-gray-400"
                                        }`}
                                        placeholder="oficina@empresa.com"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={120}
                                    />
                                    {formData.oficin_diremail?.trim() && !formErrors.oficin_diremail && (
                                        <Icon name="Check" size={14} className="absolute right-2 top-3 text-green-500" />
                                    )}
                                </div>
                                {formErrors.oficin_diremail && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.oficin_diremail}</p>
                                )}
                            </div>
                        </div>

                        {/* Fila 6: Estado y campos opcionales */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Estado
                                </label>
                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="oficin_ctractual"
                                            value={1}
                                            checked={formData.oficin_ctractual === 1}
                                            onChange={(e) => handleInputChange("oficin_ctractual", parseInt(e.target.value))}
                                            className="w-4 h-4 text-green-600"
                                            disabled={externalLoading || isSubmitting}
                                        />
                                        <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                            <Icon name="CheckCircle" size={14} />
                                            Activa
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="oficin_ctractual"
                                            value={0}
                                            checked={formData.oficin_ctractual === 0}
                                            onChange={(e) => handleInputChange("oficin_ctractual", parseInt(e.target.value))}
                                            className="w-4 h-4 text-red-600"
                                            disabled={externalLoading || isSubmitting}
                                        />
                                        <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                                            <Icon name="XCircle" size={14} />
                                            Inactiva
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Código Control
                                </label>
                                <input
                                    type="text"
                                    value={formData.oficin_codocntrl}
                                    onChange={(e) => handleInputChange("oficin_codocntrl", e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                                    placeholder="Código"
                                    disabled={externalLoading || isSubmitting}
                                    maxLength={20}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha Apertura
                                </label>
                                <input
                                    type="date"
                                    value={formData.oficin_fechaapertura}
                                    onChange={(e) => handleInputChange("oficin_fechaapertura", e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400"
                                    disabled={externalLoading || isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Campos adicionales para oficinas inactivas */}
                        {formData.oficin_ctractual === 0 && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-2">
                                        Fecha de Cierre
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.oficin_fechacierre}
                                        onChange={(e) => handleInputChange("oficin_fechacierre", e.target.value)}
                                        className="w-full px-3 py-2.5 border border-red-300 rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        disabled={externalLoading || isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-2">
                                        Código Resolución Cierre
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.oficin_codrescierre}
                                        onChange={(e) => handleInputChange("oficin_codrescierre", e.target.value)}
                                        className="w-full px-3 py-2.5 border border-red-300 rounded text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Código de resolución"
                                        disabled={externalLoading || isSubmitting}
                                        maxLength={20}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Indicador de cambios */}
                        {hasChanges && (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-1">
                                <Icon name="AlertTriangle" size={12} />
                                Hay cambios sin guardar
                            </div>
                        )}
                    </div>

                    {/* Botones de acción - Siempre en la parte inferior */}
                    <div className="pt-6 border-t border-gray-200">
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={externalLoading || isSubmitting || !isFormValid || !hasChanges || loadingSelects.initial}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] ${
                                    isFormValid && hasChanges && !isSubmitting && !loadingSelects.initial
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transform"
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
                            Actualizando oficina...
                        </span>
                    </div>
                </div>  
            )}
        </div>
    );
};

export default EditarOficinaForm;