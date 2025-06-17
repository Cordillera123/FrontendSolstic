// src/components/Windows/AsigPerBotWindow.jsx - CORREGIDO PARA VENTANAS DIRECTAS CON ICONOS CRUD
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { adminService } from '../../services/apiService';
import Icon from '../UI/Icon';

// ===== UTILIDADES PARA ICONOS CRUD =====
const getCrudIconInfo = (buttonCode, buttonName) => {
  const code = buttonCode?.toLowerCase() || '';
  const name = buttonName?.toLowerCase() || '';
  
  // Mapeo específico por código de botón
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
    'actualizar': { icon: 'Edit3', color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Actualizar' },
    'update': { icon: 'Edit3', color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', tooltip: 'Actualizar' },
    
    'eliminar': { icon: 'Trash2', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', tooltip: 'Eliminar registro' },
    'borrar': { icon: 'Trash2', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', tooltip: 'Borrar registro' },
    'delete': { icon: 'Trash2', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', tooltip: 'Eliminar' },
    'remove': { icon: 'Trash2', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', tooltip: 'Remover' },
    
    'guardar': { icon: 'Save', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Guardar cambios' },
    'save': { icon: 'Save', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Guardar' },
    
    'cancelar': { icon: 'X', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Cancelar operación' },
    'cancel': { icon: 'X', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Cancelar' },
    
    // Operaciones de visualización
    'ver': { icon: 'Eye', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Ver detalles' },
    'view': { icon: 'Eye', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Ver' },
    'mostrar': { icon: 'Eye', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Mostrar' },
    'detalles': { icon: 'FileText', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Ver detalles' },
    'consultar': { icon: 'Eye', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Consultar' },
    'read': { icon: 'Eye', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Leer' },
    
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
    
    // Operaciones de navegación
    'anterior': { icon: 'ChevronLeft', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Anterior' },
    'siguiente': { icon: 'ChevronRight', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Siguiente' },
    'primero': { icon: 'ChevronsLeft', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Primero' },
    'ultimo': { icon: 'ChevronsRight', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', tooltip: 'Último' },
    
    // Operaciones de refrescar/actualizar
    'refrescar': { icon: 'RefreshCw', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Refrescar datos' },
    'refresh': { icon: 'RefreshCw', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Refrescar' },
    
    // Operaciones de ayuda
    'ayuda': { icon: 'HelpCircle', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Ayuda' },
    'help': { icon: 'HelpCircle', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', tooltip: 'Ayuda' },
    
    // Operaciones de correo/comunicación
    'enviar': { icon: 'Send', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Enviar' },
    'email': { icon: 'Mail', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Enviar email' },
    'correo': { icon: 'Mail', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', tooltip: 'Correo electrónico' },
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
const CrudButtonProfile = memo(({ 
  boton, 
  hasPermission, 
  onTogglePermission,
  savingPermissions,
  elementType = 'option'
}) => {
  const iconInfo = getCrudIconInfo(boton.bot_codigo, boton.bot_nom);
  
  const getElementColors = () => {
    switch (elementType) {
      case 'menu':
        return { 
          activeColor: 'border-red-300 bg-red-100', 
          inactiveColor: 'border-gray-200 bg-gray-50',
          checkboxColor: 'text-red-600 focus:ring-red-500'
        };
      case 'submenu':
        return { 
          activeColor: 'border-orange-300 bg-orange-100', 
          inactiveColor: 'border-gray-200 bg-gray-50',
          checkboxColor: 'text-orange-600 focus:ring-orange-500'
        };
      case 'option':
        return { 
          activeColor: 'border-green-300 bg-green-100', 
          inactiveColor: 'border-gray-200 bg-gray-50',
          checkboxColor: 'text-green-600 focus:ring-green-500'
        };
    }
  };

  const elementColors = getElementColors();

  return (
    <div className={`p-3 rounded-lg border transition-all ${
      hasPermission ? elementColors.activeColor : elementColors.inactiveColor
    }`}>
      <div className="flex items-center justify-between">
        {/* Icono y información del botón */}
        <div className="flex items-center flex-1">
          <div 
            className={`p-2 rounded-lg mr-3 ${iconInfo.bgColor} border border-opacity-30`}
            style={{ borderColor: iconInfo.color }}
            title={iconInfo.tooltip}
          >
            <Icon 
              name={iconInfo.icon} 
              size={14} 
              style={{ color: iconInfo.color }}
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                hasPermission ? iconInfo.textColor : 'text-gray-700'
              }`}>
                {boton.bot_nom}
              </span>
              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                {boton.bot_codigo}
              </span>
            </div>
            
            {/* Descripción del botón si existe */}
            {boton.bot_descripcion && (
              <p className="text-xs text-gray-500 mt-1">{boton.bot_descripcion}</p>
            )}
          </div>
        </div>

        {/* Checkbox para activar/desactivar */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={hasPermission}
            onChange={onTogglePermission}
            disabled={savingPermissions}
            className={`h-4 w-4 rounded border-gray-300 ${elementColors.checkboxColor}`}
          />
        </label>
      </div>
    </div>
  );
});

// ===== UTILIDADES PARA FILTRADO DE VENTANAS DIRECTAS =====
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
  // ✅ NUEVA LÓGICA: Solo contar botones si el elemento ES ventana directa
  if (!isDirectWindow(element, level)) {
    return false;
  }

  return element.botones && element.botones.length > 0;
};

const hasDirectWindowsAtAnyLevel = (menu) => {
  // ✅ NUEVA LÓGICA: Verificar ventanas directas con botones en cualquier nivel

  // 1. Menú directo con botones
  if (hasDirectWindowBotones(menu, 'menu')) {
    return true;
  }

  // 2. Submenús directos con botones
  if (menu.submenus) {
    for (const submenu of menu.submenus) {
      if (hasDirectWindowBotones(submenu, 'submenu')) {
        return true;
      }

      // 3. Opciones directas con botones
      if (submenu.opciones) {
        for (const opcion of submenu.opciones) {
          if (hasDirectWindowBotones(opcion, 'option')) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

const checkHierarchicalPermission = (profilePermissions, menId, subId = null, opcId = null) => {
  console.log(`🔍 Verificando permisos para Men:${menId}, Sub:${subId}, Opc:${opcId}`);

  // 1. Verificar permiso en el nivel exacto solicitado
  const exactMatch = profilePermissions.some(p =>
    p.men_id === menId &&
    p.sub_id === subId &&
    p.opc_id === opcId
  );

  if (exactMatch) {
    console.log(`✅ Permiso exacto encontrado para Men:${menId}, Sub:${subId}, Opc:${opcId}`);
    return true;
  }

  // 2. Si no hay permiso exacto, verificar niveles superiores (herencia)
  if (opcId !== null) {
    // Para opciones: verificar si tiene permiso al submenú
    const submenuPermission = profilePermissions.some(p =>
      p.men_id === menId &&
      p.sub_id === subId &&
      p.opc_id === null
    );
    if (submenuPermission) {
      console.log(`✅ Permiso heredado de submenú para Men:${menId}, Sub:${subId}, Opc:${opcId}`);
      return true;
    }
  }

  if (subId !== null) {
    // Para submenús: verificar si tiene permiso al menú principal
    const menuPermission = profilePermissions.some(p =>
      p.men_id === menId &&
      p.sub_id === null &&
      p.opc_id === null
    );
    if (menuPermission) {
      console.log(`✅ Permiso heredado de menú para Men:${menId}, Sub:${subId}, Opc:${opcId}`);
      return true;
    }
  }

  console.log(`❌ Sin permisos para Men:${menId}, Sub:${subId}, Opc:${opcId}`);
  return false;
};

// ===== COMPONENTES MEMOIZADOS =====
const ProfileCard = memo(({ perfil, isSelected, onClick }) => {
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
            {perfil.usuarios_count} usuarios
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

const DirectWindowBadge = memo(({ level, isDirectWindow }) => {
  if (!isDirectWindow) return null;

  const colors = {
    menu: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    submenu: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    option: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
  };

  const color = colors[level] || colors.option;

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${color.bg} ${color.text} ${color.border}`}>
      🪟 Ventana Directa
    </span>
  );
});

const ButtonPermissionTreeItem = memo(({
  menu,
  profilePermissions,
  buttonPermissions,
  toggleButtonPermission,
  savingPermissions,
  expandedMenus,
  expandedSubmenus,
  toggleMenuExpansion,
  toggleSubmenuExpansion,
  index
}) => {
  const isMenuExpanded = expandedMenus.has(menu.men_id);

  const handleToggleExpansion = useCallback(() => {
    toggleMenuExpansion(menu.men_id);
  }, [menu.men_id, toggleMenuExpansion]);

  // ✅ VERIFICACIÓN CORREGIDA: Solo mostrar si tiene permisos Y ventanas directas con botones
  const hasMenuPermission = checkHierarchicalPermission(profilePermissions, menu.men_id);
  const menuHasDirectWindows = hasDirectWindowsAtAnyLevel(menu);

  console.log(`📋 Menú ${menu.men_nom} (ID: ${menu.men_id}):`, {
    hasPermission: hasMenuPermission,
    hasDirectWindows: menuHasDirectWindows,
    isDirectWindow: isDirectWindow(menu, 'menu'),
    willShow: hasMenuPermission && menuHasDirectWindows
  });

  // Solo mostrar si tiene permiso Y tiene ventanas directas con botones
  if (!hasMenuPermission || !menuHasDirectWindows) {
    return null;
  }

  const hasSubmenus = menu.submenus && menu.submenus.length > 0;
  const menuIsDirectWindow = isDirectWindow(menu, 'menu');
  const menuHasBotones = hasDirectWindowBotones(menu, 'menu');

  return (
    <div className="mb-3">
      {/* Menú Principal */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center flex-1">
          {(hasSubmenus || menuHasBotones) && (
            <button
              onClick={handleToggleExpansion}
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
            <span className="ml-2 text-xs text-gray-500">ID: {menu.men_id}</span>

            {/* Indicadores */}
            <div className="ml-3 flex gap-1 items-center">
              <DirectWindowBadge level="menu" isDirectWindow={menuIsDirectWindow} />

              {menuHasBotones && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                  {menu.botones.length} botones
                </span>
              )}

              {hasSubmenus && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                  {menu.submenus.length} sub
                </span>
              )}
            </div>
          </div>
        </div>

        <span className="text-xs text-gray-500 px-2 py-1 bg-green-100 rounded">
          ✅ Disponible
        </span>
      </div>

      {/* Contenido expandido */}
      {isMenuExpanded && (
        <div className="ml-6 mt-2 space-y-2">
          {/* Botones directos del menú (solo si es ventana directa) */}
          {menuHasBotones && (
            <MenuButtonsSection
              menu={menu}
              menuId={menu.men_id}
              buttonPermissions={buttonPermissions}
              toggleButtonPermission={toggleButtonPermission}
              savingPermissions={savingPermissions}
            />
          )}

          {/* Submenús */}
          {hasSubmenus && menu.submenus.map((submenu, subIndex) => (
            <SubmenuButtonTreeItem
              key={`menu-${menu.men_id}-${index}-submenu-${submenu.sub_id}-${subIndex}`}
              submenu={submenu}
              menuId={menu.men_id}
              menuIndex={index}
              submenuIndex={subIndex}
              profilePermissions={profilePermissions}
              buttonPermissions={buttonPermissions}
              toggleButtonPermission={toggleButtonPermission}
              savingPermissions={savingPermissions}
              expandedSubmenus={expandedSubmenus}
              toggleSubmenuExpansion={toggleSubmenuExpansion}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ✅ SECCIÓN CORREGIDA: MenuButtonsSection CON ICONOS
const MenuButtonsSection = memo(({ menu, menuId, buttonPermissions, toggleButtonPermission, savingPermissions }) => {
  // ✅ SOLO MOSTRAR SI EL MENÚ ES VENTANA DIRECTA
  if (!isDirectWindow(menu, 'menu') || !menu.botones || menu.botones.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="bg-red-50 border border-red-200 rounded p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Icon name="Square" size={14} className="mr-2 text-red-600" />
            <span className="text-sm font-medium text-red-900">Botones del Menú (Ventana Directa)</span>
          </div>
          <span className="text-xs text-gray-500 px-2 py-1 bg-red-100 rounded">
            {menu.botones.length} botones
          </span>
        </div>

        {/* ✅ USAR COMPONENTE CrudButtonProfile EN LUGAR DEL DISEÑO ANTERIOR */}
        <div className="space-y-2">
          {menu.botones.map((boton, botonIndex) => {
            const hasPermission = buttonPermissions.some(bp =>
              bp.men_id === menuId &&
              !bp.sub_id &&
              !bp.opc_id &&
              bp.bot_id === boton.bot_id
            );

            const handleTogglePermission = () => {
              toggleButtonPermission(menuId, null, null, boton.bot_id, hasPermission);
            };

            return (
              <CrudButtonProfile
                key={`menu-${menuId}-boton-${boton.bot_id}-${botonIndex}`}
                boton={boton}
                hasPermission={hasPermission}
                onTogglePermission={handleTogglePermission}
                savingPermissions={savingPermissions}
                elementType="menu"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

const SubmenuButtonTreeItem = memo(({
  submenu,
  menuId,
  menuIndex,
  submenuIndex,
  profilePermissions,
  buttonPermissions,
  toggleButtonPermission,
  savingPermissions,
  expandedSubmenus,
  toggleSubmenuExpansion
}) => {
  const isSubmenuExpanded = expandedSubmenus.has(submenu.sub_id);

  const handleToggleExpansion = useCallback(() => {
    toggleSubmenuExpansion(submenu.sub_id);
  }, [submenu.sub_id, toggleSubmenuExpansion]);

  // ✅ VERIFICACIÓN CORREGIDA: Solo mostrar si tiene permisos Y es ventana directa con botones
  const hasSubmenuPermission = checkHierarchicalPermission(profilePermissions, menuId, submenu.sub_id);
  const submenuIsDirectWindow = isDirectWindow(submenu, 'submenu');
  const submenuHasBotones = hasDirectWindowBotones(submenu, 'submenu');

  // Verificar si tiene opciones directas con botones
  const hasDirectOptionsWithButtons = submenu.opciones && submenu.opciones.some(opc => hasDirectWindowBotones(opc, 'option'));

  const shouldShow = hasSubmenuPermission && (submenuHasBotones || hasDirectOptionsWithButtons);

  console.log(`📂 Submenú ${submenu.sub_nom} (ID: ${submenu.sub_id}):`, {
    hasPermission: hasSubmenuPermission,
    isDirectWindow: submenuIsDirectWindow,
    hasBotones: submenuHasBotones,
    hasDirectOptionsWithButtons,
    shouldShow
  });

  if (!shouldShow) {
    return null;
  }

  const hasOptions = submenu.opciones && submenu.opciones.length > 0;

  return (
    <div className="border-l-2 border-purple-200 pl-4">
      {/* Submenú */}
      <div className="flex items-center justify-between p-2 bg-purple-50 rounded border">
        <div className="flex items-center flex-1">
          {(hasOptions || submenuHasBotones) && (
            <button
              onClick={handleToggleExpansion}
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
            <span className="ml-2 text-xs text-gray-500">ID: {submenu.sub_id}</span>

            {/* Indicadores */}
            <div className="ml-3 flex gap-1 items-center">
              <DirectWindowBadge level="submenu" isDirectWindow={submenuIsDirectWindow} />

              {submenuHasBotones && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                  {submenu.botones.length} botones
                </span>
              )}

              {hasOptions && (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                  {submenu.opciones.length} opc
                </span>
              )}
            </div>
          </div>
        </div>

        <span className="text-xs text-gray-500 px-2 py-1 bg-green-100 rounded">
          ✅ Disponible
        </span>
      </div>

      {/* Contenido expandido */}
      {isSubmenuExpanded && (
        <div className="ml-4 mt-2 space-y-2">
          {/* Botones directos del submenú (solo si es ventana directa) */}
          {submenuHasBotones && (
            <SubmenuButtonsSection
              submenu={submenu}
              menuId={menuId}
              submenuId={submenu.sub_id}
              buttonPermissions={buttonPermissions}
              toggleButtonPermission={toggleButtonPermission}
              savingPermissions={savingPermissions}
            />
          )}

          {/* Opciones con Botones (solo ventanas directas) */}
          {hasOptions && submenu.opciones.map((opcion, opcionIndex) => {
            // ✅ SOLO MOSTRAR OPCIONES QUE SON VENTANAS DIRECTAS CON BOTONES
            const hasOptionPermission = checkHierarchicalPermission(profilePermissions, menuId, submenu.sub_id, opcion.opc_id);
            const optionHasBotones = hasDirectWindowBotones(opcion, 'option');

            if (!hasOptionPermission || !optionHasBotones) {
              return null;
            }

            return (
              <OptionButtonsTreeItem
                key={`menu-${menuId}-${menuIndex}-submenu-${submenu.sub_id}-${submenuIndex}-opcion-${opcion.opc_id}-${opcionIndex}`}
                opcion={opcion}
                menuId={menuId}
                submenuId={submenu.sub_id}
                menuIndex={menuIndex}
                submenuIndex={submenuIndex}
                opcionIndex={opcionIndex}
                buttonPermissions={buttonPermissions}
                toggleButtonPermission={toggleButtonPermission}
                savingPermissions={savingPermissions}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

const SubmenuButtonsSection = memo(({ submenu, menuId, submenuId, buttonPermissions, toggleButtonPermission, savingPermissions }) => {
  // ✅ SOLO MOSTRAR SI EL SUBMENÚ ES VENTANA DIRECTA
  if (!isDirectWindow(submenu, 'submenu') || !submenu.botones || submenu.botones.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="bg-orange-50 border border-orange-200 rounded p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Icon name="Circle" size={14} className="mr-2 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Botones del Submenú (Ventana Directa)</span>
          </div>
          <span className="text-xs text-gray-500 px-2 py-1 bg-orange-100 rounded">
            {submenu.botones.length} botones
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {submenu.botones.map((boton, botonIndex) => {
            const hasPermission = buttonPermissions.some(bp =>
              bp.men_id === menuId &&
              bp.sub_id === submenuId &&
              !bp.opc_id &&
              bp.bot_id === boton.bot_id
            );

            const handleTogglePermission = () => {
              toggleButtonPermission(menuId, submenuId, null, boton.bot_id, hasPermission);
            };

            return (
              <div
                key={`submenu-${submenuId}-boton-${boton.bot_id}-${botonIndex}`}
                className={`flex items-center justify-between p-2 rounded border ${hasPermission ? 'bg-orange-100 border-orange-300' : 'bg-gray-50 border-gray-200'
                  }`}
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: boton.bot_color || '#6c757d' }}
                  ></div>
                  <span className={`text-sm ${hasPermission ? 'text-orange-900' : 'text-gray-700'}`}>
                    {boton.bot_nom}
                  </span>
                  <span className="ml-2 text-xs text-gray-500 font-mono">
                    {boton.bot_codigo}
                  </span>
                </div>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPermission}
                    onChange={handleTogglePermission}
                    disabled={savingPermissions}
                    className="text-orange-600 focus:ring-2 focus:ring-orange-500"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const OptionButtonsTreeItem = memo(({
  opcion,
  menuId,
  submenuId,
  menuIndex,
  submenuIndex,
  opcionIndex,
  buttonPermissions,
  toggleButtonPermission,
  savingPermissions
}) => {
  const opcionIsDirectWindow = isDirectWindow(opcion, 'option');

  return (
    <div className="bg-green-50 border border-green-200 rounded p-3">
      {/* Header de la opción */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {opcion.ico_nombre && (
            <Icon name={opcion.ico_nombre} size={14} className="mr-2 text-green-600" />
          )}
          <span className="text-sm font-medium text-green-900">{opcion.opc_nom}</span>
          <span className="ml-2 text-xs text-gray-500">ID: {opcion.opc_id}</span>

          <div className="ml-3">
            <DirectWindowBadge level="option" isDirectWindow={opcionIsDirectWindow} />
          </div>
        </div>
        <span className="text-xs text-gray-500 px-2 py-1 bg-green-100 rounded">
          {opcion.botones.length} botones
        </span>
      </div>

      {/* Lista de botones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {opcion.botones.map((boton, botonIndex) => {
          const hasPermission = buttonPermissions.some(bp =>
            bp.men_id === menuId &&
            bp.sub_id === submenuId &&
            bp.opc_id === opcion.opc_id &&
            bp.bot_id === boton.bot_id
          );

          const handleTogglePermission = () => {
            toggleButtonPermission(menuId, submenuId, opcion.opc_id, boton.bot_id, hasPermission);
          };

          return (
            <div
              key={`menu-${menuId}-${menuIndex}-submenu-${submenuId}-${submenuIndex}-opcion-${opcion.opc_id}-${opcionIndex}-boton-${boton.bot_id}-${botonIndex}`}
              className={`flex items-center justify-between p-2 rounded border ${hasPermission ? 'bg-green-100 border-green-300' : 'bg-gray-50 border-gray-200'
                }`}
            >
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded mr-2"
                  style={{ backgroundColor: boton.bot_color || '#6c757d' }}
                ></div>
                <span className={`text-sm ${hasPermission ? 'text-green-900' : 'text-gray-700'}`}>
                  {boton.bot_nom}
                </span>
                <span className="ml-2 text-xs text-gray-500 font-mono">
                  {boton.bot_codigo}
                </span>
              </div>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPermission}
                  onChange={handleTogglePermission}
                  disabled={savingPermissions}
                  className="text-green-600 focus:ring-2 focus:ring-green-500"
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ===== COMPONENTE PRINCIPAL =====
const AsigPerBotWindow = ({ showMessage }) => {
  // ===== ESTADOS =====
  const [perfiles, setPerfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [menuStructure, setMenuStructure] = useState([]);
  const [profilePermissions, setProfilePermissions] = useState([]);
  const [buttonPermissions, setButtonPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [expandedSubmenus, setExpandedSubmenus] = useState(new Set());

  // ===== HANDLERS MEMOIZADOS =====
  const handleProfileSelect = useCallback((perfil) => {
    setSelectedProfile(perfil);
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

  const loadButtonPermissions = useCallback(async (perfilId) => {
    if (!perfilId) return;

    setLoadingPermissions(true);
    try {
      // ✅ CARGAR PERMISOS REGULARES DEL PERFIL
      console.log('🔍 Cargando permisos regulares del perfil:', perfilId);
      const permResult = await adminService.permissions.getMenuStructureWithPermissions(perfilId);
      if (permResult.status === 'success') {
        const flatPermissions = [];
        permResult.menu_structure.forEach(menu => {
          if (menu.has_permission) {
            flatPermissions.push({ men_id: menu.men_id, sub_id: null, opc_id: null });
          }
          if (menu.submenus) {
            menu.submenus.forEach(submenu => {
              if (submenu.has_permission) {
                flatPermissions.push({ men_id: menu.men_id, sub_id: submenu.sub_id, opc_id: null });
              }
              if (submenu.opciones) {
                submenu.opciones.forEach(opcion => {
                  if (opcion.has_permission) {
                    flatPermissions.push({ men_id: menu.men_id, sub_id: submenu.sub_id, opc_id: opcion.opc_id });
                  }
                });
              }
            });
          }
        });
        setProfilePermissions(flatPermissions);
        console.log('✅ Permisos del perfil cargados:', flatPermissions.length);
      }

      // ✅ CARGAR ESTRUCTURA CON BOTONES (SOLO VENTANAS DIRECTAS)
      console.log('🔍 Cargando estructura de botones para ventanas directas:', perfilId);
      const buttonResult = await adminService.buttonPermissions.getProfileButtonPermissions(perfilId);
      console.log('📥 Respuesta buttonPermissions completa:', buttonResult);

      if (buttonResult.status === 'success') {
        const rawMenuStructure = buttonResult.menu_structure || [];
        console.log('📥 Estructura cruda recibida:', rawMenuStructure);

        // ✅ FILTRAR SOLO VENTANAS DIRECTAS CON BOTONES
        const filteredMenuStructure = rawMenuStructure.filter(menu => {
          const hasDirectWindows = hasDirectWindowsAtAnyLevel(menu);
          console.log(`🔍 Menú ${menu.men_nom}: hasDirectWindows=${hasDirectWindows}`);
          return hasDirectWindows;
        });

        setMenuStructure(filteredMenuStructure);
        console.log('✅ Estructura filtrada para ventanas directas:', filteredMenuStructure.length, 'menús');

        // ✅ EXTRAER PERMISOS DE BOTONES DE TODOS LOS NIVELES
        const flatButtonPermissions = [];
        const extractButtonPermissions = (menus) => {
          menus.forEach(menu => {
            // Nivel 1: Botones directos del menú (solo si es ventana directa)
            if (isDirectWindow(menu, 'menu') && menu.botones) {
              menu.botones.forEach(boton => {
                if (boton.has_permission) {
                  flatButtonPermissions.push({
                    men_id: menu.men_id,
                    sub_id: null,
                    opc_id: null,
                    bot_id: boton.bot_id
                  });
                }
              });
            }

            // Nivel 2 y 3: Submenús y opciones
            if (menu.submenus) {
              menu.submenus.forEach(submenu => {
                // Nivel 2: Botones directos del submenú (solo si es ventana directa)
                if (isDirectWindow(submenu, 'submenu') && submenu.botones) {
                  submenu.botones.forEach(boton => {
                    if (boton.has_permission) {
                      flatButtonPermissions.push({
                        men_id: menu.men_id,
                        sub_id: submenu.sub_id,
                        opc_id: null,
                        bot_id: boton.bot_id
                      });
                    }
                  });
                }

                // Nivel 3: Botones de opciones (solo si son ventanas directas)
                if (submenu.opciones) {
                  submenu.opciones.forEach(opcion => {
                    if (isDirectWindow(opcion, 'option') && opcion.botones) {
                      opcion.botones.forEach(boton => {
                        if (boton.has_permission) {
                          flatButtonPermissions.push({
                            men_id: menu.men_id,
                            sub_id: submenu.sub_id,
                            opc_id: opcion.opc_id,
                            bot_id: boton.bot_id
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        };

        extractButtonPermissions(filteredMenuStructure);
        setButtonPermissions(flatButtonPermissions);
        console.log('✅ Permisos de botones extraídos (solo ventanas directas):', flatButtonPermissions.length);
      } else {
        console.log('⚠️ No se encontraron permisos de botones para ventanas directas');
        setMenuStructure([]);
        setButtonPermissions([]);
      }
    } catch (error) {
      console.error('❌ Error loading button permissions:', error);
      showMessage('error', 'Error al cargar permisos de botones: ' + (error.message || 'Error desconocido'));
      setMenuStructure([]);
      setButtonPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  }, [showMessage]);

  // ===== EFECTOS =====
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (selectedProfile) {
      console.log('🔄 Perfil seleccionado cambiado:', selectedProfile.per_nom, selectedProfile.per_id);
      loadButtonPermissions(selectedProfile.per_id);
    } else {
      // Limpiar datos cuando no hay perfil seleccionado
      setMenuStructure([]);
      setProfilePermissions([]);
      setButtonPermissions([]);
    }
  }, [selectedProfile, loadButtonPermissions]);

  // ===== MANEJO DE PERMISOS =====
  const toggleButtonPermission = useCallback(async (menId, subId, opcId, botId, currentState) => {
    // 🔍 DEBUG TEMPORAL - Eliminar después de probar
    console.log('🔍 Datos que se envían al backend:', {
      per_id: selectedProfile.per_id,
      men_id: menId,
      sub_id: subId,
      opc_id: opcId,
      bot_id: botId,
      grant_permission: !currentState,
      tipo_elemento: subId ? (opcId ? 'Opción' : 'Submenú') : 'Menú'
    });
    if (!selectedProfile) return;

    setSavingPermissions(true);
    try {
      console.log('🔄 Cambiando permiso de botón:', {
        per_id: selectedProfile.per_id,
        men_id: menId,
        sub_id: subId,
        opc_id: opcId,
        bot_id: botId,
        grant_permission: !currentState
      });

      const result = await adminService.buttonPermissions.toggleButtonPermission({
        per_id: selectedProfile.per_id,
        men_id: menId,
        sub_id: subId,
        opc_id: opcId,
        bot_id: botId,
        grant_permission: !currentState
      });

      if (result.status === 'success') {
        await loadButtonPermissions(selectedProfile.per_id);
        showMessage('success', result.message || 'Permiso de botón actualizado correctamente');
      }
    } catch (error) {
      console.error('❌ Error toggling button permission:', error);
      showMessage('error', 'Error al modificar permiso de botón: ' + (error.message || 'Error desconocido'));
    } finally {
      setSavingPermissions(false);
    }
  }, [selectedProfile, loadButtonPermissions, showMessage]);

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

  // ===== ACCIONES MASIVAS =====
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

  // ===== ESTADÍSTICAS MEJORADAS =====
  const buttonStats = useMemo(() => {
    if (!menuStructure.length) return { total: 0, granted: 0, percentage: 0, byLevel: { menu: 0, submenu: 0, option: 0 } };

    let total = 0;
    let granted = 0;
    const byLevel = { menu: 0, submenu: 0, option: 0 };

    menuStructure.forEach(menu => {
      // Botones de menú (nivel 1) - solo si es ventana directa
      if (isDirectWindow(menu, 'menu') && menu.botones) {
        menu.botones.forEach(boton => {
          total++;
          byLevel.menu++;
          if (buttonPermissions.some(bp =>
            bp.men_id === menu.men_id &&
            !bp.sub_id &&
            !bp.opc_id &&
            bp.bot_id === boton.bot_id
          )) {
            granted++;
          }
        });
      }

      // Botones de submenús y opciones
      if (menu.submenus) {
        menu.submenus.forEach(submenu => {
          // Botones de submenú (nivel 2) - solo si es ventana directa
          if (isDirectWindow(submenu, 'submenu') && submenu.botones) {
            submenu.botones.forEach(boton => {
              total++;
              byLevel.submenu++;
              if (buttonPermissions.some(bp =>
                bp.men_id === menu.men_id &&
                bp.sub_id === submenu.sub_id &&
                !bp.opc_id &&
                bp.bot_id === boton.bot_id
              )) {
                granted++;
              }
            });
          }

          // Botones de opciones (nivel 3) - solo si son ventanas directas
          if (submenu.opciones) {
            submenu.opciones.forEach(opcion => {
              if (isDirectWindow(opcion, 'option') && opcion.botones) {
                opcion.botones.forEach(boton => {
                  total++;
                  byLevel.option++;
                  if (buttonPermissions.some(bp =>
                    bp.men_id === menu.men_id &&
                    bp.sub_id === submenu.sub_id &&
                    bp.opc_id === opcion.opc_id &&
                    bp.bot_id === boton.bot_id
                  )) {
                    granted++;
                  }
                });
              }
            });
          }
        });
      }
    });

    return {
      total,
      granted,
      percentage: total > 0 ? Math.round((granted / total) * 100) : 0,
      byLevel
    };
  }, [menuStructure, buttonPermissions]);

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Lista de perfiles */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Icon name="Settings" size={20} className="mr-2" />
          Permisos de Botones
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Solo Ventanas Directas
          </span>
        </h3>

        <div className="space-y-3">
          {perfiles.map((perfil) => (
            <ProfileCard
              key={`perfil-${perfil.per_id}`}
              perfil={perfil}
              isSelected={selectedProfile?.per_id === perfil.per_id}
              onClick={handleProfileSelect}
            />
          ))}
        </div>

        {perfiles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Icon name="Shield" size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay perfiles disponibles</p>
          </div>
        )}
      </div>

      {/* Panel de permisos de botones */}
      <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
        {selectedProfile ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Icon name="Settings" size={20} className="mr-2" />
                  Permisos de Botones: {selectedProfile.per_nom}
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    🪟 Solo Ventanas Directas
                  </span>
                </h3>
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <span>Botones con permiso: {buttonStats.granted}/{buttonStats.total}</span>
                  <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {buttonStats.percentage}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex gap-4">
                  <span>Menús directos: {buttonStats.byLevel.menu}</span>
                  <span>Submenús directos: {buttonStats.byLevel.submenu}</span>
                  <span>Opciones directas: {buttonStats.byLevel.option}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
                    <span>Menús Directos</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-100 rounded mr-2"></div>
                    <span>Submenús Directos</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                    <span>Opciones Directas</span>
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="flex gap-2">
                  <button
                    onClick={expandAllMenus}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                    disabled={savingPermissions || loadingPermissions}
                    type="button"
                  >
                    <Icon name="Maximize" size={14} className="mr-1" />
                    Expandir
                  </button>
                  <button
                    onClick={collapseAllMenus}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                    disabled={savingPermissions || loadingPermissions}
                    type="button"
                  >
                    <Icon name="Minimize" size={14} className="mr-1" />
                    Colapsar
                  </button>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-auto">
              {loadingPermissions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">Cargando permisos de botones para ventanas directas...</p>
                  </div>
                </div>
              ) : menuStructure.length > 0 ? (
                <div className="space-y-3">
                  {menuStructure.map((menu, index) => (
                    <ButtonPermissionTreeItem
                      key={`menu-tree-${menu.men_id}-index-${index}-${Date.now()}`}
                      menu={menu}
                      index={index}
                      profilePermissions={profilePermissions}
                      buttonPermissions={buttonPermissions}
                      toggleButtonPermission={toggleButtonPermission}
                      savingPermissions={savingPermissions}
                      expandedMenus={expandedMenus}
                      expandedSubmenus={expandedSubmenus}
                      toggleMenuExpansion={toggleMenuExpansion}
                      toggleSubmenuExpansion={toggleSubmenuExpansion}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No hay ventanas directas con botones disponibles</p>
                  <p className="text-sm mt-1">Las ventanas directas son formularios que se abren sin navegación</p>
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-left">
                    <p className="text-sm text-blue-800"><strong>¿Qué son las ventanas directas?</strong></p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• <strong>Menús directos:</strong> Se abren inmediatamente como formularios</li>
                      <li>• <strong>Submenús directos:</strong> Abren un formulario sin mostrar opciones</li>
                      <li>• <strong>Opciones directas:</strong> Formularios CRUD tradicionales</li>
                    </ul>
                    <p className="text-sm text-blue-800 mt-3"><strong>Configuración:</strong></p>
                    <p className="text-sm text-blue-700 mt-1">
                      Para que aparezcan aquí, deben tener el campo <code className="bg-blue-100 px-1 rounded">*_ventana_directa = true</code>
                      y tener botones asignados.
                    </p>
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
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Icon name="Settings" size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Seleccione un perfil para configurar permisos de botones</p>
              <p className="text-sm mt-1">Solo se mostrarán ventanas directas con botones</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsigPerBotWindow;