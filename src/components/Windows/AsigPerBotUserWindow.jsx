// src/components/Windows/AsigPerBotUserWindow.jsx - VERSIÓN CORREGIDA CON SINCRONIZACIÓN
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { adminService } from '../../services/apiService';
import Icon from '../UI/Icon';

// ===== EVENTOS GLOBALES PARA SINCRONIZACIÓN =====
class PermissionChangeNotifier {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(data) {
    console.log('🔄 PermissionChangeNotifier - Notificando cambio:', data);
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error en listener de permisos:', error);
      }
    });
  }
}

// Instancia global del notificador
window.permissionChangeNotifier = window.permissionChangeNotifier || new PermissionChangeNotifier();

// ===== UTILIDADES PARA ICONOS CRUD =====
const getCrudIconInfo = (buttonCode, buttonName) => {
  const code = buttonCode?.toLowerCase() || '';
  const name = buttonName?.toLowerCase() || '';

  const codeMapping = {
    // Operaciones CRUD principales
    'crear': { icon: 'Plus', color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', tooltip: 'Crear nuevo registro' },
    'nuevo': { icon: 'Plus', color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', tooltip: 'Crear nuevo registro' },
    'agregar': { icon: 'Plus', color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', tooltip: 'Agregar registro' },
    'add': { icon: 'Plus', color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', tooltip: 'Agregar' },
    'create': { icon: 'Plus', color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', tooltip: 'Crear' },
    
    'editar': { icon: 'Edit3', color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Editar registro' },
    'modificar': { icon: 'Edit3', color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Modificar registro' },
    'edit': { icon: 'Edit3', color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Editar' },
    'update': { icon: 'Edit3', color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Actualizar' },
    'actualizar': { icon: 'Edit3', color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Actualizar' },
    
    'eliminar': { icon: 'Trash2', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', tooltip: 'Eliminar registro' },
    'borrar': { icon: 'Trash2', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', tooltip: 'Borrar registro' },
    'delete': { icon: 'Trash2', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', tooltip: 'Eliminar' },
    'remove': { icon: 'Trash2', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', tooltip: 'Remover' },
    
    'read': { icon: 'Eye', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Leer' },
    'leer': { icon: 'Eye', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Leer' },
    
    'guardar': { icon: 'Save', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Guardar cambios' },
    'save': { icon: 'Save', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Guardar' },
    
    'cancelar': { icon: 'X', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Cancelar operación' },
    'cancel': { icon: 'X', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Cancelar' },
    
    // ✅ CRÍTICO: Operaciones de calendario - CÓDIGOS ACTUALIZADOS
    'calendario': { icon: 'Calendar', color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Ver calendario' },
    'CALENDARIO': { icon: 'Calendar', color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Ver calendario' },
    'calendar': { icon: 'Calendar', color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Calendario' },
    'CALENDAR': { icon: 'Calendar', color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Calendario' },
    'agenda': { icon: 'Calendar', color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Ver agenda' },
    'AGENDA': { icon: 'Calendar', color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Ver agenda' },
    'fechas': { icon: 'CalendarDays', color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Gestionar fechas' },
    'programar': { icon: 'CalendarPlus', color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Programar evento' },
    
    // Operaciones de visualización
    'ver': { icon: 'Eye', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Ver detalles' },
    'view': { icon: 'Eye', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Ver' },
    'mostrar': { icon: 'Eye', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Mostrar' },
    'detalles': { icon: 'FileText', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Ver detalles' },
    
    // Operaciones de búsqueda y filtros
    'buscar': { icon: 'Search', color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', tooltip: 'Buscar registros' },
    'search': { icon: 'Search', color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', tooltip: 'Buscar' },
    'filtrar': { icon: 'Filter', color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', tooltip: 'Filtrar resultados' },
    'filter': { icon: 'Filter', color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', tooltip: 'Filtrar' },
    
    // Operaciones de importación/exportación
    'importar': { icon: 'Upload', color: '#059669', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800', tooltip: 'Importar datos' },
    'import': { icon: 'Upload', color: '#059669', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800', tooltip: 'Importar' },
    'exportar': { icon: 'Download', color: '#059669', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800', tooltip: 'Exportar datos' },
    'export': { icon: 'Download', color: '#059669', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800', tooltip: 'Exportar' },
    
    // Operaciones de impresión y reportes
    'imprimir': { icon: 'Printer', color: '#4b5563', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Imprimir' },
    'print': { icon: 'Printer', color: '#4b5563', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Imprimir' },
    'reporte': { icon: 'FileBarChart', color: '#7c3aed', bgColor: 'bg-violet-100', textColor: 'text-violet-800', tooltip: 'Generar reporte' },
    'report': { icon: 'FileBarChart', color: '#7c3aed', bgColor: 'bg-violet-100', textColor: 'text-violet-800', tooltip: 'Reporte' },
    
    // Operaciones de configuración
    'configurar': { icon: 'Settings', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Configurar' },
    'config': { icon: 'Settings', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Configuración' },
    'ajustes': { icon: 'Settings', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Ajustes' },
    
    // Operaciones de refrescar/actualizar
    'refrescar': { icon: 'RefreshCw', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Refrescar datos' },
    'refresh': { icon: 'RefreshCw', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Refrescar' },
    
    // Operaciones de ayuda
    'ayuda': { icon: 'HelpCircle', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Ayuda' },
    'help': { icon: 'HelpCircle', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Ayuda' },
  };
  
  // Buscar por código exacto primero
  if (codeMapping[code]) {
    return codeMapping[code];
  }
  
  // Buscar por nombre si no se encuentra por código
  if (codeMapping[name]) {
    return codeMapping[name];
  }
  
  // Buscar parcialmente en código
  for (const [key, value] of Object.entries(codeMapping)) {
    if (code.includes(key) || name.includes(key)) {
      return value;
    }
  }
  
  // Valor por defecto si no se encuentra coincidencia
  return { 
    icon: 'Square', 
    color: '#6b7280', 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-800', 
    tooltip: buttonName || buttonCode || 'Acción' 
  };
};

// ===== COMPONENTE PARA BOTÓN CRUD CON ICONO =====
const CrudButton = memo(({ 
  boton, 
  hasEffectivePermission, 
  profilePermission, 
  isCustomized, 
  customizationType,
  onGrantPermission,
  onDenyPermission,
  onRemoveCustomization,
  savingPermissions 
}) => {
  const iconInfo = getCrudIconInfo(boton.bot_codigo, boton.bot_nom);
  
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      hasEffectivePermission 
        ? `${iconInfo.bgColor} border-opacity-50 shadow-sm` 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        {/* Icono y nombre del botón */}
        <div className="flex items-center flex-1">
          <div 
            className={`p-2 rounded-lg mr-3 ${iconInfo.bgColor} border border-opacity-30`}
            style={{ borderColor: iconInfo.color }}
            title={iconInfo.tooltip}
          >
            <Icon 
              name={iconInfo.icon} 
              size={16} 
              style={{ color: iconInfo.color }}
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                hasEffectivePermission ? iconInfo.textColor : 'text-gray-700'
              }`}>
                {boton.bot_nom}
              </span>
              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                {boton.bot_codigo}
              </span>
              {isCustomized && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  customizationType === 'C' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {customizationType === 'C' ? '✅ Concedido' : '❌ Denegado'}
                </span>
              )}
            </div>

            {/* Estados del permiso */}
            <div className="text-xs text-gray-600 mt-1 flex items-center gap-4">
              <span className={`px-2 py-1 rounded ${
                profilePermission ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                Perfil: {profilePermission ? '✅ SÍ' : '❌ NO'}
              </span>
              <span className={`px-2 py-1 rounded ${
                hasEffectivePermission ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                Efectivo: {hasEffectivePermission ? '✅ PERMITIDO' : '❌ DENEGADO'}
              </span>
              {isCustomized && (
                <span className={`px-2 py-1 rounded ${
                  customizationType === 'C' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  Usuario: {customizationType === 'C' ? '✅ Concedido' : '❌ Denegado'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {/* Botón CONCEDER */}
            <button
              onClick={onGrantPermission}
              disabled={savingPermissions || !profilePermission}
              className={`p-2 rounded transition-colors ${
                hasEffectivePermission && customizationType === 'C'
                  ? 'bg-green-500 text-white shadow-sm'
                  : profilePermission
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={profilePermission ? "Conceder acceso específico" : "El perfil no tiene acceso a este botón"}
            >
              <Icon name="Check" size={14} />
            </button>

            {/* Botón DENEGAR */}
            <button
              onClick={onDenyPermission}
              disabled={savingPermissions || !profilePermission}
              className={`p-2 rounded transition-colors ${
                !hasEffectivePermission && customizationType === 'D'
                  ? 'bg-red-500 text-white shadow-sm'
                  : profilePermission
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={profilePermission ? "Denegar acceso específico" : "El perfil no tiene acceso a este botón"}
            >
              <Icon name="X" size={14} />
            </button>

            {/* Botón RESETEAR */}
            {isCustomized && (
              <button
                onClick={onRemoveCustomization}
                disabled={savingPermissions}
                className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors border border-gray-300"
                title="Remover personalización (volver a herencia del perfil)"
              >
                <Icon name="RotateCcw" size={14} />
              </button>
            )}
          </div>

          {/* Indicadores visuales */}
          <div className="flex flex-col items-center gap-1">
            {!profilePermission && (
              <span className="text-xs text-gray-400" title="El perfil no tiene acceso">
                <Icon name="Lock" size={12} />
              </span>
            )}
            {isCustomized && (
              <span className="text-xs text-blue-500" title="Permiso personalizado">
                <Icon name="Settings" size={12} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ===== UTILIDADES REUTILIZADAS =====
const isDirectWindow = (element, level = 'option') => {
  switch (level) {
    case 'menu':
      return element.men_ventana_directa === true || element.men_ventana_directa === 1;
    case 'submenu':
      return element.sub_ventana_directa === true || element.sub_ventana_directa === 1;
    case 'option':
      return element.opc_ventana_directa === true || element.opc_ventana_directa === 1;
    default:
      return false;
  }
};

const hasDirectWindowBotones = (element, level = 'option') => {
  if (!isDirectWindow(element, level)) {
    return false;
  }
  return element.botones && element.botones.length > 0;
};

// ===== COMPONENTES =====
const ProfileCard = memo(({ perfil, isSelected, onClick, usuariosCount }) => {
  const handleClick = useCallback(() => {
    onClick(perfil);
  }, [onClick, perfil]);

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${isSelected
        ? 'border-blue-500 bg-blue-50 shadow-md'
        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center">
            <Icon
              name={perfil.per_nom.toLowerCase().includes('super') ? 'Crown' :
                perfil.per_nom.toLowerCase().includes('admin') ? 'Shield' : 'User'}
              size={16}
              className={`mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
            />
            <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
              {perfil.per_nom}
            </span>
          </div>
          <p className={`text-sm mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
            {usuariosCount || 0} usuarios
          </p>
        </div>
        <Icon
          name="ChevronRight"
          size={16}
          className={`transition-colors ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}
        />
      </div>
    </div>
  );
});

const UserCard = memo(({ usuario, isSelected, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(usuario);
  }, [onClick, usuario]);

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${isSelected
        ? 'border-green-500 bg-green-50 shadow-md'
        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <Icon
              name="User"
              size={14}
              className={`mr-2 ${isSelected ? 'text-green-600' : 'text-gray-500'}`}
            />
            <span className={`font-medium text-sm ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
              {usuario.usu_nom} {usuario.usu_ape}
            </span>
          </div>
          <p className={`text-xs mt-1 ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
            {usuario.usu_cor}
          </p>
          {usuario.permisos_personalizados > 0 && (
            <div className="flex items-center mt-1">
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                {usuario.permisos_personalizados} personalizados
              </span>
            </div>
          )}
        </div>
        <Icon
          name="ChevronRight"
          size={14}
          className={`transition-colors ${isSelected ? 'text-green-500' : 'text-gray-400'}`}
        />
      </div>
    </div>
  );
});

const UserButtonsSection = memo(({
  element,
  elementType,
  menuId,
  submenuId,
  opcionId,
  toggleButtonPermission,
  removeCustomization,
  savingPermissions
}) => {
  if (!hasDirectWindowBotones(element, elementType) || !element.botones) {
    return null;
  }

  const getElementInfo = () => {
    switch (elementType) {
      case 'menu':
        return {
          title: 'Botones del Menú (Ventana Directa)',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          icon: 'Square'
        };
      case 'submenu':
        return {
          title: 'Botones del Submenú (Ventana Directa)',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600',
          icon: 'Circle'
        };
      case 'option':
        return {
          title: 'Botones de la Opción (Ventana Directa)',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          icon: 'Hexagon'
        };
    }
  };

  const elementInfo = getElementInfo();

  return (
    <div className="mt-2">
      <div className={`${elementInfo.bgColor} border ${elementInfo.borderColor} rounded p-3`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Icon name={elementInfo.icon} size={14} className={`mr-2 ${elementInfo.iconColor}`} />
            <span className={`text-sm font-medium ${elementInfo.iconColor.replace('text-', 'text-').replace('-600', '-900')}`}>
              {elementInfo.title}
            </span>
          </div>
          <span className="text-xs text-gray-500 px-2 py-1 bg-white rounded border">
            {element.botones.length} botones
          </span>
        </div>

        <div className="space-y-3">
          {element.botones.map((boton, botonIndex) => {
            const hasEffectivePermission = boton.has_permission === true;
            const profilePermission = boton.profile_permission === true;
            const isCustomized = boton.is_customized === true;
            const customizationType = boton.customization_type;

            return (
              <CrudButton
                key={`${elementType}-${menuId}-${submenuId}-${opcionId}-boton-${boton.bot_id}-${botonIndex}`}
                boton={boton}
                hasEffectivePermission={hasEffectivePermission}
                profilePermission={profilePermission}
                isCustomized={isCustomized}
                customizationType={customizationType}
                onGrantPermission={() => toggleButtonPermission(menuId, submenuId, opcionId, boton.bot_id, 'C')}
                onDenyPermission={() => toggleButtonPermission(menuId, submenuId, opcionId, boton.bot_id, 'D')}
                onRemoveCustomization={() => removeCustomization(menuId, submenuId, opcionId, boton.bot_id)}
                savingPermissions={savingPermissions}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

const UserButtonPermissionTree = memo(({
  menuStructure,
  toggleButtonPermission,
  removeCustomization,
  savingPermissions,
  expandedMenus,
  expandedSubmenus,
  toggleMenuExpansion,
  toggleSubmenuExpansion
}) => {
  return (
    <div className="space-y-3">
      {menuStructure.map((menu, menuIndex) => {
        const isMenuExpanded = expandedMenus.has(menu.men_id);
        const menuHasBotones = hasDirectWindowBotones(menu, 'menu');
        const hasSubmenus = menu.submenus && menu.submenus.length > 0;

        return (
          <div key={`user-menu-${menu.men_id}-${menuIndex}`} className="mb-3">
            {/* Menú Principal */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center flex-1">
                {(hasSubmenus || menuHasBotones) && (
                  <button
                    onClick={() => toggleMenuExpansion(menu.men_id)}
                    className="mr-2 p-1 hover:bg-gray-200 rounded"
                    disabled={savingPermissions}
                    type="button"
                  >
                    <Icon
                      name={isMenuExpanded ? 'ChevronDown' : 'ChevronRight'}
                      size={14}
                      className="text-gray-500"
                    />
                  </button>
                )}

                <div className="flex items-center flex-1">
                  {menu.ico_nombre && (
                    <Icon name={menu.ico_nombre} size={16} className="mr-2 text-gray-600" />
                  )}
                  <span className="font-medium text-gray-900">{menu.men_nom}</span>

                  <div className="ml-3 flex gap-1 items-center">
                    {isDirectWindow(menu, 'menu') && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs border border-red-200">
                        🪟 Ventana Directa
                      </span>
                    )}
                    {menuHasBotones && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {menu.botones.length} botones
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido expandido */}
            {isMenuExpanded && (
              <div className="ml-6 mt-2 space-y-2">
                {/* Botones del menú */}
                {menuHasBotones && (
                  <UserButtonsSection
                    element={menu}
                    elementType="menu"
                    menuId={menu.men_id}
                    submenuId={null}
                    opcionId={null}
                    toggleButtonPermission={toggleButtonPermission}
                    removeCustomization={removeCustomization}
                    savingPermissions={savingPermissions}
                  />
                )}

                {/* Submenús */}
                {hasSubmenus && menu.submenus.map((submenu, submenuIndex) => {
                  const isSubmenuExpanded = expandedSubmenus.has(submenu.sub_id);
                  const submenuHasBotones = hasDirectWindowBotones(submenu, 'submenu');
                  const hasOptions = submenu.opciones && submenu.opciones.length > 0;

                  return (
                    <div key={`user-submenu-${submenu.sub_id}-${submenuIndex}`} className="border-l-2 border-purple-200 pl-4">
                      {/* Submenú */}
                      <div className="flex items-center justify-between p-2 bg-purple-50 rounded border">
                        <div className="flex items-center flex-1">
                          {(hasOptions || submenuHasBotones) && (
                            <button
                              onClick={() => toggleSubmenuExpansion(submenu.sub_id)}
                              className="mr-2 p-1 hover:bg-purple-100 rounded"
                              disabled={savingPermissions}
                              type="button"
                            >
                              <Icon
                                name={isSubmenuExpanded ? 'ChevronDown' : 'ChevronRight'}
                                size={12}
                                className="text-purple-600"
                              />
                            </button>
                          )}

                          <div className="flex items-center flex-1">
                            {submenu.ico_nombre && (
                              <Icon name={submenu.ico_nombre} size={14} className="mr-2 text-purple-600" />
                            )}
                            <span className="text-sm font-medium text-purple-900">{submenu.sub_nom}</span>

                            <div className="ml-3 flex gap-1 items-center">
                              {isDirectWindow(submenu, 'submenu') && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs border border-orange-200">
                                  🪟 Ventana Directa
                                </span>
                              )}
                              {submenuHasBotones && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                                  {submenu.botones.length} botones
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contenido del submenú */}
                      {isSubmenuExpanded && (
                        <div className="ml-4 mt-2 space-y-2">
                          {/* Botones del submenú */}
                          {submenuHasBotones && (
                            <UserButtonsSection
                              element={submenu}
                              elementType="submenu"
                              menuId={menu.men_id}
                              submenuId={submenu.sub_id}
                              opcionId={null}
                              toggleButtonPermission={toggleButtonPermission}
                              removeCustomization={removeCustomization}
                              savingPermissions={savingPermissions}
                            />
                          )}

                          {/* Opciones */}
                          {hasOptions && submenu.opciones.map((opcion, opcionIndex) => {
                            const opcionHasBotones = hasDirectWindowBotones(opcion, 'option');

                            if (!opcionHasBotones) return null;

                            return (
                              <div key={`user-opcion-${opcion.opc_id}-${opcionIndex}`} className="bg-green-50 border border-green-200 rounded p-3">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center">
                                    {opcion.ico_nombre && (
                                      <Icon name={opcion.ico_nombre} size={14} className="mr-2 text-green-600" />
                                    )}
                                    <span className="text-sm font-medium text-green-900">{opcion.opc_nom}</span>

                                    <div className="ml-3">
                                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs border border-green-200">
                                        🪟 Ventana Directa
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <UserButtonsSection
                                  element={opcion}
                                  elementType="option"
                                  menuId={menu.men_id}
                                  submenuId={submenu.sub_id}
                                  opcionId={opcion.opc_id}
                                  toggleButtonPermission={toggleButtonPermission}
                                  removeCustomization={removeCustomization}
                                  savingPermissions={savingPermissions}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

// ===== COMPONENTE PRINCIPAL =====
const AsigPerBotUserWindow = ({ showMessage }) => {
  // ===== ESTADOS =====
  const [perfiles, setPerfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [menuStructure, setMenuStructure] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [expandedSubmenus, setExpandedSubmenus] = useState(new Set());

  // ===== HANDLERS =====
  const handleProfileSelect = useCallback(async (perfil) => {
    setSelectedProfile(perfil);
    setSelectedUser(null);
    setMenuStructure([]);

    await loadUsersByProfile(perfil.per_id);
  }, []);

  const handleUserSelect = useCallback(async (usuario) => {
    setSelectedUser(usuario);
    await loadUserButtonPermissions(usuario.usu_id);
  }, []);

  // ===== CARGAR DATOS =====
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminService.permissions.getProfiles();
      if (result.status === 'success') {
        setPerfiles(result.perfiles || []);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      showMessage('error', 'Error al cargar perfiles');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const loadUsersByProfile = useCallback(async (perfilId) => {
    if (!perfilId) return;

    setLoadingUsers(true);
    try {
      const result = await adminService.userButtonPermissions.getUsersByProfile(perfilId);
      if (result.status === 'success') {
        setUsuarios(result.usuarios || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('error', 'Error al cargar usuarios del perfil');
    } finally {
      setLoadingUsers(false);
    }
  }, [showMessage]);

  const loadUserButtonPermissions = useCallback(async (usuarioId) => {
    if (!usuarioId) return;

    setLoadingPermissions(true);
    try {
      console.log('🔍 Cargando permisos para usuario:', usuarioId);

      const result = await adminService.userButtonPermissions.getUserButtonPermissions(usuarioId);

      console.log('📥 Respuesta de permisos:', result);

      if (result.success) {
        console.log('✅ Estructura de menús cargada:', result.menuStructure);
        setMenuStructure(result.menuStructure || []);

        if (result.summary) {
          console.log('📊 Estadísticas de permisos:', result.summary);
        }
      } else {
        console.error('❌ Error en respuesta:', result);
        throw new Error(result.message || 'Error al cargar permisos');
      }
    } catch (error) {
      console.error('❌ Error loading user permissions:', error);
      showMessage('error', 'Error al cargar permisos del usuario: ' + error.message);
    } finally {
      setLoadingPermissions(false);
    }
  }, [showMessage]);

  // ===== MANEJO DE PERMISOS CON NOTIFICACIÓN GLOBAL =====
  const toggleButtonPermission = useCallback(async (menId, subId, opcId, botId, permTipo) => {
    if (!selectedUser) return;

    setSavingPermissions(true);
    try {
      console.log('🔄 Cambiando permiso:', {
        usuario: selectedUser.usu_id,
        modulo: { menId, subId, opcId },
        boton: botId,
        tipo: permTipo
      });

      const requestData = {
        usu_id: selectedUser.usu_id,
        men_id: menId,
        sub_id: subId,
        opc_id: opcId,
        bot_id: botId,
        perm_tipo: permTipo,
        observaciones: `Personalizado por administrador`
      };

      const result = await adminService.userButtonPermissions.toggleUserButtonPermission(requestData);

      if (result.status === 'success') {
        console.log('✅ Permiso actualizado correctamente');

        // ✅ CRÍTICO: Notificar cambio global para sincronización
        const changedButton = menuStructure
          .flatMap(menu => [
            ...(menu.botones || []),
            ...(menu.submenus || []).flatMap(submenu => [
              ...(submenu.botones || []),
              ...(submenu.opciones || []).flatMap(opcion => opcion.botones || [])
            ])
          ])
          .find(btn => btn.bot_id === botId);

        if (changedButton) {
          console.log('🔔 Notificando cambio de permiso:', {
            buttonCode: changedButton.bot_codigo,
            buttonName: changedButton.bot_nom,
            userId: selectedUser.usu_id,
            newPermission: permTipo === 'C',
            actionType: 'permission_changed'
          });

          // ✅ SINCRONIZACIÓN GLOBAL
          window.permissionChangeNotifier.notify({
            type: 'permission_changed',
            userId: selectedUser.usu_id,
            buttonCode: changedButton.bot_codigo,
            buttonName: changedButton.bot_nom,
            newPermission: permTipo === 'C',
            isCustomized: true,
            customizationType: permTipo,
            timestamp: Date.now()
          });
        }

        await loadUserButtonPermissions(selectedUser.usu_id);

        if (selectedProfile) {
          await loadUsersByProfile(selectedProfile.per_id);
        }

        showMessage('success', result.message || 'Permiso actualizado correctamente');
      } else {
        throw new Error(result.message || 'Error al actualizar permiso');
      }
    } catch (error) {
      console.error('❌ Error toggling permission:', error);
      showMessage('error', 'Error al modificar permiso: ' + error.message);
    } finally {
      setSavingPermissions(false);
    }
  }, [selectedUser, selectedProfile, loadUserButtonPermissions, loadUsersByProfile, showMessage, menuStructure]);

  const removeCustomization = useCallback(async (menId, subId, opcId, botId) => {
    if (!selectedUser) return;

    setSavingPermissions(true);
    try {
      const result = await adminService.userButtonPermissions.removeUserCustomization({
        usu_id: selectedUser.usu_id,
        men_id: menId,
        sub_id: subId,
        opc_id: opcId,
        bot_id: botId
      });

      if (result.status === 'success') {
        console.log('✅ Personalización removida correctamente');

        // ✅ CRÍTICO: Notificar eliminación de personalización
        const changedButton = menuStructure
          .flatMap(menu => [
            ...(menu.botones || []),
            ...(menu.submenus || []).flatMap(submenu => [
              ...(submenu.botones || []),
              ...(submenu.opciones || []).flatMap(opcion => opcion.botones || [])
            ])
          ])
          .find(btn => btn.bot_id === botId);

        if (changedButton) {
          console.log('🔔 Notificando eliminación de personalización:', {
            buttonCode: changedButton.bot_codigo,
            userId: selectedUser.usu_id,
            actionType: 'customization_removed'
          });

          // ✅ SINCRONIZACIÓN GLOBAL
          window.permissionChangeNotifier.notify({
            type: 'customization_removed',
            userId: selectedUser.usu_id,
            buttonCode: changedButton.bot_codigo,
            buttonName: changedButton.bot_nom,
            newPermission: changedButton.profile_permission, // Vuelve al permiso del perfil
            isCustomized: false,
            customizationType: null,
            timestamp: Date.now()
          });
        }

        await loadUserButtonPermissions(selectedUser.usu_id);
        showMessage('success', result.message);
      }
    } catch (error) {
      console.error('Error removing customization:', error);
      showMessage('error', 'Error al remover personalización: ' + error.message);
    } finally {
      setSavingPermissions(false);
    }
  }, [selectedUser, loadUserButtonPermissions, showMessage, menuStructure]);

  // ===== ACCIONES ADICIONALES =====
  const resetAllCustomizations = useCallback(async () => {
    if (!selectedUser) return;

    const confirmReset = window.confirm(
      `¿Estás seguro de que deseas eliminar TODAS las personalizaciones de ${selectedUser.usu_nom} ${selectedUser.usu_ape}?\n\n` +
      'El usuario volverá a heredar únicamente los permisos de su perfil.'
    );

    if (!confirmReset) return;

    setSavingPermissions(true);
    try {
      const result = await adminService.userButtonPermissions.resetUserCustomizations(selectedUser.usu_id);

      if (result.status === 'success') {
        console.log('✅ Todas las personalizaciones reseteadas');

        // ✅ CRÍTICO: Notificar reset completo
        console.log('🔔 Notificando reset completo de permisos:', {
          userId: selectedUser.usu_id,
          actionType: 'full_reset'
        });

        // ✅ SINCRONIZACIÓN GLOBAL - RESET COMPLETO
        window.permissionChangeNotifier.notify({
          type: 'full_reset',
          userId: selectedUser.usu_id,
          userName: `${selectedUser.usu_nom} ${selectedUser.usu_ape}`,
          timestamp: Date.now()
        });

        await loadUserButtonPermissions(selectedUser.usu_id);
        await loadUsersByProfile(selectedProfile.per_id);
        showMessage('success', result.message);
      }
    } catch (error) {
      console.error('Error resetting customizations:', error);
      showMessage('error', 'Error al resetear personalizaciones: ' + error.message);
    } finally {
      setSavingPermissions(false);
    }
  }, [selectedUser, selectedProfile, loadUserButtonPermissions, loadUsersByProfile, showMessage]);

  // ===== MANEJO DE EXPANSIÓN =====
  const toggleMenuExpansion = useCallback((menuId) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  }, []);

  const toggleSubmenuExpansion = useCallback((submenuId) => {
    setExpandedSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submenuId)) {
        newSet.delete(submenuId);
      } else {
        newSet.add(submenuId);
      }
      return newSet;
    });
  }, []);

  const expandAllMenus = useCallback(() => {
    const allMenuIds = new Set(menuStructure.map(menu => menu.men_id));
    const allSubmenuIds = new Set();

    menuStructure.forEach(menu => {
      if (menu.submenus) {
        menu.submenus.forEach(submenu => {
          allSubmenuIds.add(submenu.sub_id);
        });
      }
    });

    setExpandedMenus(allMenuIds);
    setExpandedSubmenus(allSubmenuIds);
  }, [menuStructure]);

  const collapseAllMenus = useCallback(() => {
    setExpandedMenus(new Set());
    setExpandedSubmenus(new Set());
  }, []);

  // ===== EFECTOS =====
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // ===== ESTADÍSTICAS =====
  const userStats = useMemo(() => {
    if (!menuStructure.length) return { total: 0, customized: 0, granted: 0, denied: 0 };

    let total = 0;
    let customized = 0;
    let granted = 0;
    let denied = 0;

    const countButtons = (botones) => {
      if (!botones) return;

      botones.forEach(boton => {
        total++;
        if (boton.is_customized) {
          customized++;
          if (boton.customization_type === 'C') granted++;
          else denied++;
        }
      });
    };

    menuStructure.forEach(menu => {
      countButtons(menu.botones);
      if (menu.submenus) {
        menu.submenus.forEach(submenu => {
          countButtons(submenu.botones);
          if (submenu.opciones) {
            submenu.opciones.forEach(opcion => {
              countButtons(opcion.botones);
            });
          }
        });
      }
    });

    return { total, customized, granted, denied };
  }, [menuStructure]);

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      {/* Panel 1: Lista de perfiles */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Icon name="Shield" size={20} className="mr-2" />
          Perfiles
        </h3>

        <div className="space-y-3">
          {perfiles.map((perfil) => (
            <ProfileCard
              key={`perfil-${perfil.per_id}`}
              perfil={perfil}
              isSelected={selectedProfile?.per_id === perfil.per_id}
              onClick={handleProfileSelect}
              usuariosCount={perfil.usuarios_count}
            />
          ))}
        </div>
      </div>

      {/* Panel 2: Lista de usuarios del perfil */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {selectedProfile ? (
          <>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Icon name="Users" size={20} className="mr-2" />
              Usuarios de {selectedProfile.per_nom}
            </h3>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {usuarios.map((usuario) => (
                  <UserCard
                    key={`usuario-${usuario.usu_id}`}
                    usuario={usuario}
                    isSelected={selectedUser?.usu_id === usuario.usu_id}
                    onClick={handleUserSelect}
                  />
                ))}
                {usuarios.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Icon name="Users" size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No hay usuarios en este perfil</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Icon name="Shield" size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Seleccione un perfil</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel 3: Permisos de botones del usuario */}
      <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Icon name="Settings" size={20} className="mr-2" />
                  Permisos: {selectedUser.usu_nom} {selectedUser.usu_ape}
                </h3>
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <span>Botones totales: {userStats.total}</span>
                  <span className="ml-3">Personalizados: {userStats.customized}</span>
                  <span className="ml-3 text-green-600">Concedidos: {userStats.granted}</span>
                  <span className="ml-3 text-red-600">Denegados: {userStats.denied}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={expandAllMenus}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                  disabled={savingPermissions}
                >
                  <Icon name="Maximize" size={14} className="mr-1" />
                  Expandir todo
                </button>
                <button
                  onClick={collapseAllMenus}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                  disabled={savingPermissions}
                >
                  <Icon name="Minimize" size={14} className="mr-1" />
                  Colapsar todo
                </button>
                {userStats.customized > 0 && (
                  <button
                    onClick={resetAllCustomizations}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                    disabled={savingPermissions}
                    title="Eliminar todas las personalizaciones"
                  >
                    <Icon name="RotateCcw" size={14} className="mr-1" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-auto">
              {loadingPermissions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">Cargando permisos del usuario...</p>
                  </div>
                </div>
              ) : menuStructure.length > 0 ? (
                <UserButtonPermissionTree
                  menuStructure={menuStructure}
                  toggleButtonPermission={toggleButtonPermission}
                  removeCustomization={removeCustomization}
                  savingPermissions={savingPermissions}
                  expandedMenus={expandedMenus}
                  expandedSubmenus={expandedSubmenus}
                  toggleMenuExpansion={toggleMenuExpansion}
                  toggleSubmenuExpansion={toggleSubmenuExpansion}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No hay ventanas directas con botones disponibles</p>
                  <p className="text-sm mt-1">El usuario hereda permisos de su perfil</p>
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-left">
                    <p className="text-sm text-blue-800"><strong>¿Cómo funciona la personalización?</strong></p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• <strong>Herencia:</strong> El usuario hereda todos los permisos de su perfil</li>
                      <li>• <strong>Personalización:</strong> Puedes conceder o denegar permisos específicos</li>
                      <li>• <strong>Prioridad:</strong> Los permisos personalizados sobrescriben los del perfil</li>
                      <li>• <strong>Reset:</strong> Puedes quitar personalizaciones para volver a la herencia</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Indicador de guardado */}
            {savingPermissions && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 text-sm">Guardando cambios...</span>
              </div>
            )}
          </>
        ) : selectedProfile ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Icon name="User" size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Seleccione un usuario para configurar permisos</p>
              <p className="text-sm mt-1">Los usuarios heredan permisos de su perfil</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Icon name="Settings" size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Seleccione un perfil y usuario</p>
              <p className="text-sm mt-1">Para personalizar permisos individuales</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsigPerBotUserWindow;