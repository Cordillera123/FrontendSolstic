// src/components/Windows/AsgiPerUsWindows.jsx - OPTIMIZADO PARA EVITAR RE-RENDERS
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { adminService } from '../../services/apiService';
import Icon from '../UI/Icon';

// ===== COMPONENTES MEMOIZADOS =====
const UserCard = memo(({ usuario, isSelected, onClick }) => {
    const getStatusColor = () => {
        if (usuario.estado === 'Activo') return 'text-green-600 bg-green-100';
        if (usuario.estado === 'Inactivo') return 'text-red-600 bg-red-100';
        return 'text-gray-600 bg-gray-100';
    };

    const handleClick = useCallback(() => {
        onClick(usuario);
    }, [onClick, usuario]);

    return (
        <div
            className={`border rounded-lg p-3 cursor-pointer transition-all ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
            onClick={handleClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center">
                        <Icon
                            name="User"
                            size={16}
                            className={`mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                        />
                        <div>
                            <span className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {usuario.nombre_completo}
                            </span>
                            <p className={`text-xs mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                {usuario.usu_cor}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                            {usuario.estado}
                        </span>
                        <span className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                            {usuario.perfil}
                        </span>
                    </div>
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

const PermissionTreeItem = memo(({ menu, hasUserPermission, isPermissionAvailableInProfile, toggleUserPermission, savingPermissions, expandedMenus, expandedSubmenus, toggleMenuExpansion, toggleSubmenuExpansion }) => {
    const isMenuExpanded = expandedMenus.has(menu.men_id);
    const hasSubmenus = menu.submenus && menu.submenus.length > 0;
    
    const menuAvailable = isPermissionAvailableInProfile(menu.men_id);
    const menuGranted = hasUserPermission(menu.men_id);

    const handleToggleExpansion = useCallback(() => {
        toggleMenuExpansion(menu.men_id);
    }, [menu.men_id, toggleMenuExpansion]);

    const handlePermissionChange = useCallback(() => {
        toggleUserPermission(menu.men_id, null, null, menuGranted);
    }, [menu.men_id, menuGranted, toggleUserPermission]);

    return (
        <div className="mb-3">
            {/* Menú Principal */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
                menuAvailable ? 'bg-gray-50' : 'bg-red-50 border-red-200'
            }`}>
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
                        <span className={`font-medium ${menuAvailable ? 'text-gray-900' : 'text-red-700'}`}>
                            {menu.men_nom}
                        </span>
                        {!menuAvailable && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                No disponible en perfil
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Indicador de permiso del perfil */}
                    <div className="flex items-center text-xs text-gray-500">
                        <Icon 
                            name={menuAvailable ? 'Shield' : 'ShieldX'} 
                            size={12} 
                            className={`mr-1 ${menuAvailable ? 'text-green-600' : 'text-red-600'}`}
                        />
                        Perfil: {menuAvailable ? 'Sí' : 'No'}
                    </div>

                    {/* Checkbox para permiso del usuario */}
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={menuGranted}
                            onChange={handlePermissionChange}
                            disabled={!menuAvailable || savingPermissions}
                            className="mr-2 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${(!menuAvailable || savingPermissions) ? 'text-gray-400' : 'text-gray-700'}`}>
                            Usuario: {menuGranted ? 'Sí' : 'No'}
                        </span>
                    </label>
                </div>
            </div>

            {/* Submenús */}
            {hasSubmenus && isMenuExpanded && (
                <div className="ml-6 mt-2 space-y-2">
                    {menu.submenus.map(submenu => (
                        <SubmenuTreeItem
                            key={submenu.sub_id}
                            submenu={submenu}
                            menuId={menu.men_id}
                            hasUserPermission={hasUserPermission}
                            isPermissionAvailableInProfile={isPermissionAvailableInProfile}
                            toggleUserPermission={toggleUserPermission}
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

const SubmenuTreeItem = memo(({ submenu, menuId, hasUserPermission, isPermissionAvailableInProfile, toggleUserPermission, savingPermissions, expandedSubmenus, toggleSubmenuExpansion }) => {
    const isSubmenuExpanded = expandedSubmenus.has(submenu.sub_id);
    const hasOptions = submenu.opciones && submenu.opciones.length > 0;
    
    const submenuAvailable = isPermissionAvailableInProfile(menuId, submenu.sub_id);
    const submenuGranted = hasUserPermission(menuId, submenu.sub_id);

    const handleToggleExpansion = useCallback(() => {
        toggleSubmenuExpansion(submenu.sub_id);
    }, [submenu.sub_id, toggleSubmenuExpansion]);

    const handlePermissionChange = useCallback(() => {
        toggleUserPermission(menuId, submenu.sub_id, null, submenuGranted);
    }, [menuId, submenu.sub_id, submenuGranted, toggleUserPermission]);

    return (
        <div className="border-l-2 border-purple-200 pl-4">
            {/* Submenú */}
            <div className={`flex items-center justify-between p-2 rounded border ${
                submenuAvailable ? 'bg-purple-50' : 'bg-red-50 border-red-200'
            }`}>
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
                        <span className={`text-sm font-medium ${submenuAvailable ? 'text-purple-900' : 'text-red-700'}`}>
                            {submenu.sub_nom}
                        </span>
                        {!submenuAvailable && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                No disponible
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Indicador de permiso del perfil */}
                    <div className="flex items-center text-xs text-gray-500">
                        <Icon 
                            name={submenuAvailable ? 'Shield' : 'ShieldX'} 
                            size={10} 
                            className={`mr-1 ${submenuAvailable ? 'text-green-600' : 'text-red-600'}`}
                        />
                        Perfil: {submenuAvailable ? 'Sí' : 'No'}
                    </div>

                    {/* Checkbox para permiso del usuario */}
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={submenuGranted}
                            onChange={handlePermissionChange}
                            disabled={!submenuAvailable || savingPermissions}
                            className="mr-2 text-purple-600 focus:ring-2 focus:ring-purple-500"
                        />
                        <span className={`text-xs ${(!submenuAvailable || savingPermissions) ? 'text-gray-400' : 'text-gray-700'}`}>
                            Usuario: {submenuGranted ? 'Sí' : 'No'}
                        </span>
                    </label>
                </div>
            </div>

            {/* Opciones */}
            {hasOptions && isSubmenuExpanded && (
                <div className="ml-4 mt-2 space-y-1">
                    {submenu.opciones.map(opcion => {
                        const opcionAvailable = isPermissionAvailableInProfile(menuId, submenu.sub_id, opcion.opc_id);
                        const opcionGranted = hasUserPermission(menuId, submenu.sub_id, opcion.opc_id);
                        
                        const handleOptionPermissionChange = () => {
                            toggleUserPermission(menuId, submenu.sub_id, opcion.opc_id, opcionGranted);
                        };

                        return (
                            <div
                                key={opcion.opc_id}
                                className={`flex items-center justify-between p-2 rounded border ${
                                    opcionAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}
                            >
                                <div className="flex items-center flex-1">
                                    {opcion.ico_nombre && (
                                        <Icon name={opcion.ico_nombre} size={12} className="mr-2 text-green-600" />
                                    )}
                                    <span className={`text-sm ${opcionAvailable ? 'text-green-900' : 'text-red-700'}`}>
                                        {opcion.opc_nom}
                                    </span>
                                    {!opcionAvailable && (
                                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                            No disponible
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Indicador de permiso del perfil */}
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Icon 
                                            name={opcionAvailable ? 'Shield' : 'ShieldX'} 
                                            size={10} 
                                            className={`mr-1 ${opcionAvailable ? 'text-green-600' : 'text-red-600'}`}
                                        />
                                        Perfil: {opcionAvailable ? 'Sí' : 'No'}
                                    </div>

                                    {/* Checkbox para permiso del usuario */}
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={opcionGranted}
                                            onChange={handleOptionPermissionChange}
                                            disabled={!opcionAvailable || savingPermissions}
                                            className="mr-2 text-green-600 focus:ring-2 focus:ring-green-500"
                                        />
                                        <span className={`text-xs ${(!opcionAvailable || savingPermissions) ? 'text-gray-400' : 'text-gray-700'}`}>
                                            Usuario: {opcionGranted ? 'Sí' : 'No'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

const AsgiPerUsWindows = ({ showMessage }) => {
    // ===== ESTADOS =====
    const [usuarios, setUsuarios] = useState([]);
    const [perfiles, setPerfiles] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState('');
    const [userPermissions, setUserPermissions] = useState([]);
    const [profilePermissions, setProfilePermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [savingPermissions, setSavingPermissions] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState(new Set());
    const [expandedSubmenus, setExpandedSubmenus] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    // ===== HANDLERS MEMOIZADOS =====
    const handleUserSelect = useCallback((usuario) => {
        setSelectedUser(usuario);
    }, []);

    const handleProfileFilterChange = useCallback((e) => {
        setSelectedProfile(e.target.value);
    }, []);

    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    // ===== CARGAR DATOS =====
    const loadUsuarios = useCallback(async (perfilId = '') => {
        setLoading(true);
        try {
            const params = {};
            if (perfilId) {
                params.perfil_id = perfilId;
            }

            const result = await adminService.usuarios.getAll(params);
            
            if (result.status === 'success') {
                const usuarios = result.data.data?.data || result.data.data || [];
                setUsuarios(usuarios);
            } else {
                showMessage('error', 'Error al cargar usuarios');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showMessage('error', error.message || 'Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    const loadPerfiles = useCallback(async () => {
        try {
            const result = await adminService.permissions.getProfiles();
            if (result.status === 'success') {
                setPerfiles(result.perfiles || []);
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
            showMessage('error', error.message || 'Error al cargar perfiles');
        }
    }, [showMessage]);

    const loadUserPermissions = useCallback(async (userId) => {
        if (!userId) return;

        setLoadingPermissions(true);
        try {
            const userResult = await adminService.usuarios.getPermissions(userId);
            if (userResult.status === 'success') {
                setUserPermissions(userResult.data.permisos || []);
            }

            if (selectedUser?.per_id) {
                const profileResult = await adminService.permissions.getMenuStructureWithPermissions(selectedUser.per_id);
                if (profileResult.status === 'success') {
                    setProfilePermissions(profileResult.menu_structure || []);
                }
            }
        } catch (error) {
            console.error('Error loading user permissions:', error);
            showMessage('error', error.message || 'Error al cargar permisos del usuario');
        } finally {
            setLoadingPermissions(false);
        }
    }, [selectedUser?.per_id, showMessage]);

    // ===== EFECTOS OPTIMIZADOS =====
    useEffect(() => {
        loadPerfiles();
        loadUsuarios();
    }, []); // Solo se ejecuta una vez

    useEffect(() => {
        if (selectedProfile) {
            loadUsuarios(selectedProfile);
        } else {
            loadUsuarios();
        }
    }, [selectedProfile]); // Solo depende del perfil seleccionado

    useEffect(() => {
        if (selectedUser?.usu_id) {
            loadUserPermissions(selectedUser.usu_id);
        }
    }, [selectedUser?.usu_id]); // Solo depende del ID del usuario

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

    // ===== MANEJO DE PERMISOS =====
    const toggleUserPermission = useCallback(async (menId, subId = null, opcId = null, currentState) => {
        if (!selectedUser) return;

        setSavingPermissions(true);
        try {
            const result = await adminService.usuarios.assignPermissions(selectedUser.usu_id, {
                permissions: [{
                    men_id: menId,
                    sub_id: subId,
                    opc_id: opcId,
                    grant: !currentState
                }]
            });

            if (result.status === 'success') {
                await loadUserPermissions(selectedUser.usu_id);
                showMessage('success', result.message);
            } else {
                showMessage('error', result.message);
            }
        } catch (error) {
            console.error('Error toggling user permission:', error);
            showMessage('error', error.message || 'Error al modificar permiso del usuario');
        } finally {
            setSavingPermissions(false);
        }
    }, [selectedUser?.usu_id, loadUserPermissions, showMessage]);

    // ===== UTILIDADES MEMOIZADAS =====
    const isPermissionAvailableInProfile = useCallback((menId, subId = null, opcId = null) => {
        for (const menu of profilePermissions) {
            if (menu.men_id === menId) {
                if (!subId && !opcId) {
                    return menu.has_permission;
                }
                
                if (menu.submenus) {
                    for (const submenu of menu.submenus) {
                        if (submenu.sub_id === subId) {
                            if (!opcId) {
                                return submenu.has_permission;
                            }
                            
                            if (submenu.opciones) {
                                for (const opcion of submenu.opciones) {
                                    if (opcion.opc_id === opcId) {
                                        return opcion.has_permission;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }, [profilePermissions]);

    const hasUserPermission = useCallback((menId, subId = null, opcId = null) => {
        for (const menu of userPermissions) {
            if (menu.id === menId) {
                if (!subId && !opcId) {
                    return true;
                }
                
                if (menu.submenus) {
                    for (const submenu of menu.submenus) {
                        if (submenu.id === subId) {
                            if (!opcId) {
                                return true;
                            }
                            
                            if (submenu.opciones) {
                                for (const opcion of submenu.opciones) {
                                    if (opcion.id === opcId) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }, [userPermissions]);

    // ===== FILTROS MEMOIZADOS =====
    const filteredUsuarios = useMemo(() => {
        return usuarios.filter(usuario => {
            const matchesSearch = searchTerm === '' || 
                usuario.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                usuario.usu_cor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                usuario.usu_ced.includes(searchTerm);
            
            return matchesSearch;
        });
    }, [usuarios, searchTerm]);

    // ===== ESTADÍSTICAS MEMOIZADAS =====
    const userPermissionsStats = useMemo(() => {
        if (!profilePermissions.length || !selectedUser) return { available: 0, granted: 0, percentage: 0 };

        let available = 0;
        let granted = 0;

        profilePermissions.forEach(menu => {
            if (menu.has_permission) {
                available++;
                if (hasUserPermission(menu.men_id)) granted++;
            }

            if (menu.submenus) {
                menu.submenus.forEach(submenu => {
                    if (submenu.has_permission) {
                        available++;
                        if (hasUserPermission(menu.men_id, submenu.sub_id)) granted++;
                    }

                    if (submenu.opciones) {
                        submenu.opciones.forEach(opcion => {
                            if (opcion.has_permission) {
                                available++;
                                if (hasUserPermission(menu.men_id, submenu.sub_id, opcion.opc_id)) granted++;
                            }
                        });
                    }
                });
            }
        });

        return {
            available,
            granted,
            percentage: available > 0 ? Math.round((granted / available) * 100) : 0
        };
    }, [profilePermissions, hasUserPermission, selectedUser]);

    // ===== RENDER PRINCIPAL =====
    if (loading) {
        return (
            <div className="p-6 h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Panel de usuarios */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <Icon name="Users" size={20} className="mr-2" />
                        Usuarios del Sistema
                    </h3>

                    {/* Filtros */}
                    <div className="space-y-3 mb-4">
                        {/* Buscador */}
                        <div className="relative">
                            <Icon name="Search" size={16} className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar usuario..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>

                        {/* Filtro por perfil */}
                        <select
                            value={selectedProfile}
                            onChange={handleProfileFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            <option value="">Todos los perfiles</option>
                            {perfiles.map(perfil => (
                                <option key={perfil.per_id} value={perfil.per_id}>
                                    {perfil.per_nom}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Lista de usuarios */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredUsuarios.map((usuario) => (
                        <UserCard
                            key={usuario.usu_id}
                            usuario={usuario}
                            isSelected={selectedUser?.usu_id === usuario.usu_id}
                            onClick={handleUserSelect}
                        />
                    ))}
                </div>

                {filteredUsuarios.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Icon name="Users" size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No hay usuarios disponibles</p>
                        {searchTerm && (
                            <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                        )}
                    </div>
                )}
            </div>

            {/* Panel de permisos del usuario */}
            <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
                {selectedUser ? (
                    <>
                        {/* Header del panel de permisos */}
                        <div className="mb-4 pb-4 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-800 flex items-center">
                                        <Icon name="User" size={20} className="mr-2" />
                                        Permisos: {selectedUser.nombre_completo}
                                    </h3>
                                    <div className="flex items-center mt-2 text-sm text-gray-600">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs mr-3">
                                            Perfil: {selectedUser.perfil}
                                        </span>
                                        <span>Permisos asignados: {userPermissionsStats.granted}/{userPermissionsStats.available}</span>
                                        <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                            {userPermissionsStats.percentage}%
                                        </span>
                                    </div>
                                </div>

                                {/* Leyenda */}
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div className="flex items-center">
                                        <Icon name="Shield" size={12} className="mr-1 text-green-600" />
                                        <span>Disponible en perfil</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Icon name="ShieldX" size={12} className="mr-1 text-red-600" />
                                        <span>No disponible en perfil</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Árbol de permisos */}
                        <div className="flex-1 overflow-auto">
                            {loadingPermissions ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                        <p className="text-gray-600 text-sm">Cargando permisos...</p>
                                    </div>
                                </div>
                            ) : profilePermissions.length > 0 ? (
                                <div className="space-y-3">
                                    {profilePermissions.map(menu => (
                                        <PermissionTreeItem 
                                            key={menu.men_id} 
                                            menu={menu} 
                                            hasUserPermission={hasUserPermission}
                                            isPermissionAvailableInProfile={isPermissionAvailableInProfile}
                                            toggleUserPermission={toggleUserPermission}
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
                                    <p>No hay permisos disponibles para este usuario</p>
                                    <p className="text-sm mt-1">El perfil del usuario no tiene permisos asignados</p>
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
                            <Icon name="User" size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>Seleccione un usuario para configurar sus permisos</p>
                            <p className="text-sm mt-1">Los usuarios solo pueden tener permisos disponibles en su perfil</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AsgiPerUsWindows;