// src/hooks/useUserSchedules.js
import { useState, useCallback, useEffect } from 'react';
import { adminService } from '../services/apiService';

export const useUserSchedules = (usuarioId) => {
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [horarios, setHorarios] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [horariosTemporales, setHorariosTemporales] = useState([]);
  const [conflictos, setConflictos] = useState([]);
  const [alertas, setAlertas] = useState([]);

  // Estados para calendario
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState(null);

  /**
   * ✅ FUNCIÓN PRINCIPAL PARA CARGAR TODOS LOS DATOS
   */
  const cargarDatos = useCallback(async () => {
    if (!usuarioId) return;

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 useUserSchedules: Cargando datos para usuario:", usuarioId);

      // Cargar horarios principales
      const horariosResponse = await adminService.horariosUsuarios.getHorarios(usuarioId);
      
      if (horariosResponse.status === 'success') {
        setHorarios(horariosResponse.data);
        setUsuario(horariosResponse.data.usuario);
        
        // Calcular estadísticas
        const stats = adminService.horariosUsuarios.calcularEstadisticas(horariosResponse.data);
        setEstadisticas(stats);
        
        // Generar eventos para calendario
        const eventos = adminService.horariosUsuarios.formatHorariosParaCalendario(horariosResponse.data);
        setCalendarEvents(eventos);
      }

      // Cargar horarios temporales
      try {
        const temporalesResponse = await adminService.horariosUsuarios.getHorariosTemporales(usuarioId);
        if (temporalesResponse.status === 'success') {
          setHorariosTemporales(temporalesResponse.data.periodos_temporales || []);
        }
      } catch (err) {
        console.warn("⚠️ Error cargando horarios temporales:", err);
        setHorariosTemporales([]);
      }

      // Cargar conflictos
      try {
        const conflictosResponse = await adminService.horariosUsuarios.getConflictosHorarios(usuarioId);
        if (conflictosResponse.status === 'success') {
          setConflictos(conflictosResponse.data || []);
        }
      } catch (err) {
        console.warn("⚠️ Error cargando conflictos:", err);
        setConflictos([]);
      }

      // Cargar alertas
      try {
        const alertasResponse = await adminService.horariosUsuarios.getAlertas({ usuario_id: usuarioId });
        if (alertasResponse.status === 'success') {
          setAlertas(alertasResponse.data || []);
        }
      } catch (err) {
        console.warn("⚠️ Error cargando alertas:", err);
        setAlertas([]);
      }

    } catch (error) {
      console.error("❌ useUserSchedules: Error cargando datos:", error);
      setError(error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  /**
   * ✅ FUNCIÓN PARA CREAR HORARIO PERMANENTE
   */
  const crearHorario = useCallback(async (horarioData) => {
    if (!usuarioId) throw new Error('ID de usuario requerido');

    try {
      setSaving(true);
      setError(null);

      console.log("💾 useUserSchedules: Creando horario:", horarioData);

      const response = await adminService.horariosUsuarios.crearHorario(usuarioId, horarioData);
      
      if (response.status === 'success') {
        // Recargar datos
        await cargarDatos();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al crear horario');
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error creando horario:", error);
      setError(error.message || 'Error al crear horario');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [usuarioId, cargarDatos]);

  /**
   * ✅ FUNCIÓN PARA CREAR HORARIO TEMPORAL
   */
  const crearHorarioTemporal = useCallback(async (horarioTemporalData) => {
    if (!usuarioId) throw new Error('ID de usuario requerido');

    try {
      setSaving(true);
      setError(null);

      console.log("⏰ useUserSchedules: Creando horario temporal:", horarioTemporalData);

      // Validar datos antes de enviar
      const validacion = adminService.horariosUsuarios.validarDatosHorarioTemporal(horarioTemporalData);
      if (!validacion.valido) {
        throw new Error(validacion.errores.join('\n'));
      }

      const response = await adminService.horariosUsuarios.crearHorarioTemporal(usuarioId, horarioTemporalData);
      
      if (response.status === 'success') {
        // Recargar datos
        await cargarDatos();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al crear horario temporal');
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error creando horario temporal:", error);
      setError(error.message || 'Error al crear horario temporal');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [usuarioId, cargarDatos]);

  /**
   * ✅ FUNCIÓN PARA ELIMINAR HORARIO PERMANENTE
   */
  const eliminarHorario = useCallback(async (diaId) => {
    if (!usuarioId) throw new Error('ID de usuario requerido');

    try {
      setSaving(true);
      setError(null);

      console.log("🗑️ useUserSchedules: Eliminando horario:", diaId);

      const response = await adminService.horariosUsuarios.eliminarHorario(usuarioId, diaId);
      
      if (response.status === 'success') {
        // Recargar datos
        await cargarDatos();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al eliminar horario');
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error eliminando horario:", error);
      setError(error.message || 'Error al eliminar horario');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [usuarioId, cargarDatos]);

  /**
   * ✅ FUNCIÓN PARA ELIMINAR HORARIO TEMPORAL
   */
  const eliminarHorarioTemporal = useCallback(async (temporalId, eliminarTodoPeriodo = false) => {
    if (!usuarioId) throw new Error('ID de usuario requerido');

    try {
      setSaving(true);
      setError(null);

      console.log("🗑️ useUserSchedules: Eliminando horario temporal:", { temporalId, eliminarTodoPeriodo });

      const response = await adminService.horariosUsuarios.eliminarHorarioTemporal(usuarioId, temporalId, eliminarTodoPeriodo);
      
      if (response.status === 'success') {
        // Recargar datos
        await cargarDatos();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al eliminar horario temporal');
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error eliminando horario temporal:", error);
      setError(error.message || 'Error al eliminar horario temporal');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [usuarioId, cargarDatos]);

  /**
   * ✅ FUNCIÓN PARA CLONAR HORARIOS DESDE OFICINA
   */
  const clonarDesdeOficina = useCallback(async (opciones = {}) => {
    if (!usuarioId) throw new Error('ID de usuario requerido');

    try {
      setSaving(true);
      setError(null);

      console.log("📋 useUserSchedules: Clonando desde oficina:", opciones);

      const response = await adminService.horariosUsuarios.clonarDesdeOficina(usuarioId, opciones);
      
      if (response.status === 'success') {
        // Recargar datos
        await cargarDatos();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al clonar horarios');
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error clonando horarios:", error);
      setError(error.message || 'Error al clonar horarios');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [usuarioId, cargarDatos]);

  /**
   * ✅ FUNCIÓN PARA VALIDAR HORARIO
   */
  const validarHorario = useCallback(async (horarioData) => {
    if (!usuarioId) throw new Error('ID de usuario requerido');

    try {
      console.log("✅ useUserSchedules: Validando horario:", horarioData);

      const response = await adminService.horariosUsuarios.validarHorario(usuarioId, horarioData);
      
      if (response.status === 'success') {
        return { valido: true, mensaje: response.message || 'Horario válido' };
      } else {
        return { valido: false, mensaje: response.message || 'Horario inválido' };
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error validando horario:", error);
      return { valido: false, mensaje: error.message || 'Error en validación' };
    }
  }, [usuarioId]);

  /**
   * ✅ FUNCIÓN PARA OBTENER HORARIOS EN RANGO
   */
  const obtenerHorariosRango = useCallback(async (fechaInicio, fechaFin) => {
    if (!usuarioId) throw new Error('ID de usuario requerido');

    try {
      setLoading(true);
      setError(null);

      console.log("📅 useUserSchedules: Obteniendo horarios en rango:", { fechaInicio, fechaFin });

      const response = await adminService.horariosUsuarios.getHorariosRango(usuarioId, fechaInicio, fechaFin);
      
      if (response.status === 'success') {
        const eventosRango = adminService.horariosUsuarios.convertirAEventosFullCalendar(response.data);
        return { success: true, data: response.data, eventos: eventosRango };
      } else {
        throw new Error(response.message || 'Error al obtener horarios');
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error obteniendo horarios en rango:", error);
      setError(error.message || 'Error al obtener horarios');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  /**
   * ✅ FUNCIÓN PARA EXPORTAR HORARIOS
   */
  const exportarHorarios = useCallback(async (formato = 'excel') => {
    if (!usuarioId) throw new Error('ID de usuario requerido');

    try {
      setLoading(true);
      setError(null);

      console.log("📁 useUserSchedules: Exportando horarios:", formato);

      const response = await adminService.horariosUsuarios.exportarHorarios(usuarioId, formato);
      
      if (response.status === 'success') {
        // Crear enlace de descarga
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `horarios_usuario_${usuarioId}.${formato === 'excel' ? 'xlsx' : 'pdf'}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true, message: 'Horarios exportados correctamente' };
      } else {
        throw new Error(response.message || 'Error al exportar horarios');
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error exportando horarios:", error);
      setError(error.message || 'Error al exportar horarios');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  /**
   * ✅ FUNCIÓN PARA MARCAR ALERTA COMO LEÍDA
   */
  const marcarAlertaLeida = useCallback(async (alertaId) => {
    try {
      console.log("✅ useUserSchedules: Marcando alerta como leída:", alertaId);

      const response = await adminService.horariosUsuarios.marcarAlertaLeida(alertaId);
      
      if (response.status === 'success') {
        // Actualizar alertas localmente
        setAlertas(prevAlertas => 
          prevAlertas.map(alerta => 
            alerta.id === alertaId ? { ...alerta, leida: true } : alerta
          )
        );
        return { success: true };
      } else {
        throw new Error(response.message || 'Error al marcar alerta');
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error marcando alerta:", error);
      throw error;
    }
  }, []);

  /**
   * ✅ FUNCIÓN PARA OBTENER PRÓXIMOS HORARIOS
   */
  const obtenerProximosHorarios = useCallback(async (dias = 7) => {
    if (!usuarioId) throw new Error('ID de usuario requerido');

    try {
      console.log("📅 useUserSchedules: Obteniendo próximos horarios:", dias);

      const response = await adminService.horariosUsuarios.getProximosHorarios(usuarioId, dias);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al obtener próximos horarios');
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error obteniendo próximos horarios:", error);
      throw error;
    }
  }, [usuarioId]);

  /**
   * ✅ FUNCIÓN PARA OBTENER HORARIO ACTUAL
   */
  const obtenerHorarioActual = useCallback(async () => {
    if (!usuarioId) throw new Error('ID de usuario requerido');

    try {
      console.log("🕐 useUserSchedules: Obteniendo horario actual");

      const response = await adminService.horariosUsuarios.getHorarioActual(usuarioId);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al obtener horario actual');
      }
    } catch (error) {
      console.error("❌ useUserSchedules: Error obteniendo horario actual:", error);
      throw error;
    }
  }, [usuarioId]);

  /**
   * ✅ FUNCIÓN PARA LIMPIAR ERROR
   */
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * ✅ FUNCIÓN PARA REFRESCAR DATOS
   */
  const refrescar = useCallback(async () => {
    await cargarDatos();
  }, [cargarDatos]);

  /**
   * ✅ CALCULADORES Y HELPERS
   */
  const calculos = {
    // Calcular tiempo total trabajado
    tiempoTrabajado: horarios ? adminService.horariosUsuarios.calcularTiempoTrabajado(horarios.horarios_por_dia) : null,
    
    // Detectar patrones
    patrones: horarios ? adminService.horariosUsuarios.detectarPatrones(horarios) : null,
    
    // Generar sugerencias
    sugerencias: (horarios && estadisticas) ? adminService.horariosUsuarios.generarSugerencias(horarios, estadisticas) : [],
    
    // Validar integridad
    problemasIntegridad: horarios ? adminService.horariosUsuarios.validarIntegridad(horarios) : []
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (usuarioId) {
      cargarDatos();
    }
  }, [usuarioId, cargarDatos]);

  // Retornar todo el estado y funciones
  return {
    // Estados
    loading,
    saving,
    error,
    horarios,
    usuario,
    estadisticas,
    horariosTemporales,
    conflictos,
    alertas,
    calendarEvents,
    selectedDateRange,
    
    // Funciones principales
    cargarDatos,
    crearHorario,
    crearHorarioTemporal,
    eliminarHorario,
    eliminarHorarioTemporal,
    clonarDesdeOficina,
    validarHorario,
    obtenerHorariosRango,
    exportarHorarios,
    marcarAlertaLeida,
    obtenerProximosHorarios,
    obtenerHorarioActual,
    
    // Utilidades
    limpiarError,
    refrescar,
    setSelectedDateRange,
    
    // Calculadores
    calculos,
    
    // Helpers para UI
    helpers: {
      // Verificar si hay horarios temporales activos
      tieneHorariosTemporalesActivos: horariosTemporales.some(h => h.esta_vigente),
      
      // Contar alertas no leídas
      alertasNoLeidas: alertas.filter(a => !a.leida).length,
      
      // Verificar si hay conflictos
      tieneConflictos: conflictos.length > 0,
      
      // Obtener color por origen de horario
      getColorByOrigin: adminService.horariosUsuarios.getColorByOrigin,
      
      // Formatear eventos para calendario
      formatForCalendar: (data) => adminService.horariosUsuarios.formatHorariosParaCalendario(data),
      
      // Obtener días laborales próximos
      getProximosDiasLaborales: adminService.horariosUsuarios.obtenerProximosDiasLaborales
    }
  };
};