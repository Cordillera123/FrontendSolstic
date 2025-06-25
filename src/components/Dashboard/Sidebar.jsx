// src/components/Dashboard/Sidebar.jsx - OPTIMIZADO para evitar re-renders
import React, { useState, useEffect, memo } from "react";
import { ChevronDown, ChevronRight, HelpCircle, Info, Building, MapPin, User } from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import { useUserInfo } from '../../hooks/useUserInfo';
import LogoutButton from '../Auth/LogoutButton';
import Icon from "../UI/Icon";

const Sidebar = memo(({
  onOpenWindow,
  currentDate,
}) => {
  const { user, permissions } = useAuth();
  
  // ✅ OPTIMIZADO: Hook para información del usuario con configuración específica
  const {
    userInfo,
    loading: userInfoLoading,
    error: userInfoError,
    displayName,
    userInitials,
    institucion,
    oficina,
    fullLocation,
    hasOffice,
    hasInstitution,
    refresh: refreshUserInfo,
    isReady
  } = useUserInfo({
    autoLoad: true,
    basicOnly: true,
    refreshInterval: 5 * 60 * 1000 // 5 minutos
  });
  
  // Estados para el menú dinámico
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [expandedSubmenus, setExpandedSubmenus] = useState(new Set());

  // Cargar menús del contexto de autenticación
  useEffect(() => {
    console.log('🔄 Sidebar - Cargando permisos desde AuthContext...');
    
    if (permissions && permissions.length > 0) {
      console.log('✅ Sidebar - Usando permisos del login:', permissions.length, 'menús');
      setMenuData(permissions);
      setLoading(false);
    } else {
      console.log('⚠️ Sidebar - No hay permisos en el contexto');
      setMenuData([]);
      setLoading(false);
    }
  }, [permissions]);

  // ✅ OPTIMIZADO: Logs solo cuando cambie la información del usuario
  useEffect(() => {
    if (isReady && userInfo) {
      console.log('✅ Sidebar - Información del usuario lista:', {
        nombre: displayName,
        institucion: institucion.nombre,
        oficina: oficina.nombre,
        hasOffice
      });
    }
  }, [isReady, displayName, institucion.nombre, oficina.nombre, hasOffice]);

  // Manejar expansión de menús principales
  const toggleMenu = (menuId) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
      const relatedSubmenus = menuData.find(m => m.id === menuId)?.submenus || [];
      relatedSubmenus.forEach(sub => {
        const newSubExpanded = new Set(expandedSubmenus);
        newSubExpanded.delete(sub.id);
        setExpandedSubmenus(newSubExpanded);
      });
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const toggleSubmenu = (submenuId) => {
    const newExpanded = new Set(expandedSubmenus);
    if (newExpanded.has(submenuId)) {
      newExpanded.delete(submenuId);
    } else {
      newExpanded.add(submenuId);
    }
    setExpandedSubmenus(newExpanded);
  };

  // Handlers de clic en elementos del menú
  const handleMenuClick = (menu) => {
    if (menu.ventana_directa && menu.componente) {
      onOpenWindow({
        id: `menu-${menu.id}`,
        title: menu.nombre,
        component: menu.componente,
        type: 'menu',
        data: menu,
      });
      return;
    }

    if (menu.submenus && menu.submenus.length > 0) {
      toggleMenu(menu.id);
    } else {
      onOpenWindow({
        id: `menu-${menu.id}`,
        title: menu.nombre,
        component: menu.componente || 'DefaultWindow',
        type: 'menu',
        data: menu,
      });
    }
  };

  const handleSubmenuClick = (submenu, parentMenu) => {
    if (submenu.ventana_directa && submenu.componente) {
      onOpenWindow({
        id: `submenu-${submenu.id}`,
        title: `${parentMenu.nombre} > ${submenu.nombre}`,
        component: submenu.componente,
        type: 'submenu',
        data: { submenu, parentMenu },
      });
      return;
    }

    if (submenu.opciones && submenu.opciones.length > 0) {
      toggleSubmenu(submenu.id);
    } else {
      onOpenWindow({
        id: `submenu-${submenu.id}`,
        title: `${parentMenu.nombre} > ${submenu.nombre}`,
        component: submenu.componente || 'DefaultWindow',
        type: 'submenu',
        data: { submenu, parentMenu },
      });
    }
  };

  const handleOptionClick = (option, parentSubmenu, parentMenu) => {
    onOpenWindow({
      id: `option-${option.id}`,
      title: `${parentMenu.nombre} > ${parentSubmenu.nombre} > ${option.nombre}`,
      component: option.componente || 'DefaultWindow',
      type: 'option',
      data: { option, parentSubmenu, parentMenu },
    });
  };

  // Estilos
  const sidebarStyle = {
    width: "16rem",
    backgroundColor: "#0c4a6e",
    color: "white",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  };

  const headerStyle = {
    padding: "1rem",
    background: "linear-gradient(to right, #0ea5e9, #0369a1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "1.5rem",
    paddingBottom: "1.5rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  };

  const logoStyle = {
    fontSize: "1.25rem",
    fontWeight: "bold",
    letterSpacing: "-0.025em",
    marginBottom: "0.25rem",
    color: "white",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  };

  const dateStyle = {
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  };

  const sectionTitleStyle = {
    paddingLeft: "0.75rem",
    paddingRight: "0.75rem",
    paddingTop: "0.5rem",
    paddingBottom: "0.5rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: "1rem",
  };

  const profileContainerStyle = {
    padding: "0.75rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(12, 74, 110, 0.9)",
  };

  const profileAvatarStyle = {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "9999px",
    background: "linear-gradient(to right, #0ea5e9, #0369a1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "0.875rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
  };

  const userInfoStyle = {
    padding: "0.75rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(12, 74, 110, 0.7)",
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.9)",
  };

  // Renderizar contenido de carga
  if (loading) {
    return (
      <div style={sidebarStyle}>
        <div style={headerStyle}>
          <div style={logoStyle}>COAC PRINCIPAL</div>
          <div style={dateStyle}>{currentDate}</div>
        </div>
        
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2"></div>
            <div className="h-4 bg-gray-600 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={sidebarStyle}>
      {/* Logo y encabezado */}
      <div style={headerStyle}>
        <div style={logoStyle}>COAC PRINCIPAL</div>
        <div style={dateStyle}>{currentDate}</div>
      </div>

      {/* ✅ OPTIMIZADO: Información de ubicación del usuario */}
      {isReady && userInfo && (
        <div style={userInfoStyle}>
          <div className="space-y-2">
            {/* Institución */}
            <div className="flex items-center">
              <Building size={12} className="mr-2 text-blue-300" />
              <span className="text-white font-medium text-xs" title={institucion.nombre}>
                {hasInstitution ? institucion.nombre : 'Sin institución'}
              </span>
            </div>
            
            {/* Oficina */}
            <div className="flex items-center">
              <MapPin size={12} className="mr-2 text-green-300" />
              <span className="text-white text-xs" title={oficina.completa}>
                {hasOffice ? oficina.nombre : 'Sin oficina asignada'}
              </span>
            </div>
            
            {/* Indicador de estado */}
            <div className="flex items-center justify-between pt-1 border-t border-white border-opacity-20">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${hasOffice ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span className="text-xs text-white text-opacity-80">
                  {hasOffice ? 'Ubicación definida' : 'Sin ubicación'}
                </span>
              </div>
              {userInfoError && (
                <button 
                  onClick={refreshUserInfo}
                  className="text-xs text-yellow-300 hover:text-yellow-100 transition-colors"
                  title="Recargar información"
                >
                  ↻
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ OPTIMIZADO: Mostrar indicador de carga solo cuando sea necesario */}
      {userInfoLoading && !isReady && (
        <div style={userInfoStyle}>
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent mr-2"></div>
            <span className="text-xs text-white text-opacity-80">Cargando ubicación...</span>
          </div>
        </div>
      )}

      {/* Módulos dinámicos */}
      <div className="flex-1 overflow-y-auto py-2">
        <div style={sectionTitleStyle}>
          Módulos del Sistema
        </div>
        
        <ul className="mt-2 space-y-1 px-2">
          {menuData.map((menu) => (
            <li key={menu.id}>
              {/* Menú principal */}
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer transition-all duration-150 ${
                  expandedMenus.has(menu.id)
                    ? "bg-coop-primary bg-opacity-70 text-white"
                    : "hover:bg-[#3b82f640]"
                }`}
                onClick={() => handleMenuClick(menu)}
              >
                <div className="p-1.5 rounded-md bg-coop-primary bg-opacity-30">
                  <Icon 
                    name={menu.icon_nombre || 'Circle'} 
                    size={16} 
                    className="text-white" 
                  />
                </div>
                <span className="ml-3 text-sm font-medium text-white">
                  {menu.nombre}
                </span>
                {menu.submenus && menu.submenus.length > 0 && (
                  <div className="ml-auto">
                    {expandedMenus.has(menu.id) ? (
                      <ChevronDown size={16} className="text-white" />
                    ) : (
                      <ChevronRight size={16} className="text-white" />
                    )}
                  </div>
                )}
              </div>

              {/* Submenús */}
              {expandedMenus.has(menu.id) && menu.submenus && (
                <ul className="pl-10 mt-1 space-y-1">
                  {menu.submenus.map((submenu) => (
                    <li key={submenu.id}>
                      <div
                        className={`flex items-center p-1.5 rounded-md cursor-pointer transition-all duration-150 ${
                          expandedSubmenus.has(submenu.id)
                            ? "bg-coop-primary bg-opacity-50 text-white"
                            : "hover:bg-[#3b82f640]"
                        }`}
                        onClick={() => handleSubmenuClick(submenu, menu)}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white mr-2"></div>
                        <Icon 
                          name={submenu.icon_nombre || 'Circle'} 
                          size={12} 
                          className="text-white mr-2" 
                        />
                        <span className="text-sm text-white">{submenu.nombre}</span>
                        {submenu.opciones && submenu.opciones.length > 0 && (
                          <div className="ml-auto">
                            {expandedSubmenus.has(submenu.id) ? (
                              <ChevronDown size={14} className="text-white" />
                            ) : (
                              <ChevronRight size={14} className="text-white" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Opciones */}
                      {expandedSubmenus.has(submenu.id) && submenu.opciones && (
                        <ul className="pl-8 mt-1 space-y-1">
                          {submenu.opciones.map((option) => (
                            <li key={option.id}>
                              <div
                                className="flex items-center p-1 rounded-md cursor-pointer transition-all duration-150 hover:bg-[#3b82f620] text-gray-300"
                                onClick={() => handleOptionClick(option, submenu, menu)}
                              >
                                <Icon 
                                  name={option.icon_nombre || 'Circle'} 
                                  size={12} 
                                  className="mr-2 text-gray-300" 
                                />
                                <span className="text-xs">{option.nombre}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {/* Mensaje si no hay menús */}
        {menuData.length === 0 && !loading && (
          <div className="px-4 py-8 text-center">
            <Icon name="AlertCircle" size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-400">No hay módulos disponibles</p>
            <p className="text-xs text-gray-500 mt-1">Contacte al administrador para asignar permisos</p>
          </div>
        )}

        {/* Sección de información */}
        <div style={sectionTitleStyle}>
          Información
        </div>
        <ul className="mt-2 space-y-1 px-2">
          <li className="flex items-center p-2 rounded-md cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all duration-150 text-white">
            <div className="p-1.5 rounded-md bg-coop-primary bg-opacity-30">
              <HelpCircle size={18} className="text-white" />
            </div>
            <span className="ml-3 text-sm font-medium">Ayuda</span>
          </li>
          <li className="flex items-center p-2 rounded-md cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all duration-150 text-white">
            <div className="p-1.5 rounded-md bg-coop-primary bg-opacity-30">
              <Info size={18} className="text-white" />
            </div>
            <span className="ml-3 text-sm font-medium">Acerca de</span>
          </li>
        </ul>
      </div>

      {/* ✅ ACTUALIZADO: Perfil de usuario con información completa */}
      <div style={profileContainerStyle}>
        <div className="flex items-center p-2">
          <div style={profileAvatarStyle}>
            {userInitials || (user?.fullName 
              ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() 
              : user?.email?.substring(0, 2).toUpperCase() || 'UA')}
          </div>
          <div className="ml-3 flex-1">
            {/* Nombre del usuario */}
            <div className="font-medium text-sm text-white">
              {displayName || user?.fullName || user?.email || 'Usuario Admin'}
            </div>
            
            {/* Información de conexión y perfil */}
            <div className="text-xs text-white text-opacity-90 flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
              Conectado - {userInfo?.perfil || user?.perfil || 'Sin perfil'}
            </div>

            {/* ✅ NUEVA LÍNEA: Mostrar ubicación laboral compacta */}
            {isReady && userInfo && (
              <div className="text-xs text-white text-opacity-75 mt-1 flex items-center">
                <User size={10} className="mr-1" />
                <span className="truncate">
                  {hasOffice ? oficina.tipo || 'Oficina' : 'Sin ubicación'}
                </span>
              </div>
            )}

            {/* Indicador de error */}
            {userInfoError && (
              <div className="text-xs text-red-300 mt-1 flex items-center">
                <span className="mr-1">⚠</span>
                Error al cargar ubicación
              </div>
            )}
          </div>
          <div className="ml-auto">
            <LogoutButton iconOnly={true} />
          </div>
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;