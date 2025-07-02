// src/components/Windows/ShowOficinaForm.jsx - VERSIÓN COMPACTA
import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../UI/Icon';
import { adminService } from '../../services/apiService';

const ShowOficinaForm = ({ 
  oficinaId, 
  oficinaNombre,
  showMessage,
  onCancel,
  loading: externalLoading 
}) => {
  console.log("👁️ ShowOficinaForm - Renderizando para oficina:", oficinaId);

  // ===== ESTADOS =====
  const [loading, setLoading] = useState(true);
  const [oficinaData, setOficinaData] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [resumenUsuarios, setResumenUsuarios] = useState({});
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'usuarios'
  const [error, setError] = useState(null);
  
  // Estados para paginación y filtros de usuarios
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(8); // ✅ Reducido de 10 a 8
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchUsuarios, setSearchUsuarios] = useState('');
  const [incluirDeshabilitados, setIncluirDeshabilitados] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // ===== FUNCIÓN PARA CARGAR DATOS DE LA OFICINA =====
  const loadOficinaData = useCallback(async () => {
    if (!oficinaId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Cargando datos de oficina:', oficinaId);
      
      const response = await adminService.oficinas.getById(oficinaId);
      
      if (response.success && response.data) {
        setOficinaData(response.data);
        console.log('✅ Datos de oficina cargados:', response.data);
      } else {
        throw new Error(response.message || 'Error al cargar datos de oficina');
      }
      
    } catch (err) {
      console.error('❌ Error cargando oficina:', err);
      setError(err.message || 'Error al cargar información de la oficina');
      showMessage('error', err.message || 'Error al cargar información de la oficina');
    } finally {
      setLoading(false);
    }
  }, [oficinaId, showMessage]);

  // ===== FUNCIÓN PARA CARGAR USUARIOS DE LA OFICINA =====
  const loadUsuarios = useCallback(async (page = 1) => {
    if (!oficinaId) return;
    
    setLoadingUsuarios(true);
    
    try {
      console.log('👥 Cargando usuarios de oficina:', {
        oficinaId,
        page,
        perPage,
        search: searchUsuarios,
        incluirDeshabilitados
      });
      
      const params = {
        per_page: perPage,
        page: page,
        search: searchUsuarios,
        incluir_deshabilitados: incluirDeshabilitados
      };
      
      const response = await adminService.oficinas.getUsuarios(oficinaId, params);
      
      if (response.success && response.data) {
        setUsuarios(response.data.usuarios?.data || []);
        setResumenUsuarios(response.data.resumen || {});
        setTotalUsers(response.data.usuarios?.total || 0);
        setCurrentPage(response.data.usuarios?.current_page || 1);
        
        console.log('✅ Usuarios cargados:', {
          total: response.data.usuarios?.total,
          currentPage: response.data.usuarios?.current_page,
          resumen: response.data.resumen
        });
      } else {
        console.warn('⚠️ Respuesta de usuarios sin éxito:', response);
        setUsuarios([]);
        setResumenUsuarios({});
        setTotalUsers(0);
        setCurrentPage(1);
        
        if (response.message && !response.success) {
          showMessage('warning', response.message);
        }
      }
      
    } catch (err) {
      console.error('❌ Error cargando usuarios:', err);
      setUsuarios([]);
      setResumenUsuarios({});
      setTotalUsers(0);
      showMessage('error', err.message || 'Error al cargar usuarios de la oficina');
    } finally {
      setLoadingUsuarios(false);
    }
  }, [oficinaId, perPage, searchUsuarios, incluirDeshabilitados, showMessage]);

  // ===== EFFECTS =====
  useEffect(() => {
    if (oficinaId) {
      loadOficinaData();
      loadUsuarios(1);
    }
  }, [oficinaId, loadOficinaData, loadUsuarios]);

  // Effect para recargar usuarios cuando cambien los filtros
  useEffect(() => {
    if (oficinaId) {
      const timeoutId = setTimeout(() => {
        loadUsuarios(1);
        setCurrentPage(1);
      }, 500); // Debounce de 500ms para el search
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchUsuarios, incluirDeshabilitados, oficinaId, loadUsuarios]);

  // ===== HANDLERS =====
  const handlePageChange = useCallback((newPage) => {
    if (newPage !== currentPage && newPage > 0) {
      loadUsuarios(newPage);
    }
  }, [currentPage, loadUsuarios]);

  const handleCancel = useCallback(() => {
    console.log("❌ Cerrando vista de oficina");
    onCancel();
  }, [onCancel]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Nunca';
    return new Date(dateTimeString).toLocaleString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== RENDERIZADO =====
  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* ✅ Header compacto */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100 rounded-lg mr-2">
              <Icon name="Eye" size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Detalles de Oficina
              </h2>
              <p className="text-xs text-gray-500">
                {oficinaNombre || `Oficina #${oficinaId}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Tabs compactos */}
      <div className="flex-shrink-0 px-4 bg-gray-50 border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Icon name="Info" size={14} className="mr-1" />
              Información
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              activeTab === 'usuarios'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Icon name="Users" size={14} className="mr-1" />
              Usuarios ({oficinaData?.cantidad_usuarios_total || 0})
            </div>
          </button>
        </div>
      </div>

      {/* ✅ Mensajes compactos */}
      {(error || loading) && (
        <div className="flex-shrink-0 px-4 pt-1 pb-1">
          {error && (
            <div className="p-1 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-center gap-1">
              <Icon name="AlertCircle" size={10} />
              {error}
            </div>
          )}

          {loading && (
            <div className="p-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600 flex items-center gap-1">
              <div className="animate-spin rounded-full h-2.5 w-2.5 border border-blue-600 border-t-transparent"></div>
              Cargando...
            </div>
          )}
        </div>
      )}

      {/* ✅ Contenido Principal - MUY COMPACTO */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-gray-600 text-sm">Cargando...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <Icon name="AlertCircle" size={32} className="mx-auto mb-2 text-red-300" />
            <p className="text-red-600 mb-2 text-sm">{error}</p>
            <button
              onClick={loadOficinaData}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : oficinaData ? (
          <div className="space-y-3">
            {/* ✅ Tab Content - Información COMPACTA */}
            {activeTab === 'info' && (
              <div className="space-y-3">
                {/* Información Básica - Grid compacto */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                    <Icon name="Building" size={14} className="mr-1" />
                    Información General
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-blue-700 mb-0.5">Nombre</label>
                      <p className="text-blue-900 font-semibold">{oficinaData.oficin_nombre}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-blue-700 mb-0.5">RUC</label>
                      <p className="text-blue-900 font-mono">{oficinaData.oficin_rucoficina}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-blue-700 mb-0.5">Teléfono</label>
                      <p className="text-blue-900">{oficinaData.oficin_telefono}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-blue-700 mb-0.5">Email</label>
                      <p className="text-blue-900 truncate">{oficinaData.oficin_diremail}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-blue-700 mb-0.5">Institución</label>
                      <p className="text-blue-900">{oficinaData.instit_nombre || 'No asignada'}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-blue-700 mb-0.5">Tipo</label>
                      <p className="text-blue-900">{oficinaData.tofici_descripcion || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-blue-700 mb-0.5">Estado</label>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        oficinaData.oficin_ctractual === 1 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {oficinaData.oficin_ctractual === 1 ? '✓ Activa' : '✗ Inactiva'}
                      </span>
                    </div>
                    <div>
                      <label className="block font-medium text-blue-700 mb-0.5">Código Control</label>
                      <p className="text-blue-900 font-mono">{oficinaData.oficin_codocntrl}</p>
                    </div>
                  </div>
                </div>

                {/* Grid compacto de ubicación y fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Ubicación compacta */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                    <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
                      <Icon name="MapPin" size={14} className="mr-1" />
                      Ubicación
                    </h3>
                    
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block font-medium text-green-700 mb-0.5">Dirección</label>
                        <p className="text-green-900">{oficinaData.oficin_direccion}</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block font-medium text-green-700 mb-0.5">Parroquia</label>
                          <p className="text-green-900 truncate">{oficinaData.parroq_nombre || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-medium text-green-700 mb-0.5">Cantón</label>
                          <p className="text-green-900 truncate">{oficinaData.canton_nombre || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block font-medium text-green-700 mb-0.5">Provincia</label>
                          <p className="text-green-900 truncate">{oficinaData.provin_nombre || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fechas e Info registral compacta */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center">
                      <Icon name="Calendar" size={14} className="mr-1" />
                      Fechas y Registro
                    </h3>
                    
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-medium text-purple-700 mb-0.5">Apertura</label>
                          <p className="text-purple-900">{formatDate(oficinaData.oficin_fechaapertura)}</p>
                        </div>
                        {oficinaData.oficin_fechacierre && (
                          <div>
                            <label className="block font-medium text-purple-700 mb-0.5">Cierre</label>
                            <p className="text-purple-900">{formatDate(oficinaData.oficin_fechacierre)}</p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block font-medium text-purple-700 mb-0.5">Código Res. Apertura</label>
                        <p className="text-purple-900 font-mono text-xs">{oficinaData.oficin_codresapertura || 'N/A'}</p>
                      </div>
                      
                      {/* Estadísticas de usuarios compacta */}
                      <div className="pt-2 border-t border-purple-200">
                        <label className="block font-medium text-purple-700 mb-1">Usuarios</label>
                        <div className="flex gap-2">
                          <div className="bg-white rounded p-1.5 border border-purple-200 flex-1 text-center">
                            <div className="text-sm font-semibold text-purple-900">{oficinaData.cantidad_usuarios_activos || 0}</div>
                            <div className="text-xs text-purple-600">Activos</div>
                          </div>
                          <div className="bg-white rounded p-1.5 border border-purple-200 flex-1 text-center">
                            <div className="text-sm font-semibold text-purple-900">{oficinaData.cantidad_usuarios_total || 0}</div>
                            <div className="text-xs text-purple-600">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Tab Content - Usuarios COMPACTA */}
            {activeTab === 'usuarios' && (
              <div className="space-y-3">
                {/* Header compacto con estadísticas */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold">Usuarios Asignados</h3>
                      <p className="text-xs text-blue-100">
                        {resumenUsuarios.total_usuarios || 0} usuarios registrados
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold">{resumenUsuarios.usuarios_activos || 0}</div>
                        <div className="text-xs text-blue-200">Activos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{resumenUsuarios.usuarios_deshabilitados || 0}</div>
                        <div className="text-xs text-blue-200">Deshabilitados</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtros compactos */}
                <div className="bg-white rounded border border-gray-200 p-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="relative">
                        <Icon name="Search" size={12} className="absolute left-2 top-2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar usuarios..."
                          value={searchUsuarios}
                          onChange={(e) => setSearchUsuarios(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={incluirDeshabilitados}
                          onChange={(e) => setIncluirDeshabilitados(e.target.checked)}
                          className="mr-1 w-3 h-3 text-blue-600"
                        />
                        Deshabilitados
                      </label>
                    </div>
                  </div>
                </div>

                {/* Lista compacta de usuarios */}
                <div className="bg-white rounded border border-gray-200">
                  {loadingUsuarios ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-gray-600 text-xs">Cargando...</span>
                    </div>
                  ) : usuarios.length === 0 ? (
                    <div className="text-center py-6">
                      <Icon name="Users" size={24} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-500 text-xs">
                        {searchUsuarios ? 'No se encontraron usuarios' : 'No hay usuarios asignados'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Tabla compacta */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left py-2 px-2 font-medium text-gray-900">Usuario</th>
                              <th className="text-left py-2 px-2 font-medium text-gray-900">Contacto</th>
                              <th className="text-left py-2 px-2 font-medium text-gray-900">Perfil</th>
                              <th className="text-left py-2 px-2 font-medium text-gray-900">Estado</th>
                              <th className="text-left py-2 px-2 font-medium text-gray-900">Último Acceso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {usuarios.map((usuario) => (
                              <tr key={usuario.usu_id} className="hover:bg-gray-50">
                                <td className="py-2 px-2">
                                  <div className="flex items-center">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                                      <span className="text-white font-medium text-xs">
                                        {((usuario.usu_nom || '').charAt(0) + (usuario.usu_ape || '').charAt(0)).toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="ml-2">
                                      <div className="font-medium text-gray-900">
                                        {usuario.nombre_completo || `${usuario.usu_nom || ''} ${usuario.usu_ape || ''}`.trim()}
                                      </div>
                                      <div className="text-gray-500">
                                        ID: {usuario.usu_id}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                
                                <td className="py-2 px-2">
                                  <div className="text-gray-900">{usuario.usu_cor || 'N/A'}</div>
                                  <div className="text-gray-500">{usuario.usu_tel || 'Sin teléfono'}</div>
                                </td>
                                
                                <td className="py-2 px-2">
                                  <span className="inline-flex px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                                    {usuario.perfil || `P${usuario.per_id}`}
                                  </span>
                                </td>
                                
                                <td className="py-2 px-2">
                                  <span className={`inline-flex px-1.5 py-0.5 rounded-full font-medium ${
                                    !usuario.usu_deshabilitado 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {!usuario.usu_deshabilitado ? '✓ Activo' : '✗ Deshabilitado'}
                                  </span>
                                </td>
                                
                                <td className="py-2 px-2 text-gray-500">
                                  {formatDateTime(usuario.usu_ultimo_acceso)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Paginación compacta */}
                      {Math.ceil(totalUsers / perPage) > 1 && (
                        <div className="bg-gray-50 px-2 py-1.5 border-t flex items-center justify-between text-xs">
                          <span className="text-gray-700">
                            {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, totalUsers)} de {totalUsers}
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage <= 1}
                              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                              ‹
                            </button>
                            
                            <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                              {currentPage}
                            </span>
                            
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage >= Math.ceil(totalUsers / perPage)}
                              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                              ›
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ✅ Footer compacto */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-gray-200">
        <button
          onClick={handleCancel}
          disabled={externalLoading || loading}
          className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
        >
          <Icon name="ArrowLeft" size={14} />
          Volver a la Lista
        </button>
      </div>
    </div>
  );
};

export default ShowOficinaForm;