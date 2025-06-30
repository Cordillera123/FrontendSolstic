// src/components/Windows/ThemeConfigWindow.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useButtonPermissions } from '../../hooks/useButtonPermissions';
import { useTheme } from '../../hooks/useTheme';
import Icon from '../UI/Icon';

const ColorPicker = ({ label, value, onChange, disabled = false }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
};

const ThemePreview = ({ themeName, colors, isActive, onClick, disabled = false }) => {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick(themeName);
    }
  }, [onClick, themeName, disabled]);

  return (
    <div
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
        isActive
          ? 'border-primary ring-2 ring-primary/20 bg-primary-lighter'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
    >
      {/* Miniatura del tema */}
      <div className="mb-3">
        <div className="w-full h-24 rounded-lg overflow-hidden border border-gray-200">
          {/* Simulación del header */}
          <div 
            className="h-6 flex items-center px-2"
            style={{ backgroundColor: colors.header }}
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-white/70"></div>
              <div className="w-2 h-2 rounded-full bg-white/70"></div>
              <div className="w-2 h-2 rounded-full bg-white/70"></div>
            </div>
          </div>
          
          <div className="flex h-18">
            {/* Simulación del sidebar */}
            <div 
              className="w-16 flex flex-col space-y-1 p-1"
              style={{ backgroundColor: colors.sidebar }}
            >
              <div className="w-full h-2 bg-white/20 rounded"></div>
              <div className="w-full h-2 bg-white/10 rounded"></div>
              <div className="w-full h-2 bg-white/10 rounded"></div>
            </div>
            
            {/* Simulación del contenido */}
            <div 
              className="flex-1 p-2 space-y-1"
              style={{ backgroundColor: colors.background }}
            >
              <div 
                className="w-full h-2 rounded"
                style={{ backgroundColor: colors.primary }}
              ></div>
              <div className="w-3/4 h-2 bg-gray-200 rounded"></div>
              <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Información del tema */}
      <div className="text-center">
        <h3 className="font-semibold text-gray-900">{colors.name || themeName}</h3>
        <div className="flex justify-center mt-2 space-x-1">
          {[colors.primary, colors.success, colors.warning, colors.error].map((color, index) => (
            <div
              key={index}
              className="w-4 h-4 rounded-full border border-gray-200"
              style={{ backgroundColor: color }}
            ></div>
          ))}
        </div>
      </div>
      
      {isActive && (
        <div className="mt-2 text-center">
          <span className="inline-flex items-center px-2 py-1 bg-primary text-white text-xs rounded-full">
            <Icon name="Check" size={12} className="mr-1" />
            Activo
          </span>
        </div>
      )}
    </div>
  );
};

const ThemeConfigWindow = ({
  showMessage = (type, message) => console.log(`${type}: ${message}`),
  menuId = 9, // ID del menú de configuración
}) => {
  // Hook de permisos
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    loading: permissionsLoading,
  } = useButtonPermissions(menuId, null, true, "menu");

  // Hook de tema
  const {
    currentTheme,
    customColors,
    predefinedThemes,
    changeTheme,
    updateCustomColors,
    getCurrentThemeInfo,
    isLoading,
  } = useTheme();

  // Estados locales
  const [activeTab, setActiveTab] = useState('predefined');
  const [tempCustomColors, setTempCustomColors] = useState({
    primary: '#3B82F6',
    primaryDark: '#1D4ED8',
    primaryLight: '#93C5FD',
    primaryLighter: '#DBEAFE',
    sidebar: '#1E3A8A',
    sidebarHover: '#1E40AF',
    header: '#2563EB',
    headerText: '#FFFFFF',
    accent: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    ...customColors,
  });

  // Información del tema actual
  const currentThemeInfo = getCurrentThemeInfo();

  // Manejadores
  const handleThemeChange = useCallback(async (themeName) => {
    if (!canUpdate) {
      showMessage('error', 'No tienes permisos para cambiar el tema');
      return;
    }

    try {
      await changeTheme(themeName);
      showMessage('success', `Tema cambiado a: ${predefinedThemes[themeName]?.name || themeName}`);
    } catch (error) {
      showMessage('error', 'Error al cambiar el tema');
    }
  }, [canUpdate, changeTheme, predefinedThemes, showMessage]);

  const handleCustomColorChange = useCallback((colorKey, colorValue) => {
    setTempCustomColors(prev => ({
      ...prev,
      [colorKey]: colorValue
    }));
  }, []);

  const handleApplyCustomColors = useCallback(async () => {
    if (!canUpdate) {
      showMessage('error', 'No tienes permisos para aplicar colores personalizados');
      return;
    }

    try {
      await changeTheme('custom', tempCustomColors);
      showMessage('success', 'Colores personalizados aplicados correctamente');
    } catch (error) {
      showMessage('error', 'Error al aplicar colores personalizados');
    }
  }, [canUpdate, changeTheme, tempCustomColors, showMessage]);

  const handleResetCustomColors = useCallback(() => {
    if (!canUpdate) {
      showMessage('error', 'No tienes permisos para resetear colores');
      return;
    }

    const defaultColors = predefinedThemes.blue.colors;
    setTempCustomColors(defaultColors);
    showMessage('info', 'Colores restablecidos a los valores por defecto');
  }, [canUpdate, predefinedThemes, showMessage]);

  const handleExportTheme = useCallback(() => {
    if (!canRead) {
      showMessage('error', 'No tienes permisos para exportar el tema');
      return;
    }

    const themeData = {
      name: currentThemeInfo.displayName,
      theme: currentTheme,
      colors: currentThemeInfo.colors,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(themeData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tema-${currentTheme}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage('success', 'Tema exportado correctamente');
  }, [canRead, currentTheme, currentThemeInfo, showMessage]);

  // Colores personalizados organizados por categorías
  const colorCategories = useMemo(() => [
    {
      name: 'Colores Principales',
      colors: [
        { key: 'primary', label: 'Principal', description: 'Color principal del sistema' },
        { key: 'primaryDark', label: 'Principal Oscuro', description: 'Versión oscura del color principal' },
        { key: 'primaryLight', label: 'Principal Claro', description: 'Versión clara del color principal' },
        { key: 'primaryLighter', label: 'Principal Muy Claro', description: 'Versión muy clara para fondos' },
      ]
    },
    {
      name: 'Navegación',
      colors: [
        { key: 'sidebar', label: 'Sidebar', description: 'Color de fondo del sidebar' },
        { key: 'sidebarHover', label: 'Sidebar Hover', description: 'Color al pasar el mouse sobre el sidebar' },
        { key: 'header', label: 'Header', description: 'Color de fondo del header de ventanas' },
        { key: 'headerText', label: 'Texto Header', description: 'Color del texto en el header' },
      ]
    },
    {
      name: 'Estados y Acciones',
      colors: [
        { key: 'accent', label: 'Acento', description: 'Color de acento para destacar elementos' },
        { key: 'success', label: 'Éxito', description: 'Color para mensajes de éxito' },
        { key: 'warning', label: 'Advertencia', description: 'Color para mensajes de advertencia' },
        { key: 'error', label: 'Error', description: 'Color para mensajes de error' },
      ]
    },
    {
      name: 'Superficies',
      colors: [
        { key: 'background', label: 'Fondo', description: 'Color de fondo general' },
        { key: 'surface', label: 'Superficie', description: 'Color de fondo de tarjetas y elementos' },
        { key: 'border', label: 'Borde', description: 'Color de los bordes' },
      ]
    },
  ], []);

  // Validaciones de carga
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Icon name="Lock" size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">
            No tienes permisos para acceder a la configuración de temas
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Información de debug:</strong>
            </p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>
                • Menu ID: <code className="bg-yellow-100 px-1 rounded">{menuId}</code>
              </li>
              <li>
                • Permiso READ: <code className="bg-yellow-100 px-1 rounded">{canRead ? "SÍ" : "NO"}</code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border flex-shrink-0">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Icon name="Palette" size={28} className="mr-3 text-primary" />
            Configuración de Temas
            <span className="ml-3 text-sm bg-primary-lighter text-primary px-2 py-1 rounded">
              Tema actual: {currentThemeInfo.displayName}
            </span>
          </h1>
          <p className="text-gray-600 mt-1">
            Personaliza la apariencia visual del sistema
          </p>
        </div>

        {/* Pestañas */}
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('predefined')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'predefined'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name="Palette" size={16} className="inline mr-2" />
              Temas Predefinidos
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'custom'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name="Settings" size={16} className="inline mr-2" />
              Personalizado
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'predefined' && (
          <div className="space-y-6">
            {/* Tema actual */}
            <div className="bg-surface rounded-lg border border-border p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Tema Actual
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg border-2 border-primary bg-primary-lighter flex items-center justify-center">
                  <Icon name="Check" size={24} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{currentThemeInfo.displayName}</h4>
                  <p className="text-sm text-gray-600">
                    {currentThemeInfo.isCustom ? 'Tema personalizado' : 'Tema predefinido'}
                  </p>
                  <div className="flex items-center mt-2 space-x-2">
                    <button
                      onClick={handleExportTheme}
                      disabled={!canRead || isLoading}
                      className="text-sm text-primary hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="Download" size={14} className="inline mr-1" />
                      Exportar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Temas disponibles */}
            <div className="bg-surface rounded-lg border border-border p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Temas Disponibles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(predefinedThemes)
                  .filter(([themeName]) => themeName !== 'custom')
                  .map(([themeName, themeData]) => (
                    <ThemePreview
                      key={themeName}
                      themeName={themeName}
                      colors={themeData}
                      isActive={currentTheme === themeName}
                      onClick={handleThemeChange}
                      disabled={!canUpdate || isLoading}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-6">
            {/* Vista previa del tema personalizado */}
            <div className="bg-surface rounded-lg border border-border p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Vista Previa
              </h3>
              <div className="max-w-md">
                <ThemePreview
                  themeName="custom"
                  colors={{ 
                    name: 'Personalizado',
                    ...tempCustomColors 
                  }}
                  isActive={currentTheme === 'custom'}
                  onClick={() => {}}
                  disabled={true}
                />
              </div>
            </div>

            {/* Editor de colores */}
            <div className="bg-surface rounded-lg border border-border p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Editor de Colores
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={handleResetCustomColors}
                    disabled={!canUpdate || isLoading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Icon name="RotateCcw" size={16} className="inline mr-2" />
                    Resetear
                  </button>
                  <button
                    onClick={handleApplyCustomColors}
                    disabled={!canUpdate || isLoading}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline mr-2"></div>
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <Icon name="Check" size={16} className="inline mr-2" />
                        Aplicar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Categorías de colores */}
              <div className="space-y-8">
                {colorCategories.map((category) => (
                  <div key={category.name}>
                    <h4 className="text-md font-semibold text-gray-700 mb-4 pb-2 border-b border-border">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {category.colors.map((colorConfig) => (
                        <div key={colorConfig.key} className="space-y-2">
                          <ColorPicker
                            label={colorConfig.label}
                            value={tempCustomColors[colorConfig.key]}
                            onChange={(value) => handleCustomColorChange(colorConfig.key, value)}
                            disabled={!canUpdate || isLoading}
                          />
                          <p className="text-xs text-gray-500">
                            {colorConfig.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Icon name="Info" size={20} className="text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    Información sobre Colores Personalizados
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Los colores se aplicarán inmediatamente al hacer clic en "Aplicar"</li>
                    <li>• Los cambios se guardan automáticamente en tu navegador</li>
                    <li>• Puedes exportar tu tema personalizado desde la pestaña "Temas Predefinidos"</li>
                    <li>• Usa el botón "Resetear" para volver a los colores por defecto</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay de carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-3 border">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-gray-700 font-medium">
              Aplicando tema...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeConfigWindow;