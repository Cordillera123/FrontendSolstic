// src/components/Windows/OficinasWindow.jsx - CON SINCRONIZACIÓN DE PERMISOS
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useButtonPermissions } from "../../hooks/useButtonPermissions";
import { adminService } from "../../services/apiService";
import { getCurrentUser } from "../../context/AuthContext";
import Icon from "../UI/Icon";

// Importar los componentes separados desde la misma carpeta
import CrearOficinaForm from "./CrearOficinaForm";
import EditarOficinaForm from "./EditarOficinaForm";
import ShowOficinaForm from "./ShowOficinaForm";
import CrearCalendarWindow from "./CalendarioOficinaForm";

const OficinasWindow = ({
  showMessage: externalShowMessage,
  menuId = 19, // ID del submenu "Oficinas"
  title = "Gestión de Oficinas",
}) => {
  console.log("🏢 OficinasWindow - Iniciando componente", {
    menuId,
    currentView: "lista",
  });

  // Obtener usuario actual
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.usu_id;

  // ✅ Hook de permisos con códigos específicos de botones
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    loading: permissionsLoading,
    error: permissionsError,
    hasButtonPermission,
    canViewCalendar: initialCanViewCalendar,
    refreshPermissions, // ✅ NUEVO: Para refrescar permisos
  } = useButtonPermissions(
    menuId, // 19 - Submenu "Oficinas"
    null, // No segundo parámetro
    true, // autoLoad
    "submenu" // Tipo "submenu"
  );

  // ✅ NUEVO: Estado local para controlar el permiso de calendario en tiempo real
  const [canViewCalendar, setCanViewCalendar] = useState(initialCanViewCalendar);

  // ✅ CRÍTICO: Sincronizar el estado local con el hook cuando cambie
  useEffect(() => {
    setCanViewCalendar(initialCanViewCalendar);
  }, [initialCanViewCalendar]);

  // Estados principales del componente
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [oficinas, setOficinas] = useState([]);

  // Estados para control de vista
  const [currentView, setCurrentView] = useState("lista");
  const [editingOficina, setEditingOficina] = useState(null);
  const [viewingOficina, setViewingOficina] = useState(null);
  const [calendarioOficina, setCalendarioOficina] = useState(null);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({
    instit_codigo: "",
    tofici_codigo: "",
    parroq_codigo: "",
    solo_activas: false,
  });
  const [institucionesOptions, setInstitucionesOptions] = useState([]);
  const [tiposOficinaOptions, setTiposOficinaOptions] = useState([]);
  const [parroquiasOptions, setParroquiasOptions] = useState([]);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // ✅ CRÍTICO: LISTENER PARA SINCRONIZACIÓN DE PERMISOS EN TIEMPO REAL
  useEffect(() => {
    // Verificar que el notificador global existe
    if (!window.permissionChangeNotifier) {
      console.warn("⚠️ PermissionChangeNotifier no disponible");
      return;
    }

    console.log("🔔 OficinasWindow - Suscribiéndose a cambios de permisos");

    const handlePermissionChange = (changeData) => {
      console.log("🔄 OficinasWindow - Cambio de permiso recibido:", changeData);

      // Solo reaccionar si es el usuario actual
      if (changeData.userId !== currentUserId) {
        console.log("ℹ️ Cambio no es para el usuario actual, ignorando");
        return;
      }

      // ✅ CRÍTICO: Verificar si el cambio afecta al botón de calendario
      const calendarCodes = ['CALENDARIO', 'calendario', 'CALENDAR', 'calendar', 'agenda', 'AGENDA'];
      const isCalendarButton = calendarCodes.includes(changeData.buttonCode);

      if (isCalendarButton) {
        console.log("📅 Cambio afecta al botón de calendario, actualizando estado");

        if (changeData.type === 'permission_changed') {
          // El usuario recibió o perdió el permiso específico
          setCanViewCalendar(changeData.newPermission);
          
          const message = changeData.newPermission 
            ? "✅ Acceso al calendario concedido"
            : "❌ Acceso al calendario retirado";
          
          showMessage("info", message);
        } else if (changeData.type === 'customization_removed') {
          // Se removió la personalización, volver al permiso del perfil
          console.log("🔄 Personalización removida, refrescando permisos...");
          refreshPermissions();
        } else if (changeData.type === 'full_reset') {
          // Reset completo de permisos
          console.log("🔄 Reset completo detectado, refrescando permisos...");
          refreshPermissions();
        }
      } else {
        console.log("ℹ️ Cambio no afecta al botón de calendario:", changeData.buttonCode);
      }
    };

    // Suscribirse al notificador global
    const unsubscribe = window.permissionChangeNotifier.subscribe(handlePermissionChange);

    // Limpieza al desmontar
    return () => {
      console.log("🔔 OficinasWindow - Desuscribiéndose de cambios de permisos");
      unsubscribe();
    };
  }, [currentUserId, refreshPermissions]);

  // ✅ FUNCIÓN PARA MOSTRAR MENSAJES
  const showMessage = useCallback(
    (type, text) => {
      console.log("📢 OficinasWindow - Mensaje:", type, text);
      if (externalShowMessage) {
        externalShowMessage(type, text);
      } else {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      }
    },
    [externalShowMessage]
  );

  // ✅ FUNCIÓN MEJORADA PARA MANEJAR CALENDARIO CON PERMISOS SINCRONIZADOS
  const handleCalendario = useCallback(
    (oficina) => {
      console.log("📅 Intentando abrir calendario:", {
        oficina: oficina.oficin_codigo,
        canViewCalendar,
        currentUserId
      });

      if (!canViewCalendar) {
        console.log("❌ Sin permisos para calendario");
        showMessage(
          "error",
          "No tienes permisos para ver el calendario de oficinas"
        );
        return;
      }

      console.log("✅ Abriendo calendario para oficina:", oficina.oficin_codigo);
      setCalendarioOficina(oficina);
      setEditingOficina(null);
      setViewingOficina(null);
      setCurrentView("calendario");
    },
    [canViewCalendar, showMessage, currentUserId]
  );

  // ✅ Debug mejorado de permisos
  useEffect(() => {
    console.log("🔍 OficinasWindow - Estado actual de permisos:", {
      menuId,
      currentUserId,
      canCreate,
      canRead,
      canUpdate,
      canDelete,
      initialCanViewCalendar,
      canViewCalendar, // ✅ Estado sincronizado
      permissionsLoading,
      permissionsError: permissionsError?.message,
      timestamp: new Date().toISOString()
    });
  }, [
    menuId,
    currentUserId,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    initialCanViewCalendar,
    canViewCalendar,
    permissionsLoading,
    permissionsError,
  ]);

  // RESTO DE FUNCIONES...
  const loadFilterOptions = useCallback(async () => {
    try {
      console.log("🔍 Cargando opciones de filtros...");

      // Cargar instituciones
      try {
        const institucionesResult = await adminService.instituciones.listar();
        if (institucionesResult.status === "success") {
          setInstitucionesOptions(institucionesResult.data);
          console.log(
            "✅ Instituciones cargadas:",
            institucionesResult.data.length
          );
        }
      } catch (error) {
        console.warn("⚠️ Error cargando instituciones:", error);
        setInstitucionesOptions([
          { value: 1, label: "Banco Central del Ecuador" },
          { value: 2, label: "Superintendencia de Bancos" },
          { value: 3, label: "IESS" },
        ]);
      }

      // Cargar tipos de oficina
      try {
        const tiposResult = await adminService.tiposOficina.getActivos();
        if (tiposResult.status === "success") {
          const tiposFormateados = tiposResult.data.map((tipo) => ({
            value: tipo.tofici_codigo || tipo.value,
            label: tipo.tofici_descripcion || tipo.label,
          }));
          setTiposOficinaOptions(tiposFormateados);
          console.log("✅ Tipos de oficina cargados:", tiposFormateados.length);
        }
      } catch (error) {
        console.warn("⚠️ Error cargando tipos de oficina:", error);
        setTiposOficinaOptions([
          { value: 1, label: "Oficina Principal" },
          { value: 2, label: "Sucursal" },
          { value: 3, label: "Agencia" },
        ]);
      }

      console.log(
        "⚠️ Parroquias temporalmente deshabilitadas - endpoint no disponible"
      );
      setParroquiasOptions([]);
    } catch (error) {
      console.error("❌ Error cargando opciones de filtros:", error);
      setInstitucionesOptions([
        { value: 1, label: "Banco Central del Ecuador" },
        { value: 2, label: "Superintendencia de Bancos" },
        { value: 3, label: "IESS" },
      ]);
      setTiposOficinaOptions([
        { value: 1, label: "Oficina Principal" },
        { value: 2, label: "Sucursal" },
        { value: 3, label: "Agencia" },
      ]);
      setParroquiasOptions([]);
    }
  }, []);

  const loadOficinas = useCallback(
    async (page = 1, customFilters = {}) => {
      console.log("🔍 Cargando oficinas - página:", page);

      if (!canRead) {
        console.log("❌ Sin permisos de lectura");
        return;
      }

      setLoading(true);
      try {
        const params = {
          page,
          per_page: perPage,
          search: searchTerm,
          ...filters,
          ...customFilters,
        };

        console.log("📤 Parámetros de búsqueda:", params);

        const result = await adminService.oficinas.getAll(params);
        console.log("📥 Respuesta de oficinas:", result);

        if (result?.status === "success" && result?.data) {
          let oficinasData = [];
          let paginationInfo = {};

          if (result.data.data && Array.isArray(result.data.data)) {
            oficinasData = result.data.data;
            paginationInfo = {
              current_page: result.data.current_page || 1,
              last_page: result.data.last_page || 1,
              total: result.data.total || 0,
              per_page: result.data.per_page || perPage,
            };
          } else if (Array.isArray(result.data)) {
            oficinasData = result.data;
            paginationInfo = {
              current_page: 1,
              last_page: 1,
              total: result.data.length,
              per_page: result.data.length,
            };
          } else {
            console.warn("⚠️ Formato inesperado de datos:", result.data);
            oficinasData = [];
            paginationInfo = {
              current_page: 1,
              last_page: 1,
              total: 0,
              per_page: perPage,
            };
          }

          setOficinas(oficinasData);
          setCurrentPage(paginationInfo.current_page);
          setTotalPages(paginationInfo.last_page);
          setTotalRecords(paginationInfo.total);

          console.log("✅ Oficinas cargadas:", {
            total: paginationInfo.total,
            current_page: paginationInfo.current_page,
            oficinas: oficinasData.length,
          });
        } else {
          console.error("❌ Error en respuesta oficinas:", result);
          setOficinas([]);
          showMessage("error", result?.message || "Error al cargar oficinas");
        }
      } catch (error) {
        console.error("❌ Error loading oficinas:", error);
        setOficinas([]);
        showMessage(
          "error",
          "Error al cargar oficinas: " + (error.message || "Error desconocido")
        );
      } finally {
        setLoading(false);
      }
    },
    [canRead, showMessage, perPage, searchTerm, filters]
  );

  const handleOficinaSave = useCallback(
    async (formData, editingOficina = null) => {
      console.log("💾 Guardando oficina:", {
        formData,
        editingOficina: editingOficina?.oficin_codigo,
      });

      if (editingOficina && !canUpdate) {
        throw new Error("No tienes permisos para actualizar oficinas");
      }

      if (!editingOficina && !canCreate) {
        throw new Error("No tienes permisos para crear oficinas");
      }

      try {
        let result;

        if (editingOficina) {
          console.log(
            "🔄 Actualizando oficina ID:",
            editingOficina.oficin_codigo
          );
          result = await adminService.oficinas.update(
            editingOficina.oficin_codigo,
            formData
          );
          showMessage("success", "Oficina actualizada correctamente");
        } else {
          console.log("➕ Creando nueva oficina");
          result = await adminService.oficinas.create(formData);
          showMessage("success", "Oficina creada correctamente");
        }

        await loadOficinas(currentPage);
        setCurrentView("lista");
        setEditingOficina(null);

        return result;
      } catch (error) {
        console.error("❌ Error guardando oficina:", error);

        let errorMessage = "Error al guardar la oficina";

        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          const errorMessages = [];

          Object.keys(errors).forEach((field) => {
            const fieldErrors = errors[field];
            const fieldName =
              {
                oficin_nombre: "Nombre",
                oficin_rucoficina: "RUC",
                oficin_diremail: "Email",
                oficin_instit_codigo: "Institución",
                oficin_tofici_codigo: "Tipo de Oficina",
                oficin_parroq_codigo: "Parroquia",
              }[field] || field;

            fieldErrors.forEach((errorMsg) => {
              if (
                errorMsg.includes("unique") ||
                errorMsg.includes("already been taken")
              ) {
                errorMessages.push(`${fieldName}: Ya existe en el sistema`);
              } else if (errorMsg.includes("required")) {
                errorMessages.push(`${fieldName}: Es requerido`);
              } else {
                errorMessages.push(`${fieldName}: ${errorMsg}`);
              }
            });
          });

          errorMessage = errorMessages.join("; ");
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }
    },
    [showMessage, loadOficinas, currentPage, canUpdate, canCreate]
  );

  const handleNewOficina = useCallback(() => {
    if (!canCreate) {
      showMessage("error", "No tienes permisos para crear oficinas");
      return;
    }

    console.log("➕ Iniciando creación de oficina");
    setEditingOficina(null);
    setViewingOficina(null);
    setCurrentView("crear");
  }, [canCreate, showMessage]);

  const handleEditOficina = useCallback(
    (oficina) => {
      if (!canUpdate) {
        showMessage("error", "No tienes permisos para editar oficinas");
        return;
      }

      console.log("✏️ Iniciando edición de oficina:", oficina.oficin_codigo);
      setEditingOficina(oficina);
      setViewingOficina(null);
      setCurrentView("editar");
    },
    [canUpdate, showMessage]
  );

  const handleShowOficina = useCallback((oficina) => {
    console.log("👁️ Mostrando detalles de oficina:", oficina.oficin_codigo);
    setViewingOficina(oficina);
    setEditingOficina(null);
    setCurrentView("mostrar");
  }, []);

  const handleDeleteOficina = useCallback(
    async (oficina) => {
      if (!canDelete) {
        showMessage("error", "No tienes permisos para eliminar oficinas");
        return;
      }

      const confirmMessage = `¿Estás seguro de eliminar la oficina "${oficina.oficin_nombre}"?\n\nEsta acción no se puede deshacer y se verificará que no tenga usuarios asignados.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      try {
        setLoading(true);
        console.log("🗑️ Eliminando oficina:", oficina.oficin_codigo);

        const result = await adminService.oficinas.delete(
          oficina.oficin_codigo
        );

        if (result?.status === "success") {
          showMessage(
            "success",
            result.message || "Oficina eliminada correctamente"
          );
        } else {
          showMessage("error", result?.message || "Error al eliminar oficina");
        }

        await loadOficinas(currentPage);
      } catch (error) {
        console.error("❌ Error eliminando oficina:", error);
        let errorMessage = "Error al eliminar oficina";

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message?.includes("usuarios asignados")) {
          errorMessage = error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        showMessage("error", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [canDelete, showMessage, loadOficinas, currentPage]
  );

  const handleFormCancel = useCallback(() => {
    console.log("❌ Cancelando formulario - volviendo a lista");
    setCurrentView("lista");
    setEditingOficina(null);
    setViewingOficina(null);
    setCalendarioOficina(null);
  }, []);

  const handleFilterChange = useCallback((filterKey, value) => {
    console.log(`🔍 Cambiando filtro ${filterKey}:`, value);
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [filterKey]: value,
      };
      console.log("🔍 Nuevos filtros:", newFilters);
      return newFilters;
    });
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    console.log("🧹 Limpiando filtros");
    setFilters({
      instit_codigo: "",
      tofici_codigo: "",
      parroq_codigo: "",
      solo_activas: false,
    });
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  const applyFilters = useCallback(() => {
    console.log("🔍 Aplicando filtros manualmente");
    loadOficinas(1);
  }, [loadOficinas]);

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      loadOficinas(page);
    },
    [loadOficinas]
  );

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Aplicar ordenamiento local a los datos ya cargados
  const sortedOficinas = useMemo(() => {
    if (!Array.isArray(oficinas) || !sortConfig.key) return oficinas;

    return [...oficinas].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [oficinas, sortConfig]);

  const handleVerUsuarios = useCallback(
    async (oficina) => {
      handleShowOficina(oficina);
    },
    [handleShowOficina]
  );

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log("🔄 OficinasWindow - useEffect mount");
    if (canRead && currentView === "lista") {
      loadFilterOptions();
      loadOficinas();
    }
  }, [loadFilterOptions, loadOficinas, canRead, currentView]);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentView === "lista" && canRead) {
        loadOficinas(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters, loadOficinas, currentView, canRead]);

  // Manejo de errores de permisos
  if (permissionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 max-w-md mx-auto">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Icon name="AlertTriangle" size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error de Permisos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {permissionsError.message ||
                "No tienes permisos para acceder a esta sección"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cargando permisos
  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Sin permisos de lectura
  if (!canRead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-md mx-auto">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <Icon name="Lock" size={24} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Acceso Denegado
            </h3>
            <p className="text-sm text-gray-600">
              No tienes permisos para acceder a la gestión de oficinas
            </p>
          </div>
        </div>
      </div>
    );
  }

  // RENDERIZADO CONDICIONAL SEGÚN LA VISTA ACTUAL
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* VISTA DE CREAR OFICINA */}
        {currentView === "crear" && (
          <CrearOficinaForm
            onSave={handleOficinaSave}
            onCancel={handleFormCancel}
            showMessage={showMessage}
            loading={loading}
          />
        )}

        {/* VISTA DE EDITAR OFICINA */}
        {currentView === "editar" && (
          <EditarOficinaForm
            oficina={editingOficina}
            onSave={handleOficinaSave}
            onCancel={handleFormCancel}
            showMessage={showMessage}
            loading={loading}
          />
        )}

        {/* VISTA DE MOSTRAR OFICINA */}
        {currentView === "mostrar" && (
          <ShowOficinaForm
            oficinaId={viewingOficina?.oficin_codigo}
            oficinaNombre={viewingOficina?.oficin_nombre}
            showMessage={showMessage}
            onCancel={handleFormCancel}
            loading={loading}
          />
        )}

        {/* VISTA DE CALENDARIO */}
        {currentView === "calendario" && (
          <CrearCalendarWindow
            oficinaId={calendarioOficina?.oficin_codigo}
            onCancel={handleFormCancel}
            showMessage={showMessage}
            loading={loading}
          />
        )}

        {/* VISTA DE LISTA DE OFICINAS */}
        {currentView === "lista" && (
          <>
            {/* Header Principal */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-xl mr-4">
                    <Icon
                      name="Building2"
                      size={24}
                      className="text-blue-600"
                    />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {title}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Administra las oficinas del sistema financiero
                    </p>
                  </div>
                </div>

                {/* ✅ INDICADORES DE PERMISOS INCLUYENDO CALENDARIO SINCRONIZADO */}
                <div className="flex items-center space-x-2">
                  {canCreate && (
                    <div className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                      <Icon name="Plus" size={14} className="mr-1" />
                      Crear
                    </div>
                  )}
                  {canUpdate && (
                    <div className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      <Icon name="Edit" size={14} className="mr-1" />
                      Editar
                    </div>
                  )}
                  {canDelete && (
                    <div className="flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                      <Icon name="Trash2" size={14} className="mr-1" />
                      Eliminar
                    </div>
                  )}
                  {/* ✅ CRÍTICO: Indicador de permiso de calendario sincronizado */}
                  {canViewCalendar && (
                    <div className="flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm">
                      <Icon name="Calendar" size={14} className="mr-1" />
                      Calendario
                    </div>
                  )}
                </div>
              </div>

              {/* Estadísticas rápidas */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon
                        name="Building2"
                        size={20}
                        className="text-blue-600"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Total Oficinas
                      </p>
                      <p className="text-xl font-semibold text-gray-900">
                        {totalRecords}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Icon
                        name="CheckCircle"
                        size={20}
                        className="text-green-600"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Activas
                      </p>
                      <p className="text-xl font-semibold text-gray-900">
                        {
                          oficinas.filter((o) => o.oficin_ctractual === 1)
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Icon name="XCircle" size={20} className="text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Inactivas
                      </p>
                      <p className="text-xl font-semibold text-gray-900">
                        {
                          oficinas.filter((o) => o.oficin_ctractual === 0)
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Icon
                        name="Users"
                        size={20}
                        className="text-purple-600"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Con Usuarios
                      </p>
                      <p className="text-xl font-semibold text-gray-900">
                        {
                          oficinas.filter((o) => o.cantidad_usuarios_total > 0)
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensaje de notificación */}
            {message.text && (
              <div
                className={`mb-6 p-4 rounded-lg border-l-4 transition-all duration-300 ${
                  message.type === "success"
                    ? "bg-green-50 border-green-400 text-green-700"
                    : message.type === "error"
                    ? "bg-red-50 border-red-400 text-red-700"
                    : message.type === "warning"
                    ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                    : "bg-blue-50 border-blue-400 text-blue-700"
                }`}
              >
                <div className="flex items-center">
                  <Icon
                    name={
                      message.type === "success"
                        ? "CheckCircle"
                        : message.type === "error"
                        ? "AlertCircle"
                        : message.type === "warning"
                        ? "AlertTriangle"
                        : "Info"
                    }
                    size={20}
                    className="mr-2"
                  />
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            {/* Sección de Filtros y Búsqueda */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center">
                  <Icon name="Filter" size={18} className="mr-2" />
                  Filtros y Búsqueda
                </h3>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Búsqueda general */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Búsqueda General
                    </label>
                    <div className="relative">
                      <Icon
                        name="Search"
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, dirección, RUC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filtro por Estado */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      value={filters.solo_activas ? "activas" : "todas"}
                      onChange={(e) =>
                        handleFilterChange(
                          "solo_activas",
                          e.target.value === "activas"
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="todas">Todas las oficinas</option>
                      <option value="activas">Solo activas</option>
                    </select>
                  </div>

                  {/* Filtro por Institución */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Institución
                    </label>
                    <select
                      value={filters.instit_codigo}
                      onChange={(e) =>
                        handleFilterChange("instit_codigo", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todas las instituciones</option>
                      {institucionesOptions.map((institucion) => (
                        <option
                          key={institucion.value}
                          value={institucion.value}
                        >
                          {institucion.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por Tipo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de Oficina
                    </label>
                    <select
                      value={filters.tofici_codigo}
                      onChange={(e) =>
                        handleFilterChange("tofici_codigo", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos los tipos</option>
                      {tiposOficinaOptions.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    disabled={loading}
                  >
                    <Icon name="RotateCcw" size={14} className="inline mr-2" />
                    Limpiar filtros
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    disabled={loading}
                  >
                    <Icon name="Search" size={14} className="inline mr-2" />
                    Aplicar filtros
                  </button>
                </div>

                {/* Indicadores de filtros activos */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      <Icon name="Search" size={12} className="mr-1" />
                      Búsqueda: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </span>
                  )}
                  {filters.solo_activas && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      <Icon name="CheckCircle" size={12} className="mr-1" />
                      Solo activas
                      <button
                        onClick={() =>
                          handleFilterChange("solo_activas", false)
                        }
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </span>
                  )}
                  {filters.instit_codigo && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                      <Icon name="Building" size={12} className="mr-1" />
                      Institución:{" "}
                      {institucionesOptions.find(
                        (i) =>
                          i.value.toString() ===
                          filters.instit_codigo.toString()
                      )?.label || filters.instit_codigo}
                      <button
                        onClick={() => handleFilterChange("instit_codigo", "")}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </span>
                  )}
                  {filters.tofici_codigo && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                      <Icon name="Building2" size={12} className="mr-1" />
                      Tipo:{" "}
                      {tiposOficinaOptions.find(
                        (t) =>
                          t.value.toString() ===
                          filters.tofici_codigo.toString()
                      )?.label || filters.tofici_codigo}
                      <button
                        onClick={() => handleFilterChange("tofici_codigo", "")}
                        className="ml-2 text-orange-600 hover:text-orange-800"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de Oficinas */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">
                    Lista de Oficinas ({totalRecords})
                  </h3>

                  {/* Selector de registros por página */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Mostrar:</label>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                        loadOficinas(1);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-600">registros</span>
                  </div>
                </div>

                {/* Botón CREATE */}
                {canCreate ? (
                  <button
                    onClick={handleNewOficina}
                    className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                    disabled={loading}
                    title="Crear nueva oficina"
                  >
                    <Icon
                      name="Plus"
                      size={20}
                      className="transition-transform duration-300 group-hover:rotate-90"
                    />
                  </button>
                ) : (
                  <div
                    className="w-10 h-10 bg-gray-300 text-gray-500 rounded-lg flex items-center justify-center cursor-not-allowed"
                    title="Sin permisos para crear oficinas"
                  >
                    <Icon name="Lock" size={16} />
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <span className="text-gray-600">Cargando oficinas...</span>
                  </div>
                </div>
              ) : !Array.isArray(oficinas) || oficinas.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Icon
                      name="Building2"
                      size={48}
                      className="mx-auto mb-4 text-gray-300"
                    />
                    <p className="text-gray-500 mb-2">
                      No hay oficinas registradas
                    </p>
                    {canCreate && (
                      <p className="text-sm text-gray-400 mt-2">
                        Haz clic en "Nueva Oficina" para crear una
                      </p>
                    )}
                    {!Array.isArray(oficinas) && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-sm mx-auto">
                        <p className="text-xs text-red-600">
                          Error: Datos recibidos no válidos ({typeof oficinas})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Tabla de Oficinas */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("oficin_codigo")}
                          >
                            <div className="flex items-center">
                              Código
                              {sortConfig.key === "oficin_codigo" && (
                                <Icon
                                  name={
                                    sortConfig.direction === "asc"
                                      ? "ChevronUp"
                                      : "ChevronDown"
                                  }
                                  size={14}
                                  className="ml-1"
                                />
                              )}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("oficin_nombre")}
                          >
                            <div className="flex items-center">
                              Oficina
                              {sortConfig.key === "oficin_nombre" && (
                                <Icon
                                  name={
                                    sortConfig.direction === "asc"
                                      ? "ChevronUp"
                                      : "ChevronDown"
                                  }
                                  size={14}
                                  className="ml-1"
                                />
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ubicación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuarios
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedOficinas.map((oficina) => (
                          <tr
                            key={oficina.oficin_codigo}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            {/* COLUMNA CÓDIGO */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div
                                  className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    oficina.oficin_ctractual === 1
                                      ? "bg-green-100"
                                      : "bg-red-100"
                                  }`}
                                >
                                  <span
                                    className={`font-medium text-sm ${
                                      oficina.oficin_ctractual === 1
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {oficina.oficin_codigo}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    ID: {oficina.oficin_codigo}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {oficina.tofici_descripcion ||
                                      "Tipo no definido"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* COLUMNA OFICINA */}
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {oficina.oficin_nombre}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {oficina.instit_nombre ||
                                      "Institución no definida"}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    RUC: {oficina.oficin_rucoficina}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* COLUMNA UBICACIÓN */}
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {oficina.oficin_direccion}
                              </div>
                              <div className="text-sm text-gray-500">
                                {[
                                  oficina.parroq_nombre,
                                  oficina.canton_nombre,
                                  oficina.provin_nombre,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            </td>

                            {/* COLUMNA CONTACTO */}
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 flex items-center">
                                <Icon
                                  name="Phone"
                                  size={14}
                                  className="mr-1 text-gray-400"
                                />
                                {oficina.oficin_telefono}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Icon
                                  name="Mail"
                                  size={14}
                                  className="mr-1 text-gray-400"
                                />
                                {oficina.oficin_diremail}
                              </div>
                            </td>

                            {/* COLUMNA USUARIOS */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {oficina.cantidad_usuarios_activos || 0}
                                </div>
                                <div className="text-sm text-gray-500 ml-1">
                                  / {oficina.cantidad_usuarios_total || 0}
                                </div>
                                {(oficina.cantidad_usuarios_total || 0) > 0 && (
                                  <button
                                    onClick={() => handleVerUsuarios(oficina)}
                                    className="ml-2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                    title="Ver usuarios"
                                  >
                                    <Icon name="Users" size={14} />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* COLUMNA ESTADO */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  oficina.oficin_ctractual === 1
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                <Icon
                                  name={
                                    oficina.oficin_ctractual === 1
                                      ? "CheckCircle"
                                      : "XCircle"
                                  }
                                  size={12}
                                  className="mr-1"
                                />
                                {oficina.oficin_ctractual === 1
                                  ? "Activa"
                                  : "Inactiva"}
                              </span>
                            </td>

                            {/* ✅ COLUMNA ACCIONES - CRÍTICA: CON BOTÓN CALENDARIO SINCRONIZADO */}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                {/* Botón VER */}
                                <button
                                  onClick={() => handleShowOficina(oficina)}
                                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                                  title={`Ver detalles de ${oficina.oficin_nombre}`}
                                >
                                  <Icon name="Eye" size={16} />
                                </button>

                                {/* Botón EDITAR */}
                                {canUpdate ? (
                                  <button
                                    onClick={() => handleEditOficina(oficina)}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                                    disabled={loading}
                                    title={`Editar ${oficina.oficin_nombre}`}
                                  >
                                    <Icon name="Edit" size={16} />
                                  </button>
                                ) : (
                                  <div
                                    className="p-2 text-gray-400 cursor-not-allowed"
                                    title="Sin permisos para editar"
                                  >
                                    <Icon name="Lock" size={16} />
                                  </div>
                                )}

                                {/* Botón ELIMINAR */}
                                {canDelete ? (
                                  <button
                                    onClick={() => handleDeleteOficina(oficina)}
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                                    disabled={
                                      loading ||
                                      (oficina.cantidad_usuarios_total || 0) > 0
                                    }
                                    title={
                                      (oficina.cantidad_usuarios_total || 0) > 0
                                        ? `No se puede eliminar: tiene ${oficina.cantidad_usuarios_total} usuarios`
                                        : `Eliminar ${oficina.oficin_nombre}`
                                    }
                                  >
                                    <Icon name="Trash2" size={16} />
                                  </button>
                                ) : (
                                  <div
                                    className="p-2 text-gray-400 cursor-not-allowed"
                                    title="Sin permisos para eliminar"
                                  >
                                    <Icon name="Lock" size={16} />
                                  </div>
                                )}

                                {/* ✅ BOTÓN CALENDARIO - AHORA COMPLETAMENTE SINCRONIZADO */}
                                {canViewCalendar ? (
                                  <button
                                    onClick={() => handleCalendario(oficina)}
                                    className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                                    title={`Ver calendario de ${oficina.oficin_nombre}`}
                                  >
                                    <Icon name="Calendar" size={16} />
                                  </button>
                                ) : (
                                  <div
                                    className="p-2 text-gray-400 cursor-not-allowed"
                                    title="Sin permisos para ver calendario"
                                  >
                                    <Icon name="Lock" size={16} />
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <span>
                            Mostrando {(currentPage - 1) * perPage + 1} a{" "}
                            {Math.min(currentPage * perPage, totalRecords)} de{" "}
                            {totalRecords} registros
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Botón Anterior */}
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Icon name="ChevronLeft" size={16} />
                          </button>

                          {/* Números de página */}
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  disabled={loading}
                                  className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                                    currentPage === pageNum
                                      ? "border-blue-500 bg-blue-50 text-blue-600"
                                      : "border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                          )}

                          {/* Botón Siguiente */}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Icon name="ChevronRight" size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer con información de depuración */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Debug Info:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    Usuario: {currentUser?.usu_nom} (ID: {currentUserId})
                  </div>
                  <div>Vista actual: {currentView}</div>
                  <div>
                    Permisos: C:{canCreate ? "✓" : "✗"} R:{canRead ? "✓" : "✗"}{" "}
                    U:{canUpdate ? "✓" : "✗"} D:{canDelete ? "✓" : "✗"}
                  </div>
                  {/* ✅ CRÍTICO: Debug del permiso de calendario sincronizado */}
                  <div>
                    Calendario: {canViewCalendar ? "✓ PERMITIDO" : "✗ DENEGADO"} 
                    (inicial: {initialCanViewCalendar ? "✓" : "✗"}, 
                    sincronizado: {canViewCalendar ? "✓" : "✗"})
                  </div>
                  <div>Oficinas cargadas: {oficinas.length}</div>
                  <div>Total registros: {totalRecords}</div>
                  <div>
                    Página actual: {currentPage}/{totalPages}
                  </div>
                  <div>Registros por página: {perPage}</div>
                  <div>Búsqueda: "{searchTerm}"</div>
                  <div>Filtros activos: {JSON.stringify(filters)}</div>
                  <div>
                    Ordenamiento: {sortConfig.key} ({sortConfig.direction})
                  </div>
                  {editingOficina && (
                    <div>
                      Editando oficina: {editingOficina.oficin_codigo} -{" "}
                      {editingOficina.oficin_nombre}
                    </div>
                  )}
                  {viewingOficina && (
                    <div>
                      Viendo oficina: {viewingOficina.oficin_codigo} -{" "}
                      {viewingOficina.oficin_nombre}
                    </div>
                  )}
                  {/* ✅ CRÍTICO: Debug info para calendario sincronizado */}
                  {calendarioOficina && (
                    <div>
                      Viendo calendario: {calendarioOficina.oficin_codigo} -{" "}
                      {calendarioOficina.oficin_nombre}
                    </div>
                  )}
                  <div>
                    Timestamp: {new Date().toISOString()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OficinasWindow;