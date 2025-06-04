import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";

// ===== COMPONENTES MEMOIZADOS =====
const TabButton = memo(({ tabId, label, icon, isActive, onClick }) => (
  <button
    className={`min-w-[140px] px-4 py-2 rounded-lg text-sm font-medium border-b-2 flex items-center justify-start gap-2 transition-all ${
      isActive
        ? "bg-white border-blue-500 text-blue-600 shadow-sm"
        : "bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-800"
    }`}
    onClick={onClick}
    type="button"
  >
    <Icon name={icon} size={18} className="text-inherit" />
    <span>{label}</span>
  </button>
));

const UserCard = memo(({ usuario, isSelected, onClick }) => {
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
        <div className="flex items-center">
          <Icon
            name="User"
            size={16}
            className={`mr-2 ${isSelected ? "text-blue-600" : "text-gray-500"}`}
          />
          <div>
            <p
              className={`font-medium text-sm ${
                isSelected ? "text-blue-900" : "text-gray-900"
              }`}
            >
              {usuario.nombre_completo}
            </p>
            <p
              className={`text-xs ${
                isSelected ? "text-blue-700" : "text-gray-600"
              }`}
            >
              {usuario.usu_cor}
            </p>
          </div>
        </div>
        <span
          className={`text-xs ${
            isSelected ? "text-blue-600" : "text-gray-500"
          }`}
        >
          {usuario.perfil || "Sin perfil"}
        </span>
      </div>
    </div>
  );
});

const PerfilCard = memo(
  ({
    perfil,
    onEdit,
    onDelete,
    onToggleStatus,
    isEditing,
    editValue,
    onEditValueChange,
    onSave,
    onCancel,
  }) => (
    <li className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <input
              value={editValue.per_nom || ""}
              onChange={(e) =>
                onEditValueChange({ ...editValue, per_nom: e.target.value })
              }
              className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del perfil"
            />
          </div>
          <div className="flex gap-2 items-center">
            <textarea
              value={editValue.per_descripcion || ""}
              onChange={(e) =>
                onEditValueChange({
                  ...editValue,
                  per_descripcion: e.target.value,
                })
              }
              className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción del perfil"
              rows="2"
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700">Nivel:</label>
            <select
              value={editValue.per_nivel || 1}
              onChange={(e) =>
                onEditValueChange({
                  ...editValue,
                  per_nivel: parseInt(e.target.value),
                })
              }
              className="border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((nivel) => (
                <option key={nivel} value={nivel}>
                  Nivel {nivel}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editValue.per_activo || false}
                onChange={(e) =>
                  onEditValueChange({
                    ...editValue,
                    per_activo: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Perfil activo</span>
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onSave}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center"
              type="button"
            >
              <Icon name="Check" size={16} className="mr-1" />
              Guardar
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors flex items-center"
              type="button"
            >
              <Icon name="X" size={16} className="mr-1" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-lg font-semibold text-gray-900">
                {perfil.per_nom}
              </h4>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  perfil.per_activo
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {perfil.per_activo ? "Activo" : "Inactivo"}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Nivel {perfil.per_nivel}
              </span>
            </div>

            {perfil.per_descripcion && (
              <p className="text-sm text-gray-600 mb-2">
                {perfil.per_descripcion}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Icon name="Users" size={14} className="mr-1" />
                <span>{perfil.total_usuarios || 0} usuarios</span>
              </div>
              <div className="flex items-center">
                <Icon name="Shield" size={14} className="mr-1" />
                <span>{perfil.total_permisos || 0} permisos</span>
              </div>
              {perfil.per_cre && (
                <div className="flex items-center">
                  <Icon name="Calendar" size={14} className="mr-1" />
                  <span>
                    Creado: {new Date(perfil.per_cre).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <button
              className={`p-2 rounded transition-colors flex items-center ${
                perfil.per_nivel === 10
                  ? "text-gray-400 cursor-not-allowed"
                  : perfil.per_activo
                  ? "text-orange-600 hover:bg-orange-100"
                  : "text-green-600 hover:bg-green-100"
              }`}
              onClick={() =>
                perfil.per_nivel !== 10 && onToggleStatus(perfil.per_id)
              }
              type="button"
              title={
                perfil.per_nivel === 10
                  ? "Este perfil no puede ser desactivado"
                  : perfil.per_activo
                  ? "Desactivar perfil"
                  : "Activar perfil"
              }
              disabled={perfil.per_nivel === 10}
            >
              <Icon
                name={perfil.per_activo ? "ToggleLeft" : "ToggleRight"}
                size={18}
              />
            </button>

            <button
              className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors"
              onClick={() => onEdit(perfil)}
              type="button"
              title="Editar perfil"
            >
              <Icon name="Edit2" size={18} />
            </button>
            <button
              className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition-colors"
              onClick={() => onDelete(perfil.per_id)}
              type="button"
              title="Eliminar perfil"
            >
              <Icon name="Trash2" size={18} />
            </button>
          </div>
        </div>
      )}
    </li>
  )
);

const UsuParamWindow = ({ data, showMessage }) => {
  // ===== ESTADOS =====
  const [activeTab, setActiveTab] = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPerfiles, setLoadingPerfiles] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioEditado, setUsuarioEditado] = useState({});
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);

  // Estados para formularios
  const [nuevoPerfil, setNuevoPerfil] = useState({
    per_nom: "",
    per_descripcion: "",
    per_nivel: 1,
    per_activo: true,
  });
  const [perfilEditando, setPerfilEditando] = useState(null);
  const [perfilEditado, setPerfilEditado] = useState({});

  // ===== FUNCIONES BÁSICAS ESTABLES =====
  const showMessageStable = useCallback(
    (type, text) => {
      if (showMessage) {
        showMessage(type, text);
      }
    },
    [showMessage]
  );

  // ===== HANDLERS MEMOIZADOS =====
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleUserSelect = useCallback((usuario) => {
    setSelectedUser(usuario);
  }, []);

  const handleNewPerfilChange = useCallback((field, value) => {
    setNuevoPerfil((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleEditValueChange = useCallback((value) => {
    setPerfilEditado(value);
  }, []);

  // ===== CARGAR DATOS =====
  const loadUsuarios = useCallback(async () => {
    console.log("🔍 Cargando usuarios...");
    setLoading(true);
    try {
      // Usar fetch directo ya que adminService puede no estar configurado aún
      const token = localStorage.getItem("auth_token");

      // Intentar diferentes URLs según tu configuración
      const possibleUrls = [
        "http://127.0.0.1:8000/api/usuarios",
        "http://localhost:8000/api/usuarios",
      ];

      let response = null;
      let lastError = null;

      for (const url of possibleUrls) {
        try {
          console.log(`🌐 Intentando conectar a: ${url}`);
          response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });

          if (response.ok) {
            console.log(`✅ Conexión exitosa a: ${url}`);
            break;
          } else {
            console.log(`❌ Error HTTP ${response.status} en: ${url}`);
            lastError = new Error(
              `HTTP ${response.status}: ${response.statusText}`
            );
          }
        } catch (error) {
          console.log(`💥 Error de conexión a: ${url}`, error.message);
          lastError = error;
          response = null;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error("No se pudo conectar a ningún servidor");
      }

      const data = await response.json();
      console.log("📦 Respuesta completa usuarios:", data);

      // Manejar diferentes estructuras de respuesta
      let usuariosList = [];
      if (Array.isArray(data)) {
        usuariosList = data;
      } else if (data.data && Array.isArray(data.data)) {
        usuariosList = data.data;
      } else if (data.data && data.data.data && Array.isArray(data.data.data)) {
        usuariosList = data.data.data;
      } else if (data.usuarios && Array.isArray(data.usuarios)) {
        usuariosList = data.usuarios;
      } else {
        console.error("❌ Estructura de usuarios no reconocida:", data);
        usuariosList = [];
      }

      console.log("📋 Lista de usuarios extraída:", usuariosList);

      if (Array.isArray(usuariosList)) {
        const usuariosFormateados = usuariosList.map((u) => ({
          ...u,
          nombre_completo: `${u.usu_nom || ""} ${u.usu_ape || ""}`.trim(),
        }));
        setUsuarios(usuariosFormateados);
        console.log("✅ Usuarios cargados:", usuariosFormateados.length);
      } else {
        console.error("❌ usuariosList no es un array:", usuariosList);
        setUsuarios([]);
        showMessageStable("error", "Formato de datos de usuarios inválido");
      }
    } catch (error) {
      console.error("💥 Error loading users:", error);
      setUsuarios([]);
      showMessageStable(
        "error",
        error.message || "Error al conectar con la API de usuarios"
      );
    } finally {
      setLoading(false);
    }
  }, [showMessageStable]);

  const loadPerfiles = useCallback(async () => {
    console.log("🔍 Cargando perfiles...");
    setLoadingPerfiles(true);
    try {
      // Usar fetch directo para debugging
      const token = localStorage.getItem("auth_token");

      // Intentar diferentes URLs según tu configuración
      const possibleUrls = [
        "http://127.0.0.1:8000/api/perfiles"
      ];

      let response = null;
      let lastError = null;

      for (const url of possibleUrls) {
        try {
          console.log(`🌐 Intentando conectar a: ${url}`);
          response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });

          if (response.ok) {
            console.log(`✅ Conexión exitosa a: ${url}`);
            break;
          } else {
            console.log(`❌ Error HTTP ${response.status} en: ${url}`);
            lastError = new Error(
              `HTTP ${response.status}: ${response.statusText}`
            );
          }
        } catch (error) {
          console.log(`💥 Error de conexión a: ${url}`, error.message);
          lastError = error;
          response = null;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error("No se pudo conectar a ningún servidor");
      }

      const data = await response.json();
      console.log("📦 Respuesta completa perfiles:", data);

      // Manejar diferentes estructuras de respuesta
      let perfilesList = [];
      if (Array.isArray(data)) {
        perfilesList = data;
      } else if (data.data && Array.isArray(data.data)) {
        perfilesList = data.data;
      } else if (data.data && data.data.data && Array.isArray(data.data.data)) {
        perfilesList = data.data.data;
      } else if (data.perfiles && Array.isArray(data.perfiles)) {
        perfilesList = data.perfiles;
      } else {
        console.error("❌ Estructura de perfiles no reconocida:", data);
        perfilesList = [];
      }

      console.log("📋 Lista de perfiles extraída:", perfilesList);

      if (Array.isArray(perfilesList)) {
        const perfilesFormateados = perfilesList.map((p) => ({
          ...p,
          per_activo: !!p.per_activo, // Asegura que sea booleano
        }));

        setPerfiles(perfilesFormateados);
        console.log("✅ Perfiles cargados:", perfilesFormateados.length);
      } else {
        console.error("❌ perfilesList no es un array:", perfilesList);
        setPerfiles([]);
        showMessageStable("error", "Formato de datos de perfiles inválido");
      }
    } catch (error) {
      console.error("💥 Error loading profiles:", error);
      setPerfiles([]);
      showMessageStable("error", error.message || "Error al cargar perfiles");
    } finally {
      setLoadingPerfiles(false);
    }
  }, [showMessageStable]);

  // ===== EFECTOS OPTIMIZADOS =====
  useEffect(() => {
    console.log("🔧 useEffect inicial - activeTab:", activeTab);
    if (activeTab === "usuarios") {
      loadUsuarios();
    }
    loadPerfiles(); // Siempre cargar perfiles para el selector
  }, [activeTab, loadUsuarios, loadPerfiles]);

  // ===== FUNCIÓN HELPER PARA OBTENER URL VÁLIDA =====
  const getValidApiUrl = useCallback(async (endpoint) => {
    const possibleUrls = [
      `http://127.0.0.1:8000/api/${endpoint}`,
      `http://localhost:8000/api/${endpoint}`,
    ];

    const token = localStorage.getItem("auth_token");

    for (const url of possibleUrls) {
      try {
        const testResponse = await fetch(url, {
          method: "HEAD",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (testResponse.ok || testResponse.status === 405) {
          // 405 = Method not allowed, but server exists
          return url.replace("/api/" + endpoint, "/api");
        }
      } catch (error) {
        continue;
      }
    }

    return "http://127.0.0.1:8000/api"; // Default fallback
  }, []);

  // ===== ACCIONES DE USUARIO =====
  const eliminarUsuario = useCallback(async () => {
    if (
      !selectedUser ||
      !window.confirm(
        `¿Estás seguro de eliminar al usuario ${selectedUser.nombre_completo}?`
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const baseUrl = await getValidApiUrl("usuarios");
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${baseUrl}/usuarios/${selectedUser.usu_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        showMessageStable("success", "Usuario eliminado correctamente");
        setSelectedUser(null);
        await loadUsuarios();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showMessageStable(
          "error",
          errorData.message || "No se pudo eliminar el usuario"
        );
      }
    } catch (error) {
      console.error("💥 Error deleting user:", error);
      showMessageStable(
        "error",
        error.message || "Error de conexión al eliminar"
      );
    } finally {
      setProcessing(false);
    }
  }, [selectedUser, showMessageStable, loadUsuarios, getValidApiUrl]);

  // ===== ACCIONES DE PERFIL =====
  const crearPerfil = useCallback(async () => {
    if (!nuevoPerfil.per_nom.trim()) {
      showMessageStable("error", "El nombre del perfil es requerido");
      return;
    }

    setProcessing(true);
    try {
      const baseUrl = await getValidApiUrl("perfiles");
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${baseUrl}/perfiles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          per_nom: nuevoPerfil.per_nom,
          per_descripcion: nuevoPerfil.per_descripcion,
          per_nivel: nuevoPerfil.per_nivel,
          per_activo: Boolean(nuevoPerfil.per_activo),
        }),
      });

      if (response.ok) {
        showMessageStable("success", "Perfil creado correctamente");
        setNuevoPerfil({
          per_nom: "",
          per_descripcion: "",
          per_nivel: 1,
          per_activo: true,
        });
        await loadPerfiles();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showMessageStable(
          "error",
          errorData.message || "No se pudo crear el perfil"
        );
      }
    } catch (error) {
      console.error("💥 Error creating profile:", error);
      showMessageStable("error", error.message || "No se pudo crear el perfil");
    } finally {
      setProcessing(false);
    }
  }, [nuevoPerfil, showMessageStable, loadPerfiles, getValidApiUrl]);

  const editarPerfil = useCallback((perfil) => {
    setPerfilEditando(perfil);
    setPerfilEditado({
      per_id: perfil.per_id,
      per_nom: perfil.per_nom,
      per_descripcion: perfil.per_descripcion || "",
      per_nivel: perfil.per_nivel,
      per_activo: perfil.per_activo,
    });
  }, []);

  const actualizarPerfil = useCallback(async () => {
    if (!perfilEditando || !perfilEditado.per_nom.trim()) {
      showMessageStable("error", "El nombre del perfil es requerido");
      return;
    }

    setProcessing(true);
    try {
      const baseUrl = await getValidApiUrl("perfiles");
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${baseUrl}/perfiles/${perfilEditando.per_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            per_nom: perfilEditado.per_nom,
            per_descripcion: perfilEditado.per_descripcion,
            per_nivel: perfilEditado.per_nivel,
            per_activo: Boolean(perfilEditado.per_activo),
            per_id: perfilEditando.per_id,
          }),
        }
      );

      if (response.ok) {
        showMessageStable("success", "Perfil actualizado correctamente");
        setPerfilEditando(null);
        setPerfilEditado({});
        await loadPerfiles();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showMessageStable(
          "error",
          errorData.message || "Error al actualizar perfil"
        );
      }
    } catch (error) {
      console.error("💥 Error updating profile:", error);
      showMessageStable(
        "error",
        error.message || "No se pudo actualizar el perfil"
      );
    } finally {
      setProcessing(false);
    }
  }, [
    perfilEditando,
    perfilEditado,
    showMessageStable,
    loadPerfiles,
    getValidApiUrl,
  ]);

  const cancelarEdicion = useCallback(() => {
    setPerfilEditando(null);
    setPerfilEditado({});
  }, []);

  const togglePerfilStatus = useCallback(
    async (perfilId) => {
      setProcessing(true);
      try {
        const baseUrl = await getValidApiUrl("perfiles");
        const token = localStorage.getItem("auth_token");
        const response = await fetch(
          `${baseUrl}/perfiles/${perfilId}/toggle-status`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          showMessageStable(
            "success",
            result.message || "Estado actualizado correctamente"
          );
          await loadPerfiles();
        } else {
          const errorData = await response.json().catch(() => ({}));
          showMessageStable(
            "error",
            errorData.message || "Error al cambiar estado del perfil"
          );
        }
      } catch (error) {
        console.error("💥 Error toggling profile status:", error);
        showMessageStable(
          "error",
          error.message || "Error al cambiar estado del perfil"
        );
      } finally {
        setProcessing(false);
      }
    },
    [showMessageStable, loadPerfiles, getValidApiUrl]
  );

  const eliminarPerfil = useCallback(
    async (perfilId) => {
      const perfil = perfiles.find((p) => p.per_id === perfilId);
      if (
        !perfil ||
        !window.confirm(
          `¿Estás seguro de eliminar el perfil "${perfil.per_nom}"?`
        )
      ) {
        return;
      }

      setProcessing(true);
      try {
        const baseUrl = await getValidApiUrl("perfiles");
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`${baseUrl}/perfiles/${perfilId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.ok) {
          showMessageStable("success", "Perfil eliminado correctamente");
          await loadPerfiles();
        } else {
          const errorData = await response.json().catch(() => ({}));
          showMessageStable(
            "error",
            errorData.message || "No se pudo eliminar el perfil"
          );
        }
      } catch (error) {
        console.error("💥 Error deleting profile:", error);
        showMessageStable("error", error.message || "Error al eliminar perfil");
      } finally {
        setProcessing(false);
      }
    },
    [perfiles, showMessageStable, loadPerfiles, getValidApiUrl]
  );

  // ===== DATOS DERIVADOS MEMOIZADOS =====
  const userDetails = useMemo(() => {
    if (!selectedUser) return null;

    return {
      nombre: selectedUser.nombre_completo || "",
      correo: selectedUser.usu_cor || "",
      perfil: selectedUser.perfil || "Sin perfil asignado",
      cedula: selectedUser.usu_ced || "",
      estado: selectedUser.estado || "No definido",
    };
  }, [selectedUser]);

  // ===== RENDER PRINCIPAL =====
  if (loading && activeTab === "usuarios") {
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
    <div className="p-6 h-full overflow-auto bg-gray-50 relative z-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            Gestión de Usuarios y Perfiles
          </h2>
          <p className="text-sm text-gray-500">
            Administra usuarios y sus perfiles asignados
          </p>
        </div>

        {/* Pestañas */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <TabButton
            tabId="usuarios"
            label="Usuarios"
            icon="Users"
            isActive={activeTab === "usuarios"}
            onClick={() => handleTabChange("usuarios")}
          />
          <TabButton
            tabId="perfiles"
            label="Perfiles"
            icon="Shield"
            isActive={activeTab === "perfiles"}
            onClick={() => handleTabChange("perfiles")}
          />
        </div>
      </div>
      {/* Botón Crear Usuario */}
      {activeTab === "usuarios" && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => {
              setUsuarioEditando(null);
              setUsuarioEditado({});
              setMostrarModalCrear(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <Icon name="UserPlus" size={16} className="mr-2" />
            Crear Usuario
          </button>
        </div>
      )}

      {/* Contenido de las pestañas */}
      {activeTab === "usuarios" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lista de usuarios */}
          <div className="bg-white p-5 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center">
              <Icon name="Users" size={18} className="mr-2" />
              Listado de Usuarios ({usuarios.length})
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {usuarios.map((usuario) => (
                <UserCard
                  key={usuario.usu_id}
                  usuario={usuario}
                  isSelected={selectedUser?.usu_id === usuario.usu_id}
                  onClick={handleUserSelect}
                />
              ))}
            </div>

            {usuarios.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Icon
                  name="Users"
                  size={48}
                  className="mx-auto mb-4 text-gray-300"
                />
                <p>No hay usuarios disponibles</p>
              </div>
            )}
          </div>

          {/* Detalles del usuario */}
          <div className="bg-white p-5 rounded-lg border">
            {selectedUser ? (
              <>
                <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center">
                  <Icon name="UserCog" size={18} className="mr-2" />
                  Detalles del Usuario
                </h3>

                <div className="space-y-4">
                  {usuarioEditando?.usu_id === selectedUser.usu_id ? (
                    <>
                      <div className="grid grid-cols-1 gap-3">
                        <input
                          type="text"
                          className="border px-3 py-2 rounded w-full"
                          placeholder="Nombre"
                          value={usuarioEditado.usu_nom || ""}
                          onChange={(e) =>
                            setUsuarioEditado({
                              ...usuarioEditado,
                              usu_nom: e.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          className="border px-3 py-2 rounded w-full"
                          placeholder="Apellido"
                          value={usuarioEditado.usu_ape || ""}
                          onChange={(e) =>
                            setUsuarioEditado({
                              ...usuarioEditado,
                              usu_ape: e.target.value,
                            })
                          }
                        />
                        <input
                          type="email"
                          className="border px-3 py-2 rounded w-full"
                          placeholder="Correo"
                          value={usuarioEditado.usu_cor || ""}
                          onChange={(e) =>
                            setUsuarioEditado({
                              ...usuarioEditado,
                              usu_cor: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-2 pt-3 border-t">
                        <button
                          onClick={async () => {
                            if (
                              !usuarioEditando ||
                              !usuarioEditado.usu_nom?.trim() ||
                              !usuarioEditado.usu_ape?.trim() ||
                              !usuarioEditado.usu_cor?.trim()
                            ) {
                              showMessageStable(
                                "error",
                                "Completa todos los campos antes de guardar"
                              );
                              return;
                            }

                            try {
                              setProcessing(true);
                              const baseUrl = await getValidApiUrl("usuarios");
                              const token = localStorage.getItem("auth_token");

                              const response = await fetch(
                                `${baseUrl}/usuarios/${usuarioEditando.usu_id}`,
                                {
                                  method: "PUT",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    usu_nom: usuarioEditado.usu_nom,
                                    usu_ape: usuarioEditado.usu_ape,
                                    usu_cor: usuarioEditado.usu_cor,
                                  }),
                                }
                              );

                              if (response.ok) {
                                showMessageStable(
                                  "success",
                                  "✅ Usuario actualizado correctamente"
                                );
                                setUsuarioEditando(null);
                                setUsuarioEditado({});
                                await loadUsuarios();

                                // Actualizar también el usuario seleccionado localmente
                                setSelectedUser((prev) => ({
                                  ...prev,
                                  usu_nom: usuarioEditado.usu_nom,
                                  usu_ape: usuarioEditado.usu_ape,
                                  usu_cor: usuarioEditado.usu_cor,
                                  nombre_completo:
                                    `${usuarioEditado.usu_nom} ${usuarioEditado.usu_ape}`.trim(),
                                }));
                              } else {
                                const errorData = await response
                                  .json()
                                  .catch(() => ({}));
                                showMessageStable(
                                  "error",
                                  errorData.message ||
                                    "❌ Error al actualizar usuario"
                                );
                              }
                            } catch (error) {
                              console.error("💥 Error al actualizar:", error);
                              showMessageStable(
                                "error",
                                "❌ Error al conectar con el servidor"
                              );
                            } finally {
                              setProcessing(false);
                            }
                          }}
                          disabled={processing}
                          className={`px-4 py-2 rounded text-white flex items-center ${
                            processing
                              ? "bg-green-400 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {processing && (
                            <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
                          )}
                          Guardar
                        </button>

                        <button
                          onClick={() => {
                            setUsuarioEditando(null);
                            setUsuarioEditado({});
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="p-3 bg-gray-50 rounded border">
                          <label className="text-sm font-medium text-gray-600">
                            Nombre Completo
                          </label>
                          <p className="text-gray-900">{userDetails.nombre}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded border">
                          <label className="text-sm font-medium text-gray-600">
                            Correo Electrónico
                          </label>
                          <p className="text-gray-900">{userDetails.correo}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded border">
                          <label className="text-sm font-medium text-gray-600">
                            Perfil Asignado
                          </label>
                          <p className="text-gray-900">{userDetails.perfil}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t flex gap-2">
                        <button
                          onClick={eliminarUsuario}
                          disabled={processing}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          type="button"
                        >
                          <Icon name="Trash2" size={16} className="mr-2" />
                          Eliminar Usuario
                        </button>
                        <button
                          onClick={() => {
                            setUsuarioEditando(selectedUser);
                            setUsuarioEditado({
                              usu_nom: selectedUser.usu_nom || "",
                              usu_ape: selectedUser.usu_ape || "",
                              usu_cor: selectedUser.usu_cor || "",
                            });
                          }}
                          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 flex items-center"
                          type="button"
                        >
                          <Icon name="Edit2" size={16} className="mr-2" />
                          Editar Usuario
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Icon
                    name="User"
                    size={48}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p>Seleccione un usuario para ver sus detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Pestaña de Perfiles */
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 text-purple-800 flex items-center">
            <Icon name="Shield" size={18} className="mr-2" />
            Gestión de Perfiles ({perfiles.length})
          </h3>

          {/* Formulario para nuevo perfil */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-4">
              Crear Nuevo Perfil
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Perfil *
                </label>
                <input
                  className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: Administrador, Usuario, etc."
                  value={nuevoPerfil.per_nom}
                  onChange={(e) =>
                    handleNewPerfilChange("per_nom", e.target.value)
                  }
                  disabled={processing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de Acceso
                </label>
                <select
                  value={nuevoPerfil.per_nivel}
                  onChange={(e) =>
                    handleNewPerfilChange("per_nivel", parseInt(e.target.value))
                  }
                  className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={processing}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((nivel) => (
                    <option key={nivel} value={nivel}>
                      Nivel {nivel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Descripción del perfil y sus responsabilidades"
                  rows="2"
                  value={nuevoPerfil.per_descripcion}
                  onChange={(e) =>
                    handleNewPerfilChange("per_descripcion", e.target.value)
                  }
                  disabled={processing}
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={nuevoPerfil.per_activo}
                    onChange={(e) =>
                      handleNewPerfilChange("per_activo", e.target.checked)
                    }
                    className="mr-2"
                    disabled={processing}
                  />
                  <span className="text-sm text-gray-700">Perfil activo</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={crearPerfil}
                  disabled={processing || !nuevoPerfil.per_nom.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  type="button"
                >
                  {processing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Icon name="Plus" size={16} className="mr-2" />
                  )}
                  {processing ? "Creando..." : "Crear Perfil"}
                </button>
              </div>
            </div>
          </div>

          {/* Lista de perfiles */}
          {loadingPerfiles ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Cargando perfiles...</p>
              </div>
            </div>
          ) : Array.isArray(perfiles) && perfiles.length > 0 ? (
            <ul className="space-y-3">
              {perfiles.map((perfil) => (
                <PerfilCard
                  key={perfil.per_id}
                  perfil={perfil}
                  isEditing={perfilEditando?.per_id === perfil.per_id}
                  editValue={perfilEditado}
                  onEdit={editarPerfil}
                  onDelete={eliminarPerfil}
                  onToggleStatus={togglePerfilStatus}
                  onEditValueChange={handleEditValueChange}
                  onSave={actualizarPerfil}
                  onCancel={cancelarEdicion}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Icon
                name="Shield"
                size={48}
                className="mx-auto mb-4 text-gray-300"
              />
              <p>No hay perfiles disponibles</p>
              <p className="text-sm mt-1">
                Crea el primer perfil usando el formulario superior
              </p>
              {!Array.isArray(perfiles) && (
                <p className="text-xs mt-2 text-red-500">
                  Error: Los datos no tienen el formato correcto
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Indicador de procesamiento global */}
      {/* Spinner local en esquina inferior derecha */}
      {processing && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-full p-3 z-50">
          <div className="animate-spin h-6 w-6 border-t-2 border-blue-600 rounded-full"></div>
        </div>
      )}
      {mostrarModalCrear && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative animate-fade-in-down">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setMostrarModalCrear(false)}
            >
              <Icon name="X" size={20} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Crear Nuevo Usuario
            </h2>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Validaciones mínimas
                if (
                  !usuarioEditado.usu_nom?.trim() ||
                  !usuarioEditado.usu_ape?.trim() ||
                  !usuarioEditado.usu_cor?.trim()
                ) {
                  showMessageStable("error", "Completa los campos requeridos");
                  return;
                }

                try {
                  setProcessing(true);
                  const baseUrl = await getValidApiUrl("usuarios");
                  const token = localStorage.getItem("auth_token");

                  const response = await fetch(`${baseUrl}/usuarios`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      usu_nom: usuarioEditado.usu_nom,
                      usu_ape: usuarioEditado.usu_ape,
                      usu_cor: usuarioEditado.usu_cor,
                      usu_con: usuarioEditado.usu_con, // 🔒 nueva clave
                      usu_ced: usuarioEditado.usu_ced,
                      usu_tel: usuarioEditado.usu_tel,
                      usu_dir: usuarioEditado.usu_dir,
                      usu_fecha_nacimiento: usuarioEditado.usu_fecha_nacimiento,
                    }),
                  });

                  if (response.ok) {
                    showMessageStable(
                      "success",
                      "Usuario creado correctamente"
                    );
                    setMostrarModalCrear(false);
                    setUsuarioEditado({});
                    await loadUsuarios();
                  } else {
                    const err = await response.json().catch(() => ({}));
                    showMessageStable(
                      "error",
                      err.message || "Error al crear usuario"
                    );
                  }
                } catch (err) {
                  console.error("Error creando usuario:", err);
                  showMessageStable(
                    "error",
                    err.message || "Error de conexión con el servidor"
                  );
                } finally {
                  setProcessing(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres
                </label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded"
                  placeholder="Nombres"
                  value={usuarioEditado.usu_nom || ""}
                  onChange={(e) =>
                    setUsuarioEditado({
                      ...usuarioEditado,
                      usu_nom: e.target.value,
                    })
                  }
                  required
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos
                </label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded"
                  placeholder="Apellidos"
                  value={usuarioEditado.usu_ape || ""}
                  onChange={(e) =>
                    setUsuarioEditado({
                      ...usuarioEditado,
                      usu_ape: e.target.value,
                    })
                  }
                  required
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo
                </label>
                <input
                  type="email"
                  className="border px-3 py-2 rounded"
                  placeholder="Correo"
                  value={usuarioEditado.usu_cor || ""}
                  onChange={(e) =>
                    setUsuarioEditado({
                      ...usuarioEditado,
                      usu_cor: e.target.value,
                    })
                  }
                  required
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  className="border px-3 py-2 rounded"
                  placeholder="Contraseña"
                  value={usuarioEditado.usu_con || ""}
                  onChange={(e) =>
                    setUsuarioEditado({
                      ...usuarioEditado,
                      usu_con: e.target.value,
                    })
                  }
                  required
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula
                </label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded"
                  placeholder="Cédula"
                  value={usuarioEditado.usu_ced || ""}
                  onChange={(e) =>
                    setUsuarioEditado({
                      ...usuarioEditado,
                      usu_ced: e.target.value,
                    })
                  }
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded"
                  placeholder="Teléfono"
                  value={usuarioEditado.usu_tel || ""}
                  onChange={(e) =>
                    setUsuarioEditado({
                      ...usuarioEditado,
                      usu_tel: e.target.value,
                    })
                  }
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded"
                  placeholder="Dirección"
                  value={usuarioEditado.usu_dir || ""}
                  onChange={(e) =>
                    setUsuarioEditado({
                      ...usuarioEditado,
                      usu_dir: e.target.value,
                    })
                  }
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  className="border px-3 py-2 rounded col-span-full"
                  value={usuarioEditado.usu_fecha_nacimiento || ""}
                  onChange={(e) =>
                    setUsuarioEditado({
                      ...usuarioEditado,
                      usu_fecha_nacimiento: e.target.value,
                    })
                  }
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={processing}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center"
                >
                  {processing && (
                    <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
                  )}
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuParamWindow;
