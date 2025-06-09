// src/components/UI/DynamicActionButtons.jsx
import React, { memo, useCallback, useState } from 'react';
import Icon from './Icon';
import { useButtonPermissions } from '../../hooks/useButtonPermissions';

/**
 * Componente que renderiza botones de acción basado en permisos del usuario
 */
const DynamicActionButtons = memo(({
  opcId,
  onAction = {},
  showLabels = true,
  size = 16,
  layout = 'horizontal',
  variant = 'solid',
  disabled = false,
  customButtons = {},
  className = '',
  confirmations = {}
}) => {
  const [processingButton, setProcessingButton] = useState(null);
  
  // Hook para obtener permisos
  const {
    buttonPermissions,
    loading,
    error,
    hasButtonPermission,
    getButtonInfo,
    isReady
  } = useButtonPermissions(opcId);

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
    }
  };

  // ===== FUNCIÓN PARA MANEJAR CLICS CON CONFIRMACIÓN =====
  const handleButtonClick = useCallback(async (buttonCode, buttonData, callback) => {
    if (!callback || disabled || processingButton) return;

    try {
      setProcessingButton(buttonCode);

      // Verificar si requiere confirmación
      const needsConfirmation = buttonData?.bot_confirmacion || 
                               confirmations[buttonCode] || 
                               ['DELETE', 'REJECT'].includes(buttonCode);

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
      await callback();
    } catch (error) {
      console.error(`❌ Error ejecutando acción ${buttonCode}:`, error);
    } finally {
      setProcessingButton(null);
    }
  }, [disabled, processingButton, confirmations]);

  // ===== FUNCIÓN PARA OBTENER CLASES CSS DEL BOTÓN =====
  const getButtonClasses = useCallback((buttonCode, buttonData) => {
    const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const config = defaultButtonConfig[buttonCode];
    if (!config) return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white`;

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
    size
  ]);

  // ===== OBTENER BOTONES PERMITIDOS =====
  const allowedButtons = buttonPermissions.filter(btn => btn.has_permission === true);

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
        <div className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg">
          <Icon name="AlertCircle" size={16} />
          <span className="text-sm">Error al cargar permisos</span>
        </div>
      </div>
    );
  }

  if (!isReady || allowedButtons.length === 0) {
    return (
      <div className={`${getLayoutClasses()} ${className}`}>
        <div className="flex items-center gap-2 px-4 py-2 text-gray-500 bg-gray-50 rounded-lg">
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
    </div>
  );
});

DynamicActionButtons.displayName = 'DynamicActionButtons';

export default DynamicActionButtons;