// src/components/Windows/SubmenuComponents.jsx - MIGRADO A BOTONES PARAMETRIZADOS
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useButtonPermissions } from '../../hooks/useButtonPermissions';
import { adminService } from '../../services/apiService';
import Icon from '../UI/Icon';

// ✅ Componente SubmenuForm independiente (sin cambios - mantiene funcionalidad original)
const SubmenuForm = React.memo(({
    editingSubmenu,
    icons,
    menus,
    loading,
    onSave,
    onCancel,
    showMessage
}) => {
    console.log('🔵 SubmenuForm render - editingSubmenu:', editingSubmenu?.sub_id || 'null');

    // Estados adicionales para animaciones
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState(false);

    // Estado del formulario con inicialización inmediata
    const [formData, setFormData] = useState(() => {
        if (editingSubmenu) {
            console.log('🟢 Inicializando submenú con datos existentes');
            return {
                sub_nom: editingSubmenu.sub_nom || '',
                ico_id: editingSubmenu.ico_id || '',
                sub_componente: editingSubmenu.sub_componente || '',
                sub_eje: editingSubmenu.sub_eje || 1,
                sub_ventana_directa: Boolean(editingSubmenu.sub_ventana_directa),
                menu_ids: editingSubmenu.menus?.map(m => m.men_id) || []
            };
        } else {
            console.log('🟡 Inicializando formulario de submenú vacío');
            return {
                sub_nom: '',
                ico_id: '',
                sub_componente: '',
                sub_eje: 1,
                sub_ventana_directa: false,
                menu_ids: []
            };
        }
    });

    // Solo actualizar cuando cambie editingSubmenu
    useEffect(() => {
        console.log('🔄 SubmenuForm useEffect - editingSubmenu cambió:', editingSubmenu?.sub_id || 'null');

        if (editingSubmenu) {
            setFormData({
                sub_nom: editingSubmenu.sub_nom || '',
                ico_id: editingSubmenu.ico_id || '',
                sub_componente: editingSubmenu.sub_componente || '',
                sub_eje: editingSubmenu.sub_eje || 1,
                sub_ventana_directa: Boolean(editingSubmenu.sub_ventana_directa),
                menu_ids: editingSubmenu.menus?.map(m => m.men_id) || []
            });
        } else {
            setFormData({
                sub_nom: '',
                ico_id: '',
                sub_componente: '',
                sub_eje: 1,
                sub_ventana_directa: false,
                menu_ids: []
            });
        }
        
        // Limpiar estados de animación cuando cambie el submenú
        setFormErrors({});
        setShowSuccess(false);
        setIsSubmitting(false);
        setExpandedMenus(false);
    }, [editingSubmenu?.sub_id]);

    // Validación en tiempo real
    const validateField = useCallback((field, value) => {
        const errors = { ...formErrors };
        
        switch (field) {
            case 'sub_nom':
                if (!value?.trim()) {
                    errors.sub_nom = 'El nombre del submenú es requerido';
                } else if (value.length < 3) {
                    errors.sub_nom = 'El nombre debe tener al menos 3 caracteres';
                } else {
                    delete errors.sub_nom;
                }
                break;
            case 'sub_eje':
                if (value < 1 || value > 9) {
                    errors.sub_eje = 'El orden debe estar entre 1 y 9';
                } else {
                    delete errors.sub_eje;
                }
                break;
            case 'menu_ids':
                if (!value || value.length === 0) {
                    errors.menu_ids = 'Debe seleccionar al menos un menú';
                } else {
                    delete errors.menu_ids;
                }
                break;
            default:
                break;
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formErrors]);

    // Manejadores estables
    const handleInputChange = useCallback((field, value) => {
        console.log('⌨️ Escribiendo en submenú:', field, '=', value);
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Validar campo en tiempo real
        validateField(field, value);
    }, [validateField]);

    const handleMenuToggle = useCallback((menuId) => {
        console.log('🔀 Toggle menú:', menuId);
        setFormData(prev => {
            const currentMenus = prev.menu_ids || [];
            const newMenus = currentMenus.includes(menuId)
                ? currentMenus.filter(id => id !== menuId)
                : [...currentMenus, menuId];

            console.log('📋 Nuevos menús seleccionados:', newMenus);
            
            // Validar menús seleccionados
            validateField('menu_ids', newMenus);
            
            return {
                ...prev,
                menu_ids: newMenus
            };
        });
    }, [validateField]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        // Validación final
        const finalErrors = {};
        
        if (!formData.sub_nom?.trim()) {
            finalErrors.sub_nom = 'El nombre del submenú es requerido';
        }
        
        if (!formData.menu_ids || formData.menu_ids.length === 0) {
            finalErrors.menu_ids = 'Debe seleccionar al menos un menú';
        }

        if (Object.keys(finalErrors).length > 0) {
            setFormErrors(finalErrors);
            showMessage('error', 'Por favor corrige los errores del formulario');
            return;
        }

        // Activar estado de carga
        setIsSubmitting(true);
        setFormErrors({});

        try {
            const dataToSend = {
                ...formData,
                sub_nom: formData.sub_nom.trim(),
                ico_id: formData.ico_id || null,
                sub_componente: formData.sub_componente?.trim() || null,
                sub_eje: parseInt(formData.sub_eje) || 1,
                sub_ventana_directa: Boolean(formData.sub_ventana_directa),
                menu_ids: formData.menu_ids
            };

            // Simular un pequeño delay para mostrar la animación
            await new Promise(resolve => setTimeout(resolve, 900));
            
            console.log('📤 Enviando datos de submenú:', dataToSend);
            await onSave(dataToSend, editingSubmenu);
            
            // Mostrar éxito brevemente
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 1500);

        } catch (error) {
            console.error('Error en submit submenú:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, editingSubmenu, onSave, showMessage, validateField]);

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
        return formData.sub_nom?.trim() && 
               formData.menu_ids?.length > 0 && 
               Object.keys(formErrors).length === 0;
    }, [formData.sub_nom, formData.menu_ids, formErrors]);

    // Contar menús seleccionados
    const selectedMenusCount = formData.menu_ids?.length || 0;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm transition-all duration-300 hover:shadow-md relative">
            {/* Header mejorado */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 transition-all duration-300 ${
                        editingSubmenu ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
                    }`}>
                        <Icon 
                            name={editingSubmenu ? "Edit" : "Plus"} 
                            size={20} 
                            className="transition-transform duration-300 hover:scale-110" 
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                            {editingSubmenu ? `Editar Submenú #${editingSubmenu.sub_id}` : 'Crear Nuevo Submenú'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {editingSubmenu ? 'Modifica los datos del submenú' : 'Complete los campos para crear un nuevo submenú'}
                        </p>
                    </div>
                </div>
                
                {/* Indicadores de estado */}
                <div className="flex items-center space-x-4">
                    {selectedMenusCount > 0 && (
                        <div className="flex items-center space-x-2 text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                            <Icon name="Layers" size={14} />
                            <span className="text-sm font-medium">{selectedMenusCount} menú{selectedMenusCount !== 1 ? 's' : ''}</span>
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
                    {/* Nombre del Submenú */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Nombre del Submenú *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.sub_nom || ''}
                                onChange={(e) => {
                                    console.log('🖊️ Input submenú onChange:', e.target.value);
                                    handleInputChange('sub_nom', e.target.value);
                                }}
                                className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                    formErrors.sub_nom 
                                        ? 'border-red-300 bg-red-50' 
                                        : formData.sub_nom?.trim() 
                                            ? 'border-green-300 bg-green-50' 
                                            : 'border-gray-300 hover:border-gray-400'
                                }`}
                                placeholder="Ingrese el nombre del submenú"
                                disabled={loading || isSubmitting}
                                autoComplete="off"
                            />
                            {formData.sub_nom?.trim() && !formErrors.sub_nom && (
                                <div className="absolute right-3 top-3.5">
                                    <Icon name="Check" size={16} className="text-green-500" />
                                </div>
                            )}
                        </div>
                        {formErrors.sub_nom && (
                            <p className="text-sm text-red-600 flex items-center animate-shake">
                                <Icon name="AlertCircle" size={14} className="mr-1" />
                                {formErrors.sub_nom}
                            </p>
                        )}
                        <div className="text-xs text-gray-400">
                            {formData.sub_nom?.length || 0}/50 caracteres
                        </div>
                    </div>

                    {/* Icono */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Icono
                        </label>
                        <div className="relative">
                            <select
                                value={formData.ico_id || ''}
                                onChange={(e) => handleInputChange('ico_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-gray-400 appearance-none bg-white"
                                disabled={loading || isSubmitting}
                            >
                                <option value="">Seleccionar icono</option>
                                {icons.map((icon) => (
                                    <option key={icon.id || icon.ico_id} value={icon.id || icon.ico_id}>
                                        {icon.nombre || icon.ico_nom} ({icon.categoria || icon.ico_cat})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-3.5 pointer-events-none">
                                <Icon name="ChevronDown" size={16} className="text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Componente */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Componente
                        </label>
                        <input
                            type="text"
                            value={formData.sub_componente || ''}
                            onChange={(e) => handleInputChange('sub_componente', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-gray-400"
                            placeholder="Ej: ClientsWindow"
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
                            value={formData.sub_eje || 1}
                            onChange={(e) => handleInputChange('sub_eje', parseInt(e.target.value) || 1)}
                            className={`w-full border rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                formErrors.sub_eje ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                            disabled={loading || isSubmitting}
                        />
                        {formErrors.sub_eje && (
                            <p className="text-sm text-red-600 flex items-center">
                                <Icon name="AlertCircle" size={14} className="mr-1" />
                                {formErrors.sub_eje}
                            </p>
                        )}
                    </div>
                </div>

                {/* Ventana Directa */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={Boolean(formData.sub_ventana_directa)}
                            onChange={(e) => handleInputChange('sub_ventana_directa', e.target.checked)}
                            className="mr-3 w-4 h-4 text-purple-600 transition-all duration-300 focus:ring-2 focus:ring-purple-500 rounded"
                            disabled={loading || isSubmitting}
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-700">Ventana Directa</span>
                            <p className="text-xs text-gray-500 mt-1">
                                El submenú se abrirá directamente sin opciones
                            </p>
                        </div>
                    </label>
                </div>

                {/* Sección de Asignación de Menús mejorada */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-700 flex items-center">
                            <Icon name="Menu" size={16} className="mr-2 text-purple-600" />
                            Asignar a Menús *
                        </h4>
                        <div className="flex items-center space-x-3">
                            <span className={`text-sm px-3 py-1 rounded-full ${
                                selectedMenusCount > 0 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {selectedMenusCount} seleccionado{selectedMenusCount !== 1 ? 's' : ''}
                            </span>
                            {menus.length > 4 && (
                                <button
                                    type="button"
                                    onClick={() => setExpandedMenus(!expandedMenus)}
                                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center transition-colors duration-300"
                                    disabled={isSubmitting}
                                >
                                    <Icon 
                                        name={expandedMenus ? "ChevronUp" : "ChevronDown"} 
                                        size={14} 
                                        className="mr-1 transition-transform duration-300" 
                                    />
                                    {expandedMenus ? 'Contraer' : 'Expandir'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`border rounded-lg p-4 transition-all duration-300 ${
                        formErrors.menu_ids ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                        {menus.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Icon name="AlertCircle" size={24} className="mx-auto mb-3 text-gray-300" />
                                <p className="text-sm font-medium">No hay menús disponibles</p>
                                <p className="text-xs text-gray-400 mt-1">Debe crear menús primero</p>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 transition-all duration-300 ${
                                menus.length > 4 && !expandedMenus ? 'max-h-32 overflow-hidden' : 'max-h-80 overflow-y-auto'
                            }`}>
                                {menus.map((menu, index) => (
                                    <div
                                        key={menu.men_id}
                                        className="transition-all duration-300"
                                        style={{ 
                                            animationDelay: `${index * 0.1}s`,
                                            animation: expandedMenus || index < 4 ? 'fadeInUp 0.3s ease-out' : 'none'
                                        }}
                                    >
                                        <label
                                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-102 ${
                                                formData.menu_ids?.includes(menu.men_id)
                                                    ? 'bg-purple-100 border-2 border-purple-300 shadow-md'
                                                    : 'bg-white border-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.menu_ids?.includes(menu.men_id) || false}
                                                onChange={() => handleMenuToggle(menu.men_id)}
                                                className="mr-3 w-4 h-4 text-purple-600 transition-all duration-300 focus:ring-2 focus:ring-purple-500 rounded"
                                                disabled={loading || isSubmitting}
                                            />
                                            <div className="flex items-center flex-1">
                                                {menu.ico_nombre && (
                                                    <Icon name={menu.ico_nombre} size={14} className="mr-2 text-gray-500" />
                                                )}
                                                <div>
                                                    <span className="text-sm font-medium text-gray-800">{menu.men_nom}</span>
                                                    <span className="ml-2 text-xs text-gray-500">#{menu.men_id}</span>
                                                </div>
                                            </div>
                                            {formData.menu_ids?.includes(menu.men_id) && (
                                                <div className="ml-2">
                                                    <Icon name="Check" size={14} className="text-purple-600" />
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {formErrors.menu_ids && (
                            <div className="mt-3 text-sm text-red-600 flex items-center animate-shake">
                                <Icon name="AlertTriangle" size={14} className="mr-1" />
                                {formErrors.menu_ids}
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
                                ? editingSubmenu
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                {editingSubmenu ? 'Actualizando...' : 'Creando...'}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <Icon 
                                    name={editingSubmenu ? "Save" : "Plus"} 
                                    size={16} 
                                    className="mr-2 transition-transform duration-300 group-hover:scale-110" 
                                />
                                {editingSubmenu ? 'Actualizar Submenú' : 'Crear Submenú'}
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
                        <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                        <span className="text-gray-700 font-medium">
                            {editingSubmenu ? 'Actualizando submenú...' : 'Creando submenú...'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
});

SubmenuForm.displayName = 'SubmenuForm';

// ✅ Componente de Lista de Submenús MIGRADO A BOTONES PARAMETRIZADOS
const SubmenusList = React.memo(({
    submenus,
    loading,
    onNew,
    onEdit,
    onDelete,
    showMessage
}) => {
    // ===== CONFIGURACIÓN =====
    const MENU_ID = 1; // ID del menú "Parametrización de Módulos"

    // ===== HOOK DE PERMISOS =====
    const {
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        loading: permissionsLoading,
        error: permissionsError
    } = useButtonPermissions(MENU_ID, null, true, 'menu');

    // ===== VALIDACIONES DE PERMISOS =====
    if (permissionsLoading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                    <span className="text-gray-600">Cargando permisos de submenús...</span>
                </div>
            </div>
        );
    }

    if (permissionsError) {
        return (
            <div className="bg-white rounded-lg border border-red-200 p-4">
                <div className="text-center py-8">
                    <Icon name="AlertCircle" size={24} className="mx-auto mb-3 text-red-300" />
                    <p className="text-red-600 mb-2">Error al cargar permisos de submenús</p>
                    <p className="text-sm text-red-500">{permissionsError}</p>
                </div>
            </div>
        );
    }

    if (!canRead) {
        return (
            <div className="bg-white rounded-lg border border-yellow-200 p-4">
                <div className="text-center py-8">
                    <Icon name="Lock" size={24} className="mx-auto mb-3 text-yellow-300" />
                    <p className="text-yellow-600 mb-2">Sin permisos para ver submenús</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left max-w-md mx-auto">
                        <p className="text-xs text-yellow-700">
                            <strong>Menu ID:</strong> {MENU_ID} | 
                            <strong> READ:</strong> {canRead ? 'SÍ' : 'NO'}
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
                    <Icon name="Layers" size={20} className="mr-2 text-purple-600" />
                    Lista de Submenús ({submenus.length})
                    <span className="ml-3 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Menu ID: {MENU_ID}
                    </span>
                </h3>
                {/* ✅ BOTÓN CREATE PARAMETRIZADO */}
                {canCreate && (
                    <button
                        onClick={onNew}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center transition-all duration-300"
                        disabled={loading}
                    >
                        <Icon name="Plus" size={16} className="mr-2" />
                        Nuevo Submenú
                    </button>
                )}
            </div>

            {/* Debug de permisos */}
            <div className="mb-4 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                <strong>Permisos Submenús:</strong>
                <span className={`ml-2 px-2 py-0.5 rounded ${canCreate ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    CREATE: {canCreate ? 'SÍ' : 'NO'}
                </span>
                <span className={`ml-2 px-2 py-0.5 rounded ${canRead ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    READ: {canRead ? 'SÍ' : 'NO'}
                </span>
                <span className={`ml-2 px-2 py-0.5 rounded ${canUpdate ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    UPDATE: {canUpdate ? 'SÍ' : 'NO'}
                </span>
                <span className={`ml-2 px-2 py-0.5 rounded ${canDelete ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    DELETE: {canDelete ? 'SÍ' : 'NO'}
                </span>
            </div>

            {submenus.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <Icon name="Layers" size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No hay submenús registrados</p>
                    {canCreate && (
                        <p className="text-sm text-gray-400 mt-2">Haz clic en "Nuevo Submenú" para empezar</p>
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
                                <th className="text-left py-2">Menús Asignados</th>
                                <th className="text-left py-2">Ventana Directa</th>
                                <th className="text-left py-2">Estado</th>
                                <th className="text-left py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submenus.map((submenu) => (
                                <tr key={submenu.sub_id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 text-xs text-gray-500">#{submenu.sub_id}</td>
                                    <td className="py-2 font-medium">{submenu.sub_nom}</td>
                                    <td className="py-2">
                                        {submenu.sub_componente ? (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                                                {submenu.sub_componente}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="py-2">
                                        {submenu.menus && submenu.menus.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {submenu.menus.map(menu => (
                                                    <span
                                                        key={menu.men_id}
                                                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                                        title={`Menú ID: ${menu.men_id}`}
                                                    >
                                                        {menu.men_nom}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="py-2">
                                        {submenu.sub_ventana_directa ?
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Sí</span> :
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">No</span>
                                        }
                                    </td>
                                    <td className="py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${submenu.sub_est ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {submenu.sub_est ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="py-2">
                                        <div className="flex gap-2">
                                            {/* ✅ BOTÓN UPDATE PARAMETRIZADO */}
                                            {canUpdate && (
                                                <button
                                                    onClick={() => onEdit(submenu)}
                                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors duration-300"
                                                    disabled={loading}
                                                    title="Editar submenú"
                                                >
                                                    <Icon name="Edit" size={14} />
                                                </button>
                                            )}
                                            {/* ✅ BOTÓN DELETE PARAMETRIZADO */}
                                            {canDelete && (
                                                <button
                                                    onClick={() => onDelete(submenu)}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors duration-300"
                                                    disabled={loading}
                                                    title="Eliminar submenú"
                                                >
                                                    <Icon name="Trash" size={14} />
                                                </button>
                                            )}
                                            {/* Mostrar mensaje si no hay permisos */}
                                            {!canUpdate && !canDelete && (
                                                <span className="text-xs text-gray-400 px-2 py-1">
                                                    Sin permisos
                                                </span>
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
});

SubmenusList.displayName = 'SubmenusList';

// ✅ Hook personalizado para gestión de submenús MIGRADO CON VALIDACIONES DE PERMISOS
const useSubmenuManagement = (showMessage, loadSubmenus) => {
    // ===== CONFIGURACIÓN =====
    const MENU_ID = 1; // ID del menú "Parametrización de Módulos"

    // ===== HOOK DE PERMISOS =====
    const {
        canCreate,
        canUpdate,
        canDelete
    } = useButtonPermissions(MENU_ID, null, true, 'menu');

    // ===== ESTADOS =====
    const [showSubmenuForm, setShowSubmenuForm] = useState(false);
    const [editingSubmenu, setEditingSubmenu] = useState(null);
    const [submenuFormKey, setSubmenuFormKey] = useState(0);

    // ===== HANDLERS CON VALIDACIÓN DE PERMISOS =====
    const handleSubmenuSave = useCallback(async (formData, editingSubmenu) => {
        console.log('💾 Guardando submenú:', formData);

        // ✅ VALIDACIÓN DE PERMISOS
        if (editingSubmenu && !canUpdate) {
            showMessage('error', 'No tienes permisos para actualizar submenús');
            return;
        }
        
        if (!editingSubmenu && !canCreate) {
            showMessage('error', 'No tienes permisos para crear submenús');
            return;
        }

        try {
            const cleanData = {
                sub_nom: formData.sub_nom?.trim(),
                ico_id: formData.ico_id ? parseInt(formData.ico_id) : null,
                sub_componente: formData.sub_componente?.trim() || null,
                sub_eje: parseInt(formData.sub_eje) || 1,
                sub_ventana_directa: Boolean(formData.sub_ventana_directa),
                menu_ids: formData.menu_ids || []
            };

            console.log('📤 Datos limpios de submenú a enviar:', cleanData);

            let result;
            if (editingSubmenu) {
                result = await adminService.submenus.update(editingSubmenu.sub_id, cleanData);
                showMessage('success', 'Submenú actualizado correctamente');
                console.log('✅ Submenú actualizado:', result);
            } else {
                result = await adminService.submenus.create(cleanData);
                showMessage('success', 'Submenú creado correctamente');
                console.log('✅ Submenú creado:', result);
            }

            await loadSubmenus();
            setShowSubmenuForm(false);
            setEditingSubmenu(null);
            setSubmenuFormKey(prev => prev + 1);

        } catch (error) {
            console.error('❌ Error completo submenú:', error);
            console.error('❌ Error response submenú:', error.response?.data);

            let errorMsg = 'Error al guardar el submenú';

            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.message) {
                errorMsg = error.message;
            }

            showMessage('error', errorMsg);
        }
    }, [showMessage, loadSubmenus, canCreate, canUpdate]);

    const handleSubmenuCancel = useCallback(() => {
        console.log('❌ Cancelando formulario de submenú');
        setShowSubmenuForm(false);
        setEditingSubmenu(null);
        setSubmenuFormKey(prev => prev + 1);
    }, []);

    const handleNewSubmenu = useCallback(() => {
        // ✅ VALIDACIÓN DE PERMISOS
        if (!canCreate) {
            showMessage('error', 'No tienes permisos para crear submenús');
            return;
        }

        console.log('➕ Nuevo submenú');
        setEditingSubmenu(null);
        setShowSubmenuForm(true);
        setSubmenuFormKey(prev => prev + 1);
    }, [canCreate, showMessage]);

    const handleEditSubmenu = useCallback((submenu) => {
        // ✅ VALIDACIÓN DE PERMISOS
        if (!canUpdate) {
            showMessage('error', 'No tienes permisos para editar submenús');
            return;
        }

        console.log('✏️ Editar submenú:', submenu.sub_id);
        setEditingSubmenu(submenu);
        setShowSubmenuForm(true);
        setSubmenuFormKey(prev => prev + 1);
    }, [canUpdate, showMessage]);

    const handleDeleteSubmenu = useCallback(async (submenu) => {
        // ✅ VALIDACIÓN DE PERMISOS
        if (!canDelete) {
            showMessage('error', 'No tienes permisos para eliminar submenús');
            return;
        }

        if (!window.confirm(`¿Eliminar el submenú "${submenu.sub_nom}"?`)) {
            return;
        }

        try {
            await adminService.submenus.delete(submenu.sub_id);
            showMessage('success', 'Submenú eliminado correctamente');
            await loadSubmenus();
        } catch (error) {
            console.error('Error eliminando submenú:', error);
            const errorMsg = error.response?.data?.message || 'Error al eliminar el submenú';
            showMessage('error', errorMsg);
        }
    }, [canDelete, showMessage, loadSubmenus]);

    return {
        showSubmenuForm,
        editingSubmenu,
        submenuFormKey,
        handleSubmenuSave,
        handleSubmenuCancel,
        handleNewSubmenu,
        handleEditSubmenu,
        handleDeleteSubmenu
    };
};

// ✅ Exportar componentes y hook
export { SubmenuForm, SubmenusList, useSubmenuManagement };