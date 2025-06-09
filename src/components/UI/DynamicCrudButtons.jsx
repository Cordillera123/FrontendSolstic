import React, { memo, useMemo } from 'react';
import { useButtonPermissions } from '../../hooks/useButtonPermissions';
import Icon from './Icon';

/**
 * Componente estándar para botones CRUD dinámicos
 * @param {number} menuId - ID del menú para permisos (ventanas directas)
 * @param {number} opcionId - ID de la opción para permisos (opciones regulares)
 * @param {'menu'|'option'} type - Tipo de consulta de permisos
 * @param {object} onAction - Callbacks para cada acción
 * @param {object} customLabels - Etiquetas personalizadas para botones
 * @param {string} layout - 'horizontal' | 'vertical' | 'grid'
 * @param {string} variant - 'solid' | 'outline' | 'ghost'
 * @param {number} size - Tamaño de iconos
 * @param {boolean} showLabels - Mostrar etiquetas de texto
 * @param {string} className - Clases CSS adicionales
 * @param {object} confirmations - Mensajes de confirmación por acción
 * @param {boolean} disabled - Deshabilitar todos los botones
 */
const DynamicCRUDButtons = memo(({
  menuId = null,
  opcionId = null,
  type = 'menu',
  onAction = {},
  customLabels = {},
  layout = 'horizontal',
  variant = 'solid',
  size = 16,
  showLabels = true,
  className = '',
  confirmations = {},
  disabled = false
}) => {
  // ===== HOOK DE PERMISOS =====
  const targetId = type === 'menu' ? menuId : opcionId;
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    loading,
    error,
    isReady,
    debugInfo
  } = useButtonPermissions(targetId, null, true, type);

  // ===== CONFIGURACIÓN DE BOTONES =====
  const buttonConfig = useMemo(() => [
    {
      code: 'CREATE',
      label: customLabels.CREATE || 'Crear',
      icon: 'Plus',
      permission: canCreate,
      color: 'green',
      action: onAction.onCreate
    },
    {
      code: 'READ',
      label: customLabels.READ || 'Consultar',
      icon: 'Eye',
      permission: canRead,
      color: 'blue',
      action: onAction.onRead
    },
    {
      code: 'UPDATE',
      label: customLabels.UPDATE || 'Editar',
      icon: 'Edit2',
      permission: canUpdate,
      color: 'yellow',
      action: onAction.onUpdate
    },
    {
      code: 'DELETE',
      label: customLabels.DELETE || 'Eliminar',
      icon: 'Trash2',
      permission: canDelete,
      color: 'red',
      action: onAction.onDelete
    },
    {
      code: 'EXPORT',
      label: customLabels.EXPORT || 'Exportar',
      icon: 'Download',
      permission: canExport,
      color: 'purple',
      action: onAction.onExport
    }
  ], [canCreate, canRead, canUpdate, canDelete, canExport, onAction, customLabels]);

  // ===== BOTONES PERMITIDOS =====
  const allowedButtons = useMemo(() => 
    buttonConfig.filter(btn => btn.permission && btn.action)
  , [buttonConfig]);

  // ===== ESTILOS DINÁMICOS =====
  const getButtonStyles = useMemo(() => (color, isDisabled) => {
    const baseStyles = 'inline-flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (isDisabled) {
      return `${baseStyles} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }

    const colorMap = {
      green: {
        solid: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        outline: 'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
        ghost: 'text-green-600 hover:bg-green-50 focus:ring-green-500'
      },
      blue: {
        solid: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
        ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
      },
      yellow: {
        solid: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
        outline: 'border border-yellow-600 text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500',
        ghost: 'text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500'
      },
      red: {
        solid: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
        ghost: 'text-red-600 hover:bg-red-50 focus:ring-red-500'
      },
      purple: {
        solid: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
        outline: 'border border-purple-600 text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
        ghost: 'text-purple-600 hover:bg-purple-50 focus:ring-purple-500'
      }
    };

    return `${baseStyles} ${colorMap[color]?.[variant] || colorMap.blue[variant]}`;
  }, [variant]);

  // ===== LAYOUT STYLES =====
  const getLayoutStyles = useMemo(() => {
    const layouts = {
      horizontal: 'flex flex-wrap gap-2',
      vertical: 'flex flex-col gap-2',
      grid: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2'
    };
    return layouts[layout] || layouts.horizontal;
  }, [layout]);

  // ===== HANDLERS =====
  const handleButtonClick = useMemo(() => (button) => {
    return () => {
      if (disabled || loading) return;

      const confirmation = confirmations[button.code];
      if (confirmation && !window.confirm(confirmation)) {
        return;
      }

      if (button.action) {
        button.action();
      }
    };
  }, [disabled, loading, confirmations]);

  // ===== RENDER CONDICIONAL =====
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="text-sm">Cargando permisos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <Icon name="AlertCircle" size={16} />
        <span>Error: {error}</span>
      </div>
    );
  }

  if (!isReady || allowedButtons.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Icon name="Lock" size={16} />
        <span>Sin permisos disponibles</span>
      </div>
    );
  }

  // ===== RENDER PRINCIPAL =====
  return (
    <div className={`${getLayoutStyles} ${className}`} role="group" aria-label="Acciones CRUD">
      {allowedButtons.map((button) => (
        <button
          key={button.code}
          type="button"
          className={getButtonStyles(button.color, disabled)}
          onClick={handleButtonClick(button)}
          disabled={disabled || loading}
          title={button.label}
          aria-label={button.label}
        >
          <Icon name={button.icon} size={size} />
          {showLabels && <span>{button.label}</span>}
        </button>
      ))}
      
      {/* Debug info en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-400 mt-2">
          <summary>Debug Info</summary>
          <pre className="mt-1 p-2 bg-gray-100 rounded">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
});

DynamicCRUDButtons.displayName = 'DynamicCRUDButtons';

export default DynamicCRUDButtons;