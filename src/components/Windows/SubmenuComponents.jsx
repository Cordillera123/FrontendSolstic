// src/components/Windows/SubmenuComponents.jsx - ACTUALIZADO CON PERMISOS HÍBRIDOS (PERFIL + USUARIO) Y BOTONES MIGRADOS
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useButtonPermissions } from '../../hooks/useButtonPermissions';
import { adminService } from '../../services/apiService';
import { getCurrentUser } from '../../context/AuthContext'; // ✅ IMPORTAR getCurrentUser
import Icon from '../UI/Icon';
import IconSelector from '../UI/IconSelector'; // ✅ IMPORTAR ICONSELECTOR

// ✅ Componente SubmenuForm con IconSelector mejorado (sin cambios en lógica de permisos)
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

                    {/* ✅ ICONO CON ICONSELECTOR MEJORADO */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Icono
                        </label>
                        <IconSelector
                            icons={icons}
                            selectedIcon={formData.ico_id}
                            onSelect={(iconId) => handleInputChange('ico_id', iconId)}
                            placeholder="Seleccionar icono"
                            disabled={loading || isSubmitting}
                        />
                        <div className="text-xs text-gray-500">
                            Elige un icono para representar visualmente el submenú
                        </div>

                        {/* ✅ VISTA PREVIA DEL ICONO (igual que en MenuForm) */}
                        {formData.ico_id && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg border-2 border-gray-300">
                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <span className="text-purple-600 font-bold text-sm">
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

// ✅ COMPONENTE SubmenusList ACTUALIZADO CON SISTEMA HÍBRIDO DE PERMISOS Y BOTONES MIGRADOS
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

    // ===== OBTENER USUARIO ACTUAL =====
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.usu_id;

    console.log('🔍 SubmenusList - Usuario actual:', {
        usu_id: currentUserId,
        usu_nom: currentUser?.usu_nom,
        per_id: currentUser?.per_id
    });

    // ===== HOOK DE PERMISOS GENERALES =====
    const {
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        loading: permissionsLoading,
        error: permissionsError,
        buttonPermissions
    } = useButtonPermissions(MENU_ID, null, true, 'menu');

    // ===== ESTADOS PARA PERMISOS ESPECÍFICOS DEL USUARIO =====
    const [userSpecificPermissions, setUserSpecificPermissions] = useState(null);
    const [loadingUserPermissions, setLoadingUserPermissions] = useState(false);
    const [userPermissionsError, setUserPermissionsError] = useState(null);

    // ===== FUNCIÓN PARA CARGAR PERMISOS ESPECÍFICOS DEL USUARIO =====
    const loadUserSpecificPermissions = useCallback(async () => {
        if (!currentUserId) return;

        setLoadingUserPermissions(true);
        setUserPermissionsError(null);

        try {
            console.log('🔍 SubmenusList - Cargando permisos específicos para usuario:', currentUserId);

            const result = await adminService.userButtonPermissions.getUserButtonPermissions(currentUserId);

            console.log('📥 SubmenusList - Respuesta permisos específicos:', result);

            if (result.success && result.menuStructure) {
                const menuData = result.menuStructure.find(menu => menu.men_id === MENU_ID);

                if (menuData && menuData.botones) {
                    console.log('✅ SubmenusList - Permisos específicos encontrados:', menuData.botones);
                    setUserSpecificPermissions(menuData.botones);
                } else {
                    console.log('❌ SubmenusList - Menú no encontrado en estructura');
                    setUserSpecificPermissions([]);
                }
            } else {
                console.log('❌ SubmenusList - Error en respuesta de permisos específicos');
                setUserPermissionsError('Error al cargar permisos específicos');
            }
        } catch (error) {
            console.error('❌ SubmenusList - Error cargando permisos específicos:', error);
            setUserPermissionsError(error.message);
        } finally {
            setLoadingUserPermissions(false);
        }
    }, [currentUserId]);

    // ===== FUNCIÓN PARA OBTENER PERMISO ESPECÍFICO =====
    const getUserSpecificButtonPermission = useCallback((buttonCode) => {
        if (!userSpecificPermissions) {
            // Fallback a permisos generales si no hay específicos
            const generalPermission = buttonPermissions?.find(btn => btn.bot_codigo === buttonCode)?.has_permission;
            console.log(`🔍 SubmenusList - Usando permiso general para ${buttonCode}:`, generalPermission);
            return generalPermission || false;
        }

        const button = userSpecificPermissions.find(btn => btn.bot_codigo === buttonCode);

        if (button) {
            const hasPermission = button.has_permission === true;
            console.log(`🎯 SubmenusList - Permiso específico ${buttonCode}:`, {
                has_permission: hasPermission,
                profile_permission: button.profile_permission,
                is_customized: button.is_customized,
                customization_type: button.customization_type
            });
            return hasPermission;
        }

        console.log(`❌ SubmenusList - Botón ${buttonCode} no encontrado`);
        return false;
    }, [userSpecificPermissions, buttonPermissions]);

    // ===== PERMISOS EFECTIVOS CALCULADOS =====
    const effectivePermissions = useMemo(() => {
        const permissions = {
            canCreate: getUserSpecificButtonPermission('CREATE'),
            canRead: getUserSpecificButtonPermission('read'),
            canUpdate: getUserSpecificButtonPermission('UPDATE'),
            canDelete: getUserSpecificButtonPermission('DELETE'),
            canExport: getUserSpecificButtonPermission('EXPORT')
        };

        console.log('🎯 SubmenusList - Permisos efectivos calculados:', permissions);
        return permissions;
    }, [getUserSpecificButtonPermission]);

    // ===== EFFECT PARA CARGAR PERMISOS ESPECÍFICOS =====
    useEffect(() => {
        if (currentUserId && !permissionsError) {
            loadUserSpecificPermissions();
        }
    }, [currentUserId, loadUserSpecificPermissions, permissionsError]);

    // ===== EFFECT PARA DEBUG =====
    useEffect(() => {
        console.log('🔍 SubmenusList - Permisos actualizados:', {
            general: { canCreate, canRead, canUpdate, canDelete },
            effective: effectivePermissions,
            userSpecific: userSpecificPermissions ? 'Cargados' : 'No cargados',
            permissionsLoading,
            loadingUserPermissions,
            currentUserId
        });
    }, [canCreate, canRead, canUpdate, canDelete, effectivePermissions, userSpecificPermissions, permissionsLoading, loadingUserPermissions, currentUserId]);

    // ===== VALIDACIONES DE CARGA =====
    if (permissionsLoading || loadingUserPermissions) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                    <span className="text-gray-600">
                        {permissionsLoading ? 'Cargando permisos generales...' : 'Cargando permisos específicos...'}
                    </span>
                </div>
            </div>
        );
    }

    if (permissionsError && !userSpecificPermissions) {
        return (
            <div className="bg-white rounded-lg border border-red-200 p-4">
                <div className="text-center py-8">
                    <Icon name="AlertCircle" size={24} className="mx-auto mb-3 text-red-300" />
                    <p className="text-red-600 mb-2">Error al cargar permisos de submenús</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left max-w-md mx-auto">
                        <p className="text-xs text-red-700 mb-2">
                            <strong>Error General:</strong> {permissionsError}
                        </p>
                        {userPermissionsError && (
                            <p className="text-xs text-red-700 mb-2">
                                <strong>Error Específico:</strong> {userPermissionsError}
                            </p>
                        )}
                        <ul className="text-xs text-red-700 space-y-1">
                            <li>• Menu ID: <code className="bg-red-100 px-1 rounded">{MENU_ID}</code></li>
                            <li>• Usuario ID: <code className="bg-red-100 px-1 rounded">{currentUserId}</code></li>
                        </ul>
                    </div>
                    <button
                        onClick={loadUserSpecificPermissions}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={loadingUserPermissions}
                    >
                        {loadingUserPermissions ? 'Cargando...' : 'Reintentar'}
                    </button>
                </div>
            </div>
        );
    }

    if (!canRead && !effectivePermissions.canRead) {
        return (
            <div className="bg-white rounded-lg border border-yellow-200 p-4">
                <div className="text-center py-8">
                    <Icon name="Lock" size={24} className="mx-auto mb-3 text-yellow-300" />
                    <p className="text-yellow-600 mb-2">Sin permisos para ver submenús</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left max-w-md mx-auto">
                        <p className="text-xs text-yellow-700">
                            <strong>Menu ID:</strong> {MENU_ID} | 
                            <strong> Usuario ID:</strong> {currentUserId}
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                            <strong>READ General:</strong> {canRead ? 'SÍ' : 'NO'} | 
                            <strong> READ Efectivo:</strong> {effectivePermissions.canRead ? 'SÍ' : 'NO'}
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
                        Menu ID: {MENU_ID} | Usuario: {currentUserId}
                    </span>
                </h3>
                {/* ✅ BOTÓN CREATE CON SOLO ICONO - MIGRADO */}
                {effectivePermissions.canCreate ? (
                    <button
                        onClick={onNew}
                        className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                        disabled={loading}
                        title="Crear nuevo submenú"
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
                        title="Sin permisos para crear submenús"
                    >
                        <Icon name="Lock" size={16} />
                    </div>
                )}
            </div>

            {/* ✅ PANEL DEBUG MEJORADO - Sistema híbrido */}
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded text-xs">
                {/* Información básica */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                    <div><strong>Usuario:</strong> {currentUser?.usu_nom} (ID: {currentUserId})</div>
                    <div><strong>Perfil:</strong> {currentUser?.per_id}</div>
                    <div><strong>Submenús:</strong> {submenus.length}</div>
                </div>

                {/* Estado de carga */}
                <div className="mb-2 pb-2 border-b border-purple-200">
                    <strong>Estado:</strong>
                    <span className={`ml-2 px-2 py-0.5 rounded ${permissionsLoading ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        General: {permissionsLoading ? 'Cargando...' : 'Listo'}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 rounded ${loadingUserPermissions ? 'bg-yellow-100 text-yellow-700' : userSpecificPermissions ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        Específicos: {loadingUserPermissions ? 'Cargando...' : userSpecificPermissions ? 'Cargados' : 'Error'}
                    </span>
                </div>

                {/* Permisos generales vs efectivos */}
                <div className="mb-2 pb-2 border-b border-purple-200">
                    <strong>Permisos Generales:</strong>
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

                <div>
                    <strong>Permisos Efectivos (Usados en UI):</strong>
                    <span className={`ml-2 px-2 py-0.5 rounded ${effectivePermissions.canCreate ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        CREATE: {effectivePermissions.canCreate ? 'SÍ' : 'NO'}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 rounded ${effectivePermissions.canRead ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        read: {effectivePermissions.canRead ? 'SÍ' : 'NO'}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 rounded ${effectivePermissions.canUpdate ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        UPDATE: {effectivePermissions.canUpdate ? 'SÍ' : 'NO'}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 rounded ${effectivePermissions.canDelete ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        DELETE: {effectivePermissions.canDelete ? 'SÍ' : 'NO'}
                    </span>
                </div>
            </div>

            {submenus.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <Icon name="Layers" size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No hay submenús registrados</p>
                    {effectivePermissions.canCreate && (
                        <p className="text-sm text-gray-400 mt-2">Haz clic en el botón + para crear un nuevo submenú</p>
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
                                            {/* ✅ BOTÓN UPDATE CON SOLO ICONO - MIGRADO */}
                                            {effectivePermissions.canUpdate ? (
                                                <button
                                                    onClick={() => onEdit(submenu)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                                                    disabled={loading}
                                                    title="Editar submenú"
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
                                            {/* ✅ BOTÓN DELETE CON SOLO ICONO - MIGRADO */}
                                            {effectivePermissions.canDelete ? (
                                                <button
                                                    onClick={() => onDelete(submenu)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                                                    disabled={loading}
                                                    title="Eliminar submenú"
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
});

SubmenusList.displayName = 'SubmenusList';

// ✅ HOOK useSubmenuManagement ACTUALIZADO CON PERMISOS EFECTIVOS
const useSubmenuManagement = (showMessage, loadSubmenus) => {
    // ===== CONFIGURACIÓN =====
    const MENU_ID = 1; // ID del menú "Parametrización de Módulos"

    // ===== OBTENER USUARIO ACTUAL =====
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.usu_id;

    // ===== HOOK DE PERMISOS GENERALES =====
    const {
        canCreate,
        canUpdate,
        canDelete,
        buttonPermissions
    } = useButtonPermissions(MENU_ID, null, true, 'menu');

    // ===== ESTADOS PARA PERMISOS ESPECÍFICOS =====
    const [userSpecificPermissions, setUserSpecificPermissions] = useState(null);

    // ===== FUNCIÓN PARA CARGAR PERMISOS ESPECÍFICOS =====
    const loadUserSpecificPermissions = useCallback(async () => {
        if (!currentUserId) return;

        try {
            console.log('🔍 useSubmenuManagement - Cargando permisos específicos para usuario:', currentUserId);

            const result = await adminService.userButtonPermissions.getUserButtonPermissions(currentUserId);

            if (result.success && result.menuStructure) {
                const menuData = result.menuStructure.find(menu => menu.men_id === MENU_ID);
                if (menuData && menuData.botones) {
                    setUserSpecificPermissions(menuData.botones);
                }
            }
        } catch (error) {
            console.error('❌ useSubmenuManagement - Error cargando permisos específicos:', error);
        }
    }, [currentUserId]);

    // ===== FUNCIÓN PARA OBTENER PERMISO ESPECÍFICO =====
    const getUserSpecificButtonPermission = useCallback((buttonCode) => {
        if (!userSpecificPermissions) {
            const generalPermission = buttonPermissions?.find(btn => btn.bot_codigo === buttonCode)?.has_permission;
            return generalPermission || false;
        }

        const button = userSpecificPermissions.find(btn => btn.bot_codigo === buttonCode);
        return button ? button.has_permission === true : false;
    }, [userSpecificPermissions, buttonPermissions]);

    // ===== PERMISOS EFECTIVOS =====
    const effectivePermissions = useMemo(() => ({
        canCreate: getUserSpecificButtonPermission('CREATE'),
        canUpdate: getUserSpecificButtonPermission('UPDATE'),
        canDelete: getUserSpecificButtonPermission('DELETE')
    }), [getUserSpecificButtonPermission]);

    // ===== ESTADOS DEL HOOK =====
    const [showSubmenuForm, setShowSubmenuForm] = useState(false);
    const [editingSubmenu, setEditingSubmenu] = useState(null);
    const [submenuFormKey, setSubmenuFormKey] = useState(0);

    // ===== CARGAR PERMISOS AL INICIALIZAR =====
    useEffect(() => {
        if (currentUserId) {
            loadUserSpecificPermissions();
        }
    }, [currentUserId, loadUserSpecificPermissions]);

    // ===== HANDLERS CON VALIDACIÓN DE PERMISOS EFECTIVOS =====
    const handleSubmenuSave = useCallback(async (formData, editingSubmenu) => {
        console.log('💾 Guardando submenú:', formData);

        // ✅ VALIDACIÓN CON PERMISOS EFECTIVOS
        if (editingSubmenu && !effectivePermissions.canUpdate) {
            console.log('❌ useSubmenuManagement - UPDATE denegado (efectivo)');
            showMessage('error', 'No tienes permisos para actualizar submenús');
            return;
        }
        
        if (!editingSubmenu && !effectivePermissions.canCreate) {
            console.log('❌ useSubmenuManagement - CREATE denegado (efectivo)');
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
    }, [showMessage, loadSubmenus, effectivePermissions]);

    const handleSubmenuCancel = useCallback(() => {
        console.log('❌ Cancelando formulario de submenú');
        setShowSubmenuForm(false);
        setEditingSubmenu(null);
        setSubmenuFormKey(prev => prev + 1);
    }, []);

    const handleNewSubmenu = useCallback(() => {
        // ✅ VALIDACIÓN CON PERMISOS EFECTIVOS
        if (!effectivePermissions.canCreate) {
            console.log('❌ useSubmenuManagement - CREATE denegado para nuevo submenú (efectivo)');
            showMessage('error', 'No tienes permisos para crear submenús');
            return;
        }

        console.log('➕ Nuevo submenú - Permiso concedido (efectivo)');
        setEditingSubmenu(null);
        setShowSubmenuForm(true);
        setSubmenuFormKey(prev => prev + 1);
    }, [effectivePermissions.canCreate, showMessage]);

    const handleEditSubmenu = useCallback((submenu) => {
        // ✅ VALIDACIÓN CON PERMISOS EFECTIVOS
        if (!effectivePermissions.canUpdate) {
            console.log('❌ useSubmenuManagement - UPDATE denegado para editar submenú (efectivo)');
            showMessage('error', 'No tienes permisos para editar submenús');
            return;
        }

        console.log('✏️ Editar submenú - Permiso concedido (efectivo):', submenu.sub_id);
        setEditingSubmenu(submenu);
        setShowSubmenuForm(true);
        setSubmenuFormKey(prev => prev + 1);
    }, [effectivePermissions.canUpdate, showMessage]);

    const handleDeleteSubmenu = useCallback(async (submenu) => {
        // ✅ VALIDACIÓN CON PERMISOS EFECTIVOS
        if (!effectivePermissions.canDelete) {
            console.log('❌ useSubmenuManagement - DELETE denegado (efectivo)');
            showMessage('error', 'No tienes permisos para eliminar submenús');
            return;
        }

        if (!window.confirm(`¿Eliminar el submenú "${submenu.sub_nom}"?`)) {
            return;
        }

        try {
            console.log('🗑️ Eliminando submenú - Permiso concedido (efectivo):', submenu.sub_id);
            await adminService.submenus.delete(submenu.sub_id);
            showMessage('success', 'Submenú eliminado correctamente');
            await loadSubmenus();
        } catch (error) {
            console.error('Error eliminando submenú:', error);
            const errorMsg = error.response?.data?.message || 'Error al eliminar el submenú';
            showMessage('error', errorMsg);
        }
    }, [effectivePermissions.canDelete, showMessage, loadSubmenus]);

    return {
        showSubmenuForm,
        editingSubmenu,
        submenuFormKey,
        handleSubmenuSave,
        handleSubmenuCancel,
        handleNewSubmenu,
        handleEditSubmenu,
        handleDeleteSubmenu,
        // ✅ EXPORTAR PERMISOS EFECTIVOS PARA DEBUG
        effectivePermissions,
        userSpecificPermissions,
        currentUserId
    };
};

// ✅ Exportar componentes y hook actualizados
export { SubmenuForm, SubmenusList, useSubmenuManagement };