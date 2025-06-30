// src/components/UI/DynamicActionButtons.jsx - VERSIÓN CORREGIDA
import React, { memo, useCallback, useState } from 'react';
import Icon from './Icon';
import { useButtonPermissions } from '../../hooks/useButtonPermissions';

/**
 * ✅ Componente corregido que respeta permisos efectivos (Perfil + Usuario)
 */
const DynamicActionButtons = memo(({
  opcId,
  menuId = null, // ✅ NUEVO: Para ventanas directas de menús
  onAction = {},
  showLabels = true,
  size = 16,
  layout = 'horizontal',
  variant = 'solid',
  disabled = false,
  customButtons = {},
  className = '',
  confirmations = {},
  userId = null, // ✅ NUEVO: Para verificar permisos de usuario específico
  type = 'option' // ✅ NUEVO: 'option' | 'menu'
}) => {
  const [processingButton, setProcessingButton] = useState(null);
  
  // ✅ CORRECCIÓN: Usar el hook con la lógica corregida
  const targetId = type === 'menu' ? menuId : opcId;
  
  const {
    buttonPermissions,
    loading,
    error,
    hasButtonPermission,
    getButtonInfo,
    isReady,
    debugInfo
  } = useButtonPermissions(targetId, opcId, true, type, userId);

  // ===== CONFIGURACIÓN DE BOTONES POR DEFECTO =====
  const defaultButtonConfig = {
    CREATE: {
      label: 'Crear',
      icon: 'Plus',
      colorClass: 'bg-green-600 hover:bg-green-700 border-green-600',
      outlineColorClass: 'border-green-600 text-green-600 hover:bg-green-50',
      ghostColorClass: 'text-green-600 hover:bg-green-50',
      callback: onAction.onCreate || onAction.onAdd || onAction.onNew
    },
    READ: {
      label: 'Consultar',
      icon: 'Eye',
      colorClass: 'bg-blue-600 hover:bg-blue-700 border-blue-600',
      outlineColorClass: 'border-blue-600 text-blue-600 hover:bg-blue-50',
      ghostColorClass: 'text-blue-600 hover:bg-blue-50',
      callback: onAction.onRead || onAction.onView || onAction.onConsult
    },
    UPDATE: {
      label: 'Actualizar',
      icon: 'Edit2',
      colorClass: 'bg-yellow-600 hover:bg-yellow-700 border-yellow-600',
      outlineColorClass: 'border-yellow-600 text-yellow-600 hover:bg-yellow-50',
      ghostColorClass: 'text-yellow-600 hover:bg-yellow-50',
      callback: onAction.onUpdate || onAction.onEdit || onAction.onModify
    },
    DELETE: {
      label: 'Eliminar',
      icon: 'Trash2',
      colorClass: 'bg-red-600 hover:bg-red-700 border-red-600',
      outlineColorClass: 'border-red-600 text-red-600 hover:bg-red-50',
      ghostColorClass: 'text-red-600 hover:bg-red-50',
      callback: onAction.onDelete || onAction.onRemove
    },
    EXPORT: {
      label: 'Exportar',
      icon: 'Download',
      colorClass: 'bg-purple-600 hover:bg-purple-700 border-purple-600',
      outlineColorClass: 'border-purple-600 text-purple-600 hover:bg-purple-50',
      ghostColorClass: 'text-purple-600 hover:bg-purple-50',
      callback: onAction.onExport || onAction.onDownload
    },
    PRINT: {
      label: 'Imprimir',
      icon: 'Printer',
      colorClass: 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600',
      outlineColorClass: 'border-indigo-600 text-indigo-600 hover:bg-indigo-50',
      ghostColorClass: 'text-indigo-600 hover:bg-indigo-50',
      callback: onAction.onPrint
    },
    SEARCH: {
      label: 'Buscar',
      icon: 'Search',
      colorClass: 'bg-gray-600 hover:bg-gray-700 border-gray-600',
      outlineColorClass: 'border-gray-600 text-gray-600 hover:bg-gray-50',
      ghostColorClass: 'text-gray-600 hover:bg-gray-50',
      callback: onAction.onSearch
    },
    REFRESH: {
      label: 'Actualizar',
      icon: 'RefreshCw',
      colorClass: 'bg-teal-600 hover:bg-teal-700 border-teal-600',
      outlineColorClass: 'border-teal-600 text-teal-600 hover:bg-teal-50',
      ghostColorClass: 'text-teal-600 hover:bg-teal-50',
      callback: onAction.onRefresh || onAction.onReload
    }
  };

  // ===== FUNCIÓN PARA MANEJAR CLICS CON CONFIRMACIÓN =====
  const handleButtonClick = useCallback(async (buttonCode, buttonData, callback) => {
    if (!callback || disabled || processingButton) return;

    try {
      setProcessingButton(buttonCode);

      // ✅ VERIFICACIÓN ADICIONAL: Confirmar permiso en tiempo real
      const hasPermission = hasButtonPermission(buttonCode);
      if (!hasPermission) {
        console.warn(`❌ Acceso denegado al botón: ${buttonCode}`);
        alert('No tienes permisos para realizar esta acción');
        return;
      }

      // Verificar si requiere confirmación
      const needsConfirmation = buttonData?.bot_confirmacion || 
                               confirmations[buttonCode] || 
                               ['DELETE', 'REJECT', 'RESET'].includes(buttonCode);

      if (needsConfirmation) {
        const confirmMessage = buttonData?.bot_mensaje_confirmacion || 
                              confirmations[buttonCode] || 
                              `¿Estás seguro de que deseas ${buttonData?.bot_nom?.toLowerCase() || 'realizar esta acción'}?`;

        const confirmed = window.confirm(confirmMessage);
        if (!confirmed) {
          return;
        }
      }

      // Ejecutar callback
      console.log(`✅ Ejecutando acción: ${buttonCode}`);
      await callback();
    } catch (error) {
      console.error(`❌ Error ejecutando acción ${buttonCode}:`, error);
      alert(`Error al ejecutar la acción: ${error.message}`);
    } finally {
      setProcessingButton(null);
    }
  }, [disabled, processingButton, confirmations, hasButtonPermission]);

  // ===== FUNCIÓN PARA OBTENER CLASES CSS DEL BOTÓN =====
  const getButtonClasses = useCallback((buttonCode, buttonData) => {
    const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const config = defaultButtonConfig[buttonCode];
    if (!config) {
      return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white border-2 border-gray-600`;
    }

    let colorClasses = '';
    switch (variant) {
      case 'outline':
        colorClasses = `${config.outlineColorClass} bg-transparent border-2`;
        break;
      case 'ghost':
        colorClasses = `${config.ghostColorClass} bg-transparent border-0`;
        break;
      default: // solid
        colorClasses = `${config.colorClass} text-white border-2`;
    }

    return `${baseClasses} ${colorClasses}`;
  }, [variant, defaultButtonConfig]);

  // ===== RENDERIZAR BOTÓN INDIVIDUAL =====
  const renderButton = useCallback((buttonData) => {
    const { bot_codigo: buttonCode, bot_nom: label, bot_tooltip: tooltip, ico_nombre: iconName } = buttonData;
    
    const config = defaultButtonConfig[buttonCode];
    const callback = customButtons[buttonCode]?.callback || config?.callback;
    
    if (!callback) {
      console.warn(`⚠️ No hay callback definido para el botón: ${buttonCode}`);
      return null;
    }

    // ✅ VERIFICACIÓN CRÍTICA: Solo mostrar si tiene permiso efectivo
    const hasPermission = hasButtonPermission(buttonCode);
    if (!hasPermission) {
      console.log(`🔒 Botón ${buttonCode} oculto - sin permisos efectivos`);
      return null;
    }

    const isProcessing = processingButton === buttonCode;
    const buttonClasses = getButtonClasses(buttonCode, buttonData);
    
    return (
      <button
        key={buttonCode}
        type="button"
        className={buttonClasses}
        onClick={() => handleButtonClick(buttonCode, buttonData, callback)}
        disabled={disabled || isProcessing}
        title={tooltip || config?.label}
        aria-label={tooltip || config?.label}
      >
        {isProcessing ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        ) : (
          <Icon 
            name={iconName || config?.icon || 'Square'} 
            size={size} 
            className="text-current" 
          />
        )}
        {showLabels && (
          <span className="whitespace-nowrap">
            {isProcessing ? 'Procesando...' : (label || config?.label)}
          </span>
        )}
      </button>
    );
  }, [
    defaultButtonConfig,
    customButtons,
    processingButton,
    getButtonClasses,
    handleButtonClick,
    disabled,
    showLabels,
    size,
    hasButtonPermission
  ]);

  // ===== OBTENER BOTONES PERMITIDOS =====
  const allowedButtons = buttonPermissions.filter(btn => {
    const hasPermission = btn.has_permission === true;
    if (!hasPermission) {
      console.log(`🔒 Botón ${btn.bot_codigo} filtrado - sin permiso efectivo`);
    }
    return hasPermission;
  });

  // ===== CLASES CSS PARA LAYOUT =====
  const getLayoutClasses = () => {
    const base = 'flex';
    switch (layout) {
      case 'vertical':
        return `${base} flex-col gap-2`;
      case 'grid':
        return `${base} flex-wrap gap-2`;
      default: // horizontal
        return `${base} flex-row gap-2 flex-wrap`;
    }
  };

  // ===== DEBUG INFO =====
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 DynamicActionButtons Debug:', {
      targetId,
      type,
      userId,
      totalButtons: buttonPermissions.length,
      allowedButtons: allowedButtons.length,
      loading,
      error,
      isReady,
      debugInfo
    });
  }

  // ===== ESTADOS DE CARGA Y ERROR =====
  if (loading) {
    return (
      <div className={`${getLayoutClasses()} ${className}`}>
        <div className="flex items-center gap-2 px-4 py-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
          <span className="text-sm">Cargando permisos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${getLayoutClasses()} ${className}`}>
        <div className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg border border-red-200">
          <Icon name="AlertCircle" size={16} />
          <span className="text-sm">Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className={`${getLayoutClasses()} ${className}`}>
        <div className="flex items-center gap-2 px-4 py-2 text-gray-500 bg-gray-50 rounded-lg">
          <Icon name="Clock" size={16} />
          <span className="text-sm">Verificando permisos...</span>
        </div>
      </div>
    );
  }

  if (allowedButtons.length === 0) {
    return (
      <div className={`${getLayoutClasses()} ${className}`}>
        <div className="flex items-center gap-2 px-4 py-2 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <Icon name="Lock" size={16} />
          <span className="text-sm">Sin permisos disponibles</span>
        </div>
      </div>
    );
  }

  // ===== RENDER PRINCIPAL =====
  return (
    <div className={`${getLayoutClasses()} ${className}`}>
      {allowedButtons.map(renderButton)}
      
      {/* ✅ NUEVO: Información de debug en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="ml-4 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
          {allowedButtons.length}/{buttonPermissions.length} botones permitidos
          {userId && ` (Usuario: ${userId})`}
        </div>
      )}
    </div>
  );
});

DynamicActionButtons.displayName = 'DynamicActionButtons';

export default DynamicActionButtons;