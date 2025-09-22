// Archivo: useWindows.js - CORREGIDO
import { useState, useCallback, useEffect } from "react";

const useWindows = () => {
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [minimizedWindows, setMinimizedWindows] = useState([]);
  const [baseZIndex, setBaseZIndex] = useState(10);

  const MAX_WINDOWS = 10;
  const DEFAULT_WINDOW_WIDTH = 800;
  const DEFAULT_WINDOW_HEIGHT = 600;
  const MIN_WINDOW_WIDTH = 400;
  const MIN_WINDOW_HEIGHT = 300;

  const getInitialPosition = useCallback((index) => {
    const offsetX = 50;
    const offsetY = 40;
    const maxOffset = 200;
    const x = (offsetX * (index % 5)) % maxOffset;
    const y = (offsetY * (index % 5)) % maxOffset;
    return { x, y };
  }, []);



  const openWindow = useCallback(
    (
      moduleId,
      subModuleId = null,
      moduleName = "",
      icon = "",
      subModuleName = "",
      component = null
    ) => {
      const windowId = subModuleId ? `${moduleId}-${subModuleId}` : moduleId;
      
      console.log(`🪟 openWindow: ${windowId} (${windows.length} ventanas actualmente)`);
      
      const existingWindow = windows.find((w) => w.id === windowId);
      const isMinimized = minimizedWindows.includes(windowId);

      if (existingWindow) {
        console.log(`♻️ openWindow: ${windowId} ya existe - maximizando`);
        if (isMinimized) {
          setMinimizedWindows((prev) => prev.filter((id) => id !== windowId));
        }
        // 🔧 NUEVO: Maximizar la ventana existente al hacer clic en su menú
        setWindows((prev) =>
          prev.map((w) =>
            w.id === windowId 
              ? { ...w, zIndex: baseZIndex + 1, isMaximized: true }
              : w
          )
        );
        setActiveWindowId(windowId);
        setBaseZIndex((prev) => prev + 1);
        return { success: true, isExisting: true };
      }

      if (windows.length >= MAX_WINDOWS) {
        setErrorMessage("Has alcanzado el límite máximo de ventanas abiertas.");
        setTimeout(() => setErrorMessage(null), 5000);
        return { success: false };
      }

      const position = getInitialPosition(windows.length);
      // 🔧 NUEVO: Solo la primera ventana se abre maximizada
      const isFirstWindow = windows.length === 0;
      const isSecondWindow = windows.length === 1;

      console.log(`✨ openWindow: Nueva ventana ${windowId} ${isFirstWindow ? '(MAXIMIZADA)' : ''}`);

      const newWindow = {
        id: windowId,
        moduleId,
        subModuleId,
        component,
        module: { name: moduleName, icon },
        subModuleName,
        position,
        size: { width: DEFAULT_WINDOW_WIDTH, height: DEFAULT_WINDOW_HEIGHT },
        isMinimized: false,
        isMaximized: isFirstWindow, // Solo la primera se maximiza
        zIndex: baseZIndex + 1,
        createdAt: new Date().getTime(),
        // 🔧 AGREGAMOS ESTADO PARA GUARDAR POSICIÓN/TAMAÑO ANTES DE MAXIMIZAR
        originalPosition: position,
        originalSize: { width: DEFAULT_WINDOW_WIDTH, height: DEFAULT_WINDOW_HEIGHT },
      };

      setBaseZIndex((prev) => prev + 1);
      
      // 🔧 NUEVO: Si es la segunda ventana o más, desmaximizar todas las ventanas
      setWindows((prev) => {
        let updatedWindows = [...prev, newWindow];
        
        if (updatedWindows.length >= 2) {
          console.log(`🔄 openWindow: ${updatedWindows.length} ventanas - desmaximizando todas para mosaico`);
          // Desmaximizar TODAS las ventanas para que entren en el mosaico
          updatedWindows = updatedWindows.map(w => ({
            ...w,
            isMaximized: false
          }));
        }
        
        return updatedWindows;
      });
      
      setActiveWindowId(windowId);
      return { 
        success: true, 
        isExisting: false, 
        isFirstWindow, 
        needsTiling: !isFirstWindow, // Siempre reorganizar si no es la primera
        windowCount: windows.length + 1
      };
    },
    [windows, minimizedWindows, baseZIndex, getInitialPosition]
  );

  const closeWindow = useCallback(
    (windowId) => {
      setMinimizedWindows((prev) => prev.filter((id) => id !== windowId));
      setWindows((prev) => {
        const updated = prev.filter((w) => w.id !== windowId);
        if (activeWindowId === windowId) {
          const topWindow = updated.sort((a, b) => b.zIndex - a.zIndex)[0];
          setActiveWindowId(topWindow?.id || null);
        }
        return updated;
      });
    },
    [activeWindowId]
  );

  const setActiveWindow = useCallback(
    (windowId) => {
      if (minimizedWindows.includes(windowId)) {
        setMinimizedWindows((prev) => prev.filter((id) => id !== windowId));
      }
      setWindows((prev) =>
        prev.map((w) =>
          w.id === windowId
            ? { ...w, isMinimized: false, zIndex: baseZIndex + 1 }
            : w
        )
      );
      setBaseZIndex((prev) => prev + 1);
      setActiveWindowId(windowId);
    },
    [minimizedWindows, baseZIndex]
  );

  const updateWindowPosition = useCallback((windowId, x, y) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === windowId) {
          const updatedWindow = { 
            ...w, 
            position: { x, y }, 
            isMaximized: false 
          };
          // 🔧 ACTUALIZAR POSICIÓN ORIGINAL SI NO ESTÁ MAXIMIZADA
          if (!w.isMaximized) {
            updatedWindow.originalPosition = { x, y };
          }
          return updatedWindow;
        }
        return w;
      })
    );
  }, []);

  const updateWindowSize = useCallback((windowId, width, height) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === windowId) {
          const newSize = {
            width: Math.max(width, MIN_WINDOW_WIDTH),
            height: Math.max(height, MIN_WINDOW_HEIGHT),
          };
          const updatedWindow = {
            ...w,
            size: newSize,
            isMaximized: false,
          };
          // 🔧 ACTUALIZAR TAMAÑO ORIGINAL SI NO ESTÁ MAXIMIZADA
          if (!w.isMaximized) {
            updatedWindow.originalSize = newSize;
          }
          return updatedWindow;
        }
        return w;
      })
    );
  }, []);

  const minimizeWindow = useCallback(
    (windowId) => {
      if (!minimizedWindows.includes(windowId)) {
        setMinimizedWindows((prev) => [...prev, windowId]);
      }
      if (activeWindowId === windowId) {
        const visible = windows.filter(
          (w) => !minimizedWindows.includes(w.id) && w.id !== windowId
        );
        const top = visible.sort((a, b) => b.zIndex - a.zIndex)[0];
        setActiveWindowId(top?.id || null);
      }
    },
    [minimizedWindows, activeWindowId, windows]
  );

  const restoreWindow = useCallback(
    (windowId) => {
      setMinimizedWindows((prev) => prev.filter((id) => id !== windowId));
      setActiveWindow(windowId);
    },
    [setActiveWindow]
  );

  // 🔧 FUNCIÓN DE MAXIMIZAR SIMPLIFICADA
  const toggleMaximize = useCallback((windowId) => {
    console.log("toggleMaximize llamado para ventana:", windowId);
    
    setWindows((prev) =>
      prev.map((window) => {
        if (window.id === windowId) {
          console.log("Estado actual de maximización:", window.isMaximized);
          
          if (window.isMaximized) {
            // 🔧 RESTAURAR: Volver al tamaño y posición original
            const restoredWindow = {
              ...window,
              isMaximized: false,
              position: window.originalPosition || window.position,
              size: window.originalSize || window.size,
              zIndex: window.zIndex + 1, // Mantener en el frente
            };
            console.log("Restaurando ventana:", restoredWindow);
            return restoredWindow;
          } else {
            // 🔧 MAXIMIZAR: Guardar estado actual y maximizar
            const maximizedWindow = {
              ...window,
              isMaximized: true,
              originalPosition: window.position, // Guardar posición actual
              originalSize: window.size, // Guardar tamaño actual
              zIndex: window.zIndex + 1, // Mantener en el frente
            };
            console.log("Maximizando ventana:", maximizedWindow);
            return maximizedWindow;
          }
        }
        return window;
      })
    );
    
    // Asegurar que la ventana esté activa
    setActiveWindowId(windowId);
  }, []);

  const cascadeWindows = useCallback(() => {
    const visible = windows.filter((w) => !minimizedWindows.includes(w.id));
    if (visible.length === 0) return;

    const sorted = [...visible].sort((a, b) => a.createdAt - b.createdAt);
    const updated = windows.map((w) => {
      const index = sorted.findIndex((v) => v.id === w.id);
      if (index !== -1) {
        const newPosition = { x: index * 40, y: index * 30 };
        return {
          ...w,
          position: newPosition,
          originalPosition: newPosition, // 🔧 ACTUALIZAR TAMBIÉN LA POSICIÓN ORIGINAL
          isMaximized: false,
          zIndex: baseZIndex + index + 1,
        };
      }
      return w;
    });

    setWindows(updated);
    setBaseZIndex((prev) => prev + visible.length);
    setActiveWindowId(sorted[sorted.length - 1]?.id || null);
  }, [windows, minimizedWindows, baseZIndex]);

  const tileWindows = useCallback(() => {
    const visible = windows.filter((w) => !minimizedWindows.includes(w.id));
    if (visible.length === 0) return;

    const cols = Math.ceil(Math.sqrt(visible.length));
    const rows = Math.ceil(visible.length / cols);
    const wWidth = Math.floor(window.innerWidth / cols);
    const wHeight = Math.floor(window.innerHeight / rows);

    const updated = windows.map((w) => {
      const index = visible.findIndex((v) => v.id === w.id);
      if (index === -1) return w;
      const row = Math.floor(index / cols);
      const col = index % cols;
      const newPosition = { x: col * wWidth, y: row * wHeight };
      const newSize = { width: wWidth, height: wHeight };
      return {
        ...w,
        position: newPosition,
        size: newSize,
        originalPosition: newPosition, // 🔧 ACTUALIZAR POSICIÓN ORIGINAL
        originalSize: newSize, // 🔧 ACTUALIZAR TAMAÑO ORIGINAL
        isMaximized: false,
        zIndex: baseZIndex + index + 1,
      };
    });

    setWindows(updated);
    setBaseZIndex((prev) => prev + visible.length);
  }, [windows, minimizedWindows, baseZIndex]);

  const closeAllWindows = useCallback(() => {
    setWindows([]);
    setMinimizedWindows([]);
    setActiveWindowId(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.altKey) && e.key === "F4" && activeWindowId) {
        e.preventDefault();
        closeWindow(activeWindowId);
      }
      if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault();
        const visible = windows.filter((w) => !minimizedWindows.includes(w.id));
        if (visible.length > 1) {
          const currentIndex = visible.findIndex(
            (w) => w.id === activeWindowId
          );
          const nextIndex = (currentIndex + 1) % visible.length;
          setActiveWindow(visible[nextIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [windows, activeWindowId, minimizedWindows, closeWindow, setActiveWindow]);

  return {
    windows,
    activeWindowId,
    errorMessage,
    minimizedWindows,
    openWindow,
    closeWindow,setActiveWindow,
    updateWindowPosition,
    updateWindowSize,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    cascadeWindows,
    tileWindows,
    closeAllWindows,
    MAX_WINDOWS,
  };
};

export default useWindows;