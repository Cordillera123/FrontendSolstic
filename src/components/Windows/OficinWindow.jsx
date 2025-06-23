import React, { useState, useEffect, useCallback } from "react";
import { useButtonPermissions } from "../../hooks/useButtonPermissions";
import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";

// Componente principal para gestión de oficinas con paginación y scroll
const OficinWindow = ({
  showMessage = (type, message) => console.log(`${type}: ${message}`),
  menuId = 25, // ID del menú para oficinas
  title = "Gestión de Oficinas",
}) => {
  const [showDisabled, setShowDisabled] = useState(true);
  const [oficinas, setOficinas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingOficina, setEditingOficina] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState(""); // Filtro por tipo de oficina
  const [formData, setFormData] = useState({
    oficin_codigo: "",
    oficin_nombre: "",
    oficin_instit_codigo: "",
    oficin_tofici_codigo: "", // Tipo de oficina (matriz, sucursal, agencia)
    oficin_parroq_codigo: "",
    oficin_direccion: "",
    oficin_telefono: "",
    oficin_diremail: "",
    oficin_codocntrl: "",
    oficin_ctractual: "",
    oficin_eregis_codigo: "",
    oficin_rucoficina: "",
    oficin_codresapertura: "",
    oficin_fechaapertura: "",
    oficin_fechacierre: "",
    oficin_codrescierre: "",
    oficin_fecharescierre: "",
  });

  // ✅ ESTADOS PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState({});

  // Hook de permisos para oficinas
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    loading: permissionsLoading,
  } = useButtonPermissions(menuId, null, true, "menu");

  // ✅ FUNCIÓN loadOficinas CON PAGINACIÓN
  const loadOficinas = useCallback(async (page = 1, perPage = itemsPerPage) => {
    console.log("🔍 loadOficinas iniciado con paginación");
    console.log("🔍 Parámetros:", { page, perPage, canRead, selectedTipo, showDisabled });

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

      // Agregar filtro por tipo de oficina si está seleccionado
      if (selectedTipo) {
        params.oficin_tofici_codigo = selectedTipo;
      }

      console.log("🔍 Cargando oficinas con params:", params);

      if (!adminService?.oficinas?.getAll) {
        console.error("❌ adminService.oficinas.getAll no existe");
        showMessage("error", "Error: Función de carga no disponible");
        return;
      }

      const result = await adminService.oficinas.getAll(params);
      console.log("📥 Respuesta completa oficinas:", result);

      if (result?.status === "success" && result?.data) {
        let oficinasData = [];
        let pagination = {};

        // ✅ PROCESAMIENTO PARA DIFERENTES FORMATOS DE RESPUESTA
        if (Array.isArray(result.data)) {
          // Caso 1: Array directo (sin paginación del backend)
          const allOficinas = result.data;
          const startIndex = (page - 1) * perPage;
          const endIndex = startIndex + perPage;
          oficinasData = allOficinas.slice(startIndex, endIndex);
          
          setOficinas(oficinasData);
          setTotalItems(allOficinas.length);
          setTotalPages(Math.ceil(allOficinas.length / perPage));
          setCurrentPage(page);
          setPaginationInfo({
            current_page: page,
            per_page: perPage,
            total: allOficinas.length,
            last_page: Math.ceil(allOficinas.length / perPage),
            from: allOficinas.length > 0 ? startIndex + 1 : 0,
            to: Math.min(endIndex, allOficinas.length)
          });
          
          console.log("📊 Caso 1: Array directo, paginación local aplicada");
        } else if (result.data.data && Array.isArray(result.data.data)) {
          // Caso 2: Paginación Laravel estándar
          oficinasData = result.data.data;
          pagination = {
            current_page: result.data.current_page || page,
            per_page: result.data.per_page || perPage,
            total: result.data.total || oficinasData.length,
            last_page: result.data.last_page || 1,
            from: result.data.from || 1,
            to: result.data.to || oficinasData.length
          };
          
          setOficinas(oficinasData);
          setTotalItems(pagination.total);
          setTotalPages(pagination.last_page);
          setCurrentPage(pagination.current_page);
          setPaginationInfo(pagination);
          
          console.log("📊 Caso 2: Paginación Laravel estándar");
        } else if (result.data.data?.data && Array.isArray(result.data.data.data)) {
          // Caso 3: Paginación Laravel anidada
          oficinasData = result.data.data.data;
          const nestedData = result.data.data;
          pagination = {
            current_page: nestedData.current_page || page,
            per_page: nestedData.per_page || perPage,
            total: nestedData.total || oficinasData.length,
            last_page: nestedData.last_page || 1,
            from: nestedData.from || 1,
            to: nestedData.to || oficinasData.length
          };
          
          setOficinas(oficinasData);
          setTotalItems(pagination.total);
          setTotalPages(pagination.last_page);
          setCurrentPage(pagination.current_page);
          setPaginationInfo(pagination);
          
          console.log("📊 Caso 3: Paginación anidada");
        }

        console.log("✅ Oficinas procesadas:", oficinasData.length);
        console.log("✅ Información de paginación:", pagination || paginationInfo);

      } else {
        console.error("❌ Error en respuesta oficinas:", result);
        setOficinas([]);
        setTotalItems(0);
        setTotalPages(0);
        setCurrentPage(1);
        setPaginationInfo({});
        showMessage("error", result?.message || "Error al cargar oficinas");
      }
    } catch (error) {
      console.error("❌ Error loading oficinas:", error);
      setOficinas([]);
      setTotalItems(0);
      setTotalPages(0);
      setCurrentPage(1);
      setPaginationInfo({});
      showMessage(
        "error",
        "Error al cargar oficinas: " + (error.message || "Error desconocido")
      );
    } finally {
      setLoading(false);
    }
  }, [canRead, selectedTipo, showDisabled, itemsPerPage]);

  // ✅ FUNCIONES DE PAGINACIÓN
  const handlePageChange = (newPage) => {
    console.log("📄 Cambiando a página:", newPage);
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      loadOficinas(newPage, itemsPerPage);
    }
  };

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    console.log("📊 Cambiando elementos por página:", newItemsPerPage);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    loadOficinas(1, newItemsPerPage);
  }, [loadOficinas]);

  // ✅ COMPONENTE DE PAGINACIÓN
  const PaginationControls = useCallback(() => {
    if (totalItems === 0) return null;

    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      const start = Math.max(2, currentPage - delta);
      const end = Math.min(totalPages - 1, currentPage + delta);

      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      range.forEach(page => {
        if (page !== 1 && page !== totalPages) {
          rangeWithDots.push(page);
        }
      });

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
                {' '}oficinas
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

  // ✅ FUNCIÓN renderOficinaStatus
  const renderOficinaStatus = (oficina) => {
    let statusText = "Activa";
    let statusClass = "bg-green-100 text-green-800";

    // Verificar si la oficina está deshabilitada
    if (
      oficina.oficin_deshabilitado === true ||
      oficina.oficin_deshabilitado === 1 ||
      oficina.oficin_deshabilitado === "1" ||
      oficina.oficin_deshabilitado === "true"
    ) {
      statusText = "Deshabilitada";
      statusClass = "bg-red-100 text-red-800";
    } else if (oficina.oficin_fechacierre && oficina.oficin_fechacierre !== "0000-00-00") {
      statusText = "Cerrada";
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

  // ✅ FUNCIÓN renderTipoOficina
  const renderTipoOficina = (tipoOficina) => {
    const tipoMap = {
      'M': { text: 'Matriz', class: 'bg-blue-100 text-blue-800' },
      'S': { text: 'Sucursal', class: 'bg-purple-100 text-purple-800' },
      'A': { text: 'Agencia', class: 'bg-orange-100 text-orange-800' },
    };

    const tipo = tipoMap[tipoOficina] || { text: tipoOficina || 'N/A', class: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipo.class}`}>
        {tipo.text}
      </span>
    );
  };

  // ✅ useEffect inicial
  useEffect(() => {
    if (canRead) {
      loadOficinas(1, itemsPerPage);
    }
  }, [canRead, loadOficinas]);

  // ✅ useEffect para filtros (resetear a página 1)
  useEffect(() => {
    if (canRead) {
      setCurrentPage(1);
      loadOficinas(1, itemsPerPage);
    }
  }, [selectedTipo, showDisabled, canRead, loadOficinas]);

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

    const required = ["oficin_codigo", "oficin_nombre", "oficin_tofici_codigo"];
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

    try {
      let result;
      const submitData = { ...formData };

      if (editingOficina) {
        if (!canUpdate) {
          showMessage("error", "No tienes permisos para editar oficinas");
          return;
        }
        result = await adminService.oficinas.update(
          editingOficina.oficin_codigo,
          submitData
        );
      } else {
        if (!canCreate) {
          showMessage("error", "No tienes permisos para crear oficinas");
          return;
        }
        result = await adminService.oficinas.create(submitData);
      }

      if (result?.status === "success") {
        showMessage(
          "success",
          result.message || "Oficina guardada correctamente"
        );
        setShowForm(false);
        setEditingOficina(null);
        resetFormData();
        // Recargar página actual
        await loadOficinas(currentPage, itemsPerPage);
      } else {
        showMessage("error", result?.message || "Error al guardar oficina");
      }
    } catch (error) {
      console.error("Error saving oficina:", error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = [];

        Object.keys(errors).forEach((field) => {
          const fieldErrors = errors[field];
          const fieldName = {
            oficin_codigo: "Código",
            oficin_nombre: "Nombre",
            oficin_tofici_codigo: "Tipo de Oficina",
            oficin_direccion: "Dirección",
            oficin_telefono: "Teléfono",
            oficin_diremail: "Email",
          }[field] || field;

          fieldErrors.forEach((errorMsg) => {
            if (errorMsg.includes("has already been taken")) {
              errorMessages.push(`${fieldName}: Ya existe en el sistema`);
            } else if (errorMsg.includes("required")) {
              errorMessages.push(`${fieldName}: Es requerido`);
            } else if (errorMsg.includes("email")) {
              errorMessages.push(`${fieldName}: Formato de email inválido`);
            } else {
              errorMessages.push(`${fieldName}: ${errorMsg}`);
            }
          });
        });

        showMessage("error", errorMessages.join("\n"));
      } else {
        showMessage("error", error.message || "Error al guardar oficina");
      }
    }
  };

  const resetFormData = () => {
    setFormData({
      oficin_codigo: "",
      oficin_nombre: "",
      oficin_instit_codigo: "",
      oficin_tofici_codigo: "",
      oficin_parroq_codigo: "",
      oficin_direccion: "",
      oficin_telefono: "",
      oficin_diremail: "",
      oficin_codocntrl: "",
      oficin_ctractual: "",
      oficin_eregis_codigo: "",
      oficin_rucoficina: "",
      oficin_codresapertura: "",
      oficin_fechaapertura: "",
      oficin_fechacierre: "",
      oficin_codrescierre: "",
      oficin_fecharescierre: "",
    });
  };

  const handleEdit = (oficina) => {
    if (!canUpdate) {
      showMessage("error", "No tienes permisos para editar oficinas");
      return;
    }
    setEditingOficina(oficina);
    setFormData({
      oficin_codigo: oficina.oficin_codigo || "",
      oficin_nombre: oficina.oficin_nombre || "",
      oficin_instit_codigo: oficina.oficin_instit_codigo || "",
      oficin_tofici_codigo: oficina.oficin_tofici_codigo || "",
      oficin_parroq_codigo: oficina.oficin_parroq_codigo || "",
      oficin_direccion: oficina.oficin_direccion || "",
      oficin_telefono: oficina.oficin_telefono || "",
      oficin_diremail: oficina.oficin_diremail || "",
      oficin_codocntrl: oficina.oficin_codocntrl || "",
      oficin_ctractual: oficina.oficin_ctractual || "",
      oficin_eregis_codigo: oficina.oficin_eregis_codigo || "",
      oficin_rucoficina: oficina.oficin_rucoficina || "",
      oficin_codresapertura: oficina.oficin_codresapertura || "",
      oficin_fechaapertura: oficina.oficin_fechaapertura || "",
      oficin_fechacierre: oficina.oficin_fechacierre || "",
      oficin_codrescierre: oficina.oficin_codrescierre || "",
      oficin_fecharescierre: oficina.oficin_fecharescierre || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (oficina) => {
    if (!canDelete) {
      showMessage("error", "No tienes permisos para eliminar oficinas");
      return;
    }

    const confirmMessage = `¿Estás seguro de DESHABILITAR la oficina "${oficina.oficin_nombre}"?\n\nEsto cambiará su estado a "Deshabilitada" (eliminado lógico).`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await adminService.oficinas.delete(oficina.oficin_codigo);

      if (result?.status === "success") {
        showMessage(
          "success",
          result.message || "Oficina deshabilitada correctamente"
        );
        await loadOficinas(currentPage, itemsPerPage);
      } else {
        showMessage(
          "error",
          result?.message || "Error al deshabilitar oficina"
        );
      }
    } catch (error) {
      console.error("❌ Error en handleDelete:", error);
      let errorMessage = "Error al deshabilitar oficina";

      if (error.response?.status === 404) {
        errorMessage = "Oficina no encontrada";
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

  const handleReactivate = async (oficina) => {
    if (!canDelete) {
      showMessage("error", "No tienes permisos para reactivar oficinas");
      return;
    }

    const confirmMessage = `¿Estás seguro de REACTIVAR la oficina "${oficina.oficin_nombre}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await adminService.oficinas.reactivate(oficina.oficin_codigo);

      if (result?.status === "success") {
        showMessage(
          "success",
          result.message || "Oficina reactivada correctamente"
        );
        await loadOficinas(currentPage, itemsPerPage);
      } else {
        showMessage("error", result?.message || "Error al reactivar oficina");
      }
    } catch (error) {
      console.error("❌ Error en handleReactivate:", error);
      showMessage("error", "Error al reactivar oficina");
    }
  };

  const isOficinaDeshabilitada = (oficina) => {
    return (
      oficina.oficin_deshabilitado === true ||
      oficina.oficin_deshabilitado === 1 ||
      oficina.oficin_deshabilitado === "1" ||
      oficina.oficin_deshabilitado === "true"
    );
  };

  const handleCreate = () => {
    if (!canCreate) {
      showMessage("error", "No tienes permisos para crear oficinas");
      return;
    }
    setEditingOficina(null);
    resetFormData();
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOficina(null);
    resetFormData();
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Icon name="Building2" size={28} className="mr-3 text-blue-600" />
            {title}
            <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Menu ID: {menuId}
            </span>
          </h1>
        </div>
      </div>

      {/* ✅ CONTENIDO PRINCIPAL CON FLEX OPTIMIZADO */}
      <div className="flex-1 flex flex-col min-h-0 p-6">
        {/* Header de oficinas - FIJO */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Gestión de Oficinas
              </h2>

              {/* Filtro por tipo de oficina */}
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                <option value="M">Matriz</option>
                <option value="S">Sucursal</option>
                <option value="A">Agencia</option>
              </select>

              {/* Toggle para mostrar oficinas deshabilitadas */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showDisabled}
                    onChange={(e) => setShowDisabled(e.target.checked)}
                    className="rounded"
                  />
                  <span>Mostrar deshabilitadas</span>
                </label>
              </div>
            </div>

            {canCreate && (
              <button
                onClick={handleCreate}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <Icon name="Plus" size={16} />
                Crear Oficina
              </button>
            )}
          </div>

          {/* ✅ FORMULARIO CON SCROLL INDEPENDIENTE */}
          {showForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">
                {editingOficina ? "Editar Oficina" : "Crear Oficina"}
              </h3>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {/* CAMPO 1: Código */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    name="oficin_codigo"
                    value={formData.oficin_codigo}
                    onChange={handleInputChange}
                    required
                    disabled={editingOficina} // No editable en modo edición
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="Código de la oficina"
                  />
                </div>

                {/* CAMPO 2: Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="oficin_nombre"
                    value={formData.oficin_nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de la oficina"
                  />
                </div>

                {/* CAMPO 3: Tipo de Oficina */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Oficina *
                  </label>
                  <select
                    name="oficin_tofici_codigo"
                    value={formData.oficin_tofici_codigo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="M">Matriz</option>
                    <option value="S">Sucursal</option>
                    <option value="A">Agencia</option>
                  </select>
                </div>

                {/* CAMPO 4: Código Institución */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Institución
                  </label>
                  <input
                    type="text"
                    name="oficin_instit_codigo"
                    value={formData.oficin_instit_codigo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Código de institución"
                  />
                </div>

                {/* CAMPO 5: Código Parroquia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Parroquia
                  </label>
                  <input
                    type="text"
                    name="oficin_parroq_codigo"
                    value={formData.oficin_parroq_codigo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Código de parroquia"
                  />
                </div>

                {/* CAMPO 6: Dirección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="oficin_direccion"
                    value={formData.oficin_direccion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dirección de la oficina"
                  />
                </div>

                {/* CAMPO 7: Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="oficin_telefono"
                    value={formData.oficin_telefono}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Teléfono de la oficina"
                  />
                </div>

                {/* CAMPO 8: Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="oficin_diremail"
                    value={formData.oficin_diremail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@oficina.com"
                  />
                </div>

                {/* CAMPO 9: RUC */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUC
                  </label>
                  <input
                    type="text"
                    name="oficin_rucoficina"
                    value={formData.oficin_rucoficina}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="RUC de la oficina"
                  />
                </div>

                {/* CAMPO 10: Fecha Apertura */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Apertura
                  </label>
                  <input
                    type="date"
                    name="oficin_fechaapertura"
                    value={formData.oficin_fechaapertura}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* CAMPO 11: Código Responsable Apertura */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Resp. Apertura
                  </label>
                  <input
                    type="text"
                    name="oficin_codresapertura"
                    value={formData.oficin_codresapertura}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Código responsable apertura"
                  />
                </div>

                {/* CAMPO 12: Código Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Control
                  </label>
                  <input
                    type="text"
                    name="oficin_codocntrl"
                    value={formData.oficin_codocntrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Código de control"
                  />
                </div>

                {/* BOTONES */}
                <div className="lg:col-span-3 md:col-span-2 flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Icon name={editingOficina ? "Save" : "Plus"} size={16} />
                    {editingOficina ? "Actualizar" : "Crear"}
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
                <span className="text-gray-600">Cargando oficinas...</span>
              </div>
            </div>
          ) : !Array.isArray(oficinas) || oficinas.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <Icon
                  name="Building2"
                  size={48}
                  className="mx-auto mb-4 text-gray-300"
                />
                <p className="text-gray-500 mb-2">
                  {selectedTipo
                    ? "No hay oficinas del tipo seleccionado"
                    : showDisabled
                    ? "No hay oficinas registradas"
                    : "No hay oficinas activas"}
                </p>
                {!showDisabled && (
                  <p className="text-sm text-gray-400">
                    Prueba activar "Mostrar deshabilitadas"
                  </p>
                )}
                {!Array.isArray(oficinas) && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-sm mx-auto">
                    <p className="text-xs text-red-600">
                      Error: Datos recibidos no válidos ({typeof oficinas})
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
                        Oficina
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dirección
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
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
                    {oficinas.map((oficina) => (
                      <tr key={oficina.oficin_codigo} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Icon
                                name="Building2"
                                size={20}
                                className="text-blue-600"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {oficina.oficin_nombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                Código: {oficina.oficin_codigo}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderTipoOficina(oficina.oficin_tofici_codigo)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {oficina.oficin_direccion || "-"}
                          </div>
                          {oficina.oficin_parroq_codigo && (
                            <div className="text-sm text-gray-500">
                              Parroquia: {oficina.oficin_parroq_codigo}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {oficina.oficin_telefono || "-"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {oficina.oficin_diremail || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderOficinaStatus(oficina)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botón de editar */}
                            {canUpdate && (
                              <button
                                onClick={() => handleEdit(oficina)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Editar oficina"
                              >
                                <Icon name="Edit2" size={16} />
                              </button>
                            )}

                            {/* Botones condicionales según el estado */}
                            {canDelete && (
                              <>
                                {isOficinaDeshabilitada(oficina) ? (
                                  // Oficina deshabilitada - Mostrar botón de reactivar
                                  <button
                                    onClick={() => handleReactivate(oficina)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                    title="Reactivar oficina"
                                  >
                                    <Icon name="RotateCcw" size={16} />
                                  </button>
                                ) : (
                                  // Oficina activa - Mostrar botón de deshabilitar
                                  <button
                                    onClick={() => handleDelete(oficina)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Deshabilitar oficina"
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
    </div>
  );
};

export default OficinWindow;