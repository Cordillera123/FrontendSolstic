// src/components/Windows/ConfigWindow.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useButtonPermissions } from "../../hooks/useButtonPermissions";
import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";
import { getCurrentUser } from "../../context/AuthContext";

const ConfigForm = React.memo(
  ({ editingConfig, loading, onSave, onCancel, showMessage }) => {
    const [formData, setFormData] = useState({
      conf_nom: "",
      conf_detalle: "",
      conf_descripcion: "",
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
      if (editingConfig) {
        setFormData({
          conf_nom: editingConfig.conf_nom || "",
          conf_detalle: editingConfig.conf_detalle || "",
          conf_descripcion: editingConfig.conf_descripcion || "",
        });
      } else {
        setFormData({ conf_nom: "", conf_detalle: "", conf_descripcion: "" });
      }
      setFormErrors({});
      setShowSuccess(false);
      setIsSubmitting(false);
    }, [editingConfig]);

    const validateField = (field, value) => {
      const errors = { ...formErrors };
      switch (field) {
        case "conf_nom":
          if (!value.trim()) errors.conf_nom = "El nombre es requerido";
          else if (value.length < 2)
            errors.conf_nom = "Debe tener al menos 2 caracteres";
          else delete errors.conf_nom;
          break;

        case "conf_detalle":
          if (!value.trim()) errors.conf_detalle = "El detalle es requerido";
          else delete errors.conf_detalle;
          break;

        default:
          break;
      }
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      validateField(field, value);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const valid = ["conf_nom", "conf_detalle"].every((field) =>
        validateField(field, formData[field])
      );
      if (!valid) {
        showMessage("error", "Por favor corrige los errores en el formulario");
        return;
      }

      setIsSubmitting(true);
      try {
        await onSave(formData, editingConfig);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      } catch (error) {
        showMessage("error", error.message || "Error al guardar configuración");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCancel = () => {
      setIsSubmitting(true);
      setTimeout(() => {
        onCancel();
        setIsSubmitting(false);
      }, 300);
    };

    const isFormValid = useMemo(
      () =>
        formData.conf_nom &&
        formData.conf_detalle &&
        Object.keys(formErrors).length === 0,
      [formData, formErrors]
    );

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {editingConfig ? "Editar Configuración" : "Crear Nueva Configuración"}
        </h3>

        {Object.keys(formErrors).length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center">
              <Icon name="AlertCircle" size={14} className="mr-2" />
              {formErrors.submit || "Por favor corrige los errores"}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.conf_nom}
                onChange={(e) => handleInputChange("conf_nom", e.target.value)}
                className={`w-full border rounded px-3 py-2 ${
                  formErrors.conf_nom ? "border-red-300" : "border-gray-300"
                }`}
                disabled={loading}
              />
              {formErrors.conf_nom && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.conf_nom}
                </p>
              )}
            </div>

            {/* Detalle */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Detalle *
              </label>
              <input
                type="text"
                value={formData.conf_detalle}
                onChange={(e) =>
                  handleInputChange("conf_detalle", e.target.value)
                }
                className={`w-full border rounded px-3 py-2 ${
                  formErrors.conf_detalle ? "border-red-300" : "border-gray-300"
                }`}
                disabled={loading}
              />
              {formErrors.conf_detalle && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.conf_detalle}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                rows={3}
                value={formData.conf_descripcion}
                onChange={(e) =>
                  handleInputChange("conf_descripcion", e.target.value)
                }
                className="w-full border rounded px-3 py-2 border-gray-300"
                disabled={loading}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`px-4 py-2 rounded text-white ${
                isFormValid
                  ? editingConfig
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting
                ? "Guardando..."
                : editingConfig
                ? "Actualizar"
                : "Crear"}
            </button>
          </div>
        </form>
      </div>
    );
  }
);

ConfigForm.displayName = "ConfigForm";

// ===== COMPONENTE PRINCIPAL =====

const ConfigWindow = ({
  showMessage: externalShowMessage,
  menuId = 30,
  title = "Gestión de Configuraciones",
}) => {
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.usu_id;

  // Hook de permisos
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    loading: permissionsLoading,
    error: permissionsError,
  } = useButtonPermissions(menuId, null, true, "menu");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const showMessage = useCallback(
    (type, text) => {
      if (externalShowMessage) {
        externalShowMessage(type, text);
      } else {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      }
    },
    [externalShowMessage]
  );

  const loadConfigs = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    try {
      let result;
      if (adminService.configuraciones.getAll) {
        result = await adminService.configuraciones.getAll();
      } else if (adminService.get) {
        result = await adminService.get("/configs");
      } else {
        const response = await fetch("/api/configs", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        result = await response.json();
      }

      if (result.status === "success" && result.data) {
        let configsData = [];

        // Caso 1: Si result.data es directamente un array
        if (Array.isArray(result.data)) {
          configsData = result.data;

          // Caso 2: Si result.data es un objeto paginado (como en Postman)
        } else if (result.data.data && Array.isArray(result.data.data)) {
          configsData = result.data.data;

          // Caso 3: Respuesta inesperada
        } else {
          console.warn("⚠️ Formato inesperado de datos:", result.data);
          configsData = [];
        }

        setConfigs(configsData); // Solo aquí guardamos los datos reales
      } else {
        showMessage(
          "error",
          result.message || "Error al cargar configuraciones"
        );
      }
    } catch (error) {
      console.error("Error fetching configs:", error);
      showMessage("error", "No se pudieron cargar las configuraciones");
    } finally {
      setLoading(false);
    }
  }, [canRead, showMessage]);

  const handleSave = useCallback(
    async (data, editingConfig) => {
      if (editingConfig && !canUpdate) {
        showMessage(
          "error",
          "No tienes permisos para actualizar configuraciones"
        );
        throw new Error("Sin permisos para actualizar");
      }
      if (!editingConfig && !canCreate) {
        showMessage("error", "No tienes permisos para crear configuraciones");
        throw new Error("Sin permisos para crear");
      }

      setLoading(true);
      try {
        let result;
        if (editingConfig) {
          result = await adminService.configuraciones.update(editingConfig.conf_id, data);
        } else {
          result = await adminService.configuraciones.create(data);
        }
        await loadConfigs();
        showMessage(
          "success",
          result.message || "Configuración guardada exitosamente"
        );
        setShowForm(false);
        setEditingConfig(null);
      } catch (error) {
        showMessage("error", error.message || "Error al guardar");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [canCreate, canUpdate, loadConfigs, showMessage]
  );

  const handleNew = useCallback(() => {
    if (!canCreate) {
      showMessage("error", "No tienes permisos para crear configuraciones");
      return;
    }
    setEditingConfig(null);
    setShowForm(true);
  }, [canCreate, showMessage]);

  const handleEdit = useCallback(
    (config) => {
      if (!canUpdate) {
        showMessage("error", "No tienes permisos para editar configuraciones");
        return;
      }
      setEditingConfig(config);
      setShowForm(true);
    },
    [canUpdate, showMessage]
  );

  const handleDelete = useCallback(
    async (config) => {
      if (!canDelete) {
        showMessage(
          "error",
          "No tienes permisos para eliminar configuraciones"
        );
        return;
      }

      const confirmMsg = `¿Estás seguro de eliminar la configuración "${config.conf_nom}"?`;
      if (!window.confirm(confirmMsg)) return;

      setLoading(true);
      try {
        await adminService.configuraciones.delete(config.id);
        await loadConfigs();
        showMessage("success", "Configuración eliminada correctamente");
      } catch (error) {
        showMessage(
          "error",
          error.message || "Error al eliminar configuración"
        );
      } finally {
        setLoading(false);
      }
    },
    [canDelete, loadConfigs, showMessage]
  );

  const filteredConfigs = useMemo(() => {
    if (!Array.isArray(configs)) return [];
    let filtered = [...configs];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.conf_nom.toLowerCase().includes(term) ||
          c.conf_detalle.toLowerCase().includes(term) ||
          c.conf_descripcion?.toLowerCase().includes(term)
      );
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig.key]?.toString().toLowerCase() ?? "";
        const valB = b[sortConfig.key]?.toString().toLowerCase() ?? "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [configs, searchTerm, sortConfig]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const ConfigsList = useMemo(() => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar configuraciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded focus:outline-none"
            />
            <Icon
              name="Search"
              size={16}
              className="absolute left-3 top-2.5 text-gray-400"
            />
          </div>
          {canCreate && (
            <button
              onClick={handleNew}
              className="ml-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              <Icon name="Plus" size={16} /> Nueva Configuración
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay configuraciones registradas o coincidencias para "
            {searchTerm}"
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort("conf_nom")}
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Nombre{" "}
                    {sortConfig.key === "conf_nom" && (
                      <Icon
                        name={
                          sortConfig.direction === "asc"
                            ? "ChevronUp"
                            : "ChevronDown"
                        }
                        size={12}
                      />
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("conf_detalle")}
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    Detalle{" "}
                    {sortConfig.key === "conf_detalle" && (
                      <Icon
                        name={
                          sortConfig.direction === "asc"
                            ? "ChevronUp"
                            : "ChevronDown"
                        }
                        size={12}
                      />
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConfigs.map((config) => (
                  <tr key={config.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {config.conf_nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {config.conf_detalle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(config)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(config)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
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
    );
  }, [
    filteredConfigs,
    searchTerm,
    sortConfig,
    handleSort,
    canCreate,
    canUpdate,
    canDelete,
    loading,
    handleEdit,
    handleDelete,
    handleNew,
  ]);

  useEffect(() => {
    if (canRead) {
      loadConfigs();
    }
  }, [loadConfigs, canRead]);

  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (permissionsError || !canRead) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Icon name="Lock" size={48} className="mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Acceso denegado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded border-l-4 ${
            message.type === "success"
              ? "bg-green-50 border-green-400 text-green-700"
              : "bg-red-50 border-red-400 text-red-700"
          }`}
        >
          <span>{message.text}</span>
        </div>
      )}

      {showForm && (
        <ConfigForm
          editingConfig={editingConfig}
          loading={loading}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          showMessage={showMessage}
        />
      )}

      {ConfigsList}
    </div>
  );
};

export default ConfigWindow;
