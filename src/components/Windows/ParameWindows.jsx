// src/components/Windows/ParameWindows.jsx - VERSIÓN ACTUALIZADA CON COMPONENTES SEPARADOS
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useButtonPermissions } from "../../hooks/useButtonPermissions";
import { adminService, iconService } from "../../services/apiService";
import { getCurrentUser } from "../../context/AuthContext";
import Icon from "../UI/Icon";
import {
  SubmenuForm,
  SubmenusList,
  useSubmenuManagement,
} from "./SubmenuComponents";
import {
  OptionForm,
  OptionsList,
  useOptionManagement,
} from "./OptionComponents";
import ParameWindowsCrear from "./ParameWindowsCrear";
import ParameWindowsEditar from "./ParameWindowsEditar";

// ===== COMPONENTE PRINCIPAL ACTUALIZADO =====
const ParameWindows = ({ data }) => {
  // ===== CONFIGURACIÓN =====
  const MENU_ID = 1; // ID del menú "Parametrización de Módulos"

  // ===== OBTENER USUARIO ACTUAL =====
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.usu_id;

  console.log("🔍 ParameWindows - Usuario actual:", {
    usu_id: currentUserId,
    usu_nom: currentUser?.usu_nom,
    per_id: currentUser?.per_id,
  });

  // ===== HOOK DE PERMISOS PRINCIPAL =====
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    loading: permissionsLoading,
    error: permissionsError,
    buttonPermissions,
    debugInfo,
  } = useButtonPermissions(MENU_ID, null, true, "menu");

  // ===== ESTADOS PARA PERMISOS ESPECÍFICOS (SISTEMA ROBUSTO) =====
  const [userSpecificPermissions, setUserSpecificPermissions] = useState(null);
  const [loadingUserPermissions, setLoadingUserPermissions] = useState(false);
  const [userPermissionsError, setUserPermissionsError] = useState(null);

  // ===== FUNCIÓN PARA CARGAR PERMISOS ESPECÍFICOS =====
  const loadUserSpecificPermissions = useCallback(async () => {
    if (!currentUserId) return;

    setLoadingUserPermissions(true);
    setUserPermissionsError(null);

    try {
      console.log(
        "🔍 ParameWindows - Cargando permisos específicos para usuario:",
        currentUserId
      );

      const result = await adminService.userButtonPermissions.getUserButtonPermissions(
        currentUserId
      );

      console.log("📥 ParameWindows - Respuesta permisos específicos:", result);

      if (result.success && result.menuStructure) {
        const menuData = result.menuStructure.find(
          (menu) => menu.men_id === MENU_ID
        );

        if (menuData && menuData.botones) {
          console.log(
            "✅ ParameWindows - Permisos específicos encontrados:",
            menuData.botones
          );
          setUserSpecificPermissions(menuData.botones);
        } else {
          console.log("❌ ParameWindows - Menú no encontrado en estructura");
          setUserSpecificPermissions([]);
        }
      } else {
        console.log(
          "❌ ParameWindows - Error en respuesta de permisos específicos"
        );
        setUserPermissionsError("Error al cargar permisos específicos");
      }
    } catch (error) {
      console.error(
        "❌ ParameWindows - Error cargando permisos específicos:",
        error
      );
      setUserPermissionsError(error.message);
    } finally {
      setLoadingUserPermissions(false);
    }
  }, [currentUserId]);

  // ===== FUNCIÓN PARA OBTENER PERMISO ESPECÍFICO =====
  const getUserSpecificButtonPermission = useCallback(
    (buttonCode) => {
      if (!userSpecificPermissions) {
        // Fallback a permisos generales si no hay específicos
        const generalPermission = buttonPermissions?.find(
          (btn) => btn.bot_codigo === buttonCode
        )?.has_permission;
        console.log(
          `🔍 ParameWindows - Usando permiso general para ${buttonCode}:`,
          generalPermission
        );
        return generalPermission || false;
      }

      const button = userSpecificPermissions.find(
        (btn) => btn.bot_codigo === buttonCode
      );

      if (button) {
        const hasPermission = button.has_permission === true;
        console.log(`🎯 ParameWindows - Permiso específico ${buttonCode}:`, {
          has_permission: hasPermission,
          profile_permission: button.profile_permission,
          is_customized: button.is_customized,
          customization_type: button.customization_type,
        });
        return hasPermission;
      }

      console.log(`❌ ParameWindows - Botón ${buttonCode} no encontrado`);
      return false;
    },
    [userSpecificPermissions, buttonPermissions]
  );

  // ===== PERMISOS EFECTIVOS CALCULADOS =====
  const effectivePermissions = useMemo(() => {
    const permissions = {
      canCreate: getUserSpecificButtonPermission("CREATE"),
      canRead: getUserSpecificButtonPermission("read"),
      canUpdate: getUserSpecificButtonPermission("UPDATE"),
      canDelete: getUserSpecificButtonPermission("DELETE"),
      canExport: getUserSpecificButtonPermission("EXPORT"),
    };

    console.log("🎯 ParameWindows - Permisos efectivos calculados:", permissions);
    return permissions;
  }, [getUserSpecificButtonPermission]);

  // ===== ESTADOS DEL COMPONENTE =====
  const [activeTab, setActiveTab] = useState("menus");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [menus, setMenus] = useState([]);
  const [submenus, setSubmenus] = useState([]);
  const [options, setOptions] = useState([]);
  const [icons, setIcons] = useState([]);
  
  // ===== NUEVOS ESTADOS PARA FORMULARIOS SEPARADOS =====
  const [showCreateMenuForm, setShowCreateMenuForm] = useState(false);
  const [showEditMenuForm, setShowEditMenuForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);

  // ===== FUNCIONES BÁSICAS =====
  const showMessage = useCallback((type, text) => {
    console.log("📢 ParameWindows - Mensaje:", type, text);
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }, []);

  // ===== FUNCIONES DE CARGA =====
  const loadMenus = useCallback(async () => {
    try {
      console.log("📥 ParameWindows - Cargando menús...");
      const result = await adminService.menus.getAll();
      console.log(
        "📋 ParameWindows - Menús cargados:",
        result.menus?.length || 0
      );
      setMenus(result.menus || []);
    } catch (error) {
      console.error("❌ ParameWindows - Error loading menus:", error);
    }
  }, []);

  const loadSubmenus = useCallback(async () => {
    try {
      const result = await adminService.submenus.getAll();
      setSubmenus(result.submenus || []);
    } catch (error) {
      console.error("❌ ParameWindows - Error loading submenus:", error);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const result = await adminService.options.getAll();
      setOptions(result.opciones || []);
    } catch (error) {
      console.error("❌ ParameWindows - Error loading options:", error);
    }
  }, []);

  const loadIcons = useCallback(async () => {
    try {
      const result = await iconService.getAllIcons();
      setIcons(result.data || []);
    } catch (error) {
      console.error("❌ ParameWindows - Error loading icons:", error);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("🚀 ParameWindows - Cargando datos iniciales...");
      await Promise.all([
        loadMenus(),
        loadSubmenus(),
        loadOptions(),
        loadIcons(),
      ]);
      console.log("✅ ParameWindows - Datos iniciales cargados");
    } catch (error) {
      console.error("❌ ParameWindows - Error loading initial data:", error);
      showMessage("error", "Error al cargar datos iniciales");
    } finally {
      setLoading(false);
    }
  }, [loadMenus, loadSubmenus, loadOptions, loadIcons, showMessage]);

  // ===== MANEJADORES CON VALIDACIÓN DE PERMISOS EFECTIVOS =====
  const handleMenuSave = useCallback(
    async (formData, editingMenu = null) => {
      console.log("💾 ParameWindows - Guardando menú:", formData);

      // ✅ VALIDACIÓN CON PERMISOS EFECTIVOS
      if (editingMenu && !effectivePermissions.canUpdate) {
        console.log("❌ ParameWindows - UPDATE denegado (efectivo)");
        showMessage("error", "No tienes permisos para actualizar menús");
        return;
      }

      if (!editingMenu && !effectivePermissions.canCreate) {
        console.log("❌ ParameWindows - CREATE denegado (efectivo)");
        showMessage("error", "No tienes permisos para crear menús");
        return;
      }

      setLoading(true);

      try {
        const cleanData = {
          men_nom: formData.men_nom?.trim(),
          ico_id: formData.ico_id ? parseInt(formData.ico_id) : null,
          men_componente: formData.men_componente?.trim() || null,
          men_eje: parseInt(formData.men_eje) || 1,
          men_ventana_directa: Boolean(formData.men_ventana_directa),
          men_est: true, // Activo por defecto
        };

        console.log("📤 ParameWindows - Datos a enviar:", cleanData);

        let result;
        if (editingMenu) {
          result = await adminService.menus.update(editingMenu.men_id, cleanData);
          showMessage("success", "Menú actualizado correctamente");
          console.log("✅ ParameWindows - Menú actualizado:", result);
        } else {
          result = await adminService.menus.create(cleanData);
          showMessage("success", "Menú creado correctamente");
          console.log("✅ ParameWindows - Menú creado:", result);
        }

        await loadMenus();
        setShowCreateMenuForm(false);
        setShowEditMenuForm(false);
        setEditingMenu(null);
      } catch (error) {
        console.error("❌ ParameWindows - Error guardando menú:", error);
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Error al guardar el menú";
        showMessage("error", errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [showMessage, loadMenus, effectivePermissions]
  );

  const handleNewMenu = useCallback(() => {
    if (!effectivePermissions.canCreate) {
      console.log("❌ ParameWindows - CREATE denegado para nuevo menú (efectivo)");
      showMessage("error", "No tienes permisos para crear menús");
      return;
    }

    console.log("➕ ParameWindows - Nuevo menú - Permiso concedido (efectivo)");
    setEditingMenu(null);
    setShowCreateMenuForm(true);
    setShowEditMenuForm(false);
  }, [effectivePermissions.canCreate, showMessage]);

  const handleEditMenu = useCallback(
    (menu) => {
      if (!effectivePermissions.canUpdate) {
        console.log(
          "❌ ParameWindows - UPDATE denegado para editar menú (efectivo)"
        );
        showMessage("error", "No tienes permisos para editar menús");
        return;
      }

      console.log(
        "✏️ ParameWindows - Editar menú - Permiso concedido (efectivo):",
        menu.men_id
      );
      setEditingMenu(menu);
      setShowEditMenuForm(true);
      setShowCreateMenuForm(false);
    },
    [effectivePermissions.canUpdate, showMessage]
  );

  const handleDeleteMenu = useCallback(
    async (menu) => {
      if (!effectivePermissions.canDelete) {
        console.log("❌ ParameWindows - DELETE denegado (efectivo)");
        showMessage("error", "No tienes permisos para eliminar menús");
        return;
      }

      if (
        !window.confirm(`¿Estás seguro de eliminar el menú "${menu.men_nom}"?`)
      ) {
        return;
      }

      try {
        setLoading(true);
        console.log(
          "🗑️ ParameWindows - Eliminando menú - Permiso concedido (efectivo):",
          menu.men_id
        );
        await adminService.menus.delete(menu.men_id);
        showMessage("success", "Menú eliminado correctamente");
        await loadMenus();
      } catch (error) {
        console.error("❌ ParameWindows - Error eliminando menú:", error);
        const errorMsg =
          error.response?.data?.message || "Error al eliminar el menú";
        showMessage("error", errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [effectivePermissions.canDelete, showMessage, loadMenus]
  );

  // ===== MANEJADORES DE CANCELACIÓN =====
  const handleCancelCreateMenu = useCallback(() => {
    console.log("❌ ParameWindows - Cancelando creación de menú");
    setShowCreateMenuForm(false);
  }, []);

  const handleCancelEditMenu = useCallback(() => {
    console.log("❌ ParameWindows - Cancelando edición de menú");
    setShowEditMenuForm(false);
    setEditingMenu(null);
  }, []);

  const handleTabChange = useCallback((newTab) => {
    console.log("🔄 ParameWindows - Cambiar tab:", newTab);
    setActiveTab(newTab);
    setShowCreateMenuForm(false);
    setShowEditMenuForm(false);
    setEditingMenu(null);
  }, []);

  // ===== HOOKS PARA SUBMENÚS Y OPCIONES =====
  const {
    showSubmenuForm,
    editingSubmenu,
    submenuFormKey,
    handleSubmenuSave,
    handleSubmenuCancel,
    handleNewSubmenu,
    handleEditSubmenu,
    handleDeleteSubmenu,
  } = useSubmenuManagement(showMessage, loadSubmenus);

  const {
    showOptionForm,
    editingOption,
    optionFormKey,
    handleOptionSave,
    handleOptionCancel,
    handleNewOption,
    handleEditOption,
    handleDeleteOption,
  } = useOptionManagement(showMessage, loadOptions);

  // ===== EFFECTS =====
  useEffect(() => {
    console.log("🚀 ParameWindows - Iniciando carga de datos");
    if ((canRead || effectivePermissions.canRead) && currentUserId) {
      loadInitialData();
    }
  }, [loadInitialData, canRead, effectivePermissions.canRead, currentUserId]);

  useEffect(() => {
    if (currentUserId && !permissionsError) {
      loadUserSpecificPermissions();
    }
  }, [currentUserId, loadUserSpecificPermissions, permissionsError]);

  useEffect(() => {
    console.log("🔍 ParameWindows - Permisos actualizados:", {
      general: { canCreate, canRead, canUpdate, canDelete },
      effective: effectivePermissions,
      userSpecific: userSpecificPermissions ? "Cargados" : "No cargados",
      permissionsLoading,
      loadingUserPermissions,
      currentUserId,
    });
  }, [
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    effectivePermissions,
    userSpecificPermissions,
    permissionsLoading,
    loadingUserPermissions,
    currentUserId,
  ]);

  // ===== COMPONENTES MEMOIZADOS =====

  const MenusList = useMemo(
    () => (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Lista de Menús ({menus.length})
          </h3>
          {/* ✅ BOTÓN CREATE CON SOLO ICONO */}
          {effectivePermissions.canCreate ? (
            <button
              onClick={handleNewMenu}
              className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
              disabled={loading}
              title="Crear nuevo menú"
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
              title="Sin permisos para crear menús"
            >
              <Icon name="Lock" size={16} />
            </div>
          )}
        </div>

        {menus.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon
              name="Menu"
              size={48}
              className="mx-auto mb-4 text-gray-300"
            />
            <p>No hay menús registrados</p>
            {effectivePermissions.canCreate && (
              <p className="text-sm text-gray-400 mt-2">Haz clic en el botón + para crear un nuevo menú</p>
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
                  <th className="text-left py-2">Estado</th>
                  <th className="text-left py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <tr
                    key={menu.men_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 text-xs text-gray-500">
                      #{menu.men_id}
                    </td>
                    <td className="py-2 font-medium">{menu.men_nom}</td>
                    <td className="py-2">
                      {menu.men_componente ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                          {menu.men_componente}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          menu.men_est
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {menu.men_est ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        {/* ✅ BOTÓN UPDATE CON PERMISOS EFECTIVOS */}
                        {effectivePermissions.canUpdate ? (
                          <button
                            onClick={() => handleEditMenu(menu)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                            disabled={loading}
                            title="Editar menú"
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
                        {/* ✅ BOTÓN DELETE CON PERMISOS EFECTIVOS */}
                        {effectivePermissions.canDelete ? (
                          <button
                            onClick={() => handleDeleteMenu(menu)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                            disabled={loading}
                            title="Eliminar menú"
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
    ),
    [
      menus,
      loading,
      effectivePermissions,
      handleNewMenu,
      handleEditMenu,
      handleDeleteMenu,
    ]
  );

  const SubmenusListMemo = useMemo(
    () => (
      <SubmenusList
        submenus={submenus}
        loading={loading}
        onNew={handleNewSubmenu}
        onEdit={handleEditSubmenu}
        onDelete={handleDeleteSubmenu}
        showMessage={showMessage}
      />
    ),
    [
      submenus,
      loading,
      handleNewSubmenu,
      handleEditSubmenu,
      handleDeleteSubmenu,
      showMessage,
    ]
  );

  const OptionsListMemo = useMemo(
    () => (
      <OptionsList
        options={options}
        loading={loading}
        onNew={handleNewOption}
        onEdit={handleEditOption}
        onDelete={handleDeleteOption}
        showMessage={showMessage}
      />
    ),
    [
      options,
      loading,
      handleNewOption,
      handleEditOption,
      handleDeleteOption,
      showMessage,
    ]
  );

  // ===== VALIDACIONES DE CARGA =====
  if (permissionsLoading || loadingUserPermissions) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {permissionsLoading
              ? "Cargando permisos generales..."
              : "Cargando permisos específicos..."}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Usuario ID: {currentUserId}
          </p>
        </div>
      </div>
    );
  }

  if (permissionsError && !userSpecificPermissions) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Icon
            name="AlertCircle"
            size={48}
            className="mx-auto mb-4 text-red-300"
          />
          <p className="text-red-500 mb-2">Error al cargar permisos</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <p className="text-sm text-red-800 mb-2">
              <strong>Error General:</strong> {permissionsError}
            </p>
            {userPermissionsError && (
              <p className="text-sm text-red-800 mb-2">
                <strong>Error Específico:</strong> {userPermissionsError}
              </p>
            )}
            <ul className="text-xs text-red-700 space-y-1">
              <li>
                • Menu ID:{" "}
                <code className="bg-red-100 px-1 rounded">{MENU_ID}</code>
              </li>
              <li>
                • Usuario ID:{" "}
                <code className="bg-red-100 px-1 rounded">{currentUserId}</code>
              </li>
              <li>• Intentando cargar permisos específicos...</li>
            </ul>
          </div>
          <button
            onClick={loadUserSpecificPermissions}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loadingUserPermissions}
          >
            {loadingUserPermissions ? "Cargando..." : "Reintentar"}
          </button>
        </div>
      </div>
    );
  }

  if (!canRead && !effectivePermissions.canRead) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Icon name="Lock" size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">
            No tienes permisos para acceder a esta sección
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Información de debug:</strong>
            </p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>
                • Menu ID:{" "}
                <code className="bg-yellow-100 px-1 rounded">{MENU_ID}</code>
              </li>
              <li>
                • Usuario ID:{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  {currentUserId}
                </code>
              </li>
              <li>
                • Permiso READ General:{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  {canRead ? "SÍ" : "NO"}
                </code>
              </li>
              <li>
                • Permiso READ Efectivo:{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  {effectivePermissions.canRead ? "SÍ" : "NO"}
                </code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER PRINCIPAL =====
  if (loading && !menus.length && !submenus.length && !options.length) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando módulos...</p>
        </div>
      </div>
    );
  }

  // ===== RENDERIZADO DE FORMULARIOS SEPARADOS =====
  if (showCreateMenuForm) {
    return (
      <ParameWindowsCrear
        onSave={handleMenuSave}
        onCancel={handleCancelCreateMenu}
        showMessage={showMessage}
        loading={loading}
        icons={icons}
      />
    );
  }

  if (showEditMenuForm) {
    return (
      <ParameWindowsEditar
        editingMenu={editingMenu}
        onSave={handleMenuSave}
        onCancel={handleCancelEditMenu}
        showMessage={showMessage}
        loading={loading}
        icons={icons}
      />
    );
  }

  const tabs = [
    { id: "menus", name: "Menús", icon: "Menu" },
    { id: "submenus", name: "Submenús", icon: "Layers" },
    { id: "options", name: "Opciones", icon: "Settings" },
  ];

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
          <Icon name="Settings" size={24} className="mr-3 text-blue-600" />
          Parametrización de Módulos
          <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Menu ID: {MENU_ID} | Usuario: {currentUserId}
          </span>
        </h2>
        <p className="text-gray-600">
          Gestione la configuración de menús, submenús y opciones del sistema
        </p>
      </div>

      {/* Debug Panel MEJORADO - Sistema híbrido */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-xs">
        {/* Información básica */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <div>
            <strong>Usuario:</strong> {currentUser?.usu_nom} (ID: {currentUserId})
          </div>
          <div>
            <strong>Perfil:</strong> {currentUser?.per_id}
          </div>
          <div>
            <strong>Tab Activo:</strong> {activeTab}
          </div>
          <div>
            <strong>Loading:</strong> {loading.toString()}
          </div>
        </div>

        {/* Estado de permisos */}
        <div className="mb-3 pb-2 border-b border-blue-200">
          <strong>Estado de Carga:</strong>
          <div className="mt-1 space-x-2">
            <span
              className={`px-2 py-1 rounded ${
                permissionsLoading
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              General: {permissionsLoading ? "Cargando..." : "Listo"}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                loadingUserPermissions
                  ? "bg-yellow-100 text-yellow-700"
                  : userSpecificPermissions
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              Específicos:{" "}
              {loadingUserPermissions
                ? "Cargando..."
                : userSpecificPermissions
                ? "Cargados"
                : "Error"}
            </span>
          </div>
        </div>

        {/* Permisos generales vs efectivos */}
        <div className="mb-3 pb-2 border-b border-blue-200">
          <strong>Permisos Generales:</strong>
          <div className="mt-1 space-x-1">
            <span
              className={`px-2 py-1 rounded ${
                canCreate
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              CREATE: {canCreate ? "SÍ" : "NO"}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                canRead
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              READ: {canRead ? "SÍ" : "NO"}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                canUpdate
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              UPDATE: {canUpdate ? "SÍ" : "NO"}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                canDelete
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              DELETE: {canDelete ? "SÍ" : "NO"}
            </span>
          </div>
        </div>

        <div className="mb-3 pb-2 border-b border-blue-200">
          <strong>Permisos Efectivos (Usados en UI):</strong>
          <div className="mt-1 space-x-1">
            <span
              className={`px-2 py-1 rounded ${
                effectivePermissions.canCreate
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              CREATE: {effectivePermissions.canCreate ? "SÍ" : "NO"}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                effectivePermissions.canRead
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              READ: {effectivePermissions.canRead ? "SÍ" : "NO"}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                effectivePermissions.canUpdate
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              UPDATE: {effectivePermissions.canUpdate ? "SÍ" : "NO"}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                effectivePermissions.canDelete
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              DELETE: {effectivePermissions.canDelete ? "SÍ" : "NO"}
            </span>
          </div>
        </div>

        {/* Detalle de permisos específicos */}
        {userSpecificPermissions && (
          <div>
            <strong>Detalle de Permisos Específicos:</strong>
            <div className="mt-1 grid grid-cols-1 md:grid-cols-5 gap-2">
              {userSpecificPermissions.map((btn) => (
                <div
                  key={btn.bot_codigo}
                  className={`p-2 rounded border text-xs ${
                    btn.has_permission
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="font-mono font-bold">{btn.bot_codigo}</div>
                  <div>Efectivo: {btn.has_permission ? "✅" : "❌"}</div>
                  <div>Perfil: {btn.profile_permission ? "✅" : "❌"}</div>
                  {btn.is_customized && (
                    <div className="text-orange-600">
                      Usuario:{" "}
                      {btn.customization_type === "C" ? "✅" : "❌"} (
                      {btn.customization_type})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {message.text && (
        <div
          className={`mb-4 p-3 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            <Icon
              name={message.type === "success" ? "CheckCircle" : "AlertCircle"}
              size={16}
              className="mr-2"
            />
            {message.text}
          </div>
        </div>
      )}

      {/* Pestañas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                disabled={loading}
              >
                <Icon name={tab.icon} size={16} className="mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <div className="space-y-6">
        {activeTab === "menus" && MenusList}

        {activeTab === "submenus" && (
          <>
            {showSubmenuForm && (
              <SubmenuForm
                key={submenuFormKey}
                editingSubmenu={editingSubmenu}
                icons={icons}
                menus={menus}
                loading={loading}
                onSave={handleSubmenuSave}
                onCancel={handleSubmenuCancel}
                showMessage={showMessage}
              />
            )}
            {SubmenusListMemo}
          </>
        )}

        {activeTab === "options" && (
          <>
            {showOptionForm && (
              <OptionForm
                key={optionFormKey}
                editingOption={editingOption}
                icons={icons}
                submenus={submenus}
                loading={loading}
                onSave={handleOptionSave}
                onCancel={handleOptionCancel}
                showMessage={showMessage}
              />
            )}
            {OptionsListMemo}
          </>
        )}
      </div>
    </div>
  );
};

export default ParameWindows;