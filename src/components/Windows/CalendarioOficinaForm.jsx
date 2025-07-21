// src/components/Windows/Oficinas/CalendarioOficinaForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";

const CalendarioOficinaForm = ({
  oficinaId,
  onCancel,
  showMessage,
  loading: externalLoading,
}) => {
  console.log(
    "📅 CalendarioOficinaForm - Renderizando para oficina:",
    oficinaId
  );

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [oficina, setOficina] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPlantillas, setShowPlantillas] = useState(false);
  const [showCalendario, setShowCalendario] = useState(false);
  const [showConflictos, setShowConflictos] = useState(false);
  const [showCopiarHorarios, setShowCopiarHorarios] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados para formulario
  const [formData, setFormData] = useState({
    dia_codigo: "",
    hora_inicio: "08:00",
    hora_fin: "17:00",
    activo: true,
  });

  // Estados para plantillas
  const [plantillas, setPlantillas] = useState([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState("");

  // Estados para vista calendario
  const [calendarioData, setCalendarioData] = useState(null);
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());

  // Estados para conflictos
  const [conflictos, setConflictos] = useState(null);

  // Estados para copia de horarios
  const [oficinasDisponibles, setOficinasDisponibles] = useState([]);
  const [oficinaOrigen, setOficinaOrigen] = useState("");

  // Días de la semana
  const diasSemana = [
    { codigo: 1, nombre: "Lunes", abrev: "Lun" },
    { codigo: 2, nombre: "Martes", abrev: "Mar" },
    { codigo: 3, nombre: "Miércoles", abrev: "Mié" },
    { codigo: 4, nombre: "Jueves", abrev: "Jue" },
    { codigo: 5, nombre: "Viernes", abrev: "Vie" },
    { codigo: 6, nombre: "Sábado", abrev: "Sáb" },
    { codigo: 7, nombre: "Domingo", abrev: "Dom" },
  ];

  // Función para cargar oficinas disponibles
  const cargarOficinasDisponibles = async () => {
    try {
      const response = await adminService.oficinas.getAll({
        per_page: 1000,
        solo_activas: true,
      });

      if (response?.status === "success" && response?.data) {
        let oficinasData = [];

        if (response.data.data && Array.isArray(response.data.data)) {
          oficinasData = response.data.data;
        } else if (Array.isArray(response.data)) {
          oficinasData = response.data;
        }

        const oficinasFormateadas = oficinasData.map((oficina) => ({
          value: oficina.oficin_codigo,
          label: `${oficina.oficin_codigo} - ${oficina.oficin_nombre}`,
        }));

        setOficinasDisponibles(oficinasFormateadas);
        console.log(
          "✅ Oficinas disponibles cargadas:",
          oficinasFormateadas.length
        );
      } else {
        console.warn("⚠️ No se pudieron cargar las oficinas");
        setOficinasDisponibles([]);
      }
    } catch (error) {
      console.error("❌ Error cargando oficinas disponibles:", error);
      setOficinasDisponibles([]);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (oficinaId) {
      cargarHorarios();
      cargarPlantillas();
      cargarOficinasDisponibles();
    }
  }, [oficinaId]);

  // Función para cargar horarios
  const cargarHorarios = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.horariosOficinas.getHorarios(
        oficinaId
      );

      if (response.status === "success") {
        setOficina(response.data.oficina);
        setHorarios(response.data.horarios_por_dia || []);
        console.log("✅ Horarios cargados:", response.data);
      } else {
        throw new Error(response.message || "Error al cargar horarios");
      }
    } catch (error) {
      console.error("❌ Error cargando horarios:", error);
      setError(error.message || "Error al cargar horarios");
      showMessage("error", error.message || "Error al cargar horarios");
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar plantillas
  const cargarPlantillas = async () => {
    try {
      const response = await adminService.horariosOficinas.getPlantillas();
      if (response.status === "success") {
        setPlantillas(response.data || []);
      }
    } catch (error) {
      console.error("❌ Error cargando plantillas:", error);
    }
  };

  // Función para abrir formulario
  const abrirFormulario = (diaData = null) => {
    if (diaData) {
      setFormData({
        dia_codigo: diaData.dia_codigo,
        hora_inicio: diaData.hora_inicio || "08:00",
        hora_fin: diaData.hora_fin || "17:00",
        activo: diaData.activo || true,
      });
      setSelectedDay(diaData);
    } else {
      setFormData({
        dia_codigo: "",
        hora_inicio: "08:00",
        hora_fin: "17:00",
        activo: true,
      });
      setSelectedDay(null);
    }
    setShowForm(true);
  };

  // Función para guardar horario
  // Función para guardar horario (versión simplificada para pruebas)
  const guardarHorario = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validar datos básicos
      if (!formData.dia_codigo || !formData.hora_inicio || !formData.hora_fin) {
        throw new Error("Todos los campos son requeridos");
      }

      // ✅ VALIDACIÓN MÍNIMA SOLO PARA FORMATO (sin validar duración)
      const validarFormatoHora = (hora) => {
        const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return horaRegex.test(hora);
      };

      // Solo validar formato, no duración
      if (!validarFormatoHora(formData.hora_inicio)) {
        throw new Error("Formato de hora de inicio inválido (debe ser HH:MM)");
      }

      if (!validarFormatoHora(formData.hora_fin)) {
        throw new Error("Formato de hora de fin inválido (debe ser HH:MM)");
      }

      console.log("✅ Guardando horario:", {
        oficinaId,
        formData,
        esEdicion: !!selectedDay,
      });

      const response = await adminService.horariosOficinas.crearHorario(
        oficinaId,
        formData
      );

      if (response.status === "success") {
        setSuccess("Horario guardado correctamente");
        setShowForm(false);
        await cargarHorarios();
        showMessage("success", "Horario guardado correctamente");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || "Error al guardar horario");
      }
    } catch (error) {
      console.error("❌ Error guardando horario:", error);
      setError(error.message || "Error al guardar horario");
      showMessage("error", error.message || "Error al guardar horario");
    } finally {
      setSaving(false);
    }
  };

  // Función para eliminar horario
  const eliminarHorario = async (diaId) => {
    if (!confirm("¿Está seguro que desea eliminar este horario?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.horariosOficinas.eliminarHorario(
        oficinaId,
        diaId
      );

      if (response.status === "success") {
        setSuccess("Horario eliminado correctamente");
        await cargarHorarios();
        showMessage("success", "Horario eliminado correctamente");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || "Error al eliminar horario");
      }
    } catch (error) {
      console.error("❌ Error eliminando horario:", error);
      setError(error.message || "Error al eliminar horario");
      showMessage("error", error.message || "Error al eliminar horario");
    } finally {
      setLoading(false);
    }
  };

  // Función para activar/desactivar horario
  const toggleHorario = async (diaId) => {
    try {
      setLoading(true);
      const response = await adminService.horariosOficinas.toggleHorario(
        oficinaId,
        diaId
      );

      if (response.status === "success") {
        setSuccess("Estado del horario cambiado correctamente");
        await cargarHorarios();
        showMessage("success", "Estado del horario cambiado correctamente");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || "Error al cambiar estado");
      }
    } catch (error) {
      console.error("❌ Error cambiando estado:", error);
      setError(error.message || "Error al cambiar estado del horario");
      showMessage(
        "error",
        error.message || "Error al cambiar estado del horario"
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para aplicar plantilla
  const aplicarPlantilla = async () => {
    if (!selectedPlantilla) {
      setError("Seleccione una plantilla");
      return;
    }

    if (
      !confirm(
        "¿Está seguro que desea aplicar esta plantilla? Se sobrescribirán los horarios existentes."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.horariosOficinas.aplicarPlantilla(
        oficinaId,
        selectedPlantilla,
        true
      );

      if (response.status === "success") {
        setSuccess("Plantilla aplicada correctamente");
        setShowPlantillas(false);
        await cargarHorarios();
        showMessage("success", "Plantilla aplicada correctamente");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || "Error al aplicar plantilla");
      }
    } catch (error) {
      console.error("❌ Error aplicando plantilla:", error);
      setError(error.message || "Error al aplicar plantilla");
      showMessage("error", error.message || "Error al aplicar plantilla");
    } finally {
      setLoading(false);
    }
  };

  // Función para copiar horarios
  const copiarHorarios = async () => {
    if (!oficinaOrigen) {
      setError("Seleccione una oficina origen");
      return;
    }

    if (
      !confirm(
        "¿Está seguro que desea copiar los horarios? Se sobrescribirán los horarios existentes."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.horariosOficinas.copiarHorarios(
        oficinaOrigen,
        oficinaId,
        { sobrescribir: true }
      );

      if (response.status === "success") {
        setSuccess("Horarios copiados correctamente");
        setShowCopiarHorarios(false);
        await cargarHorarios();
        showMessage("success", "Horarios copiados correctamente");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || "Error al copiar horarios");
      }
    } catch (error) {
      console.error("❌ Error copiando horarios:", error);
      setError(error.message || "Error al copiar horarios");
      showMessage("error", error.message || "Error al copiar horarios");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener color del día
  const getColorDia = (dia) => {
    if (!dia.tiene_horario) return "bg-gray-100 text-gray-400 border-gray-200";
    if (!dia.activo) return "bg-red-100 text-red-600 border-red-200";
    return "bg-green-100 text-green-600 border-green-200";
  };

  // Función para obtener ícono del día
  const getIconoDia = (dia) => {
    if (!dia.tiene_horario) return <Icon name="X" size={16} />;
    if (!dia.activo) return <Icon name="AlertCircle" size={16} />;
    return <Icon name="CheckCircle" size={16} />;
  };

  const handleCancel = useCallback(() => {
    console.log("❌ Cancelando vista de calendario - volviendo a lista");
    onCancel();
  }, [onCancel]);

  // Renderizado sin oficina
  if (!oficinaId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Icon
            name="Calendar"
            size={48}
            className="mx-auto mb-4 text-gray-400"
          />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No hay oficina seleccionada
          </h2>
          <p className="text-gray-500 mb-6">
            Seleccione una oficina de la lista para gestionar sus horarios
          </p>
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Volver a la Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header compacto */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-100 to-blue-200 border-b border-blue-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Icon name="Calendar" size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-800">
                Gestión de Horarios
              </h2>
              <p className="text-blue-600 text-sm flex items-center gap-2">
                <span className="bg-blue-200 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                  ID: {oficinaId}
                </span>
                <span className="text-blue-600">
                  {oficina?.oficin_nombre || "Cargando..."}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => abrirFormulario()}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            disabled={loading}
          >
            <Icon name="Plus" size={14} />
            Nuevo Horario
          </button>
          <button
            onClick={() => setShowPlantillas(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            disabled={loading}
          >
            <Icon name="Settings" size={14} />
            Plantillas
          </button>
          <button
            onClick={() => setShowCopiarHorarios(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            disabled={loading}
          >
            <Icon name="Copy" size={14} />
            Copiar Horarios
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col p-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-600">Cargando horarios...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {horarios.map((dia) => (
                <div
                  key={dia.dia_codigo}
                  className={`border-2 rounded-lg p-4 transition-all ${getColorDia(
                    dia
                  )} hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getIconoDia(dia)}
                      <h3 className="font-medium">{dia.dia_nombre}</h3>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                      {dia.dia_abreviatura}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dia.tiene_horario ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Clock" size={14} />
                          <span className="font-mono">
                            {dia.formato_visual}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`px-2 py-1 rounded-full ${
                              dia.activo
                                ? "bg-green-200 text-green-800"
                                : "bg-red-200 text-red-800"
                            }`}
                          >
                            {dia.activo ? "Activo" : "Inactivo"}
                          </span>
                          {dia.jornada && (
                            <span className="px-2 py-1 rounded-full bg-blue-200 text-blue-800">
                              {dia.jornada}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Sin horario configurado
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => abrirFormulario(dia)}
                      className="flex-1 px-3 py-1 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-75 transition-colors"
                      title="Editar horario"
                    >
                      <Icon name="Edit3" size={12} className="mx-auto" />
                    </button>
                    {dia.tiene_horario && (
                      <>
                        <button
                          onClick={() => toggleHorario(dia.dia_codigo)}
                          className="flex-1 px-3 py-1 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-75 transition-colors"
                          title="Activar/Desactivar"
                        >
                          <Icon
                            name="RotateCcw"
                            size={12}
                            className="mx-auto"
                          />
                        </button>
                        <button
                          onClick={() => eliminarHorario(dia.dia_codigo)}
                          className="flex-1 px-3 py-1 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-75 transition-colors"
                          title="Eliminar horario"
                        >
                          <Icon name="Trash2" size={12} className="mx-auto" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón para volver */}
        <div className="pt-6 border-t border-gray-200 mt-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={externalLoading || saving}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:text-gray-800 hover:scale-105 transform hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
            >
              <Icon name="ArrowLeft" size={16} />
              Volver a Oficinas
            </button>
          </div>
        </div>
      </div>

      {/* Modal de formulario de horario */}
      {showForm && (
        <div className="fixed inset-0 z-50">
          {/* Overlay con blur */}
          <div className="fixed inset-0 backdrop-blur-sm bg-red bg-opacity-10"></div>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-4">
                  {selectedDay ? "Editar Horario" : "Nuevo Horario"}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Día de la semana
                    </label>
                    <select
                      value={formData.dia_codigo}
                      onChange={(e) =>
                        setFormData({ ...formData, dia_codigo: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={selectedDay}
                    >
                      <option value="">Seleccionar día</option>
                      {diasSemana.map((dia) => (
                        <option key={dia.codigo} value={dia.codigo}>
                          {dia.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora inicio
                      </label>
                      <input
                        type="time"
                        value={formData.hora_inicio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hora_inicio: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="60" // ✅ Solo permitir selección por horas
                        min="00:00"
                        max="23:59"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora fin
                      </label>
                      <input
                        type="time"
                        value={formData.hora_fin}
                        onChange={(e) =>
                          setFormData({ ...formData, hora_fin: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="60" // ✅ Solo permitir selección por horas
                        min="00:00"
                        max="23:59"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) =>
                        setFormData({ ...formData, activo: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="activo"
                      className="text-sm font-medium text-gray-700"
                    >
                      Horario activo
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarHorario}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de plantillas */}
      {showPlantillas && (
        <div className="fixed inset-0 z-50">
          {/* Overlay con blur */}
          <div className="fixed inset-0 backdrop-blur-sm bg-red bg-opacity-10"></div>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-4">Aplicar Plantilla</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seleccionar plantilla
                    </label>
                    <select
                      value={selectedPlantilla}
                      onChange={(e) => setSelectedPlantilla(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar plantilla</option>
                      {plantillas.map((plantilla) => (
                        <option key={plantilla.id} value={plantilla.id}>
                          {plantilla.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPlantilla && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Descripción:
                      </p>
                      <p className="text-sm text-gray-600">
                        {
                          plantillas.find((p) => p.id === selectedPlantilla)
                            ?.descripcion
                        }
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowPlantillas(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={aplicarPlantilla}
                    disabled={!selectedPlantilla || loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de copiar horarios */}
      {showCopiarHorarios && (
        <div className="fixed inset-0 z-50">
          {/* Overlay con blur */}
          <div className="fixed inset-0 backdrop-blur-sm bg-red bg-opacity-10"></div>

          {/* Contenedor del modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-4">Copiar Horarios</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Oficina origen
                    </label>
                    <select
                      value={oficinaOrigen}
                      onChange={(e) => setOficinaOrigen(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar oficina</option>
                      {oficinasDisponibles
                        .filter((o) => o.value !== parseInt(oficinaId))
                        .map((oficina) => (
                          <option key={oficina.value} value={oficina.value}>
                            {oficina.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Advertencia:</strong> Esta acción sobrescribirá
                      todos los horarios existentes de esta oficina.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowCopiarHorarios(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={copiarHorarios}
                    disabled={!oficinaOrigen || loading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Copiando..." : "Copiar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioOficinaForm;
