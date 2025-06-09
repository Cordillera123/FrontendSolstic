import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useButtonPermissions } from '../../hooks/useButtonPermissions';
import { adminService } from '../../services/apiService';
import Icon from '../UI/Icon';
import PerParamWindow from './PerParamWindow';

// Componente principal para gestión de usuarios
const UsuParamWindow = ({ 
  showMessage = (type, message) => console.log(`${type}: ${message}`), // ✅ Función por defecto
  menuId = 8, 
  perfilesMenuId = null,
  defaultTab = 'usuarios',
  title = 'Gestión de Usuarios y Perfiles'
}) => {
  const effectivePerfilesMenuId = perfilesMenuId || menuId;
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [selectedPerfil, setSelectedPerfil] = useState('');
  const [formData, setFormData] = useState({
    usu_nom: '',
    usu_ape: '',
    usu_cor: '',
    usu_con: '',
    usu_ced: '',
    per_id: '',
    est_id: 1
  });

  // Hook de permisos para usuarios
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    loading: permissionsLoading
  } = useButtonPermissions(menuId, null, true, 'menu');

  // ✅ CORRECCIÓN 5: Función loadUsuarios sin dependencias problemáticas
  const loadUsuarios = useCallback(async () => {
    if (!canRead) return;
    
    setLoading(true);
    try {
      const params = selectedPerfil ? { per_id: selectedPerfil } : {};
      console.log('🔍 Cargando usuarios con params:', params);
      
      const result = await adminService.usuarios.getAll(params);
      console.log('📥 Respuesta usuarios:', result);
      
      if (result?.status === 'success' && result?.data) {
        // ✅ CORRECCIÓN: Manejo robusto de diferentes estructuras de respuesta
        let usuariosData = [];
        
        // Caso 1: Respuesta directa como array
        if (Array.isArray(result.data)) {
          usuariosData = result.data;
        }
        // Caso 2: Paginación Laravel estándar
        else if (result.data.data && Array.isArray(result.data.data)) {
          usuariosData = result.data.data;
        }
        // Caso 3: Paginación Laravel anidada
        else if (result.data.data?.data && Array.isArray(result.data.data.data)) {
          usuariosData = result.data.data.data;
        }
        // Caso 4: Propiedad específica usuarios
        else if (result.data.usuarios && Array.isArray(result.data.usuarios)) {
          usuariosData = result.data.usuarios;
        }
        
        console.log('✅ Usuarios procesados:', usuariosData);
        setUsuarios(usuariosData);
      } else {
        console.error('❌ Error en respuesta usuarios:', result);
        setUsuarios([]);
        showMessage('error', result?.message || 'Error al cargar usuarios');
      }
    } catch (error) {
      console.error('❌ Error loading usuarios:', error);
      setUsuarios([]);
      showMessage('error', 'Error al cargar usuarios: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [canRead, selectedPerfil]); // ✅ Solo dependencias esenciales

  // ✅ CORRECCIÓN 6: Función loadPerfiles separada para el filtro
  const loadPerfilesForFilter = useCallback(async () => {
    try {
      console.log('🔍 Cargando perfiles para filtro...');
      const result = await adminService.perfiles.getAll();
      
      if (result?.status === 'success' && result?.data) {
        const perfilesData = Array.isArray(result.data) ? result.data : [];
        console.log('✅ Perfiles para filtro:', perfilesData);
        setPerfiles(perfilesData);
      }
    } catch (error) {
      console.error('❌ Error loading perfiles para filtro:', error);
      setPerfiles([]);
    }
  }, []);

  // ✅ CORRECCIÓN 7: useEffect optimizado
  useEffect(() => {
    if (canRead) {
      loadUsuarios();
      loadPerfilesForFilter();
    }
  }, [canRead, loadUsuarios, loadPerfilesForFilter]);

  // Handlers del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ CORRECCIÓN 8: Validaciones robustas - SOLUCIONADO
    const required = ['usu_nom', 'usu_ape', 'usu_cor', 'usu_ced', 'per_id'];
    const missing = required.filter(field => {
      const value = formData[field];
      // ✅ FIX: Manejar tanto strings como números
      if (typeof value === 'string') {
        return !value.trim();
      } else if (typeof value === 'number') {
        return !value;
      } else {
        return !value;
      }
    });
    
    if (missing.length > 0) {
      showMessage('error', `Campos requeridos: ${missing.join(', ')}`);
      return;
    }

    if (!editingUsuario && !formData.usu_con?.trim()) {
      showMessage('error', 'La contraseña es requerida para crear usuario');
      return;
    }

    try {
      let result;
      const submitData = { ...formData };
      
      if (editingUsuario) {
        if (!canUpdate) {
          showMessage('error', 'No tienes permisos para editar usuarios');
          return;
        }
        // Si no hay nueva contraseña, no enviarla
        if (!submitData.usu_con?.trim()) {
          delete submitData.usu_con;
        }
        result = await adminService.usuarios.update(editingUsuario.usu_id, submitData);
      } else {
        if (!canCreate) {
          showMessage('error', 'No tienes permisos para crear usuarios');
          return;
        }
        result = await adminService.usuarios.create(submitData);
      }

      if (result?.status === 'success') {
        showMessage('success', result.message || 'Usuario guardado correctamente');
        // ✅ CORRECCIÓN 9: Limpiar formulario y recargar inmediatamente
        setShowForm(false);
        setEditingUsuario(null);
        setFormData({
          usu_nom: '',
          usu_ape: '',
          usu_cor: '',
          usu_con: '',
          usu_ced: '',
          per_id: '',
          est_id: 1
        });
        await loadUsuarios(); // ✅ Recarga inmediata
      } else {
        showMessage('error', result?.message || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error saving usuario:', error);
      
      // ✅ MEJORA: Mostrar errores de validación específicos
      if (error.response && error.response.data && error.response.data.errors) {
        const errors = error.response.data.errors;
        const errorMessages = [];
        
        // Convertir errores a mensajes amigables
        Object.keys(errors).forEach(field => {
          const fieldErrors = errors[field];
          const fieldName = {
            'usu_nom': 'Nombre',
            'usu_ape': 'Apellido', 
            'usu_cor': 'Email',
            'usu_ced': 'Cédula',
            'usu_con': 'Contraseña',
            'per_id': 'Perfil',
            'est_id': 'Estado'
          }[field] || field;
          
          fieldErrors.forEach(errorMsg => {
            if (errorMsg.includes('has already been taken')) {
              errorMessages.push(`${fieldName}: Ya existe en el sistema`);
            } else if (errorMsg.includes('required')) {
              errorMessages.push(`${fieldName}: Es requerido`);
            } else if (errorMsg.includes('email')) {
              errorMessages.push(`${fieldName}: Formato de email inválido`);
            } else if (errorMsg.includes('min')) {
              errorMessages.push(`${fieldName}: Muy corto`);
            } else {
              errorMessages.push(`${fieldName}: ${errorMsg}`);
            }
          });
        });
        
        showMessage('error', errorMessages.join('\n'));
      } else {
        showMessage('error', error.message || 'Error al guardar usuario');
      }
    }
  };

  const handleEdit = (usuario) => {
    if (!canUpdate) {
      showMessage('error', 'No tienes permisos para editar usuarios');
      return;
    }
    setEditingUsuario(usuario);
    setFormData({
      usu_nom: usuario.usu_nom || '',
      usu_ape: usuario.usu_ape || '',
      usu_cor: usuario.usu_cor || '',
      usu_con: '', // Siempre vacío en edición
      usu_ced: usuario.usu_ced || '',
      per_id: usuario.per_id || '',
      est_id: usuario.est_id || 1
    });
    setShowForm(true);
  };

  const handleDelete = async (usuario) => {
    if (!canDelete) {
      showMessage('error', 'No tienes permisos para eliminar usuarios');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${usuario.usu_nom} ${usuario.usu_ape}"?`)) {
      return;
    }

    try {
      const result = await adminService.usuarios.delete(usuario.usu_id);
      if (result?.status === 'success') {
        showMessage('success', result.message || 'Usuario eliminado correctamente');
        await loadUsuarios(); // ✅ Recarga inmediata
      } else {
        showMessage('error', result?.message || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error deleting usuario:', error);
      showMessage('error', error.message || 'Error al eliminar usuario');
    }
  };

  const handleCreate = () => {
    if (!canCreate) {
      showMessage('error', 'No tienes permisos para crear usuarios');
      return;
    }
    setEditingUsuario(null);
    setFormData({
      usu_nom: '',
      usu_ape: '',
      usu_cor: '',
      usu_con: '',
      usu_ced: '',
      per_id: '',
      est_id: 1
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUsuario(null);
    setFormData({
      usu_nom: '',
      usu_ape: '',
      usu_cor: '',
      usu_con: '',
      usu_ced: '',
      per_id: '',
      est_id: 1
    });
  };

  const handlePerfilSelect = (perfil) => {
    console.log('🔍 Seleccionando perfil:', perfil);
    setActiveTab('usuarios');
    setSelectedPerfil(perfil.per_id.toString());
  };

  // ✅ CORRECCIÓN 10: useEffect para recargar cuando cambie el filtro de perfil
  useEffect(() => {
    if (canRead && activeTab === 'usuarios') {
      loadUsuarios();
    }
  }, [selectedPerfil, canRead, activeTab, loadUsuarios]);

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
          <p className="text-gray-500 mb-2">No tienes permisos para acceder a esta sección</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Información de debug:</strong>
            </p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Menu ID configurado: <code className="bg-yellow-100 px-1 rounded">{menuId}</code></li>
              <li>• Permiso READ: <code className="bg-yellow-100 px-1 rounded">{canRead ? 'SÍ' : 'NO'}</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header con pestañas */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Icon name="Users" size={28} className="mr-3 text-blue-600" />
            {title}
            <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Menu ID: {menuId}
            </span>
          </h1>
        </div>
        
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'usuarios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name="User" size={16} className="inline mr-2" />
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('perfiles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'perfiles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name="Shield" size={16} className="inline mr-2" />
              Perfiles
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'usuarios' ? (
          <div className="h-full flex flex-col">
            {/* Header de usuarios */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Gestión de Usuarios
                </h2>
                
                {/* Filtro por perfil */}
                <select
                  value={selectedPerfil}
                  onChange={(e) => setSelectedPerfil(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los perfiles</option>
                  {Array.isArray(perfiles) && perfiles.map((perfil) => (
                    <option key={perfil.per_id} value={perfil.per_id}>
                      {perfil.per_nom}
                    </option>
                  ))}
                </select>
              </div>
              
              {canCreate && (
                <button
                  onClick={handleCreate}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <Icon name="Plus" size={16} />
                  Crear Usuario
                </button>
              )}
            </div>

            {/* Formulario de usuario */}
            {showForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">
                  {editingUsuario ? 'Editar Usuario' : 'Crear Usuario'}
                </h3>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="usu_nom"
                      value={formData.usu_nom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre del usuario"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      name="usu_ape"
                      value={formData.usu_ape}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Apellido del usuario"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="usu_cor"
                      value={formData.usu_cor}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cédula *
                    </label>
                    <input
                      type="text"
                      name="usu_ced"
                      value={formData.usu_ced}
                      onChange={handleInputChange}
                      required
                      maxLength="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1234567890"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {editingUsuario ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                    </label>
                    <input
                      type="password"
                      name="usu_con"
                      value={formData.usu_con}
                      onChange={handleInputChange}
                      required={!editingUsuario}
                      minLength="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={editingUsuario ? 'Dejar vacío para mantener actual' : 'Mínimo 6 caracteres'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Perfil *
                    </label>
                    <select
                      name="per_id"
                      value={formData.per_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar perfil</option>
                      {Array.isArray(perfiles) && perfiles.map((perfil) => (
                        <option key={perfil.per_id} value={perfil.per_id}>
                          {perfil.per_nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      name="est_id"
                      value={formData.est_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>Activo</option>
                      <option value={2}>Inactivo</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2 flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Icon name={editingUsuario ? "Save" : "Plus"} size={16} />
                      {editingUsuario ? 'Actualizar' : 'Crear'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 flex items-center gap-2"
                    >
                      <Icon name="X" size={16} />
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de usuarios */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span>Cargando usuarios...</span>
                </div>
              ) : !Array.isArray(usuarios) || usuarios.length === 0 ? (
                <div className="text-center p-8">
                  <Icon name="Users" size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">
                    {selectedPerfil ? 'No hay usuarios con el perfil seleccionado' : 'No hay usuarios registrados'}
                  </p>
                  {!Array.isArray(usuarios) && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600">
                        Error: Datos recibidos no válidos ({typeof usuarios})
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        Verificar estructura de respuesta del backend
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cédula
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Perfil
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.usu_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Icon name="User" size={20} className="text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {usuario.usu_nom} {usuario.usu_ape}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {usuario.usu_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{usuario.usu_cor}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{usuario.usu_ced || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {usuario.perfil || usuario.per_nom || 'Sin perfil'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              usuario.est_id === 1 || usuario.estado === 'Activo'
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {usuario.est_id === 1 || usuario.estado === 'Activo' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {canUpdate && (
                                <button
                                  onClick={() => handleEdit(usuario)}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  title="Editar usuario"
                                >
                                  <Icon name="Edit2" size={16} />
                                </button>
                              )}
                              
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(usuario)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                  title="Eliminar usuario"
                                >
                                  <Icon name="Trash2" size={16} />
                                </button>
                              )}
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
        ) : (
          // Pestaña de Perfiles
          <PerParamWindow 
            showMessage={showMessage} 
            onPerfilSelect={handlePerfilSelect}
            menuId={effectivePerfilesMenuId}
          />
        )}
      </div>
    </div>
  );
};

export default UsuParamWindow;