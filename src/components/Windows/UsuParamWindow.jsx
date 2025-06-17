import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useButtonPermissions } from "../../hooks/useButtonPermissions";
import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";
import PerParamWindow from "./PerParamWindow";

// Componente principal para gestión de usuarios con paginación y scroll
const UsuParamWindow = ({
  showMessage = (type, message) => console.log(`${type}: ${message}`),
  menuId = 8,
  perfilesMenuId = null,
  defaultTab = "usuarios",
  title = "Gestión de Usuarios y Perfiles",
}) => {
  const effectivePerfilesMenuId = perfilesMenuId || menuId;
  const [showDisabled, setShowDisabled] = useState(true);
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

  // ✅ ESTADOS PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState({});

  // Hook de permisos para usuarios
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    loading: permissionsLoading,
  } = useButtonPermissions(menuId, null, true, "menu");

  // ✅ FUNCIÓN loadUsuarios CON PAGINACIÓN CORREGIDA
  const loadUsuarios = useCallback(async (page = 1, perPage = itemsPerPage) => {
    console.log("🔍 loadUsuarios iniciado con paginación");
    console.log("🔍 Parámetros:", { page, perPage, canRead, selectedPerfil, showDisabled });

    if (!canRead) {
      console.log("❌ Sin permisos de lectura");
      return;
    }

    setLoading(true);
    try {
      // Parámetros de consulta con paginación
      const params = {
        page: page,
        per_page: perPage,
        incluir_deshabilitados: showDisabled,
      };

      // Agregar filtro de perfil si está seleccionado
      if (selectedPerfil) {
        params.per_id = selectedPerfil;
      }

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
        let pagination = {};

        // ✅ PROCESAMIENTO MEJORADO PARA DIFERENTES FORMATOS DE RESPUESTA
        if (Array.isArray(result.data)) {
          // Caso 1: Array directo (sin paginación del backend)
          const allUsers = result.data;
          const startIndex = (page - 1) * perPage;
          const endIndex = startIndex + perPage;
          usuariosData = allUsers.slice(startIndex, endIndex);
          
          setUsuarios(usuariosData);
          setTotalItems(allUsers.length);
          setTotalPages(Math.ceil(allUsers.length / perPage));
          setCurrentPage(page);
          setPaginationInfo({
            current_page: page,
            per_page: perPage,
            total: allUsers.length,
            last_page: Math.ceil(allUsers.length / perPage),
            from: allUsers.length > 0 ? startIndex + 1 : 0,
            to: Math.min(endIndex, allUsers.length)
          });
          
          console.log("📊 Caso 1: Array directo, paginación local aplicada");
        } else if (result.data.data && Array.isArray(result.data.data)) {
          // Caso 2: Paginación Laravel estándar
          usuariosData = result.data.data;
          pagination = {
            current_page: result.data.current_page || page,
            per_page: result.data.per_page || perPage,
            total: result.data.total || usuariosData.length,
            last_page: result.data.last_page || 1,
            from: result.data.from || 1,
            to: result.data.to || usuariosData.length
          };
          
          setUsuarios(usuariosData);
          setTotalItems(pagination.total);
          setTotalPages(pagination.last_page);
          setCurrentPage(pagination.current_page);
          setPaginationInfo(pagination);
          
          console.log("📊 Caso 2: Paginación Laravel estándar");
        } else if (result.data.data?.data && Array.isArray(result.data.data.data)) {
          // Caso 3: Paginación Laravel anidada
          usuariosData = result.data.data.data;
          const nestedData = result.data.data;
          pagination = {
            current_page: nestedData.current_page || page,
            per_page: nestedData.per_page || perPage,
            total: nestedData.total || usuariosData.length,
            last_page: nestedData.last_page || 1,
            from: nestedData.from || 1,
            to: nestedData.to || usuariosData.length
          };
          
          setUsuarios(usuariosData);
          setTotalItems(pagination.total);
          setTotalPages(pagination.last_page);
          setCurrentPage(pagination.current_page);
          setPaginationInfo(pagination);
          
          console.log("📊 Caso 3: Paginación anidada");
        }

        console.log("✅ Usuarios procesados:", usuariosData.length);
        console.log("✅ Información de paginación:", pagination || paginationInfo);

      } else {
        console.error("❌ Error en respuesta usuarios:", result);
        setUsuarios([]);
        setTotalItems(0);
        setTotalPages(0);
        setCurrentPage(1);
        setPaginationInfo({});
        showMessage("error", result?.message || "Error al cargar usuarios");
      }
    } catch (error) {
      console.error("❌ Error loading usuarios:", error);
      setUsuarios([]);
      setTotalItems(0);
      setTotalPages(0);
      setCurrentPage(1);
      setPaginationInfo({});
      showMessage(
        "error",
        "Error al cargar usuarios: " + (error.message || "Error desconocido")
      );
    } finally {
      setLoading(false);
    }
  }, [canRead, selectedPerfil, showDisabled, itemsPerPage]);

  // ✅ FUNCIONES DE PAGINACIÓN
  const handlePageChange = (newPage) => {
    console.log("📄 Cambiando a página:", newPage);
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      loadUsuarios(newPage, itemsPerPage);
    }
  };

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    console.log("📊 Cambiando elementos por página:", newItemsPerPage);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    loadUsuarios(1, newItemsPerPage);
  }, [loadUsuarios]);

  // ✅ COMPONENTE DE PAGINACIÓN MEJORADO
  const PaginationControls = useCallback(() => {
    // ✅ MOSTRAR PAGINACIÓN SIEMPRE QUE HAYA USUARIOS (no solo cuando totalPages > 1)
    if (totalItems === 0) return null;

    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      // Calcular el rango de páginas a mostrar
      const start = Math.max(2, currentPage - delta);
      const end = Math.min(totalPages - 1, currentPage + delta);

      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      // Agregar primera página
      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      // Agregar rango medio (evitar duplicados)
      range.forEach(page => {
        if (page !== 1 && page !== totalPages) {
          rangeWithDots.push(page);
        }
      });

      // Agregar última página
      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1 && !rangeWithDots.includes(totalPages)) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    const pageNumbers = getPageNumbers();

    return (
      <div className="bg-white border-t border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Vista móvil */}
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>

          {/* Vista escritorio */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Información de registros */}
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">{paginationInfo.from || ((currentPage - 1) * itemsPerPage + 1)}</span>
                {' '}a{' '}
                <span className="font-medium">
                  {paginationInfo.to || Math.min(currentPage * itemsPerPage, totalItems)}
                </span>
                {' '}de{' '}
                <span className="font-medium">{totalItems}</span>
                {' '}resultados
              </p>

              {/* Selector de elementos por página */}
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700 whitespace-nowrap">
                  Mostrar:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newValue = Number(e.target.value);
                    console.log("🔄 Selector cambiado a:", newValue);
                    handleItemsPerPageChange(newValue);
                  }}
                  onFocus={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white min-w-16"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
                <span className="text-sm text-gray-700 whitespace-nowrap">por página</span>
              </div>
            </div>

            {/* Controles de paginación */}
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {/* ✅ SOLO MOSTRAR CONTROLES DE NAVEGACIÓN SI HAY MÁS DE 1 PÁGINA */}
              {totalPages > 1 && (
                <>
                  {/* Botón Primera página */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Primera página"
                  >
                    <Icon name="ChevronsLeft" size={16} />
                  </button>

                  {/* Botón Anterior */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Página anterior"
                  >
                    <Icon name="ChevronLeft" size={16} />
                  </button>

                  {/* Números de página */}
                  {pageNumbers.map((pageNumber, index) => (
                    <React.Fragment key={index}>
                      {pageNumber === '...' ? (
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                          ...
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                            pageNumber === currentPage
                              ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Botón Siguiente */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Página siguiente"
                  >
                    <Icon name="ChevronRight" size={16} />
                  </button>

                  {/* Botón Última página */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Última página"
                  >
                    <Icon name="ChevronsRight" size={16} />
                  </button>
                </>
              )}
              
              {/* ✅ MENSAJE CUANDO SOLO HAY UNA PÁGINA */}
              {totalPages === 1 && (
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-50 rounded-md">
                  Página 1 de 1
                </span>
              )}
            </nav>
          </div>
        </div>
      </div>
    );
  }, [totalPages, currentPage, itemsPerPage, totalItems, paginationInfo, handlePageChange, handleItemsPerPageChange]);

  // ✅ FUNCIÓN renderUsuarioStatus
  const renderUsuarioStatus = (usuario) => {
    let statusText = "Activo";
    let statusClass = "bg-green-100 text-green-800";

    if (
      usuario.usu_deshabilitado === true ||
      usuario.usu_deshabilitado === 1 ||
      usuario.usu_deshabilitado === "1" ||
      usuario.usu_deshabilitado === "true"
    ) {
      statusText = "Deshabilitado";
      statusClass = "bg-red-100 text-red-800";
    } else if (usuario.est_id === 2 || usuario.est_id === "2") {
      statusText = "Inactivo";
      statusClass = "bg-yellow-100 text-yellow-800";
    } else if (
      usuario.estado === "Inactivo" ||
      usuario.estado === "Deshabilitado"
    ) {
      statusText = usuario.estado;
      statusClass = "bg-yellow-100 text-yellow-800";
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
      >
        {statusText}
      </span>
    );
  };

  // ✅ CARGAR PERFILES PARA FILTRO
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

  // ✅ useEffect inicial
  useEffect(() => {
    if (canRead) {
      loadUsuarios(1, itemsPerPage);
      loadPerfilesForFilter();
    }
  }, [canRead, loadPerfilesForFilter]); // Removido itemsPerPage de las dependencias

  // ✅ useEffect para filtros (resetear a página 1)
  useEffect(() => {
    if (canRead && activeTab === "usuarios") {
      setCurrentPage(1);
      loadUsuarios(1, itemsPerPage);
    }
  }, [selectedPerfil, showDisabled, canRead, activeTab, loadUsuarios, itemsPerPage]);

  // HANDLERS DEL FORMULARIO
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        // Recargar página actual
        await loadUsuarios(currentPage, itemsPerPage);
      } else {
        showMessage("error", result?.message || "Error al guardar usuario");
      }
    } catch (error) {
      console.error("Error saving usuario:", error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = [];

        Object.keys(errors).forEach((field) => {
          const fieldErrors = errors[field];
          const fieldName = {
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
      usu_con: "",
      usu_ced: usuario.usu_ced || "",
      per_id: usuario.per_id || "",
      est_id: usuario.est_id || 1,
    });
    setShowForm(true);
  };

  const handleDelete = async (usuario) => {
    if (!canDelete) {
      showMessage("error", "No tienes permisos para eliminar usuarios");
      return;
    }

    const confirmMessage = `¿Estás seguro de DESHABILITAR al usuario "${usuario.usu_nom} ${usuario.usu_ape}"?\n\nEsto cambiará su estado a "Deshabilitado" (eliminado lógico).`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await adminService.usuarios.delete(usuario.usu_id);

      if (result?.status === "success") {
        showMessage(
          "success",
          result.message || "Usuario deshabilitado correctamente"
        );
        await loadUsuarios(currentPage, itemsPerPage);
      } else {
        showMessage(
          "error",
          result?.message || "Error al deshabilitar usuario"
        );
      }
    } catch (error) {
      console.error("❌ Error en handleDelete:", error);
      let errorMessage = "Error al deshabilitar usuario";

      if (error.response?.status === 404) {
        errorMessage = "Usuario no encontrado";
      } else if (error.response?.status === 401) {
        errorMessage = "No autorizado - verifica tu sesión";
      } else if (error.response?.status === 403) {
        errorMessage = "No tienes permisos para esta acción";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showMessage("error", errorMessage);
    }
  };

  const handleReactivate = async (usuario) => {
    if (!canDelete) {
      showMessage("error", "No tienes permisos para reactivar usuarios");
      return;
    }

    const confirmMessage = `¿Estás seguro de REACTIVAR al usuario "${usuario.usu_nom} ${usuario.usu_ape}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await adminService.usuarios.reactivate(usuario.usu_id);

      if (result?.status === "success") {
        showMessage(
          "success",
          result.message || "Usuario reactivado correctamente"
        );
        await loadUsuarios(currentPage, itemsPerPage);
      } else {
        showMessage("error", result?.message || "Error al reactivar usuario");
      }
    } catch (error) {
      console.error("❌ Error en handleReactivate:", error);
      showMessage("error", "Error al reactivar usuario");
    }
  };

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
    setActiveTab("usuarios");
    setSelectedPerfil(perfil.per_id.toString());
    setCurrentPage(1);
  };

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header con pestañas */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
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

      {/* ✅ CONTENIDO PRINCIPAL CON FLEX OPTIMIZADO */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "usuarios" ? (
          <div className="flex-1 flex flex-col p-6 min-h-0">
            {/* Header de usuarios - FIJO */}
            <div className="flex-shrink-0 mb-6">
              <div className="flex items-center justify-between mb-4">
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

                  {/* Toggle para mostrar usuarios deshabilitados */}
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

                  {/* Botón de debug temporal */}
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

              {/* ✅ FORMULARIO CON SCROLL INDEPENDIENTE */}
              {showForm && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                  <h3 className="text-lg font-medium mb-4">
                    {editingUsuario ? "Editar Usuario" : "Crear Usuario"}
                  </h3>

                  <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {/* CAMPO 1: Nombre */}
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

                    {/* CAMPO 2: Apellido */}
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

                    {/* CAMPO 3: Email */}
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

                    {/* CAMPO 4: Cédula */}
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

                    {/* CAMPO 5: Contraseña */}
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

                    {/* CAMPO 6: Perfil */}
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

                    {/* CAMPO 7: Estado */}
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

                    {/* BOTONES */}
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
            </div>

            {/* ✅ CONTENEDOR DE TABLA CON ALTURA DINÁMICA Y SCROLL */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col min-h-0">
              {loading ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <span className="text-gray-600">Cargando usuarios...</span>
                  </div>
                </div>
              ) : !Array.isArray(usuarios) || usuarios.length === 0 ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center">
                    <Icon
                      name="Users"
                      size={48}
                      className="mx-auto mb-4 text-gray-300"
                    />
                    <p className="text-gray-500 mb-2">
                      {selectedPerfil
                        ? "No hay usuarios con el perfil seleccionado"
                        : showDisabled
                        ? "No hay usuarios registrados"
                        : "No hay usuarios activos"}
                    </p>
                    {!showDisabled && (
                      <p className="text-sm text-gray-400">
                        Prueba activar "Mostrar deshabilitados"
                      </p>
                    )}
                    {!Array.isArray(usuarios) && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-sm mx-auto">
                        <p className="text-xs text-red-600">
                          Error: Datos recibidos no válidos ({typeof usuarios})
                        </p>
                        <p className="text-xs text-red-500 mt-1">
                          Verificar estructura de respuesta del backend
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* ✅ TABLA CON SCROLL OPTIMIZADO */}
                  <div className="flex-1 overflow-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0 z-10">
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
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
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
                                {/* Botón de editar */}
                                {canUpdate && (
                                  <button
                                    onClick={() => handleEdit(usuario)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
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
                                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                        title="Reactivar usuario"
                                      >
                                        <Icon name="RotateCcw" size={16} />
                                      </button>
                                    ) : (
                                      // Usuario activo - Mostrar botón de deshabilitar
                                      <button
                                        onClick={() => handleDelete(usuario)}
                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
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

                  {/* ✅ CONTROLES DE PAGINACIÓN */}
                  <PaginationControls />
                </>
              )}
            </div>
          </div>
        ) : (
          // Pestaña de Perfiles
          <div className="flex-1 p-6">
            <PerParamWindow
              showMessage={showMessage}
              onPerfilSelect={handlePerfilSelect}
              menuId={effectivePerfilesMenuId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuParamWindow;