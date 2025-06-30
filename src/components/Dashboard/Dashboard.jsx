// src/components/Dashboard/Dashboard.jsx - Completo y 100% Funcional
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  Layout,
  X,
  Layers,
  Clock,
  AlertTriangle,
} from "lucide-react";

import Sidebar from "./Sidebar";
import WindowPanel from "./WindowPanel";
import useWindows from "../../hooks/useWindows";
import { useAuth } from "../../context/AuthContext";
import {
  getComponent,
  getWindowConfig,
  mapApiDataToProps,
} from "../../config/componentMapping.jsx";
import Icon from "../UI/Icon";
import { useTheme } from "../../context/ThemeContext"; // ← AGREGAR ESTA LÍNEA

const Dashboard = () => {
  const { currentTheme, changeTheme, predefinedThemes, isLoading } = useTheme(); // ← AGREGAR

// Componente temporal para probar temas (OPCIONAL)
const ThemeTestButtons = () => (
  <div className="fixed top-4 right-4 z-50 bg-white p-3 rounded-lg shadow-lg border max-w-xs">
    <h3 className="text-sm font-semibold mb-2">🎨 Test Temas</h3>
    <p className="text-xs mb-2">Actual: {currentTheme}</p>
    <div className="grid grid-cols-2 gap-1">
      {Object.entries(predefinedThemes)
        .filter(([key]) => key !== 'custom')
        .map(([themeName, themeData]) => (
          <button
            key={themeName}
            onClick={() => changeTheme(themeName)}
            disabled={isLoading}
            className={`
              text-xs px-2 py-1 rounded transition-colors
              ${currentTheme === themeName 
                ? 'bg-blue-100 text-blue-800' 
                : 'hover:bg-gray-100 bg-gray-50'
              }
              disabled:opacity-50
            `}
          >
            {themeData.name}
          </button>
        ))}
    </div>
  </div>
);
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  // Estados para paginación y gestión de ventanas
  const [currentPage, setCurrentPage] = useState(0);
  const WINDOWS_PER_PAGE = 4;

  // Estados para el cierre automático de sesión
  const [timeLeft, setTimeLeft] = useState(30); // 30 segundos para la cuenta regresiva
  const [showWarning, setShowWarning] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  
  // Referencias para los timers
  const idleTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  
  // Configuración de inactividad (en milisegundos)
  const IDLE_TIME = 30 * 60 * 1000; // 30 minutos de inactividad
  const WARNING_TIME = 30; // Mostrar advertencia 30 segundos antes
  const COUNTDOWN_TIME = 30; // Tiempo de cuenta regresiva en segundos

  // Hook personalizado para gestión de ventanas
  const {
    windows,
    activeWindowId,
    errorMessage,
    minimizedWindows,
    openWindow,
    closeWindow,
    setActiveWindow,
    updateWindowPosition,
    updateWindowSize,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    cascadeWindows,
    tileWindows,
    closeAllWindows,
    MAX_WINDOWS,
  } = useWindows();

  // Función para resetear el timer de inactividad
  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    setShowWarning(false);
    setTimeLeft(COUNTDOWN_TIME);
    
    // Limpiar timers existentes
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Configurar nuevo timer de inactividad
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      setShowWarning(true);
      setTimeLeft(COUNTDOWN_TIME);
      
      // Iniciar cuenta regresiva
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Cerrar sesión automáticamente
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIME);
  }, [logout]);

  // Eventos que resetean el timer de inactividad
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  // Configurar listeners de actividad
  useEffect(() => {
    if (!isAuthenticated) return;

    // Función throttled para evitar demasiadas llamadas
    let lastActivity = 0;
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) { // Throttle a 1 segundo
        lastActivity = now;
        resetIdleTimer();
      }
    };

    // Agregar listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledReset, true);
    });

    // Inicializar timer
    resetIdleTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledReset, true);
      });
      
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [isAuthenticated, resetIdleTimer]);

  // Función para extender la sesión
  const extendSession = () => {
    resetIdleTimer();
  };

  // Función para cerrar sesión inmediatamente
  const logoutNow = () => {
    logout();
  };

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, authLoading]);

  // Obtener fecha actual formateada
  const getCurrentDate = () => {
    const today = new Date();
    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return today.toLocaleDateString("es-ES", options);
  };

  const currentDate = getCurrentDate();

  // Filtrar ventanas visibles (no minimizadas)
  const visibleWindows = windows.filter(
    (w) => !minimizedWindows.includes(w.id)
  );

  // Calcular número total de páginas
  const totalPages = Math.ceil(visibleWindows.length / WINDOWS_PER_PAGE);

  // Obtener ventanas para la página actual
  const currentPageWindows = visibleWindows.slice(
    currentPage * WINDOWS_PER_PAGE,
    (currentPage + 1) * WINDOWS_PER_PAGE
  );

  // Funciones de paginación
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Verificar si no hay ventanas abiertas
  const isEmpty = windows.length === 0;
  
  // Reiniciar página cuando no hay ventanas
  useEffect(() => {
    if (windows.length === 0 && currentPage > 0) {
      setCurrentPage(0);
    }
  }, [windows.length, currentPage]);

  // Función mejorada para organizar en mosaico - Respeta ventanas maximizadas
  const arrangeTileLayout = useCallback(() => {
    // Solo organizar ventanas que no estén maximizadas
    const pageWindows = visibleWindows
      .slice(currentPage * WINDOWS_PER_PAGE, (currentPage + 1) * WINDOWS_PER_PAGE)
      .filter(w => !w.isMaximized);
    
    if (pageWindows.length === 0) return;

    let cols, rows;
    switch (pageWindows.length) {
      case 1:
        cols = 1;
        rows = 1;
        break;
      case 2:
        cols = 2;
        rows = 1;
        break;
      case 3:
        cols = 3;
        rows = 1;
        break;
      case 4:
      default:
        cols = 2;
        rows = 2;
        break;
    }

    const mainAreaEl = document.querySelector(".main-area");
    if (!mainAreaEl) return;

    const mainAreaWidth = mainAreaEl.clientWidth;
    const mainAreaHeight = mainAreaEl.clientHeight;

    const margin = 16;
    const windowWidth = Math.floor(
      (mainAreaWidth - margin * (cols + 1)) / cols
    );
    const windowHeight = Math.floor(
      (mainAreaHeight - margin * (rows + 1)) / rows
    );

    pageWindows.forEach((window, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = margin + col * (windowWidth + margin);
      const y = margin + row * (windowHeight + margin);

      updateWindowPosition(window.id, x, y);
      updateWindowSize(window.id, windowWidth, windowHeight);
    });
  }, [visibleWindows, currentPage, updateWindowPosition, updateWindowSize]);

  // Función mejorada de cascada - Respeta ventanas maximizadas
  const arrangeCascadeLayout = useCallback(() => {
    // Solo organizar ventanas que no estén maximizadas
    const nonMaximizedWindows = visibleWindows.filter(w => !w.isMaximized);
    
    if (nonMaximizedWindows.length === 0) return;

    // Usar la función cascadeWindows del hook pero solo para ventanas no maximizadas
    cascadeWindows();
  }, [visibleWindows, cascadeWindows]);

  // Manejar apertura de ventanas desde el Sidebar
  const handleOpenWindow = (windowConfig) => {
    console.log('handleOpenWindow called with:', windowConfig);
    const { id, title, component, type, data } = windowConfig;
    console.log('Component name from config:', component);
    
    // Obtener configuración de la ventana
    const config = getWindowConfig(component);

    // Mapear datos de la API a props del componente
    let mappedProps = {};
    if (type === "menu" && data) {
      mappedProps = mapApiDataToProps(data);
    } else if (type === "submenu" && data) {
      mappedProps = mapApiDataToProps(data.parentMenu, data.submenu);
    } else if (type === "option" && data) {
      mappedProps = mapApiDataToProps(
        data.parentMenu,
        data.parentSubmenu,
        data.option
      );
    }

    // Abrir la ventana
    const result = openWindow(
      id,           // windowId 
      null,         // subModuleId (no usado en este contexto)
      title,        // moduleName
      'Monitor',    // icon
      title,        // subModuleName
      component     // component
    );

    // Organizar en mosaico inmediatamente después de abrir
    if (result && result.success) {
      setTimeout(() => {
        arrangeTileLayout();
      }, 100);
    }
  };

  // Restaurar una ventana minimizada y reordenar
  const handleRestoreWindow = (windowId) => {
    restoreWindow(windowId);
    setTimeout(() => {
      // Solo reorganizar si no hay ventanas maximizadas
      const hasMaximizedWindows = windows.some(w => w.isMaximized);
      if (!hasMaximizedWindows) {
        arrangeTileLayout();
      }
    }, 50);
  };

  // Efecto mejorado: Solo organizar automáticamente si no hay ventanas maximizadas
  useEffect(() => {
    if (visibleWindows.length > 0) {
      const hasMaximizedWindows = visibleWindows.some(w => w.isMaximized);
      
      // Solo organizar automáticamente si no hay ventanas maximizadas
      if (!hasMaximizedWindows) {
        const delay = setTimeout(() => {
          arrangeTileLayout();
        }, 100);
        return () => clearTimeout(delay);
      }
    }
  }, [visibleWindows.length, currentPage]);

  // Detectar cambios en el estado de maximización
  useEffect(() => {
    const maximizedCount = visibleWindows.filter(w => w.isMaximized).length;
    console.log("Ventanas maximizadas:", maximizedCount);
    
    // Si no hay ventanas maximizadas, reorganizar las demás
    if (maximizedCount === 0 && visibleWindows.length > 0) {
      const delay = setTimeout(() => {
        arrangeTileLayout();
      }, 200);
      return () => clearTimeout(delay);
    }
  }, [visibleWindows.map(w => w.isMaximized).join(',')]);

  // Estilos para la barra de herramientas
  const toolbarStyles = {
    container: {
      position: "fixed",
      top: "5px",
      right: "250px",
      display: "flex",
      backgroundColor: "white",
      borderRadius: "0.375rem",
      boxShadow:
        "0 2px 5px -1px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.05)",
      zIndex: 30,
      border: "1px solid #e2e8f0",
    },
    button: {
      padding: "0.5rem",
      backgroundColor: "transparent",
      border: "none",
      borderRadius: "0.375rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "background-color 150ms",
      color: "#475569",
    },
    separator: {
      width: "1px",
      margin: "0.5rem 0",
      backgroundColor: "#e2e8f0",
    },
  };

  // Formatear tiempo para mostrar
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mostrar loading si la autenticación está cargando
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
   <div className="flex h-screen overflow-hidden background-themed theme-transition">
      {/* Modal de advertencia de inactividad */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-mx mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 p-3 rounded-full mr-4">
                <Clock size={24} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sesión por Expirar</h3>
                <p className="text-sm text-gray-600">Tu sesión expirará por inactividad</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-gray-600">
                  Tu sesión se cerrará automáticamente si no realizas ninguna acción.
                </p>
              </div>
              
              {/* Barra de progreso */}
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${(timeLeft / COUNTDOWN_TIME) * 100}%`,
                    backgroundColor: timeLeft <= 10 ? '#ef4444' : '#f97316'
                  }}
                ></div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={extendSession}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Extender Sesión
              </button>
              <button
                onClick={logoutNow}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <ThemeTestButtons />
      {/* Sidebar */}
      <Sidebar onOpenWindow={handleOpenWindow} currentDate={currentDate} />

      {/* Área principal */}
      <div className="flex-1 relative overflow-hidden main-area">
        {/* Barra de herramientas */}
        {visibleWindows.length > 0 && (
          <div style={toolbarStyles.container}>
            <button
              style={toolbarStyles.button}
              title="Organizar en mosaico"
              onClick={arrangeTileLayout}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f1f5f9")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <Grid size={18} />
            </button>
            <div style={toolbarStyles.separator}></div>
            <button
              style={toolbarStyles.button}
              title="Organizar en cascada"
              onClick={arrangeCascadeLayout}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f1f5f9")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <Layers size={18} />
            </button>
            <div style={toolbarStyles.separator}></div>
            <button
              style={toolbarStyles.button}
              title="Cerrar todas las ventanas"
              onClick={closeAllWindows}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f1f5f9")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Contenido cuando no hay ventanas */}
        {(isEmpty || visibleWindows.length === 0) && (
          <div className="flex flex-col h-full p-8 bg-gray-50 overflow-auto">
            {/* Panel de control */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-coop-dark mb-2">
                Panel de Control
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Bienvenido al sistema financiero integrado. Use el menú lateral
                para navegar entre los diferentes módulos.
              </p>
            </div>

            {/* Información del usuario */}
            {user && (
              <div className="max-w-4xl mx-auto w-full mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-coop-dark mb-4">
                    Información de la Sesión
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Usuario
                      </label>
                      <p className="text-gray-900">{user.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Perfil
                      </label>
                      <p className="text-gray-900">
                        {user.perfil || "No asignado"}
                      </p>
                    </div>
                    {user.cedula && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Cédula
                        </label>
                        <p className="text-gray-900">{user.cedula}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Estado
                      </label>
                      <p className="text-gray-900">{user.estado || "Activo"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Permisos
                      </label>
                      <p className="text-gray-900">
                        {user.permisos?.length || 0} módulos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Widgets de resumen */}
            <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <Icon name="Users" size={24} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-coop-dark">
                    Clientes Activos
                  </h3>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-coop-primary">254</p>
                  <div className="flex items-center text-green-600 text-sm">
                    <Icon name="TrendingUp" size={16} className="mr-1" />
                    <span>+5%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <Icon
                      name="Activity"
                      size={24}
                      className="text-green-600"
                    />
                  </div>
                  <h3 className="font-semibold text-coop-dark">
                    Transacciones Hoy
                  </h3>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-coop-primary">127</p>
                  <div className="flex items-center text-green-600 text-sm">
                    <Icon name="TrendingUp" size={16} className="mr-1" />
                    <span>+12%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <Icon
                      name="DollarSign"
                      size={24}
                      className="text-purple-600"
                    />
                  </div>
                  <h3 className="font-semibold text-coop-dark">
                    Balance Total
                  </h3>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-coop-primary">$1.2M</p>
                  <div className="flex items-center text-green-600 text-sm">
                    <Icon name="TrendingUp" size={16} className="mr-1" />
                    <span>+8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ventanas flotantes - Con todas las props necesarias */}
        {currentPageWindows.map((window) => (
          <WindowPanel
            key={window.id}
            window={window}
            isActive={activeWindowId === window.id}
            setActiveTab={setActiveWindow}
            closeWindow={closeWindow}
            updateWindowPosition={updateWindowPosition}
            updateWindowSize={updateWindowSize}
            minimizeWindow={minimizeWindow}
            toggleMaximize={toggleMaximize}
          />
        ))}

        {/* Mensaje de error */}
        {errorMessage && (
          <div className="fixed top-4 right-4 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg z-50">
            <div className="flex items-center">
              <Icon
                name="AlertTriangle"
                size={20}
                className="text-red-500 mr-3"
              />
              <div>
                <p className="font-bold text-red-800">Límite alcanzado</p>
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controles de paginación */}
        {totalPages > 1 && (
          <div className="fixed bottom-4 right-4 flex bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <button
              className={`p-3 rounded-l-lg transition-colors ${
                currentPage > 0
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "text-gray-400 cursor-not-allowed"
              }`}
              onClick={prevPage}
              disabled={currentPage === 0}
              title="Página anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center justify-center px-4 text-sm text-gray-700 border-x border-gray-200">
              {currentPage + 1} / {totalPages}
            </div>
            <button
              className={`p-3 rounded-r-lg transition-colors ${
                currentPage < totalPages - 1
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "text-gray-400 cursor-not-allowed"
              }`}
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              title="Página siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Barra de tareas para ventanas minimizadas */}
        {minimizedWindows.length > 0 && (
          <div className="fixed bottom-0 left-64 right-0 bg-gray-200 p-2 border-t border-gray-300 flex flex-wrap gap-2 z-10">
            {windows
              .filter((w) => minimizedWindows.includes(w.id))
              .map((window) => (
                <button
                  key={window.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => handleRestoreWindow(window.id)}
                >
                  <Icon name="Window" size={16} />
                  <span className="truncate max-w-32">
                    {window.module?.name || window.title}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;