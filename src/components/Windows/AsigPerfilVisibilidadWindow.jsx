// src/components/Windows/AsigPerfilVisibilidadWindow.jsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { adminService } from '../../services/apiService';
import Icon from '../UI/Icon';

// ===== COMPONENTES MEMOIZADOS =====
const UserCard = memo(({ usuario, isSelected, onClick }) => {
  const getStatusColor = () => {
    if (usuario.usu_deshabilitado) return "text-red-600 bg-red-100";
    if (usuario.estado === "Activo") return "text-green-600 bg-green-100";
    return "text-gray-600 bg-gray-100";
  };

  const handleClick = useCallback(() => {
    onClick(usuario);
  }, [onClick, usuario]);

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <Icon
              name="User"
              size={16}
              className={`mr-2 ${
                isSelected ? "text-blue-600" : "text-gray-500"
              }`}
            />
            <div>
              <span
                className={`font-medium text-sm ${
                  isSelected ? "text-blue-900" : "text-gray-900"
                }`}
              >
                {usuario.nombre_completo}
              </span>
              <p
                className={`text-xs mt-1 ${
                  isSelected ? "text-blue-700" : "text-gray-600"
                }`}
              >
                {usuario.usu_cor}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
            >
              {usuario.usu_deshabilitado ? 'Deshabilitado' : usuario.estado}
            </span>
            <span
              className={`text-xs ${
                isSelected ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {usuario.perfil}
            </span>
          </div>
        </div>
        <Icon
          name="ChevronRight"
          size={16}
          className={`transition-colors ${
            isSelected ? "text-blue-500" : "text-gray-400"
          }`}
        />
      </div>
    </div>
  );
});

const PerfilCard = memo(({ perfil, canView, onToggle, saving }) => {
  const handleToggle = useCallback(() => {
    onToggle(perfil.per_id, canView);
  }, [onToggle, perfil.per_id, canView]);

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        canView 
          ? 'border-green-300 bg-green-50' 
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <Icon
            name={perfil.per_nom.toLowerCase().includes('super') ? 'Crown' :
              perfil.per_nom.toLowerCase().includes('admin') ? 'Shield' : 'User'}
            size={16}
            className={`mr-2 ${canView ? 'text-green-600' : 'text-gray-500'}`}
          />
          
          <div>
            <span className={`font-medium text-sm ${
              canView ? 'text-green-900' : 'text-gray-700'
            }`}>
              {perfil.per_nom}
            </span>
            {perfil.per_descripcion && (
              <p className="text-xs text-gray-500 mt-1">
                {perfil.per_descripcion}
              </p>
            )}
          </div>
        </div>

        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={canView}
            onChange={handleToggle}
            disabled={saving}
            className="text-green-600 focus:ring-2 focus:ring-green-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            {canView ? 'Puede ver' : 'No puede ver'}
          </span>
        </label>
      </div>
    </div>
  );
});

// ===== COMPONENTE PRINCIPAL =====
const AsigPerfilVisibilidadWindow = ({ showMessage }) => {
  // ===== ESTADOS =====
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [perfilesVisiblesUsuario, setPerfilesVisiblesUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVisibilidad, setLoadingVisibilidad] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ===== HANDLERS MEMOIZADOS =====
  const handleUserSelect = useCallback((usuario) => {
    setSelectedUser(usuario);
  }, []);

  const handleProfileFilterChange = useCallback((e) => {
    setSelectedProfile(e.target.value);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // ===== CARGAR DATOS =====
  const loadUsuarios = useCallback(async (perfilId = "") => {
    setLoading(true);
    try {
      const params = {};
      if (perfilId) params.per_id = perfilId;

      const result = await adminService.usuarios.getAll(params);
      
      if (result?.status === "success" && result?.data) {
        let usuariosData = [];
        
        if (Array.isArray(result.data)) {
          usuariosData = result.data;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          usuariosData = result.data.data;
        } else if (result.data.data?.data && Array.isArray(result.data.data.data)) {
          usuariosData = result.data.data.data;
        }
        
        setUsuarios(usuariosData);
      } else {
        setUsuarios([]);
        showMessage("error", "Error al cargar usuarios");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setUsuarios([]);
      showMessage("error", error.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const loadPerfiles = useCallback(async () => {
    try {
      const result = await adminService.perfiles.getAll();
      if (result.status === "success") {
        const perfilesData = Array.isArray(result.data) ? result.data : [];
        setPerfiles(perfilesData);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      showMessage("error", error.message || "Error al cargar perfiles");
    }
  }, [showMessage]);

  const loadPerfilesVisiblesUsuario = useCallback(async (usuarioId) => {
    if (!usuarioId) return;
    
    setLoadingVisibilidad(true);
    try {
      // Obtener perfiles que el usuario puede ver actualmente
      const response = await fetch(
        `http://127.0.0.1:8000/api/usuarios/${usuarioId}/perfiles-visibles`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.status === "success") {
          const perfilesVisibles = result.data || [];
          setPerfilesVisiblesUsuario(perfilesVisibles.map(p => p.per_id));
        } else {
          setPerfilesVisiblesUsuario([]);
        }
      } else {
        // Si no existe el endpoint, inicializar vacío
        setPerfilesVisiblesUsuario([]);
      }
    } catch (error) {
      console.error("Error loading user profile visibility:", error);
      setPerfilesVisiblesUsuario([]);
    } finally {
      setLoadingVisibilidad(false);
    }
  }, []);

  // ===== EFECTOS =====
  useEffect(() => {
    loadPerfiles();
    loadUsuarios();
  }, [loadPerfiles, loadUsuarios]);

  useEffect(() => {
    if (selectedProfile) {
      loadUsuarios(selectedProfile);
    } else {
      loadUsuarios();
    }
  }, [selectedProfile, loadUsuarios]);

  useEffect(() => {
    if (selectedUser?.usu_id) {
      loadPerfilesVisiblesUsuario(selectedUser.usu_id);
    }
  }, [selectedUser?.usu_id, loadPerfilesVisiblesUsuario]);

  // ===== MANEJO DE VISIBILIDAD =====
  const togglePerfilVisibilidad = useCallback(async (perfilId, currentState) => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      // Actualizar el estado local temporalmente para mejor UX
      const nuevosPerfilesVisibles = currentState 
        ? perfilesVisiblesUsuario.filter(id => id !== perfilId)
        : [...perfilesVisiblesUsuario, perfilId];

      setPerfilesVisiblesUsuario(nuevosPerfilesVisibles);

      // Enviar todos los perfiles visibles al backend
      const response = await fetch(
        `http://127.0.0.1:8000/api/usuarios/${selectedUser.usu_id}/asignar-perfil-visibilidad`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            perfiles_ids: nuevosPerfilesVisibles
          }),
        }
      );

      if (!response.ok) throw new Error("Error al modificar visibilidad");

      const result = await response.json();
      if (result.status === "success") {
        showMessage("success", result.message || "Visibilidad actualizada correctamente");
      } else {
        // Revertir cambio local si falla
        setPerfilesVisiblesUsuario(perfilesVisiblesUsuario);
        showMessage("error", result.message || "Error al actualizar visibilidad");
      }
    } catch (error) {
      // Revertir cambio local si falla
      setPerfilesVisiblesUsuario(perfilesVisiblesUsuario);
      console.error("Error toggling profile visibility:", error);
      showMessage("error", error.message || "Error al modificar visibilidad de perfil");
    } finally {
      setSaving(false);
    }
  }, [selectedUser, perfilesVisiblesUsuario, showMessage]);

  // ===== FILTROS MEMOIZADOS =====
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      const matchesSearch =
        searchTerm === "" ||
        usuario.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.usu_cor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.usu_ced?.includes(searchTerm);

      return matchesSearch;
    });
  }, [usuarios, searchTerm]);

  // ===== ESTADÍSTICAS MEMOIZADAS =====
  const visibilityStats = useMemo(() => {
    if (!perfiles.length || !selectedUser) 
      return { total: 0, visible: 0, percentage: 0 };

    const total = perfiles.length;
    const visible = perfilesVisiblesUsuario.length;
    const percentage = total > 0 ? Math.round((visible / total) * 100) : 0;

    return { total, visible, percentage };
  }, [perfiles.length, perfilesVisiblesUsuario.length, selectedUser]);

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Panel de usuarios */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Icon name="Eye" size={20} className="mr-2" />
            Visibilidad de Perfiles
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure qué perfiles puede ver cada usuario en el mantenimiento
          </p>

          {/* Filtros */}
          <div className="space-y-3 mb-4">
            {/* Buscador */}
            <div className="relative">
              <Icon
                name="Search"
                size={16}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Filtro por perfil */}
            <select
              value={selectedProfile}
              onChange={handleProfileFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todos los perfiles</option>
              {perfiles.map((perfil) => (
                <option key={perfil.per_id} value={perfil.per_id}>
                  {perfil.per_nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredUsuarios.map((usuario) => (
            <UserCard
              key={usuario.usu_id}
              usuario={usuario}
              isSelected={selectedUser?.usu_id === usuario.usu_id}
              onClick={handleUserSelect}
            />
          ))}
        </div>

        {filteredUsuarios.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Icon
              name="Users"
              size={48}
              className="mx-auto mb-4 text-gray-300"
            />
            <p>No hay usuarios disponibles</p>
            {searchTerm && (
              <p className="text-sm mt-1">
                Intenta con otro término de búsqueda
              </p>
            )}
          </div>
        )}
      </div>

      {/* Panel de configuración de visibilidad */}
      <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
        {selectedUser ? (
          <>
            {/* Header del panel */}
            <div className="mb-4 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Icon name="Eye" size={20} className="mr-2" />
                    Perfiles Visibles: {selectedUser.nombre_completo}
                  </h3>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs mr-3">
                      Perfil: {selectedUser.perfil}
                    </span>
                    <span>
                      Puede ver: {visibilityStats.visible}/{visibilityStats.total} perfiles
                    </span>
                    <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {visibilityStats.percentage}%
                    </span>
                  </div>
                </div>

                {/* Leyenda */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center">
                    <Icon
                      name="Eye"
                      size={12}
                      className="mr-1 text-green-600"
                    />
                    <span>Puede ver este perfil en listas</span>
                  </div>
                  <div className="flex items-center">
                    <Icon
                      name="EyeOff"
                      size={12}
                      className="mr-1 text-gray-400"
                    />
                    <span>No puede ver este perfil</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de perfiles */}
            <div className="flex-1 overflow-auto">
              {loadingVisibilidad ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">
                      Cargando configuración de visibilidad...
                    </p>
                  </div>
                </div>
              ) : perfiles.length > 0 ? (
                <div className="space-y-3">
                  {perfiles.map((perfil) => {
                    const canView = perfilesVisiblesUsuario.includes(perfil.per_id);
                    
                    return (
                      <PerfilCard
                        key={perfil.per_id}
                        perfil={perfil}
                        canView={canView}
                        onToggle={togglePerfilVisibilidad}
                        saving={saving}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Icon
                    name="AlertCircle"
                    size={48}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p>No hay perfiles disponibles</p>
                  <p className="text-sm mt-1">
                    Cree perfiles en la sección de Parametrización
                  </p>
                </div>
              )}
            </div>

            {/* Indicador de guardado */}
            {saving && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 text-sm">
                  Guardando cambios...
                </span>
              </div>
            )}

            {/* Información adicional */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-start">
                <Icon name="Info" size={16} className="mr-2 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">¿Cómo funciona?</p>
                  <p className="mt-1">
                    Los usuarios solo verán en las listas de usuarios aquellos que pertenezcan 
                    a los perfiles que tienen marcados como "Puede ver".
                  </p>
                  <p className="mt-1">
                    Los usuarios con perfil <strong>Administrador</strong> generalmente 
                    pueden ver todos los perfiles por defecto.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Icon
                name="Eye"
                size={48}
                className="mx-auto mb-4 text-gray-300"
              />
              <p>Seleccione un usuario para configurar la visibilidad de perfiles</p>
              <p className="text-sm mt-1">
                Determine qué perfiles puede ver cada usuario en los mantenimientos
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsigPerfilVisibilidadWindow;