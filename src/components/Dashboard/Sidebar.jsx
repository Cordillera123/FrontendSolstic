// src/components/Dashboard/Sidebar.jsx - CON ALERTA DE HORARIO INTEGRADA
import React, { useState, useEffect, memo } from "react";
import { ChevronDown, ChevronRight, HelpCircle, Info, Building, MapPin, User, Loader2, Palette, Clock, AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import { useUserInfo } from '../../hooks/useUserInfo';
import { useLogo } from '../../context/LogoContext';
import { useTheme } from '../../context/ThemeContext';
import LogoutButton from '../Auth/LogoutButton';
import Icon from "../UI/Icon";

// ✅ NUEVO: Componente de alerta de horario integrado
const ScheduleAlert = memo(({ scheduleInfo, onForceLogout }) => {
  const [segundosRestantes, setSegundosRestantes] = useState(
    (scheduleInfo?.tiempo_restante_minutos || 1) * 60
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (segundosRestantes <= 0) {
      onForceLogout();
      return;
    }

    const timer = setInterval(() => {
      setSegundosRestantes(prev => {
        if (prev <= 1) {
          onForceLogout();
          return 0;
        }
        return prev - 1;
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
    if (segundosRestantes <= 30) return {
      bg: 'bg-red-500',
      text: 'text-red-100',
      border: 'border-red-300',
      pulse: 'animate-pulse'
    };
    if (segundosRestantes <= 60) return {
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
          <Icon name="X" size={14} />
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
          <span className="font-medium">{scheduleInfo?.horario?.fin || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>Oficina:</span>
          <span className="font-medium truncate ml-2">
            {scheduleInfo?.oficina_nombre || 'N/A'}
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

// ✅ Componente de carga de temas (sin cambios)
const ThemeLoadingOverlay = memo(() => {
  const [loadingText, setLoadingText] = useState('Cargando configuración...');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const textInterval = setInterval(() => {
      setLoadingText(prev => {
        const texts = [
          'Cargando configuración...',
          'Verificando permisos...',
          'Inicializando sistema...',
          'Preparando interfaz...'
        ];
        const currentIndex = texts.indexOf(prev);
        return texts[(currentIndex + 1) % texts.length];
      });
    }, 1200);

    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 600);

    return () => {
      clearInterval(textInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cooperativa-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="#64748b"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cooperativa-pattern)"/>
        </svg>
      </div>

      <div className="relative bg-white rounded-xl p-8 max-w-md w-full mx-4 border border-gray-200 shadow-lg">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-4 border-gray-200">
              <svg 
                className="w-10 h-10 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="absolute inset-0 w-20 h-20 border-3 border-gray-300 rounded-full animate-spin border-t-blue-600"></div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            COAC PRINCIPAL
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Sistema de Gestión Cooperativa
          </p>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-700 text-base font-medium mb-2">
            {loadingText}{dots}
          </p>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-600 to-blue-700 h-1.5 rounded-full transition-all duration-1000 ease-in-out" 
              style={{ 
                width: '75%',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            ></div>
          </div>
          
          <p className="text-gray-500 text-xs">
            Inicializando componentes del sistema
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span>Conexión segura</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <span>Datos protegidos</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .7;
          }
        }
        
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
});

ThemeLoadingOverlay.displayName = 'ThemeLoadingOverlay';

const Sidebar = memo(({
  onOpenWindow,
  currentDate,
}) => {
  // ✅ ACTUALIZADO: Incluir scheduleInfo y forceLogout del contexto
  const { user, permissions, scheduleInfo, forceLogout } = useAuth();
  
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
    fullLocation,
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

  // ✅ NUEVO: Estado para controlar la visibilidad de la alerta
  const [scheduleAlertVisible, setScheduleAlertVisible] = useState(true);

  // ✅ NUEVO: Detectar cuando mostrar la alerta de horario
  const shouldShowScheduleAlert = 
    scheduleInfo?.alerta_cierre_proximo && 
    scheduleInfo?.tiempo_restante_minutos <= 10 && // Mostrar cuando quedan 10 minutos o menos
    scheduleAlertVisible &&
    !scheduleInfo?.es_super_admin;

  // ✅ Log para debug de información de horario
  useEffect(() => {
    if (scheduleInfo) {
      console.log('🕐 Sidebar - Información de horario:', {
        alerta_cierre_proximo: scheduleInfo.alerta_cierre_proximo,
        tiempo_restante_minutos: scheduleInfo.tiempo_restante_minutos,
        es_super_admin: scheduleInfo.es_super_admin,
        shouldShowAlert: shouldShowScheduleAlert
      });
    }
  }, [scheduleInfo, shouldShowScheduleAlert]);

  // Efectos existentes (sin cambios)
  useEffect(() => {
    console.log('🎨 Sidebar - Estado del tema:', {
      themeIsLoading,
      themeIsInitialized,
      showThemeLoading
    });

    if (themeIsInitialized && !themeIsLoading) {
      const timer = setTimeout(() => {
        setShowThemeLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    if (themeIsLoading || !themeIsInitialized) {
      setShowThemeLoading(true);
    }
  }, [themeIsLoading, themeIsInitialized]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('theme-reloading', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    const wasReloading = sessionStorage.getItem('theme-reloading');
    if (wasReloading) {
      console.log('🔄 Sidebar - Detectada recarga de página, mostrando carga de tema');
      setShowThemeLoading(true);
      sessionStorage.removeItem('theme-reloading');
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    console.log('🖼️ Sidebar - Estado del logo:', {
      logoLoading,
      sidebarLogoUrl,
      hasUrl: !!sidebarLogoUrl
    });
  }, [logoLoading, sidebarLogoUrl]);

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

  // Handlers de menú (sin cambios)
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

  const handleLogoError = (e) => {
    console.log('❌ Sidebar - Error al cargar logo:', e.target.src);
    e.target.style.display = 'none';
  };

  // ✅ NUEVO: Handler para el logout forzado
  const handleForceLogout = () => {
    if (forceLogout) {
      forceLogout('Tiempo de sesión agotado');
    }
  };

  // Estilos (sin cambios)
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
    return <ThemeLoadingOverlay />;
  }

  if (loading) {
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

      {/* ✅ NUEVA SECCIÓN: Alerta de horario integrada */}
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
            
            {/* ✅ NUEVO: Mostrar información de horario si está disponible */}
            {scheduleInfo && !scheduleInfo.es_super_admin && (
              <div className="flex items-center">
                <Clock size={12} className="mr-2 text-yellow-300" />
                <span className="text-white text-xs">
                  {scheduleInfo.horario ? 
                    `${scheduleInfo.horario.formato_visual}` : 
                    'Sin horario hoy'
                  }
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-1 border-t border-white border-opacity-20">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  hasOffice ? 
                    (scheduleInfo?.alerta_cierre_proximo ? 'bg-red-400 animate-pulse' : 'bg-green-400') : 
                    'bg-yellow-400'
                }`}></div>
                <span className="text-xs text-white text-opacity-80">
                  {scheduleInfo?.alerta_cierre_proximo ? 
                    `Cierra en ${scheduleInfo.tiempo_restante_minutos || 0}min` :
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

      {/* Indicador de carga de información de usuario */}
      {userInfoLoading && !isReady && (
        <div style={userInfoStyle} className="sidebar-themed theme-transition">
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
             <div className={`w-2 h-2 rounded-full mr-1.5 ${
               scheduleInfo?.alerta_cierre_proximo ? 'bg-red-500 animate-pulse' : 'bg-green-500'
             }`}></div>
             {scheduleInfo?.alerta_cierre_proximo ? 
               `Sesión expira - ${scheduleInfo.tiempo_restante_minutos || 0}min` :
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