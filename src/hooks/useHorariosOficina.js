// hooks/useHorariosOficina.js
import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/apiService';

export const useHorariosOficina = (oficinaId) => {
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [oficina, setOficina] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [oficinasDisponibles, setOficinasDisponibles] = useState([]);

  // Estados para operaciones específicas
  const [operationLoading, setOperationLoading] = useState({
    save: false,
    delete: false,
    toggle: false,
    copy: false,
    template: false,
    calendar: false,
    conflicts: false,
    clear: false
  });

  // Función para manejar loading de operaciones específicas
  const setOperationState = (operation, state) => {
    setOperationLoading(prev => ({
      ...prev,
      [operation]: state
    }));
  };

  // Función para manejar errores
  const handleError = useCallback((error, operation = null) => {
    console.error(`❌ Error en ${operation || 'operación'}:`, error);
    setError(error.message || 'Error desconocido');
    
    // Limpiar error después de 5 segundos
    setTimeout(() => setError(null), 5000);
  }, []);

  // Función para manejar éxito
  const handleSuccess = useCallback((message) => {
    setSuccess(message);
    
    // Limpiar éxito después de 3 segundos
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  // Función para limpiar mensajes
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Función para cargar horarios
  const cargarHorarios = useCallback(async (showLoading = true) => {
    if (!oficinaId) return;

    try {
      if (showLoading) setLoading(true);
      clearMessages();
      
      const response = await adminService.horariosOficinas.getHorarios(oficinaId);
      
      if (response.status === 'success') {
        setOficina(response.data.oficina);
        setHorarios(response.data.horarios_por_dia || []);
        console.log('✅ Horarios cargados:', response.data);
      } else {
        throw new Error(response.message || 'Error al cargar horarios');
      }
    } catch (error) {
      handleError(error, 'cargar horarios');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [oficinaId, handleError, clearMessages]);

  // Función para cargar plantillas
  const cargarPlantillas = useCallback(async () => {
    try {
      const response = await adminService.horariosOficinas.getPlantillas();
      if (response.status === 'success') {
        setPlantillas(response.data || []);
      }
    } catch (error) {
      console.error('❌ Error cargando plantillas:', error);
    }
  }, []);

  // Función para cargar oficinas disponibles
  const cargarOficinasDisponibles = useCallback(async () => {
    try {
      const response = await adminService.oficinas.listar({ solo_activas: true });
      if (response.status === 'success') {
        setOficinasDisponibles(response.data || []);
      }
    } catch (error) {
      console.error('❌ Error cargando oficinas:', error);
    }
  }, []);

  // Función para guardar horario
  const guardarHorario = useCallback(async (horarioData) => {
    try {
      setOperationState('save', true);
      clearMessages();

      // Validar datos
      if (!horarioData.dia_codigo || !horarioData.hora_inicio || !horarioData.hora_fin) {
        throw new Error('Todos los campos son requeridos');
      }

      // Validar formato de horario
      const validacion = adminService.horariosOficinas.validarFormatoHorario(
        horarioData.hora_inicio, 
        horarioData.hora_fin
      );
      
      if (!validacion.valido) {
        throw new Error(validacion.error);
      }

      const response = await adminService.horariosOficinas.crearHorario(oficinaId, horarioData);
      
      if (response.status === 'success') {
        handleSuccess('Horario guardado correctamente');
        await cargarHorarios(false);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al guardar horario');
      }
    } catch (error) {
      handleError(error, 'guardar horario');
      return { success: false, error: error.message };
    } finally {
      setOperationState('save', false);
    }
  }, [oficinaId, handleError, handleSuccess, clearMessages, cargarHorarios]);

  // Función para guardar múltiples horarios
  const guardarHorariosBatch = useCallback(async (horariosData, sobrescribir = true) => {
    try {
      setOperationState('save', true);
      clearMessages();

      const response = await adminService.horariosOficinas.crearHorariosBatch(oficinaId, {
        horarios: horariosData,
        sobrescribir_existentes: sobrescribir
      });
      
      if (response.status === 'success') {
        handleSuccess('Horarios guardados correctamente');
        await cargarHorarios(false);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al guardar horarios');
      }
    } catch (error) {
      handleError(error, 'guardar horarios batch');
      return { success: false, error: error.message };
    } finally {
      setOperationState('save', false);
    }
  }, [oficinaId, handleError, handleSuccess, clearMessages, cargarHorarios]);

  // Función para eliminar horario
  const eliminarHorario = useCallback(async (diaId) => {
    try {
      setOperationState('delete', true);
      clearMessages();

      const response = await adminService.horariosOficinas.eliminarHorario(oficinaId, diaId);
      
      if (response.status === 'success') {
        handleSuccess('Horario eliminado correctamente');
        await cargarHorarios(false);
        return { success: true };
      } else {
        throw new Error(response.message || 'Error al eliminar horario');
      }
    } catch (error) {
      handleError(error, 'eliminar horario');
      return { success: false, error: error.message };
    } finally {
      setOperationState('delete', false);
    }
  }, [oficinaId, handleError, handleSuccess, clearMessages, cargarHorarios]);

  // Función para activar/desactivar horario
  const toggleHorario = useCallback(async (diaId) => {
    try {
      setOperationState('toggle', true);
      clearMessages();

      const response = await adminService.horariosOficinas.toggleHorario(oficinaId, diaId);
      
      if (response.status === 'success') {
        handleSuccess('Estado del horario cambiado correctamente');
        await cargarHorarios(false);
        return { success: true };
      } else {
        throw new Error(response.message || 'Error al cambiar estado');
      }
    } catch (error) {
      handleError(error, 'cambiar estado horario');
      return { success: false, error: error.message };
    } finally {
      setOperationState('toggle', false);
    }
  }, [oficinaId, handleError, handleSuccess, clearMessages, cargarHorarios]);

  // Función para aplicar plantilla
  const aplicarPlantilla = useCallback(async (plantillaId, sobrescribir = true) => {
    try {
      setOperationState('template', true);
      clearMessages();

      const response = await adminService.horariosOficinas.aplicarPlantilla(
        oficinaId, 
        plantillaId, 
        sobrescribir
      );
      
      if (response.status === 'success') {
        handleSuccess('Plantilla aplicada correctamente');
        await cargarHorarios(false);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al aplicar plantilla');
      }
    } catch (error) {
      handleError(error, 'aplicar plantilla');
      return { success: false, error: error.message };
    } finally {
      setOperationState('template', false);
    }
  }, [oficinaId, handleError, handleSuccess, clearMessages, cargarHorarios]);

  // Función para copiar horarios
  const copiarHorarios = useCallback(async (oficinaOrigenId, opciones = {}) => {
    try {
      setOperationState('copy', true);
      clearMessages();

      const response = await adminService.horariosOficinas.copiarHorarios(
        oficinaOrigenId, 
        oficinaId, 
        opciones
      );
      
      if (response.status === 'success') {
        handleSuccess('Horarios copiados correctamente');
        await cargarHorarios(false);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al copiar horarios');
      }
    } catch (error) {
      handleError(error, 'copiar horarios');
      return { success: false, error: error.message };
    } finally {
      setOperationState('copy', false);
    }
  }, [oficinaId, handleError, handleSuccess, clearMessages, cargarHorarios]);

  // Función para obtener vista calendario
  const obtenerCalendario = useCallback(async (mes = null, anio = null) => {
    try {
      setOperationState('calendar', true);
      clearMessages();

      const response = await adminService.horariosOficinas.getCalendario(
        oficinaId, 
        mes, 
        anio
      );
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al cargar calendario');
      }
    } catch (error) {
      handleError(error, 'cargar calendario');
      return { success: false, error: error.message };
    } finally {
      setOperationState('calendar', false);
    }
  }, [oficinaId, handleError, clearMessages]);

  // Función para verificar conflictos
  const verificarConflictos = useCallback(async () => {
    try {
      setOperationState('conflicts', true);
      clearMessages();

      const response = await adminService.horariosOficinas.verificarConflictos(oficinaId);
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al verificar conflictos');
      }
    } catch (error) {
      handleError(error, 'verificar conflictos');
      return { success: false, error: error.message };
    } finally {
      setOperationState('conflicts', false);
    }
  }, [oficinaId, handleError, clearMessages]);

  // Función para limpiar todos los horarios
  const limpiarTodosLosHorarios = useCallback(async () => {
    try {
      setOperationState('clear', true);
      clearMessages();

      const response = await adminService.horariosOficinas.eliminarTodosLosHorarios(oficinaId);
      
      if (response.status === 'success') {
        handleSuccess('Todos los horarios han sido eliminados');
        await cargarHorarios(false);
        return { success: true };
      } else {
        throw new Error(response.message || 'Error al eliminar horarios');
      }
    } catch (error) {
      handleError(error, 'limpiar horarios');
      return { success: false, error: error.message };
    } finally {
      setOperationState('clear', false);
    }
  }, [oficinaId, handleError, handleSuccess, clearMessages, cargarHorarios]);

  // Función para validar horario específico
  const validarHorarioEspecifico = useCallback(async (fecha, hora) => {
    try {
      const response = await adminService.horariosOficinas.validarHorario(
        oficinaId, 
        fecha, 
        hora
      );
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al validar horario');
      }
    } catch (error) {
      console.error('❌ Error validando horario:', error);
      return { success: false, error: error.message };
    }
  }, [oficinaId]);

  // Función para obtener próximos horarios
  const obtenerProximosHorarios = useCallback(async (dias = 7) => {
    try {
      const response = await adminService.horariosOficinas.getProximosHorarios(
        oficinaId, 
        dias
      );
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al obtener próximos horarios');
      }
    } catch (error) {
      console.error('❌ Error obteniendo próximos horarios:', error);
      return { success: false, error: error.message };
    }
  }, [oficinaId]);

  // Función para obtener estadísticas
  const obtenerEstadisticas = useCallback(async () => {
    try {
      const response = await adminService.horariosOficinas.getEstadisticasGenerales();
      
      if (response.status === 'success') {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Error al obtener estadísticas');
      }
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Funciones utilitarias
  const getDiaInfo = useCallback((diaCodigo) => {
    return horarios.find(h => h.dia_codigo === diaCodigo);
  }, [horarios]);

  const getHorariosActivos = useCallback(() => {
    return horarios.filter(h => h.tiene_horario && h.activo);
  }, [horarios]);

  const getHorariosInactivos = useCallback(() => {
    return horarios.filter(h => h.tiene_horario && !h.activo);
  }, [horarios]);

  const getHorariosSinConfigurar = useCallback(() => {
    return horarios.filter(h => !h.tiene_horario);
  }, [horarios]);

  const getTieneHorarioCompleto = useCallback(() => {
    return horarios.length === 7 && horarios.every(h => h.tiene_horario);
  }, [horarios]);

  const getTieneCoberturaSemanal = useCallback(() => {
    const activos = getHorariosActivos();
    return activos.length >= 5; // Al menos 5 días activos
  }, [getHorariosActivos]);

  const getResumenHorarios = useCallback(() => {
    const activos = getHorariosActivos();
    const inactivos = getHorariosInactivos();
    const sinConfigurar = getHorariosSinConfigurar();

    return {
      total_configurados: horarios.filter(h => h.tiene_horario).length,
      activos: activos.length,
      inactivos: inactivos.length,
      sin_configurar: sinConfigurar.length,
      porcentaje_cobertura: horarios.length > 0 ? (activos.length / horarios.length) * 100 : 0,
      tiene_cobertura_completa: getTieneHorarioCompleto(),
      tiene_cobertura_semanal: getTieneCoberturaSemanal()
    };
  }, [horarios, getHorariosActivos, getHorariosInactivos, getHorariosSinConfigurar, getTieneHorarioCompleto, getTieneCoberturaSemanal]);

  // Función para validar formato de horario
  const validarHorario = useCallback((horaInicio, horaFin) => {
    return adminService.horariosOficinas.validarFormatoHorario(horaInicio, horaFin);
  }, []);

  // Función para formatear horarios para calendario
  const formatearParaCalendario = useCallback(() => {
    return adminService.horariosOficinas.formatHorariosParaCalendar(horarios);
  }, [horarios]);

  // Effect para cargar datos iniciales
  useEffect(() => {
    if (oficinaId) {
      cargarHorarios();
      cargarPlantillas();
      cargarOficinasDisponibles();
    }
  }, [oficinaId, cargarHorarios, cargarPlantillas, cargarOficinasDisponibles]);

  // Effect para limpiar mensajes cuando cambie la oficina
  useEffect(() => {
    clearMessages();
  }, [oficinaId, clearMessages]);

  return {
    // Estados
    loading,
    error,
    success,
    oficina,
    horarios,
    plantillas,
    oficinasDisponibles,
    operationLoading,

    // Funciones principales
    cargarHorarios,
    guardarHorario,
    guardarHorariosBatch,
    eliminarHorario,
    toggleHorario,
    aplicarPlantilla,
    copiarHorarios,
    obtenerCalendario,
    verificarConflictos,
    limpiarTodosLosHorarios,
    validarHorarioEspecifico,
    obtenerProximosHorarios,
    obtenerEstadisticas,

    // Funciones utilitarias
    getDiaInfo,
    getHorariosActivos,
    getHorariosInactivos,
    getHorariosSinConfigurar,
    getTieneHorarioCompleto,
    getTieneCoberturaSemanal,
    getResumenHorarios,
    validarHorario,
    formatearParaCalendario,

    // Funciones para manejar mensajes
    clearMessages,
    handleError,
    handleSuccess,

    // Información derivada
    resumenHorarios: getResumenHorarios(),
    horariosActivos: getHorariosActivos(),
    horariosInactivos: getHorariosInactivos(),
    horariosSinConfigurar: getHorariosSinConfigurar(),
    tieneHorarioCompleto: getTieneHorarioCompleto(),
    tieneCoberturaSemanal: getTieneCoberturaSemanal(),

    // Estados de loading específicos
    isLoading: loading,
    isSaving: operationLoading.save,
    isDeleting: operationLoading.delete,
    isToggling: operationLoading.toggle,
    isCopying: operationLoading.copy,
    isApplyingTemplate: operationLoading.template,
    isLoadingCalendar: operationLoading.calendar,
    isCheckingConflicts: operationLoading.conflicts,
    isClearing: operationLoading.clear,

    // Validadores
    canSave: oficinaId && !operationLoading.save,
    canDelete: oficinaId && !operationLoading.delete,
    canToggle: oficinaId && !operationLoading.toggle,
    canCopy: oficinaId && !operationLoading.copy,
    canApplyTemplate: oficinaId && !operationLoading.template,
    canClear: oficinaId && !operationLoading.clear && horarios.some(h => h.tiene_horario),

    // Métodos de conveniencia
    refresh: () => cargarHorarios(),
    reset: () => {
      setHorarios([]);
      setOficina(null);
      clearMessages();
    }
  };
};