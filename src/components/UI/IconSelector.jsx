// src/components/UI/IconSelector.jsx - VERSIÓN LIMPIA FINAL
import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Función para obtener dinámicamente cualquier icono de Lucide
const getLucideIcon = (iconName) => {
    if (!iconName) return null;
    
    // Intentar diferentes variaciones del nombre del icono
    const variations = [
        iconName,                                    // Exacto como está en BD
        iconName.charAt(0).toUpperCase() + iconName.slice(1), // Primera letra mayúscula
        iconName.toLowerCase(),                      // Todo minúscula
        iconName.toUpperCase(),                      // Todo mayúscula
        iconName.replace(/[-_\s]/g, ''),            // Sin guiones, guiones bajos o espacios
        iconName.replace(/[-_\s]/g, '').charAt(0).toUpperCase() + iconName.replace(/[-_\s]/g, '').slice(1), // Sin separadores + primera mayúscula
    ];
    
    // Intentar cada variación
    for (const variation of variations) {
        if (LucideIcons[variation]) {
            return LucideIcons[variation];
        }
    }
    
    // Si no se encuentra, intentar búsqueda más flexible
    const iconKeys = Object.keys(LucideIcons);
    const flexibleMatch = iconKeys.find(key => 
        key.toLowerCase().includes(iconName.toLowerCase()) ||
        iconName.toLowerCase().includes(key.toLowerCase())
    );
    
    if (flexibleMatch && LucideIcons[flexibleMatch]) {
        return LucideIcons[flexibleMatch];
    }
    
    return null;
};

// Componente para renderizar un icono dinámicamente
const IconRenderer = ({ iconData, size = 20, className = "" }) => {
    if (!iconData) return null;
    
    const iconName = iconData.ico_nom || iconData.nombre;
    const IconComponent = getLucideIcon(iconName);
    
    if (IconComponent) {
        return <IconComponent size={size} className={className} />;
    }
    
    // Placeholder mejorado si no se encuentra el icono
    return (
        <div 
            className={`flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 rounded border-2 border-dashed border-gray-400 ${className}`}
            style={{ width: size, height: size }}
            title={`Icono no encontrado: ${iconName}`}
        >
            <span className="text-xs font-bold text-gray-600">
                {iconName ? iconName.charAt(0).toUpperCase() : '?'}
            </span>
        </div>
    );
};

const IconSelector = ({ 
    icons = [], 
    selectedIcon = null, 
    onSelect, 
    placeholder = "Seleccionar icono",
    disabled = false 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // Debug: mostrar información de los iconos cargados
    console.log('🎯 IconSelector - Total iconos desde BD:', icons.length);
    if (icons.length > 0) {
        console.log('🎯 IconSelector - Estructura primer icono:', icons[0]);
        console.log('🎯 IconSelector - Nombres de iconos disponibles:', 
            icons.slice(0, 10).map(icon => icon.ico_nom || icon.nombre)
        );
    }

    // Filtrar iconos
    const filteredIcons = useMemo(() => {
        return icons.filter(icon => {
            const iconName = icon.ico_nom || icon.nombre || '';
            const iconCategory = icon.ico_cat || icon.categoria || '';
            
            const matchesSearch = !searchTerm || 
                iconName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                iconCategory.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = !selectedCategory || 
                iconCategory === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
    }, [icons, searchTerm, selectedCategory]);

    // Obtener categorías únicas desde la BD
    const categories = useMemo(() => {
        const cats = [...new Set(icons.map(icon => 
            icon.ico_cat || icon.categoria
        ).filter(Boolean))];
        return cats.sort();
    }, [icons]);

    // Encontrar el icono seleccionado
    const selectedIconData = useMemo(() => {
        if (!selectedIcon) return null;
        return icons.find(icon => 
            (icon.ico_id || icon.id) == selectedIcon
        );
    }, [selectedIcon, icons]);

    const handleIconSelect = (icon) => {
        console.log('🎯 Seleccionando icono desde BD:', icon);
        onSelect?.(icon.ico_id || icon.id);
        setIsOpen(false);
        setSearchTerm('');
        setSelectedCategory('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onSelect?.('');
    };

    const toggleDropdown = () => {
        if (!disabled) {
            console.log('🎯 Toggle dropdown, isOpen:', !isOpen, 'Total iconos:', icons.length);
            setIsOpen(!isOpen);
        }
    };

    // Mostrar mensaje si no hay iconos cargados
    if (icons.length === 0) {
        return (
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                Cargando iconos...
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Botón principal del selector */}
            <button
                type="button"
                onClick={toggleDropdown}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all duration-300 ${
                    disabled 
                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
                        : isOpen 
                            ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' 
                            : 'border-gray-300 hover:border-gray-400'
                } focus:outline-none`}
            >
                <div className="flex items-center flex-1">
                    {selectedIconData ? (
                        <div className="flex items-center">
                            <IconRenderer 
                                iconData={selectedIconData} 
                                size={20} 
                                className="text-gray-700 mr-3" 
                            />
                            <div className="text-left">
                                <div className="text-sm font-medium text-gray-900">
                                    {selectedIconData.ico_nom || selectedIconData.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {selectedIconData.ico_cat || selectedIconData.categoria}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <div className="w-5 h-5 bg-gray-200 rounded mr-3 flex items-center justify-center">
                                <span className="text-xs text-gray-400">?</span>
                            </div>
                            <span className="text-gray-500">{placeholder}</span>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center ml-2">
                    {selectedIconData && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded mr-1 transition-colors"
                        >
                            <X size={14} className="text-gray-400" />
                        </button>
                    )}
                    <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform duration-200 ${
                            isOpen ? 'transform rotate-180' : ''
                        }`} 
                    />
                </div>
            </button>

            {/* Dropdown con los iconos */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
                    {/* Header con búsqueda y filtros */}
                    <div className="p-4 border-b border-gray-200">
                        {/* Información de iconos cargados */}
                        <div className="mb-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            📊 {icons.length} iconos cargados desde la base de datos
                        </div>
                        
                        {/* Barra de búsqueda */}
                        <div className="relative mb-3">
                            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar iconos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>

                        {/* Filtro por categoría */}
                        {categories.length > 0 && (
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todas las categorías ({categories.length})</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category} ({icons.filter(i => (i.ico_cat || i.categoria) === category).length})
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Contador de resultados */}
                        <div className="mt-2 text-xs text-gray-500">
                            {filteredIcons.length} de {icons.length} iconos mostrados
                        </div>
                    </div>

                    {/* Lista de iconos */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredIcons.length > 0 ? (
                            <div className="p-2">
                                {filteredIcons.map((icon) => {
                                    const iconId = icon.ico_id || icon.id;
                                    const iconName = icon.ico_nom || icon.nombre;
                                    const iconCategory = icon.ico_cat || icon.categoria;
                                    const isSelected = iconId == selectedIcon;
                                    const hasLucideIcon = getLucideIcon(iconName) !== null;
                                    
                                    return (
                                        <button
                                            key={iconId}
                                            type="button"
                                            onClick={() => handleIconSelect(icon)}
                                            className={`flex items-center w-full px-3 py-2 text-left rounded-md transition-all duration-200 mb-1 ${
                                                isSelected 
                                                    ? 'bg-blue-100 text-blue-900 border border-blue-300' 
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center flex-1">
                                                <IconRenderer 
                                                    iconData={icon} 
                                                    size={24} 
                                                    className={isSelected ? 'text-blue-600' : 'text-gray-600'} 
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="text-sm font-medium flex items-center">
                                                        {iconName}
                                                        {hasLucideIcon && (
                                                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-1 rounded">
                                                                ✓
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {iconCategory} • ID: {iconId}
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check size={16} className="text-blue-600 ml-2" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-sm">No se encontraron iconos</p>
                                <p className="text-xs mt-1">
                                    Intenta con otros términos de búsqueda
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer con acciones */}
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                                💡 Los iconos se cargan automáticamente desde la BD
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay para cerrar al hacer click fuera */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default IconSelector;