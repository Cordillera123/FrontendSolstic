import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useButtonPermissions } from "../../hooks/useButtonPermissions";
import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";
import PerParamWindow from "./PerParamWindow";

// Componente principal para gestión de usuarios
const UsuParamWindow = ({
  showMessage = (type, message) => console.log(`${type}: ${message}`), // ✅ Función por defecto
  menuId = 8,
  perfilesMenuId = null,
  defaultTab = "usuarios",
  title = "Gestión de Usuarios y Perfiles",
}) => {
  const effectivePerfilesMenuId = perfilesMenuId || menuId;
  const [showDisabled, setShowDisabled] = useState(true); // ✅ Estado para mostrar deshabilitados
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [selectedPerfil, setSelectedPerfil] = useState("");
  const [formData, setFormData] = useState({
    usu_nom: "",
    usu_ape: "",
    usu_cor: "",
    usu_con: "",
    usu_ced: "",
    per_id: "",
    est_id: 1,
  });

  // Hook de permisos para usuarios
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    loading: permissionsLoading,
  } = useButtonPermissions(menuId, null, true, "menu");

  // ✅ FUNCIÓN loadUsuarios CORREGIDA - Siempre incluye deshabilitados para ver cambios
  const loadUsuarios = useCallback(async () => {
    console.log("🔍 loadUsuarios iniciado");
    console.log("🔍 canRead:", canRead);
    console.log("🔍 selectedPerfil:", selectedPerfil);
    console.log("🔍 showDisabled:", showDisabled);

    if (!canRead) {
      console.log("❌ Sin permisos de lectura");
      return;
    }

    setLoading(true);
    try {
      // ✅ CAMBIO CLAVE: Incluir usuarios deshabilitados basado en el estado
      const params = selectedPerfil ? { per_id: selectedPerfil } : {};

      // ✅ Incluir deshabilitados según el checkbox
      params.incluir_deshabilitados = showDisabled;

      console.log("🔍 Cargando usuarios con params:", params);

      if (!adminService?.usuarios?.getAll) {
        console.error("❌ adminService.usuarios.getAll no existe");
        showMessage("error", "Error: Función de carga no disponible");
        return;
      }

      const result = await adminService.usuarios.getAll(params);
      console.log("📥 Respuesta completa usuarios:", result);

      if (result?.status === "success" && result?.data) {
        let usuariosData = [];

        // Caso 1: Respuesta directa como array
        if (Array.isArray(result.data)) {
          usuariosData = result.data;
          console.log(
            "📊 Caso 1: Array directo, usuarios:",
            usuariosData.length
          );
        }
        // Caso 2: Paginación Laravel estándar
        else if (result.data.data && Array.isArray(result.data.data)) {
          usuariosData = result.data.data;
          console.log(
            "📊 Caso 2: Paginación Laravel, usuarios:",
            usuariosData.length
          );
        }
        // Caso 3: Paginación Laravel anidada
        else if (
          result.data.data?.data &&
          Array.isArray(result.data.data.data)
        ) {
          usuariosData = result.data.data.data;
          console.log(
            "📊 Caso 3: Paginación anidada, usuarios:",
            usuariosData.length
          );
        }

        console.log("✅ Usuarios procesados:", usuariosData);
        console.log("✅ Primer usuario (muestra):", usuariosData[0]);

        // ✅ VERIFICAR ESTADOS DE USUARIOS
        usuariosData.forEach((user) => {
          console.log(
            `👤 Usuario ${user.usu_id} (${user.usu_nom}): usu_deshabilitado = ${user.usu_deshabilitado}`
          );
        });

        setUsuarios(usuariosData);
      } else {
        console.error("❌ Error en respuesta usuarios:", result);
        setUsuarios([]);
        showMessage("error", result?.message || "Error al cargar usuarios");
      }
    } catch (error) {
      console.error("❌ Error loading usuarios:", error);
      console.error("❌ Error details:", error.response?.data);
      setUsuarios([]);
      showMessage(
        "error",
        "Error al cargar usuarios: " + (error.message || "Error desconocido")
      );
    } finally {
      setLoading(false);
    }
  }, [canRead, selectedPerfil, showDisabled]); // ✅ Agregar showDisabled como dependencia

  // ✅ FUNCIÓN renderUsuarioStatus MEJORADA con debug completo
  const renderUsuarioStatus = (usuario) => {
    console.log("🔍 DEBUG COMPLETO - Renderizando estado para usuario:", {
      id: usuario.usu_id,
      nombre: `${usuario.usu_nom} ${usuario.usu_ape}`,
      usu_deshabilitado: usuario.usu_deshabilitado,
      usu_deshabilitado_type: typeof usuario.usu_deshabilitado,
      est_id: usuario.est_id,
      est_id_type: typeof usuario.est_id,
      estado: usuario.estado,
      raw_object: usuario,
    });

    // ✅ VERIFICAR MÚLTIPLES CAMPOS PARA EL ESTADO - MEJORADO
    let statusText = "Activo";
    let statusClass = "bg-green-100 text-green-800";

    // ✅ PRIORIDAD 1: Campo usu_deshabilitado (eliminado lógico) - MÁS ESTRICTO
    if (
      usuario.usu_deshabilitado === true ||
      usuario.usu_deshabilitado === 1 ||
      usuario.usu_deshabilitado === "1" ||
      usuario.usu_deshabilitado === "true"
    ) {
      statusText = "Deshabilitado";
      statusClass = "bg-red-100 text-red-800";
      console.log(
        "✅ DETECTADO como DESHABILITADO por usu_deshabilitado:",
        usuario.usu_deshabilitado
      );
    }
    // ✅ PRIORIDAD 2: Campo est_id
    else if (usuario.est_id === 2 || usuario.est_id === "2") {
      statusText = "Inactivo";
      statusClass = "bg-yellow-100 text-yellow-800";
      console.log("✅ DETECTADO como INACTIVO por est_id:", usuario.est_id);
    }
    // ✅ PRIORIDAD 3: Campo estado como string
    else if (
      usuario.estado === "Inactivo" ||
      usuario.estado === "Deshabilitado"
    ) {
      statusText = usuario.estado;
      statusClass = "bg-yellow-100 text-yellow-800";
      console.log(
        "✅ DETECTADO como INACTIVO por estado string:",
        usuario.estado
      );
    }

    console.log("✅ Estado FINAL calculado:", { statusText, statusClass });

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
      >
        {statusText}
      </span>
    );
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI adminService ESTÁ DISPONIBLE
  const verifyApiService = () => {
    console.log("🔍 Verificando adminService...");
    console.log("adminService:", adminService);
    console.log("adminService.usuarios:", adminService?.usuarios);
    console.log(
      "adminService.usuarios.getAll:",
      typeof adminService?.usuarios?.getAll
    );
    console.log(
      "adminService.usuarios.delete:",
      typeof adminService?.usuarios?.delete
    );

    if (!adminService) {
      console.error("❌ adminService no está disponible");
      return false;
    }

    if (!adminService.usuarios) {
      console.error("❌ adminService.usuarios no está disponible");
      return false;
    }

    if (!adminService.usuarios.delete) {
      console.error("❌ adminService.usuarios.delete no está disponible");
      return false;
    }

    console.log("✅ adminService verificado correctamente");
    return true;
  };

  // ✅ FUNCIÓN PARA DEBUG DE ESTADOS DE USUARIOS
  const debugUsuarioStates = () => {
    console.log("🔍 DEBUG - Estados actuales de todos los usuarios:");
    usuarios.forEach((usuario, index) => {
      console.log(
        `${index + 1}. Usuario ${usuario.usu_id} (${usuario.usu_nom}):`,
        {
          usu_deshabilitado: usuario.usu_deshabilitado,
          tipo: typeof usuario.usu_deshabilitado,
          est_id: usuario.est_id,
          estado: usuario.estado,
          calculado: usuario.usu_deshabilitado ? "DESHABILITADO" : "ACTIVO",
        }
      );
    });
  };

  // ✅ LLAMAR VERIFICACIÓN AL CARGAR EL COMPONENTE
  useEffect(() => {
    console.log("🔍 Componente montado, verificando servicios...");
    verifyApiService();
  }, []);

  // ✅ FUNCIÓN loadPerfiles separada para el filtro
  const loadPerfilesForFilter = useCallback(async () => {
    try {
      console.log("🔍 Cargando perfiles para filtro...");
      const result = await adminService.perfiles.getAll();

      if (result?.status === "success" && result?.data) {
        const perfilesData = Array.isArray(result.data) ? result.data : [];
        console.log("✅ Perfiles para filtro:", perfilesData);
        setPerfiles(perfilesData);
      }
    } catch (error) {
      console.error("❌ Error loading perfiles para filtro:", error);
      setPerfiles([]);
    }
  }, []);

  // ✅ useEffect optimizado
  useEffect(() => {
    if (canRead) {
      loadUsuarios();
      loadPerfilesForFilter();
    }
  }, [canRead, loadUsuarios, loadPerfilesForFilter]);

  // ✅ useEffect para recargar cuando cambie showDisabled
  useEffect(() => {
    if (canRead && activeTab === "usuarios") {
      loadUsuarios();
    }
  }, [selectedPerfil, canRead, activeTab, showDisabled, loadUsuarios]);

  // Handlers del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validaciones robustas
    const required = ["usu_nom", "usu_ape", "usu_cor", "usu_ced", "per_id"];
    const missing = required.filter((field) => {
      const value = formData[field];
      if (typeof value === "string") {
        return !value.trim();
      } else if (typeof value === "number") {
        return !value;
      } else {
        return !value;
      }
    });

    if (missing.length > 0) {
      showMessage("error", `Campos requeridos: ${missing.join(", ")}`);
      return;
    }

    if (!editingUsuario && !formData.usu_con?.trim()) {
      showMessage("error", "La contraseña es requerida para crear usuario");
      return;
    }

    try {
      let result;
      const submitData = { ...formData };

      if (editingUsuario) {
        if (!canUpdate) {
          showMessage("error", "No tienes permisos para editar usuarios");
          return;
        }
        // Si no hay nueva contraseña, no enviarla
        if (!submitData.usu_con?.trim()) {
          delete submitData.usu_con;
        }
        result = await adminService.usuarios.update(
          editingUsuario.usu_id,
          submitData
        );
      } else {
        if (!canCreate) {
          showMessage("error", "No tienes permisos para crear usuarios");
          return;
        }
        result = await adminService.usuarios.create(submitData);
      }

      if (result?.status === "success") {
        showMessage(
          "success",
          result.message || "Usuario guardado correctamente"
        );
        // ✅ Limpiar formulario y recargar inmediatamente
        setShowForm(false);
        setEditingUsuario(null);
        setFormData({
          usu_nom: "",
          usu_ape: "",
          usu_cor: "",
          usu_con: "",
          usu_ced: "",
          per_id: "",
          est_id: 1,
        });
        await loadUsuarios(); // ✅ Recarga inmediata
      } else {
        showMessage("error", result?.message || "Error al guardar usuario");
      }
    } catch (error) {
      console.error("Error saving usuario:", error);

      // ✅ Mostrar errores de validación específicos
      if (error.response && error.response.data && error.response.data.errors) {
        const errors = error.response.data.errors;
        const errorMessages = [];

        // Convertir errores a mensajes amigables
        Object.keys(errors).forEach((field) => {
          const fieldErrors = errors[field];
          const fieldName =
            {
              usu_nom: "Nombre",
              usu_ape: "Apellido",
              usu_cor: "Email",
              usu_ced: "Cédula",
              usu_con: "Contraseña",
              per_id: "Perfil",
              est_id: "Estado",
            }[field] || field;

          fieldErrors.forEach((errorMsg) => {
            if (errorMsg.includes("has already been taken")) {
              errorMessages.push(`${fieldName}: Ya existe en el sistema`);
            } else if (errorMsg.includes("required")) {
              errorMessages.push(`${fieldName}: Es requerido`);
            } else if (errorMsg.includes("email")) {
              errorMessages.push(`${fieldName}: Formato de email inválido`);
            } else if (errorMsg.includes("min")) {
              errorMessages.push(`${fieldName}: Muy corto`);
            } else {
              errorMessages.push(`${fieldName}: ${errorMsg}`);
            }
          });
        });

        showMessage("error", errorMessages.join("\n"));
      } else {
        showMessage("error", error.message || "Error al guardar usuario");
      }
    }
  };

  const handleEdit = (usuario) => {
    if (!canUpdate) {
      showMessage("error", "No tienes permisos para editar usuarios");
      return;
    }
    setEditingUsuario(usuario);
    setFormData({
      usu_nom: usuario.usu_nom || "",
      usu_ape: usuario.usu_ape || "",
      usu_cor: usuario.usu_cor || "",
      usu_con: "", // Siempre vacío en edición
      usu_ced: usuario.usu_ced || "",
      per_id: usuario.per_id || "",
      est_id: usuario.est_id || 1,
    });
    setShowForm(true);
  };

  // ✅ FUNCIÓN handleDelete MEJORADA
  const handleDelete = async (usuario) => {
    console.log("🔍 handleDelete iniciado para usuario:", usuario.usu_id);

    if (!canDelete) {
      console.log("❌ Sin permisos para eliminar");
      showMessage("error", "No tienes permisos para eliminar usuarios");
      return;
    }

    const confirmMessage = `¿Estás seguro de DESHABILITAR al usuario "${usuario.usu_nom} ${usuario.usu_ape}"?\n\nEsto cambiará su estado a "Deshabilitado" (eliminado lógico).`;

    if (!window.confirm(confirmMessage)) {
      console.log("❌ Usuario canceló la operación");
      return;
    }

    console.log("✅ Usuario confirmó, iniciando deshabilitación...");

    try {
      console.log("🔄 Llamando a adminService.usuarios.delete...");

      const result = await adminService.usuarios.delete(usuario.usu_id);

      console.log("📥 Respuesta completa del servidor:", result);

      if (result?.status === "success") {
        console.log("✅ Deshabilitación exitosa");
        showMessage(
          "success",
          result.message || "Usuario deshabilitado correctamente"
        );

        console.log("🔄 Recargando lista de usuarios...");

        // ✅ FORZAR recarga inmediata para ver el cambio
        await loadUsuarios();

        console.log("✅ Lista recargada - verificando estados...");

        // ✅ VERIFICAR que el usuario específico esté ahora deshabilitado
        setTimeout(() => {
          const usuarioActualizado = usuarios.find(
            (u) => u.usu_id === usuario.usu_id
          );
          if (usuarioActualizado) {
            console.log("🔍 Usuario después de eliminar:", {
              id: usuarioActualizado.usu_id,
              nombre: usuarioActualizado.usu_nom,
              usu_deshabilitado: usuarioActualizado.usu_deshabilitado,
              estado_detectado: usuarioActualizado.usu_deshabilitado
                ? "DESHABILITADO"
                : "ACTIVO",
            });
          }
        }, 500);
      } else {
        console.error("❌ Error en resultado:", result);
        showMessage(
          "error",
          result?.message || "Error al deshabilitar usuario"
        );
      }
    } catch (error) {
      console.error("❌ Error completo en handleDelete:", {
        error: error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });

      let errorMessage = "Error al deshabilitar usuario";

      if (error.response?.status === 404) {
        errorMessage = "Usuario no encontrado";
      } else if (error.response?.status === 401) {
        errorMessage = "No autorizado - verifica tu sesión";
      } else if (error.response?.status === 403) {
        errorMessage = "No tienes permisos para esta acción";
      } else if (error.response?.status === 500) {
        errorMessage = `Error del servidor: ${
          error.response?.data?.message || "Error interno"
        }`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showMessage("error", errorMessage);
    }
  };

  // Función para reactivar usuarios
  const handleReactivate = async (usuario) => {
    console.log("🔍 handleReactivate iniciado para usuario:", usuario.usu_id);

    if (!canDelete) {
      console.log("❌ Sin permisos para reactivar");
      showMessage("error", "No tienes permisos para reactivar usuarios");
      return;
    }

    const confirmMessage = `¿Estás seguro de REACTIVAR al usuario "${usuario.usu_nom} ${usuario.usu_ape}"?\n\nEsto cambiará su estado a "Activo".`;

    if (!window.confirm(confirmMessage)) {
      console.log("❌ Usuario canceló la reactivación");
      return;
    }

    console.log("✅ Usuario confirmó, iniciando reactivación...");

    try {
      console.log("🔄 Llamando a adminService.usuarios.reactivate...");
      const result = await adminService.usuarios.reactivate(usuario.usu_id);
      console.log("📥 Respuesta del servidor:", result);

      if (result?.status === "success") {
        console.log("✅ Reactivación exitosa");
        showMessage(
          "success",
          result.message || "Usuario reactivado correctamente"
        );
        console.log("🔄 Recargando lista de usuarios...");
        await loadUsuarios();
        console.log("✅ Lista recargada");
      } else {
        console.error("❌ Error en resultado:", result);
        showMessage("error", result?.message || "Error al reactivar usuario");
      }
    } catch (error) {
      console.error("❌ Error completo en handleReactivate:", error);
      let errorMessage = "Error al reactivar usuario";

      if (error.response?.status === 404) {
        errorMessage = "Usuario no encontrado";
      } else if (error.response?.status === 401) {
        errorMessage = "No autorizado - verifica tu sesión";
      } else if (error.response?.status === 403) {
        errorMessage = "No tienes permisos para esta acción";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showMessage("error", errorMessage);
    }
  };

  // Función helper para verificar si usuario está deshabilitado
  const isUsuarioDeshabilitado = (usuario) => {
    return (
      usuario.usu_deshabilitado === true ||
      usuario.usu_deshabilitado === 1 ||
      usuario.usu_deshabilitado === "1" ||
      usuario.usu_deshabilitado === "true"
    );
  };

  const handleCreate = () => {
    if (!canCreate) {
      showMessage("error", "No tienes permisos para crear usuarios");
      return;
    }
    setEditingUsuario(null);
    setFormData({
      usu_nom: "",
      usu_ape: "",
      usu_cor: "",
      usu_con: "",
      usu_ced: "",
      per_id: "",
      est_id: 1,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUsuario(null);
    setFormData({
      usu_nom: "",
      usu_ape: "",
      usu_cor: "",
      usu_con: "",
      usu_ced: "",
      per_id: "",
      est_id: 1,
    });
  };

  const handlePerfilSelect = (perfil) => {
    console.log("🔍 Seleccionando perfil:", perfil);
    setActiveTab("usuarios");
    setSelectedPerfil(perfil.per_id.toString());
  };

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
          <p className="text-gray-500 mb-2">
            No tienes permisos para acceder a esta sección
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Información de debug:</strong>
            </p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>
                • Menu ID configurado:{" "}
                <code className="bg-yellow-100 px-1 rounded">{menuId}</code>
              </li>
              <li>
                • Permiso READ:{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  {canRead ? "SÍ" : "NO"}
                </code>
              </li>
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
              onClick={() => setActiveTab("usuarios")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "usuarios"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon name="User" size={16} className="inline mr-2" />
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab("perfiles")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "perfiles"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
        {activeTab === "usuarios" ? (
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
                  {Array.isArray(perfiles) &&
                    perfiles.map((perfil) => (
                      <option key={perfil.per_id} value={perfil.per_id}>
                        {perfil.per_nom}
                      </option>
                    ))}
                </select>

                {/* ✅ Toggle para mostrar usuarios deshabilitados */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showDisabled}
                      onChange={(e) => setShowDisabled(e.target.checked)}
                      className="rounded"
                    />
                    <span>Mostrar deshabilitados</span>
                  </label>
                </div>

                {/* ✅ Botón de debug temporal */}
                <button
                  onClick={debugUsuarioStates}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                  title="Debug estados de usuarios"
                >
                  🔍 Debug Estados
                </button>
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

            {/* ✅ FORMULARIO COMPLETO CON TODOS LOS CAMPOS */}
            {showForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">
                  {editingUsuario ? "Editar Usuario" : "Crear Usuario"}
                </h3>

                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* ✅ CAMPO 1: Nombre */}
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

                  {/* ✅ CAMPO 2: Apellido */}
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

                  {/* ✅ CAMPO 3: Email */}
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

                  {/* ✅ CAMPO 4: Cédula */}
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

                  {/* ✅ CAMPO 5: Contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {editingUsuario
                        ? "Nueva Contraseña (opcional)"
                        : "Contraseña *"}
                    </label>
                    <input
                      type="password"
                      name="usu_con"
                      value={formData.usu_con}
                      onChange={handleInputChange}
                      required={!editingUsuario}
                      minLength="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={
                        editingUsuario
                          ? "Dejar vacío para mantener actual"
                          : "Mínimo 6 caracteres"
                      }
                    />
                  </div>

                  {/* ✅ CAMPO 6: Perfil */}
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
                      {Array.isArray(perfiles) &&
                        perfiles.map((perfil) => (
                          <option key={perfil.per_id} value={perfil.per_id}>
                            {perfil.per_nom}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* ✅ CAMPO 7: Estado */}
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

                  {/* ✅ BOTONES */}
                  <div className="md:col-span-2 flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Icon name={editingUsuario ? "Save" : "Plus"} size={16} />
                      {editingUsuario ? "Actualizar" : "Crear"}
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
                  <Icon
                    name="Users"
                    size={48}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p className="text-gray-500">
                    {selectedPerfil
                      ? "No hay usuarios con el perfil seleccionado"
                      : showDisabled
                      ? "No hay usuarios registrados"
                      : "No hay usuarios activos (prueba activar 'Mostrar deshabilitados')"}
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
                                <Icon
                                  name="User"
                                  size={20}
                                  className="text-blue-600"
                                />
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
                            <div className="text-sm text-gray-900">
                              {usuario.usu_cor}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {usuario.usu_ced || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {usuario.perfil ||
                                usuario.per_nom ||
                                "Sin perfil"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderUsuarioStatus(usuario)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {/* Botón de editar - siempre visible */}
                              {canUpdate && (
                                <button
                                  onClick={() => handleEdit(usuario)}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  title="Editar usuario"
                                >
                                  <Icon name="Edit2" size={16} />
                                </button>
                              )}

                              {/* Botones condicionales según el estado */}
                              {canDelete && (
                                <>
                                  {isUsuarioDeshabilitado(usuario) ? (
                                    // Usuario deshabilitado - Mostrar botón de reactivar
                                    <button
                                      onClick={() => handleReactivate(usuario)}
                                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                      title="Reactivar usuario"
                                    >
                                      <Icon name="RotateCcw" size={16} />
                                    </button>
                                  ) : (
                                    // Usuario activo - Mostrar botón de deshabilitar
                                    <button
                                      onClick={() => handleDelete(usuario)}
                                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                      title="Deshabilitar usuario"
                                    >
                                      <Icon name="Trash2" size={16} />
                                    </button>
                                  )}
                                </>
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
