// Archivo: WindowPanel.jsx - COMPLETO Y CORREGIDO
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Minimize2,
  Maximize2,
  ChevronDown,
  RefreshCw,
  Move,
} from "lucide-react";
import Icon from "../UI/Icon";
import AccountsWindow from "../Windows/AccountsWindow";
import ReportsWindow from "../Windows/ReportsWindow";
import SettingsWindow from "../Windows/SettingsWindow";
import TransactionsWindow from "../Windows/TransactionsWindow";
import ParameWindows from "../Windows/ParameWindows";
import AsgiPerWindows from "../Windows/AsgiPerWindows";
import UsuParamWindow from "../Windows/UsuParamWindow";
import ConfigWindow from "../Windows/ConfigWindow";
import TiOficinWindow from "../Windows/TiOficinWindow";
import OficinasWindow from "../Windows/OficinasWindow";
import { useTheme } from '../../context/ThemeContext';
import ThemeConfigWindow from "../Windows/ThemeConfigWindow"; // ← AGREGAR ESTA LÍNEA

const WindowPanel = ({
  window,
  isActive,
  setActiveTab,
  closeWindow,
  updateWindowPosition,
  updateWindowSize,
  minimizeWindow,
  toggleMaximize,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({
    x: window.position.x,
    y: window.position.y,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState("");
  const [originalSize, setOriginalSize] = useState({
    width: window.size.width,
    height: window.size.height,
  });
  const { getThemeClasses } = useTheme(); // ← AGREGAR ESTA LÍNEA

  const windowRef = useRef(null);

  // 🔧 MEJORAR LA SINCRONIZACIÓN CON EL ESTADO EXTERNO
  useEffect(() => {
    console.log("WindowPanel useEffect - window.isMaximized:", window.isMaximized);
    
    // Sincronizar posición solo si no está maximizada y la posición ha cambiado
    if (!window.isMaximized && window.position &&
        (window.position.x !== position.x || window.position.y !== position.y)) {
      console.log("Actualizando posición:", window.position);
      setPosition({
        x: window.position.x,
        y: window.position.y,
      });
    }

    // Sincronizar tamaño solo si no está maximizada
    if (!window.isMaximized && window.size &&
        (window.size.width !== originalSize.width ||
         window.size.height !== originalSize.height)) {
      console.log("Actualizando tamaño:", window.size);
      setOriginalSize({
        width: window.size.width,
        height: window.size.height,
      });
    }
  }, [window.isMaximized, window.position, window.size, position, originalSize]);

  // Función para refrescar el contenido
  const refreshContent = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  // Manejador de inicio de movimiento - 🔧 PREVENIR SI ESTÁ MAXIMIZADA
  const handleMouseDown = (e) => {
    if (window.isMaximized) {
      console.log("Ventana maximizada - movimiento deshabilitado");
      return;
    }

    setActiveTab(window.id);

    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  // Movimiento del mouse con `useCallback`
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging && !isResizing) return;
      if (window.isMaximized && isDragging) return; // 🔧 PREVENIR ARRASTRE SI ESTÁ MAXIMIZADA

      const innerWidth = window.innerWidth;
      const innerHeight = window.innerHeight;

      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        const maxWidth = innerWidth - (windowRef.current?.offsetWidth || 800);
        const maxHeight = innerHeight - (windowRef.current?.offsetHeight || 600);

        const limitedX = Math.max(0, Math.min(newX, maxWidth));
        const limitedY = Math.max(0, Math.min(newY, maxHeight));

        setPosition({ x: limitedX, y: limitedY });
      }

      if (isResizing && windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();

        let newWidth = originalSize.width;
        let newHeight = originalSize.height;

        if (resizeDirection.includes("e")) {
          newWidth = Math.max(400, e.clientX - rect.left);
        }
        if (resizeDirection.includes("s")) {
          newHeight = Math.max(300, e.clientY - rect.top);
        }
        if (resizeDirection.includes("w")) {
          const diff = rect.left - e.clientX;
          newWidth = Math.max(400, originalSize.width + diff);
          if (newWidth !== originalSize.width) {
            setPosition((prev) => ({
              x: prev.x - (newWidth - originalSize.width),
              y: prev.y,
            }));
          }
        }
        if (resizeDirection.includes("n")) {
          const diff = rect.top - e.clientY;
          newHeight = Math.max(300, originalSize.height + diff);
          if (newHeight !== originalSize.height) {
            setPosition((prev) => ({
              x: prev.x,
              y: prev.y - (newHeight - originalSize.height),
            }));
          }
        }

        setOriginalSize({
          width: newWidth,
          height: newHeight,
        });
      }
    },
    [
      isDragging,
      isResizing,
      dragOffset,
      resizeDirection,
      originalSize,
      position,
      window.isMaximized, // 🔧 AGREGAR DEPENDENCIA
    ]
  );

  // Finaliza movimiento o redimensionamiento
  const handleMouseUp = useCallback(() => {
    if (isDragging && !window.isMaximized) { // 🔧 SOLO ACTUALIZAR SI NO ESTÁ MAXIMIZADA
      updateWindowPosition(window.id, position.x, position.y);
    }

    if (isResizing) {
      updateWindowSize(window.id, originalSize.width, originalSize.height);
    }

    setIsDragging(false);
    setIsResizing(false);
    setIsMoveMode(false);
  }, [isDragging, isResizing, position.x, position.y, originalSize, updateWindowPosition, updateWindowSize, window.id, window.isMaximized]);

  // Listener de eventos globales
  useEffect(() => {
    if (isDragging || isResizing || isMoveMode) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isMoveMode, isResizing, handleMouseMove, handleMouseUp]);

  // Activar modo de movimiento (botón específico) - 🔧 PREVENIR SI ESTÁ MAXIMIZADA
  const activateMoveMode = (e) => {
    e.stopPropagation();
    if (window.isMaximized) {
      console.log("No se puede mover ventana maximizada");
      return;
    }
    setIsMoveMode(true);
    handleMouseDown(e);
  };

  // Iniciar redimensionamiento - 🔧 PREVENIR SI ESTÁ MAXIMIZADA
  const startResize = (e, direction) => {
    e.stopPropagation();
    if (window.isMaximized) {
      console.log("No se puede redimensionar ventana maximizada");
      return;
    }

    setResizeDirection(direction);
    setIsResizing(true);
    setOriginalSize({
      width: windowRef.current.offsetWidth,
      height: windowRef.current.offsetHeight,
    });
  };

  // 🔧 MANEJAR MAXIMIZACIÓN MEJORADO
  const handleMaximize = (e) => {
    e.stopPropagation();
    console.log("handleMaximize llamado - estado actual:", window.isMaximized);
    toggleMaximize(window.id);
  };

  // Manejar minimización
  const handleMinimize = (e) => {
    e.stopPropagation();
    if (minimizeWindow) {
      minimizeWindow(window.id);
    }
  };

  // Manejar cierre de ventana
  const handleClose = (e) => {
    e.stopPropagation();
    closeWindow(window.id);
  };

  // Función para obtener el contenido de la ventana según el módulo
  const getWindowContent = () => {
    const componentName = window.component;

    // ✅ Usar los componentes importados directamente
    switch (componentName) {
      case "ParameWindows":
        return <ParameWindows data={window.data} />;

      case "AsgiPerWindows":
        return <AsgiPerWindows data={window.data} />;

      case "AccountsWindow":
        return <AccountsWindow data={window.data} />;

      case "ReportsWindow":
        return <ReportsWindow data={window.data} />;

      case "SettingsWindow":
        return <SettingsWindow data={window.data} />;

      case "TransactionsWindow":
        return <TransactionsWindow data={window.data} />;
      
      case "UsuParamWindow":
        return <UsuParamWindow data={window.data} />;

      case "ConfigWindow":
        return <ConfigWindow data={window.data} />;
      case "OficinasWindow":
        return <OficinasWindow data={window.data} />;
      case "TiOficinWindow":
        return <TiOficinWindow data={window.data}/>;
      case "ThemeConfigWindow":
        return <ThemeConfigWindow data={window.data} />;
      default:
        // Contenido por defecto
        return (
          <div
            className="p-6"
            style={{
              padding: "1.5rem",
              backgroundColor: "#f0f9ff",
              height: "100%",
            }}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {window.module.name}
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800 text-sm">
                Componente: <strong>{componentName || "No definido"}</strong>
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Este componente está en desarrollo.
              </p>
            </div>

            <details className="bg-gray-50 p-4 rounded-md border mt-4">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Ver datos de la ventana
              </summary>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-60">
                {JSON.stringify(window, null, 2)}
              </pre>
            </details>
          </div>
        );
    }
  };

  // 🔧 ESTILOS DINÁMICOS MEJORADOS PARA MAXIMIZACIÓN
  const windowStyles = {
    position: "absolute",
    left: window.isMaximized ? "0" : `${position.x}px`,
    top: window.isMaximized ? "0" : `${position.y}px`,
    width: window.isMaximized ? "100%" : `${originalSize.width}px`,
    height: window.isMaximized ? "100%" : `${originalSize.height}px`,
    zIndex: window.zIndex || (isActive ? 10 : 5),
    transition: isDragging || isResizing ? "none" : "all 0.3s ease-in-out",
    cursor: isMoveMode && !window.isMaximized ? "move" : "default",
    backgroundColor: "white",
    borderRadius: window.isMaximized ? "0" : "0.5rem", // 🔧 SIN BORDES REDONDEADOS AL MAXIMIZAR
    boxShadow: isActive
      ? "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
      : "0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    border: isActive ? "1px solid #0ea5e9" : "1px solid rgba(0, 0, 0, 0.05)",
  };

  const headerStyle = {
  // background eliminado - se usa clase CSS dinámica
  color: "white", 
  padding: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: isMoveMode && !window.isMaximized ? "move" : window.isMaximized ? "default" : "pointer", // 🔧 CURSOR MEJORADO
    userSelect: "none",
    minHeight: "36px", // Altura fija para el header
  };

  const iconContainerStyle = {
    marginRight: "0.5rem",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: "0.25rem",
    borderRadius: "0.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const titleStyle = {
    fontWeight: "500",
    fontSize: "0.875rem",
    color: "white",
  };

  const subtitleStyle = {
    marginLeft: "0.5rem",
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.9)",
  };

  const buttonStyle = {
    backgroundColor: "transparent",
    border: "none",
    color: "white",
    padding: "0.25rem",
    borderRadius: "0.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background-color 150ms",
    minWidth: "28px",
    minHeight: "28px",
  };

  const contentStyle = {
    overflow: "auto",
    backgroundColor: "#f0f9ff", // coop-light
    height: "calc(100% - 36px)", // Restar altura fija del header
  };

  const loadingStyle = {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    backgroundColor: "#f0f9ff",
  };

  // 🔧 MANEJADORES DE REDIMENSIONAMIENTO - SOLO SI NO ESTÁ MAXIMIZADA
  const resizeHandles = !window.isMaximized ? (
    <>
      {/* Esquinas */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "10px",
          height: "10px",
          cursor: "nw-resize",
          zIndex: 20,
        }}
        onMouseDown={(e) => startResize(e, "nw")}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "10px",
          height: "10px",
          cursor: "ne-resize",
          zIndex: 20,
        }}
        onMouseDown={(e) => startResize(e, "ne")}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "10px",
          height: "10px",
          cursor: "sw-resize",
          zIndex: 20,
        }}
        onMouseDown={(e) => startResize(e, "sw")}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "10px",
          height: "10px",
          cursor: "se-resize",
          zIndex: 20,
        }}
        onMouseDown={(e) => startResize(e, "se")}
      />
      
      {/* Bordes */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10px",
          right: "10px",
          height: "5px",
          cursor: "n-resize",
          zIndex: 20,
        }}
        onMouseDown={(e) => startResize(e, "n")}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "10px",
          right: "10px",
          height: "5px",
          cursor: "s-resize",
          zIndex: 20,
        }}
        onMouseDown={(e) => startResize(e, "s")}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "10px",
          bottom: "10px",
          width: "5px",
          cursor: "w-resize",
          zIndex: 20,
        }}
        onMouseDown={(e) => startResize(e, "w")}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "10px",
          bottom: "10px",
          width: "5px",
          cursor: "e-resize",
          zIndex: 20,
        }}
        onMouseDown={(e) => startResize(e, "e")}
      />
    </>
  ) : null;

  return (
    <div
      ref={windowRef}
      style={windowStyles}
      onClick={() => setActiveTab(window.id)}
      className="window-panel"
    >
      {/* Manejadores de redimensionamiento - solo si no está maximizada */}
      {resizeHandles}

      {/* Window header */}
      <div
  style={headerStyle}
  className={`${getThemeClasses('windowHeader')} window-header-themed theme-transition`}
  onDoubleClick={handleMaximize}
  onMouseDown={isMoveMode ? undefined : window.isMaximized ? undefined : handleMouseDown}
>
        <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
          <span style={iconContainerStyle}>
            <Icon
              name={window.module.icon}
              size={18}
              style={{ color: "white" }}
            />
          </span>
          <span style={titleStyle}>{window.module.name}</span>
          {window.subModuleName && (
            <span style={subtitleStyle}>&gt; {window.subModuleName}</span>
          )}
          {/* 🔧 INDICADOR VISUAL DE MAXIMIZACIÓN */}
          {window.isMaximized && (
            <span style={{
              marginLeft: "0.5rem",
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.8)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              padding: "0.125rem 0.375rem",
              borderRadius: "0.25rem",
            }}>
              MAXIMIZADA
            </span>
          )}
        </div>

        {/* Botones de control */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {/* Botón de mover */}
          <button
            style={buttonStyle}
            title="Modo mover"
            onClick={activateMoveMode}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            disabled={window.isMaximized}
          >
            <Move size={14} />
          </button>

          {/* Botón de refrescar */}
          <button
            style={buttonStyle}
            title="Refrescar contenido"
            onClick={refreshContent}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>

          {/* Botón de minimizar */}
          <button
            style={buttonStyle}
            title="Minimizar"
            onClick={handleMinimize}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Minimize2 size={14} />
          </button>

          {/* Botón de maximizar/restaurar */}
          <button
            style={buttonStyle}
            title={window.isMaximized ? "Restaurar" : "Maximizar"}
            onClick={handleMaximize}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Maximize2 size={14} />
          </button>

          {/* Botón de cerrar */}
          <button
            style={{
              ...buttonStyle,
              marginLeft: "0.25rem",
            }}
            title="Cerrar"
            onClick={handleClose}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.8)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Window content */}
      <div style={contentStyle}>
        {isLoading ? (
          <div style={loadingStyle}>
            <RefreshCw size={32} className="animate-spin text-blue-500 mb-2" />
            <p className="text-gray-600 text-sm">Cargando contenido...</p>
          </div>
        ) : (
          getWindowContent()
        )}
      </div>
    </div>
  );
};

export default WindowPanel;