// src/components/Windows/AsgiPerWindows.jsx - CON NUEVA PESTAÑA DE BOTONES POR USUARIO
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { adminService } from '../../services/apiService';
import Icon from '../UI/Icon';
import AsgiPerUsWindows from './AsgiPerUsWindows';
import AsigPerBotWindow from './AsigPerBotWindow';
import AsigModulosDirectosTab from './AsigModulosDirectosTab';
import AsigPerBotUserWindow from './AsigPerBotUserWindow';

// ===== COMPONENTES MEMOIZADOS =====
const TabButton = memo(({ label, icon, isActive, onClick, badge = null }) => (
    <button
        className={`flex items-center px-4 py-2 rounded-t-lg border-b-2 transition-all relative ${isActive
            ? 'bg-white border-blue-500 text-blue-600 shadow-sm'
            : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
        onClick={onClick}
        type="button"
    >
        <Icon name={icon} size={16} className="mr-2" />
        {label}
        {badge && (
            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                {badge}
            </span>
        )}
    </button>
));

const ProfileCard = memo(({ perfil, isSelected, onClick }) => {
    const handleClick = useCallback(() => {
        onClick(perfil);
    }, [onClick, perfil]);

    return (
        <div
            className={`border rounded-lg p-4 cursor-pointer transition-all ${isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
            onClick={handleClick}
        >
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center">
                        <Icon
                            name={perfil.per_nom.toLowerCase().includes('super') ? 'Crown' :
                                perfil.per_nom.toLowerCase().includes('admin') ? 'Shield' : 'User'}
                            size={16}
                            className={`mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                        />
                        <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                            {perfil.per_nom}
                        </span>
                    </div>
                    <p className={`text-sm mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                        {perfil.usuarios_count} usuarios
                    </p>
                </div>
                <Icon
                    name="ChevronRight"
                    size={16}
                    className={`transition-colors ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}
                />
            </div>
        </div>
    );
});

const PermissionCheckbox = memo(({ checked, onChange, disabled, label, level = 0 }) => {
    const getCheckboxColor = () => {
        if (level === 0) return 'text-blue-600';
        if (level === 1) return 'text-purple-600';
        return 'text-green-600';
    };

    return (
        <label className="flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className={`mr-2 ${getCheckboxColor()} focus:ring-2 focus:ring-blue-500`}
            />
            <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                {label}
            </span>
        </label>
    );
});

const PermissionTreeItem = memo(({ menu, togglePermission, savingPermissions, expandedMenus, expandedSubmenus, toggleMenuExpansion, toggleSubmenuExpansion }) => {
    const isMenuExpanded = expandedMenus.has(menu.men_id);
    const hasSubmenus = menu.submenus && menu.submenus.length > 0;

    const handleToggleExpansion = useCallback(() => {
        toggleMenuExpansion(menu.men_id);
    }, [menu.men_id, toggleMenuExpansion]);

    const handlePermissionChange = useCallback(() => {
        togglePermission(menu.men_id, null, null, menu.has_permission);
    }, [menu.men_id, menu.has_permission, togglePermission]);

    return (
        <div className="mb-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center flex-1">
                    {hasSubmenus && (
                        <button
                            onClick={handleToggleExpansion}
                            className="mr-2 p-1 hover:bg-gray-200 rounded"
                            disabled={savingPermissions}
                            type="button"
                        >
                            <Icon
                                name={isMenuExpanded ? 'ChevronDown' : 'ChevronRight'}
                                size={14}
                                className="text-gray-500"
                            />
                        </button>
                    )}

                    <div className="flex items-center flex-1">
                        {menu.ico_nombre && (
                            <Icon name={menu.ico_nombre} size={16} className="mr-2 text-gray-600" />
                        )}
                        <span className="font-medium text-gray-900">{menu.men_nom}</span>
                        {menu.men_componente && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                                {menu.men_componente}
                            </span>
                        )}
                    </div>
                </div>

                <PermissionCheckbox
                    checked={menu.has_permission}
                    onChange={handlePermissionChange}
                    disabled={savingPermissions}
                    label="Acceso al menú"
                    level={0}
                />
            </div>

            {hasSubmenus && isMenuExpanded && (
                <div className="ml-6 mt-2 space-y-2">
                    {menu.submenus.map(submenu => (
                        <SubmenuTreeItem
                            key={submenu.sub_id}
                            submenu={submenu}
                            menuId={menu.men_id}
                            togglePermission={togglePermission}
                            savingPermissions={savingPermissions}
                            expandedSubmenus={expandedSubmenus}
                            toggleSubmenuExpansion={toggleSubmenuExpansion}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

const SubmenuTreeItem = memo(({ submenu, menuId, togglePermission, savingPermissions, expandedSubmenus, toggleSubmenuExpansion }) => {
    const isSubmenuExpanded = expandedSubmenus.has(submenu.sub_id);
    const hasOptions = submenu.opciones && submenu.opciones.length > 0;

    const handleToggleExpansion = useCallback(() => {
        toggleSubmenuExpansion(submenu.sub_id);
    }, [submenu.sub_id, toggleSubmenuExpansion]);

    const handlePermissionChange = useCallback(() => {
        togglePermission(menuId, submenu.sub_id, null, submenu.has_permission);
    }, [menuId, submenu.sub_id, submenu.has_permission, togglePermission]);

    return (
        <div className="border-l-2 border-purple-200 pl-4">
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded border">
                <div className="flex items-center flex-1">
                    {hasOptions && (
                        <button
                            onClick={handleToggleExpansion}
                            className="mr-2 p-1 hover:bg-purple-100 rounded"
                            disabled={savingPermissions}
                            type="button"
                        >
                            <Icon
                                name={isSubmenuExpanded ? 'ChevronDown' : 'ChevronRight'}
                                size={12}
                                className="text-purple-600"
                            />
                        </button>
                    )}

                    <div className="flex items-center flex-1">
                        {submenu.ico_nombre && (
                            <Icon name={submenu.ico_nombre} size={14} className="mr-2 text-purple-600" />
                        )}
                        <span className="text-sm font-medium text-purple-900">{submenu.sub_nom}</span>
                        {submenu.sub_componente && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-mono">
                                {submenu.sub_componente}
                            </span>
                        )}
                    </div>
                </div>

                <PermissionCheckbox
                    checked={submenu.has_permission}
                    onChange={handlePermissionChange}
                    disabled={savingPermissions}
                    label="Acceso al submenú"
                    level={1}
                />
            </div>

            {hasOptions && isSubmenuExpanded && (
                <div className="ml-4 mt-2 space-y-1">
                    {submenu.opciones.map(opcion => {
                        const handleOptionPermissionChange = () => {
                            togglePermission(menuId, submenu.sub_id, opcion.opc_id, opcion.has_permission);
                        };

                        return (
                            <div
                                key={opcion.opc_id}
                                className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                            >
                                <div className="flex items-center flex-1">
                                    {opcion.ico_nombre && (
                                        <Icon name={opcion.ico_nombre} size={12} className="mr-2 text-green-600" />
                                    )}
                                    <span className="text-sm text-green-900">{opcion.opc_nom}</span>
                                    {opcion.opc_componente && (
                                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-mono">
                                            {opcion.opc_componente}
                                        </span>
                                    )}
                                </div>

                                <PermissionCheckbox
                                    checked={opcion.has_permission}
                                    onChange={handleOptionPermissionChange}
                                    disabled={savingPermissions}
                                    label="Acceso a la opción"
                                    level={2}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

const AsgiPerWindows = () => {
    // ===== ESTADOS PARA PESTAÑAS =====
    const [activeTab, setActiveTab] = useState('profiles');

    // ===== ESTADOS PARA PERFILES =====
    const [perfiles, setPerfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [menuStructure, setMenuStructure] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingPermissions, setSavingPermissions] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [expandedMenus, setExpandedMenus] = useState(new Set());
    const [expandedSubmenus, setExpandedSubmenus] = useState(new Set());

    // ===== FUNCIONES BÁSICAS ESTABLES =====
    const showMessage = useCallback((type, text) => {
        console.log('📨 Mostrando mensaje:', type, text);
        setMessage({ type, text });
        const timeoutId = setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        return () => clearTimeout(timeoutId);
    }, []); // Sin dependencias para que sea completamente estable

    // ===== HANDLERS MEMOIZADOS =====
    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
    }, []);

    const handleProfileSelect = useCallback((perfil) => {
        setSelectedProfile(perfil);
    }, []);

    // ===== CARGAR DATOS =====
    const loadProfiles = useCallback(async () => {
        console.log('🔍 Iniciando carga de perfiles...');
        setLoading(true);

        try {
            console.log('📡 Llamando a adminService.permissions.getProfiles()...');
            const result = await adminService.permissions.getProfiles();
            console.log('📥 Respuesta recibida:', result);

            if (result.status === 'success') {
                console.log('✅ Perfiles cargados:', result.perfiles);
                setPerfiles(result.perfiles || []);
            } else {
                console.error('❌ Status no exitoso:', result);
                showMessage('error', 'Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('💥 Error completo:', error);

            let errorMessage = 'Error al cargar perfiles';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'No autorizado - Token inválido';
            } else if (error.response?.status === 404) {
                errorMessage = 'Endpoint no encontrado';
            } else if (error.message) {
                errorMessage = error.message;
            }

            showMessage('error', errorMessage);
        } finally {
            console.log('🏁 Finalizando carga de perfiles');
            setLoading(false);
        }
    }, [showMessage]); // Solo showMessage como dependencia

    const loadMenuStructure = useCallback(async (perfilId) => {
        if (!perfilId) return;

        setLoading(true);
        try {
            const result = await adminService.permissions.getMenuStructureWithPermissions(perfilId);
            if (result.status === 'success') {
                setMenuStructure(result.menu_structure || []);
            }
        } catch (error) {
            console.error('Error loading menu structure:', error);
            showMessage('error', 'Error al cargar estructura de menús');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    // ===== EFECTOS OPTIMIZADOS =====
    useEffect(() => {
        console.log('🔧 useEffect triggered - activeTab:', activeTab, 'perfiles.length:', perfiles.length);
        if (activeTab === 'profiles') {
            console.log('🚀 Llamando loadProfiles desde useEffect');
            loadProfiles();
        }
    }, [activeTab, loadProfiles]); // Incluir loadProfiles pero está memoizado

    useEffect(() => {
        if (selectedProfile && activeTab === 'profiles') {
            loadMenuStructure(selectedProfile.per_id);
        }
    }, [selectedProfile?.per_id, activeTab, loadMenuStructure]); // Agregar loadMenuStructure

    // ===== MANEJO DE PERMISOS =====
    const togglePermission = useCallback(async (menId, subId = null, opcId = null, currentState) => {
        if (!selectedProfile) return;

        setSavingPermissions(true);

        try {
            const permissionData = {
                per_id: selectedProfile.per_id,
                men_id: menId,
                sub_id: subId,
                opc_id: opcId,
                grant_permission: !currentState
            };

            const result = await adminService.permissions.togglePermission(permissionData);
            if (result.status === 'success') {
                await loadMenuStructure(selectedProfile.per_id);
                showMessage('success', result.message);
            }
        } catch (error) {
            console.error('Error toggling permission:', error);
            showMessage('error', 'Error al modificar permiso');
        } finally {
            setSavingPermissions(false);
        }
    }, [selectedProfile?.per_id, loadMenuStructure, showMessage]);

    // ===== MANEJO DE EXPANSIÓN =====
    const toggleMenuExpansion = useCallback((menuId) => {
        setExpandedMenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(menuId)) {
                newSet.delete(menuId);
            } else {
                newSet.add(menuId);
            }
            return newSet;
        });
    }, []);

    const toggleSubmenuExpansion = useCallback((submenuId) => {
        setExpandedSubmenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(submenuId)) {
                newSet.delete(submenuId);
            } else {
                newSet.add(submenuId);
            }
            return newSet;
        });
    }, []);

    // ===== ACCIONES MASIVAS MEMOIZADAS =====
    const expandAllMenus = useCallback(() => {
        const allMenuIds = new Set(menuStructure.map(menu => menu.men_id));
        const allSubmenuIds = new Set();

        menuStructure.forEach(menu => {
            if (menu.submenus) {
                menu.submenus.forEach(submenu => {
                    allSubmenuIds.add(submenu.sub_id);
                });
            }
        });

        setExpandedMenus(allMenuIds);
        setExpandedSubmenus(allSubmenuIds);
    }, [menuStructure]);

    const collapseAllMenus = useCallback(() => {
        setExpandedMenus(new Set());
        setExpandedSubmenus(new Set());
    }, []);

    // ===== ESTADÍSTICAS MEMOIZADAS =====
    const permissionsStats = useMemo(() => {
        if (!menuStructure.length) return { total: 0, granted: 0, percentage: 0 };

        let total = 0;
        let granted = 0;

        menuStructure.forEach(menu => {
            total++;
            if (menu.has_permission) granted++;

            if (menu.submenus) {
                menu.submenus.forEach(submenu => {
                    total++;
                    if (submenu.has_permission) granted++;

                    if (submenu.opciones) {
                        submenu.opciones.forEach(opcion => {
                            total++;
                            if (opcion.has_permission) granted++;
                        });
                    }
                });
            }
        });

        return {
            total,
            granted,
            percentage: total > 0 ? Math.round((granted / total) * 100) : 0
        };
    }, [menuStructure]);

    // ===== CONFIGURACIÓN DE PESTAÑAS ACTUALIZADA =====
    const tabs = [
        { id: 'profiles', label: 'Permisos por Perfil', icon: 'Shield' },
        { id: 'users', label: 'Permisos por Usuario', icon: 'User' },
        { id: 'modules', label: 'Módulos Directos', icon: 'Monitor', badge: 'Nuevo' },
        { id: 'buttons', label: 'Permisos de Botones', icon: 'Settings' },
        { id: 'userButtons', label: 'Botones por Usuario', icon: 'UserCog', badge: 'Nuevo' }
    ];

    // ===== RENDER PRINCIPAL =====
    if (loading && !selectedProfile && activeTab === 'profiles') {
        return (
            <div className="p-6 h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando perfiles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full overflow-auto bg-gray-50">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Gestión de Permisos
                </h2>
                <p className="text-gray-600">
                    Configure los permisos de acceso para perfiles, usuarios, módulos directos y botones CRUD
                </p>
            </div>

            {/* Pestañas */}
            <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    {tabs.map(tab => (
                        <TabButton
                            key={tab.id}
                            label={tab.label}
                            icon={tab.icon}
                            badge={tab.badge}
                            isActive={activeTab === tab.id}
                            onClick={() => handleTabChange(tab.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Mensajes */}
            {message.text && (
                <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                        'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                    <div className="flex items-center">
                        <Icon
                            name={message.type === 'success' ? 'CheckCircle' : message.type === 'error' ? 'AlertCircle' : 'Info'}
                            size={16}
                            className="mr-2"
                        />
                        {message.text}
                    </div>
                </div>
            )}

            {/* Contenido de las pestañas */}
            {activeTab === 'profiles' ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                    {/* Lista de perfiles */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <Icon name="Shield" size={20} className="mr-2" />
                            Perfiles de Usuario
                        </h3>

                        <div className="space-y-3">
                            {perfiles.map((perfil) => (
                                <ProfileCard
                                    key={perfil.per_id}
                                    perfil={perfil}
                                    isSelected={selectedProfile?.per_id === perfil.per_id}
                                    onClick={handleProfileSelect}
                                />
                            ))}
                        </div>

                        {perfiles.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Icon name="Shield" size={48} className="mx-auto mb-4 text-gray-300" />
                                <p>No hay perfiles disponibles</p>
                            </div>
                        )}
                    </div>

                    {/* Panel de permisos */}
                    <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
                        {selectedProfile ? (
                            <>
                                {/* Header del panel de permisos */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 flex items-center">
                                            <Icon name="Shield" size={20} className="mr-2" />
                                            Permisos: {selectedProfile.per_nom}
                                        </h3>
                                        <div className="flex items-center mt-2 text-sm text-gray-600">
                                            <span>Permisos otorgados: {permissionsStats.granted}/{permissionsStats.total}</span>
                                            <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                {permissionsStats.percentage}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Acciones rápidas */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={expandAllMenus}
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                                            disabled={savingPermissions}
                                            type="button"
                                        >
                                            <Icon name="Maximize" size={14} className="mr-1" />
                                            Expandir
                                        </button>
                                        <button
                                            onClick={collapseAllMenus}
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                                            disabled={savingPermissions}
                                            type="button"
                                        >
                                            <Icon name="Minimize" size={14} className="mr-1" />
                                            Colapsar
                                        </button>
                                    </div>
                                </div>

                                {/* Árbol de permisos */}
                                <div className="flex-1 overflow-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                                <p className="text-gray-600 text-sm">Cargando permisos...</p>
                                            </div>
                                        </div>
                                    ) : menuStructure.length > 0 ? (
                                        <div className="space-y-3">
                                            {menuStructure.map(menu => (
                                                <PermissionTreeItem
                                                    key={menu.men_id}
                                                    menu={menu}
                                                    togglePermission={togglePermission}
                                                    savingPermissions={savingPermissions}
                                                    expandedMenus={expandedMenus}
                                                    expandedSubmenus={expandedSubmenus}
                                                    toggleMenuExpansion={toggleMenuExpansion}
                                                    toggleSubmenuExpansion={toggleSubmenuExpansion}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-300" />
                                            <p>No hay menús disponibles</p>
                                            <p className="text-sm mt-1">Cree menús en la sección de Parametrización</p>
                                        </div>
                                    )}
                                </div>

                                {/* Indicador de guardado */}
                                {savingPermissions && (
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                                        <span className="text-blue-800 text-sm">Guardando cambios...</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <Icon name="Shield" size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p>Seleccione un perfil para configurar sus permisos</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'users' ? (
                <AsgiPerUsWindows
                    showMessage={showMessage}
                />
            ) : activeTab === 'modules' ? (
                <AsigModulosDirectosTab
                    showMessage={showMessage}
                />
            ) : activeTab === 'buttons' ? (
                <AsigPerBotWindow
                    showMessage={showMessage}
                />
            ) : activeTab === 'userButtons' ? (
                <AsigPerBotUserWindow
                    showMessage={showMessage}
                />
            ) : null}
        </div>
    );
};

export default AsgiPerWindows;