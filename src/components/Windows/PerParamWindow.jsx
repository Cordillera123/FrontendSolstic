import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useButtonPermissions } from '../../hooks/useButtonPermissions';
import { adminService } from '../../services/apiService';
import Icon from '../UI/Icon';

// Componente hijo para gestión de perfiles
const PerParamWindow = ({ showMessage, onPerfilSelect, menuId = 8 }) => {
    const [perfiles, setPerfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingPerfil, setEditingPerfil] = useState(null);
    const [formData, setFormData] = useState({
        per_nom: '',
        per_descripcion: '',
        per_nivel: 1 // ✅ FIX: Agregar per_nivel con valor por defecto
    });

    // Hook de permisos para perfiles
    const {
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        loading: permissionsLoading
    } = useButtonPermissions(menuId, null, true, 'menu');

    // ✅ CORRECCIÓN 1: Función loadPerfiles sin dependencias externas
    const loadPerfiles = useCallback(async () => {
        if (!canRead) return;

        setLoading(true);
        try {
            console.log('🔍 Cargando perfiles...');
            const result = await adminService.perfiles.getAll();
            console.log('📥 Respuesta perfiles:', result);

            if (result.status === 'success') {
                // ✅ CORRECCIÓN: Manejo simplificado de respuesta
                const perfilesData = Array.isArray(result.data) ? result.data : [];
                console.log('✅ Perfiles procesados:', perfilesData);
                setPerfiles(perfilesData);
            } else {
                console.error('❌ Error en respuesta perfiles:', result);
                setPerfiles([]);
                showMessage?.('error', result.message || 'Error al cargar perfiles');
            }
        } catch (error) {
            console.error('❌ Error loading perfiles:', error);
            setPerfiles([]);
            showMessage?.('error', 'Error al cargar perfiles: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    }, [canRead]); // ✅ Solo canRead como dependencia

    // ✅ CORRECCIÓN 2: useEffect simplificado
    useEffect(() => {
        if (canRead) {
            loadPerfiles();
        }
    }, [canRead, loadPerfiles]);

    // Handlers del formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'per_nivel' ? parseInt(value) || 1 : value // ✅ FIX: Convertir per_nivel a número
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ CORRECCIÓN 3: Validación de campos requeridos para perfiles
        if (!formData.per_nom.trim()) {
            showMessage?.('error', 'El nombre del perfil es requerido');
            return;
        }

        if (!formData.per_nivel || formData.per_nivel < 1 || formData.per_nivel > 10) {
            showMessage?.('error', 'El nivel del perfil debe estar entre 1 y 10');
            return;
        }

        try {
            let result;
            if (editingPerfil) {
                if (!canUpdate) {
                    showMessage?.('error', 'No tienes permisos para editar perfiles');
                    return;
                }
                result = await adminService.perfiles.update(editingPerfil.per_id, formData);
            } else {
                if (!canCreate) {
                    showMessage?.('error', 'No tienes permisos para crear perfiles');
                    return;
                }
                result = await adminService.perfiles.create(formData);
            }

            if (result.status === 'success') {
                showMessage?.('success', result.message || 'Perfil guardado correctamente');
                // ✅ CORRECCIÓN 4: Limpiar formulario y recargar inmediatamente
                setShowForm(false);
                setEditingPerfil(null);
                setFormData({ per_nom: '', per_descripcion: '', per_nivel: 1 });
                await loadPerfiles(); // ✅ Recarga inmediata
            } else {
                showMessage?.('error', result.message || 'Error al guardar perfil');
            }
        } catch (error) {
            console.error('Error saving perfil:', error);
            showMessage?.('error', error.message || 'Error al guardar perfil');
        }
    };

    const handleEdit = (perfil) => {
        if (!canUpdate) {
            showMessage?.('error', 'No tienes permisos para editar perfiles');
            return;
        }
        setEditingPerfil(perfil);
        setFormData({
            per_nom: perfil.per_nom || '',
            per_descripcion: perfil.per_descripcion || '',
            per_nivel: perfil.per_nivel || 1 // ✅ FIX: Agregar per_nivel
        });
        setShowForm(true);
    };

    const handleDelete = async (perfil) => {
        if (!canDelete) {
            showMessage?.('error', 'No tienes permisos para eliminar perfiles');
            return;
        }

        if (!window.confirm(`¿Estás seguro de eliminar el perfil "${perfil.per_nom}"?`)) {
            return;
        }

        try {
            const result = await adminService.perfiles.delete(perfil.per_id);
            if (result.status === 'success') {
                showMessage?.('success', result.message || 'Perfil eliminado correctamente');
                await loadPerfiles(); // ✅ Recarga inmediata
            } else {
                showMessage?.('error', result.message || 'Error al eliminar perfil');
            }
        } catch (error) {
            console.error('Error deleting perfil:', error);
            showMessage?.('error', error.message || 'Error al eliminar perfil');
        }
    };

    const handleCreate = () => {
        if (!canCreate) {
            showMessage?.('error', 'No tienes permisos para crear perfiles');
            return;
        }
        setEditingPerfil(null);
        setFormData({ per_nom: '', per_descripcion: '', per_nivel: 1 });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingPerfil(null);
        setFormData({ per_nom: '', per_descripcion: '', per_nivel: 1 });
    };

    if (permissionsLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <span>Cargando permisos...</span>
            </div>
        );
    }

    if (!canRead) {
        return (
            <div className="text-center p-8">
                <Icon name="Lock" size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No tienes permisos para ver perfiles</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Icon name="Shield" size={24} className="mr-2 text-blue-600" />
                    Gestión de Perfiles
                </h2>

                {canCreate && (
                    <button
                        onClick={handleCreate}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                        <Icon name="Plus" size={16} />
                        Crear Perfil
                    </button>
                )}
            </div>

            {/* Formulario */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium mb-4">
                        {editingPerfil ? 'Editar Perfil' : 'Crear Perfil'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del Perfil *
                            </label>
                            <input
                                type="text"
                                name="per_nom"
                                value={formData.per_nom}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ej: Administrador, Usuario, Supervisor..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <textarea
                                name="per_descripcion"
                                value={formData.per_descripcion}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Descripción del perfil..."
                            />
                        </div>

                        {/* ✅ FIX: Agregar campo per_nivel */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nivel *
                            </label>
                            <select
                                name="per_nivel"
                                value={formData.per_nivel}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(nivel => (
                                    <option key={nivel} value={nivel}>
                                        Nivel {nivel}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                {editingPerfil ? 'Actualizar' : 'Crear'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de perfiles */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        <span>Cargando perfiles...</span>
                    </div>
                ) : !Array.isArray(perfiles) || perfiles.length === 0 ? (
                    <div className="text-center p-8">
                        <Icon name="Shield" size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No hay perfiles registrados</p>
                        {!Array.isArray(perfiles) && (
                            <p className="text-xs text-red-500 mt-2">
                                Error: Datos recibidos no son válidos ({typeof perfiles})
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Perfil
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Descripción
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuarios
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {perfiles.map((perfil) => (
                                    <tr key={perfil.per_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Icon
                                                    name={perfil.per_nom.toLowerCase().includes('super') ? 'Crown' :
                                                        perfil.per_nom.toLowerCase().includes('admin') ? 'Shield' : 'User'}
                                                    size={16}
                                                    className="mr-2 text-blue-600"
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {perfil.per_nom}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {perfil.per_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {perfil.per_descripcion || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {perfil.usuarios_count || 0} usuarios
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {canUpdate && (
                                                    <button
                                                        onClick={() => handleEdit(perfil)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                        title="Editar perfil"
                                                    >
                                                        <Icon name="Edit2" size={16} />
                                                    </button>
                                                )}

                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(perfil)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded"
                                                        title="Eliminar perfil"
                                                    >
                                                        <Icon name="Trash2" size={16} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => onPerfilSelect?.(perfil)}
                                                    className="text-purple-600 hover:text-purple-900 p-1 rounded"
                                                    title="Ver usuarios de este perfil"
                                                >
                                                    <Icon name="Users" size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
export default PerParamWindow;