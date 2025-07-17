// src/components/Dashboard/Sidebar.jsx - VERSIÓN FINAL con alerta de horario
import React, { useState, useEffect, memo } from "react";
import { ChevronDown, ChevronRight, HelpCircle, Info, Building, MapPin, User, Clock, LogOut, X } from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import { useUserInfo } from '../../hooks/useUserInfo';
import { useLogo } from '../../context/LogoContext';
import { useTheme } from '../../context/ThemeContext';
import LogoutButton from '../Auth/LogoutButton';
import Icon from "../UI/Icon";

// ✅ Componente de alerta de horario optimizado
const ScheduleAlert = memo(({ scheduleInfo, onForceLogout }) => {
  const [segundosRestantes, setSegundosRestantes] = useState(
    Math.max((scheduleInfo?.tiempo_restante_minutos || 0) * 60, 0)
  );
  const [visible, setVisible] = useState(true);

  // Actualizar segundos cuando cambie la información de horario
  useEffect(() => {
    if (scheduleInfo?.tiempo_restante_minutos) {
      setSegundosRestantes(Math.max(scheduleInfo.tiempo_restante_minutos * 60, 0));
    }
  }, [scheduleInfo?.tiempo_restante_minutos]);

  // Countdown timer
  useEffect(() => {
    if (segundosRestantes <= 0) {
      console.log('⏰ ScheduleAlert: Tiempo agotado, cerrando sesión');
      onForceLogout();
      return;
    }

    const timer = setInterval(() => {
      setSegundosRestantes(prev => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          console.log('⏰ ScheduleAlert: Countdown terminado, cerrando sesión');
          onForceLogout();
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [segundosRestantes, onForceLogout]);

  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const getColorClasses = () => {
    if (segundosRestantes <= 60) return {
      bg: 'bg-red-500',
      text: 'text-red-100',
      border: 'border-red-300',
      pulse: 'animate-pulse'
    };
    if (segundosRestantes <= 300) return { // 5 minutos
      bg: 'bg-orange-500',
      text: 'text-orange-100',
      border: 'border-orange-300',
      pulse: ''
    };
    return {
      bg: 'bg-yellow-500',
      text: 'text-yellow-100',
      border: 'border-yellow-300',
      pulse: ''
    };
  };

  if (!visible) return null;

  const colors = getColorClasses();

  return (
    <div className={`mx-2 mb-3 p-3 rounded-lg border-2 ${colors.bg} ${colors.border} ${colors.pulse}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Clock size={16} className={`mr-2 ${colors.text}`} />
          <span className={`text-sm font-bold ${colors.text}`}>
            Sesión expira en:
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className={`${colors.text} hover:opacity-70 transition-opacity`}
        >
          <X size={14} />
        </button>
      </div>

      <div className="text-center mb-2">
        <div className={`text-2xl font-bold ${colors.text}`}>
          {formatearTiempo(segundosRestantes)}
        </div>
      </div>

      <div className={`text-xs ${colors.text} space-y-1 mb-3`}>
        <div className="flex justify-between">
          <span>Horario termina:</span>
          <span className="font-medium">
            {scheduleInfo?.horario?.fin ||
              scheduleInfo?.horario?.formato_visual?.split(' - ')[1] ||
              scheduleInfo?.detalles?.horario_fin || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Oficina:</span>
          <span className="font-medium truncate ml-2">
            {scheduleInfo?.oficina_codigo ||
              scheduleInfo?.detalles?.oficina_codigo || 'N/A'}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setVisible(false)}
          className="flex-1 px-2 py-1 bg-white bg-opacity-20 text-white rounded text-xs hover:bg-opacity-30 transition-all"
        >
          Ocultar
        </button>
        <button
          onClick={onForceLogout}
          className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-all flex items-center justify-center"
        >
          <LogOut size={12} className="mr-1" />
          Salir
        </button>
      </div>

      <div className={`text-xs ${colors.text} text-center mt-2 opacity-90`}>
        ⚠️ Guarde su trabajo antes del cierre
      </div>
    </div>
  );
});

ScheduleAlert.displayName = 'ScheduleAlert';

const Sidebar = memo(({
  onOpenWindow,
  currentDate,
}) => {
  // ✅ Estados del contexto
  const {
    user,
    permissions,
    scheduleInfo,
    forceLogout,
    shouldShowTimeoutAlert,
    getTimeRemaining
  } = useAuth();

  const {
    getThemeClasses,
    isLoading: themeIsLoading,
    isInitialized: themeIsInitialized
  } = useTheme();

  const { getLogoUrl, isLoading: logoLoading } = useLogo();
  const sidebarLogoUrl = getLogoUrl('sidebar');

  const {
    userInfo,
    loading: userInfoLoading,
    error: userInfoError,
    displayName,
    userInitials,
    institucion,
    oficina,
    hasOffice,
    hasInstitution,
    refresh: refreshUserInfo,
    isReady
  } = useUserInfo({
    autoLoad: true,
    basicOnly: true,
    refreshInterval: 5 * 60 * 1000
  });

  // Estados para el menú dinámico
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [expandedSubmenus, setExpandedSubmenus] = useState(new Set());
  const [showThemeLoading, setShowThemeLoading] = useState(true);

  // ✅ Lógica para mostrar la alerta de horario
  const shouldShowScheduleAlert = React.useMemo(() => {
    // No mostrar si es super admin
    if (scheduleInfo?.es_super_admin) return false;

    // No mostrar si no hay información de horario
    if (!scheduleInfo) return false;

    // Verificar si está en alerta de cierre próximo
    const isCloseToExpiry = scheduleInfo.alerta_cierre_proximo === true;

    // Verificar tiempo restante (mostrar si quedan 10 minutos o menos)
    const timeLeft = scheduleInfo.tiempo_restante_minutos;
    const hasTimeLimit = timeLeft !== null && timeLeft <= 10;

    // Verificar si debe mostrar desde el contexto
    const contextSaysShow = shouldShowTimeoutAlert && shouldShowTimeoutAlert();

    const shouldShow = isCloseToExpiry || hasTimeLimit || contextSaysShow;

    console.log('🕐 Sidebar - Evaluando alerta de horario:', {
      es_super_admin: scheduleInfo.es_super_admin,
      alerta_cierre_proximo: isCloseToExpiry,
      tiempo_restante_minutos: timeLeft,
      hasTimeLimit,
      contextSaysShow,
      shouldShow
    });

    return shouldShow;
  }, [scheduleInfo, shouldShowTimeoutAlert]);

  // Efectos para tema
  useEffect(() => {
    if (themeIsInitialized && !themeIsLoading) {
      const timer = setTimeout(() => setShowThemeLoading(false), 500);
      return () => clearTimeout(timer);
    }
    if (themeIsLoading || !themeIsInitialized) {
      setShowThemeLoading(true);
    }
  }, [themeIsLoading, themeIsInitialized]);

  // Efecto para cargar permisos
  useEffect(() => {
    if (permissions && permissions.length > 0) {
      setMenuData(permissions);
      setLoading(false);
    } else {
      setMenuData([]);
      setLoading(false);
    }
  }, [permissions]);

  // Handlers de menú
  const toggleMenu = (menuId) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
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

  const handleForceLogout = () => {
    if (forceLogout) {
      forceLogout('Tiempo de sesión agotado');
    }
  };

  const handleLogoError = (e) => {
    e.target.style.display = 'none';
  };

  // Estilos
  const sidebarStyle = {
    width: "16rem",
    color: "white",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  };

  const headerStyle = {
    padding: "1rem",
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
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.9)",
  };

  if (showThemeLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="relative bg-white rounded-xl p-8 max-w-md w-full mx-4 border border-gray-200 shadow-lg">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-200">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">COAC PRINCIPAL</h1>
            <p className="text-sm text-gray-500">Cargando sistema...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={sidebarStyle} className={`${getThemeClasses('sidebar')} sidebar-themed theme-transition`}>
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
    <div style={sidebarStyle} className={`${getThemeClasses('sidebar')} sidebar-themed theme-transition`}>
      <div style={headerStyle} className="header-themed theme-transition">
        <div className="flex flex-col items-center mb-2">
          {logoLoading ? (
            <div className="animate-pulse h-14 w-44 bg-white bg-opacity-10 rounded mb-2"></div>
          ) : sidebarLogoUrl ? (
            <img
              src={sidebarLogoUrl}
              alt="Logo Sidebar"
              className="max-h-14 max-w-[180px] mb-2 object-contain"
              onError={handleLogoError}
              draggable={false}
            />
          ) : null}
        </div>

        <div style={logoStyle}>COAC PRINCIPAL</div>
        <div style={dateStyle}>{currentDate}</div>
      </div>

      {/* ✅ ALERTA DE HORARIO - Solo se muestra cuando es necesario */}
      {shouldShowScheduleAlert && (
        <ScheduleAlert
          scheduleInfo={scheduleInfo}
          onForceLogout={handleForceLogout}
        />
      )}

      {/* Información de ubicación del usuario */}
      {isReady && userInfo && (
        <div style={userInfoStyle} className="sidebar-themed theme-transition">
          <div className="space-y-2">
            <div className="flex items-center">
              <Building size={12} className="mr-2 text-blue-300" />
              <span className="text-white font-medium text-xs" title={institucion.nombre}>
                {hasInstitution ? institucion.nombre : 'Sin institución'}
              </span>
            </div>

            <div className="flex items-center">
              <MapPin size={12} className="mr-2 text-green-300" />
              <span className="text-white text-xs" title={oficina.completa}>
                {hasOffice ? oficina.nombre : 'Sin oficina asignada'}
              </span>
            </div>

            {/* Mostrar información de horario si está disponible */}
            {scheduleInfo && !scheduleInfo.es_super_admin && (
              <div className="flex items-center">
                <Clock size={12} className="mr-2 text-yellow-300" />
                <span className="text-white text-xs">
                  {scheduleInfo.horario ?
                    `${scheduleInfo.horario.formato_visual ||
                    (scheduleInfo.horario.inicio + ' - ' + scheduleInfo.horario.fin) ||
                    (scheduleInfo.detalles?.horario_inicio + ' - ' + scheduleInfo.detalles?.horario_fin)}` :
                    'Sin horario hoy'
                  }
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-white border-opacity-20">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${shouldShowScheduleAlert ? 'bg-red-400 animate-pulse' :
                    hasOffice ? 'bg-green-400' : 'bg-yellow-400'
                  }`}></div>
                <span className="text-xs text-white text-opacity-80">
                  {shouldShowScheduleAlert ?
                    `Cierra en ${getTimeRemaining && getTimeRemaining() || scheduleInfo?.tiempo_restante_minutos || 0}min` :
                    (hasOffice ? 'Ubicación definida' : 'Sin ubicación')
                  }
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

      {/* Módulos dinámicos */}
      <div className="flex-1 overflow-y-auto py-2">
        <div style={sectionTitleStyle}>
          Módulos del Sistema
        </div>

        <ul className="mt-2 space-y-1 px-2">
          {menuData.map((menu) => (
            <li key={menu.id}>
              <div
                className={`flex items-center p-2 rounded-md cursor-pointer transition-all duration-150 ${expandedMenus.has(menu.id)
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

              {expandedMenus.has(menu.id) && menu.submenus && (
                <ul className="pl-10 mt-1 space-y-1">
                  {menu.submenus.map((submenu) => (
                    <li key={submenu.id}>
                      <div
                        className={`flex items-center p-1.5 rounded-md cursor-pointer transition-all duration-150 ${expandedSubmenus.has(submenu.id)
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

      {/* Perfil de usuario */}
      <div style={profileContainerStyle} className="sidebar-themed theme-transition">
        <div className="flex items-center p-2">
          <div style={profileAvatarStyle}>
            {userInitials || (user?.fullName
              ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
              : user?.email?.substring(0, 2).toUpperCase() || 'UA')}
          </div>
          <div className="ml-3 flex-1">
            <div className="font-medium text-sm text-white">
              {displayName || user?.fullName || user?.email || 'Usuario Admin'}
            </div>

            <div className="text-xs text-white text-opacity-90 flex items-center">
              <div className={`w-2 h-2 rounded-full mr-1.5 ${shouldShowScheduleAlert ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                }`}></div>
              {shouldShowScheduleAlert ?
                `Sesión expira - ${getTimeRemaining && getTimeRemaining() || scheduleInfo?.tiempo_restante_minutos || 0}min` :
                `Conectado - ${userInfo?.perfil || user?.perfil || 'Sin perfil'}`
              }
            </div>

            {isReady && userInfo && (
              <div className="text-xs text-white text-opacity-75 mt-1 flex items-center">
                <User size={10} className="mr-1" />
                <span className="truncate">
                  {hasOffice ? oficina.tipo || 'Oficina' : 'Sin ubicación'}
                </span>
              </div>
            )}

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