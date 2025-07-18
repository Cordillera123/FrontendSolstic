// src/components/Windows/UsuarioHorarioWindow.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/apiService";
import Icon from "../UI/Icon";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

const UsuarioHorarioWindow = ({ 
  usuarioId, 
  usuarioNombre, 
  onCancel, 
  showMessage 
}) => {
  console.log("📅 UsuarioHorarioWindow - Iniciando para usuario:", usuarioId);

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('permanentes');
  const [usuario, setUsuario] = useState(null);
  const [horariosData, setHorariosData] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDia, setEditingDia] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState(null);

  // Estados del formulario permanente
  const [formData, setFormData] = useState({
    dia_codigo: '',
    hora_entrada: '08:00',
    hora_salida: '17:00'
  });

  // Estados para horarios temporales
  const [showTemporalForm, setShowTemporalForm] = useState(false);
  const [temporalFormData, setTemporalFormData] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    tipo_temporal: 'VACACIONES',
    motivo: '',
    horarios: []
  });

  // Estados para estadísticas y resumen
  const [estadisticas, setEstadisticas] = useState(null);
  const [conflictos, setConflictos] = useState([]);
  const [horariosTemporales, setHorariosTemporales] = useState([]);
  const [comparacionOficina, setComparacionOficina] = useState(null);

  // Pestañas disponibles
  const tabs = [
    { id: 'permanentes', label: 'Horarios Permanentes', icon: 'Clock' },
    { id: 'temporales', label: 'Horarios Temporales', icon: 'Calendar' },
    { id: 'calendario', label: 'Calendario', icon: 'CalendarDays' },
    { id: 'estadisticas', label: 'Estadísticas', icon: 'BarChart3' },
    { id: 'conflictos', label: 'Conflictos', icon: 'AlertTriangle' }
  ];

  // Días de la semana
  const diasSemana = [
    { codigo: 1, nombre: 'Lunes', abrev: 'Lun' },
    { codigo: 2, nombre: 'Martes', abrev: 'Mar' },
    { codigo: 3, nombre: 'Miércoles', abrev: 'Mié' },
    { codigo: 4, nombre: 'Jueves', abrev: 'Jue' },
    { codigo: 5, nombre: 'Viernes', abrev: 'Vie' },
    { codigo: 6, nombre: 'Sábado', abrev: 'Sáb' },
    { codigo: 7, nombre: 'Domingo', abrev: 'Dom' }
  ];

  // Tipos de horarios temporales
  const tiposTemporales = [
    { value: 'VACACIONES', label: 'Vacaciones', color: '#10b981' },
    { value: 'PERMISO_MEDICO', label: 'Permiso Médico', color: '#ef4444' },
    { value: 'PROYECTO_ESPECIAL', label: 'Proyecto Especial', color: '#3b82f6' },
    { value: 'CAPACITACION', label: 'Capacitación', color: '#8b5cf6' },
    { value: 'OTRO', label: 'Otro', color: '#6b7280' }
  ];

  // ✅ FUNCIÓN HELPER PARA FORMATEAR HORARIOS PARA CALENDARIO
  const formatHorariosParaCalendario = (horariosData) => {
    if (!horariosData || !horariosData.horarios_por_dia) {
      return [];
    }

    return horariosData.horarios_por_dia
      .filter(dia => dia.puede_acceder && dia.horario_efectivo)
      .map(dia => ({
        id: `user-${horariosData.usuario?.usu_id || 'unknown'}-day-${dia.dia_codigo}`,
        title: `${dia.dia_abreviatura}: ${dia.horario_efectivo.hora_entrada} - ${dia.horario_efectivo.hora_salida}`,
        daysOfWeek: [dia.dia_codigo === 7 ? 0 : dia.dia_codigo], // Convertir domingo
        startTime: dia.horario_efectivo.hora_entrada,
        endTime: dia.horario_efectivo.hora_salida,
        extendedProps: {
          diaData: dia,
          origen: dia.origen_horario,
          usuarioId: horariosData.usuario?.usu_id
        },
        backgroundColor: getColorForEvent(dia.origen_horario),
        borderColor: getBorderColorForEvent(dia.origen_horario),
        textColor: '#ffffff'
      }));
  };

  // ✅ FUNCIÓN HELPER PARA OBTENER COLOR DEL EVENTO
  const getColorForEvent = (origen) => {
    switch (origen) {
      case 'TEMPORAL':
        return '#f97316'; // orange-500
      case 'PERSONALIZADO':
        return '#10b981'; // emerald-500
      case 'HEREDADO_OFICINA':
        return '#3b82f6'; // blue-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // ✅ FUNCIÓN HELPER PARA OBTENER COLOR DE BORDE
  const getBorderColorForEvent = (origen) => {
    switch (origen) {
      case 'TEMPORAL':
        return '#ea580c'; // orange-600
      case 'PERSONALIZADO':
        return '#059669'; // emerald-600
      case 'HEREDADO_OFICINA':
        return '#2563eb'; // blue-600
      default:
        return '#4b5563'; // gray-600
    }
  };

  // ✅ FUNCIÓN HELPER PARA CALCULAR ESTADÍSTICAS
  const calcularEstadisticas = (horariosData) => {
    if (!horariosData || !horariosData.horarios_por_dia) {
      return null;
    }

    const diasConHorario = horariosData.horarios_por_dia.filter(dia => dia.puede_acceder);
    const diasPersonalizados = horariosData.horarios_por_dia.filter(dia => dia.origen_horario === 'PERSONALIZADO');
    const diasTemporales = horariosData.horarios_por_dia.filter(dia => dia.origen_horario === 'TEMPORAL');
    const diasOficina = horariosData.horarios_por_dia.filter(dia => dia.origen_horario === 'HEREDADO_OFICINA');

    return {
      dias_con_horario: diasConHorario.length,
      total_dias: 7,
      porcentaje_cobertura: Math.round((diasConHorario.length / 7) * 100),
      horarios_personalizados: diasPersonalizados.length,
      horarios_temporales: diasTemporales.length,
      horarios_oficina: diasOficina.length,
      dias_sin_horario: 7 - diasConHorario.length,
      usuario_operativo: diasConHorario.length > 0,
      independencia_oficina: diasPersonalizados.length > 0 || diasTemporales.length > 0
    };
  };

  // ✅ FUNCIÓN HELPER PARA DETECTAR CONFLICTOS
  const detectarConflictos = (horariosData, horariosTemporales) => {
    const conflictos = [];

    if (!horariosData || !horariosData.horarios_por_dia) {
      return conflictos;
    }

    // Verificar días sin horario
    const diasSinHorario = horariosData.horarios_por_dia.filter(dia => !dia.puede_acceder);
    if (diasSinHorario.length > 0) {
      conflictos.push({
        tipo: 'DIAS_SIN_HORARIO',
        severidad: 'MEDIA',
        descripcion: `${diasSinHorario.length} días sin horario configurado`,
        afectados: diasSinHorario.map(dia => dia.dia_nombre),
        sugerencia: 'Configure horarios para estos días o use los horarios de oficina'
      });
    }

    // Verificar solapamientos de temporales
    if (horariosTemporales && horariosTemporales.periodos_temporales) {
      const periodosActivos = horariosTemporales.periodos_temporales.filter(p => p.esta_vigente);
      if (periodosActivos.length > 1) {
        conflictos.push({
          tipo: 'TEMPORALES_SOLAPADOS',
          severidad: 'ALTA',
          descripcion: 'Múltiples horarios temporales activos simultáneamente',
          afectados: periodosActivos.map(p => p.tipo_temporal),
          sugerencia: 'Revise las fechas de los horarios temporales'
        });
      }
    }

    return conflictos;
  };

  // ✅ FUNCIÓN PRINCIPAL PARA CARGAR DATOS
  const cargarDatosCompletos = useCallback(async () => {
    if (!usuarioId) return;

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Cargando datos completos para usuario:", usuarioId);
      
      // Cargar horarios principales
      const horariosResponse = await adminService.horariosUsuarios.getHorarios(usuarioId);
      
      if (horariosResponse.status === 'success') {
        setHorariosData(horariosResponse.data);
        setUsuario(horariosResponse.data.usuario);
        
        // Calcular estadísticas usando función local
        const stats = calcularEstadisticas(horariosResponse.data);
        setEstadisticas(stats);
        
        // Generar eventos para el calendario usando función local
        const eventos = formatHorariosParaCalendario(horariosResponse.data);
        setCalendarEvents(eventos);
        
        console.log("✅ Horarios cargados:", horariosResponse.data);
      } else {
        throw new Error(horariosResponse.message || 'Error al cargar horarios');
      }

      // Cargar horarios temporales
      await cargarHorariosTemporales();
      
      // Cargar conflictos
      await cargarConflictos();
      
      // Cargar comparación con oficina
      await cargarComparacionOficina();

    } catch (error) {
      console.error("❌ Error cargando datos completos:", error);
      setError(error.message || 'Error al cargar datos');
      showMessage("error", error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [usuarioId, showMessage]);

  // ✅ FUNCIÓN PARA CARGAR HORARIOS TEMPORALES
  const cargarHorariosTemporales = useCallback(async () => {
    if (!usuarioId) return;

    try {
      const response = await adminService.horariosUsuarios.getHorariosTemporales(usuarioId);
      
      if (response.status === 'success') {
        setHorariosTemporales(response.data.periodos_temporales || []);
        console.log("✅ Horarios temporales cargados:", response.data);
      }
    } catch (error) {
      console.error("❌ Error cargando horarios temporales:", error);
      setHorariosTemporales([]);
    }
  }, [usuarioId]);

  // ✅ FUNCIÓN PARA CARGAR CONFLICTOS
  const cargarConflictos = useCallback(async () => {
    if (!usuarioId) return;

    try {
      // Usar función local para detectar conflictos
      const conflictosDetectados = detectarConflictos(horariosData, { periodos_temporales: horariosTemporales });
      setConflictos(conflictosDetectados);
      console.log("✅ Conflictos detectados:", conflictosDetectados);
    } catch (error) {
      console.error("❌ Error detectando conflictos:", error);
      setConflictos([]);
    }
  }, [usuarioId, horariosData, horariosTemporales]);

  // ✅ FUNCIÓN PARA CARGAR COMPARACIÓN CON OFICINA
  const cargarComparacionOficina = useCallback(async () => {
    if (!usuarioId) return;

    try {
      // Simular comparación por ahora
      const simulatedComparison = {
        dias_coincidentes: 5,
        dias_diferentes: 2,
        porcentaje_independencia: 28
      };
      setComparacionOficina(simulatedComparison);
      console.log("✅ Comparación con oficina simulada:", simulatedComparison);
    } catch (error) {
      console.error("❌ Error cargando comparación con oficina:", error);
      setComparacionOficina(null);
    }
  }, [usuarioId]);

  // ✅ FUNCIÓN PARA VALIDAR DATOS DE HORARIO TEMPORAL
  const validarDatosHorarioTemporal = (horarioTemporalData) => {
    const errores = [];

    if (!horarioTemporalData.fecha_inicio) {
      errores.push('La fecha de inicio es requerida');
    }

    if (!horarioTemporalData.fecha_fin) {
      errores.push('La fecha de fin es requerida');
    }

    if (horarioTemporalData.fecha_inicio && horarioTemporalData.fecha_fin) {
      const fechaInicio = new Date(horarioTemporalData.fecha_inicio);
      const fechaFin = new Date(horarioTemporalData.fecha_fin);
      
      if (fechaFin < fechaInicio) {
        errores.push('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }

    if (!horarioTemporalData.motivo || horarioTemporalData.motivo.trim().length === 0) {
      errores.push('El motivo es requerido');
    }

    if (!horarioTemporalData.tipo_temporal) {
      errores.push('El tipo de horario temporal es requerido');
    }

    if (!horarioTemporalData.horarios || horarioTemporalData.horarios.length === 0) {
      errores.push('Debe configurar al menos un día');
    } else {
      horarioTemporalData.horarios.forEach((horario, index) => {
        const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!horaRegex.test(horario.hora_entrada)) {
          errores.push(`Día ${index + 1}: Formato de hora de entrada inválido`);
        }
        if (!horaRegex.test(horario.hora_salida)) {
          errores.push(`Día ${index + 1}: Formato de hora de salida inválido`);
        }
      });
    }

    return {
      valido: errores.length === 0,
      errores: errores
    };
  };

  // ✅ FUNCIÓN PARA GUARDAR HORARIO PERMANENTE
  const guardarHorario = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validar datos básicos
      if (!formData.dia_codigo || !formData.hora_entrada || !formData.hora_salida) {
        throw new Error('Todos los campos son requeridos');
      }

      // Formatear horas correctamente
      const formatearHora = (hora) => {
        if (!hora) return '';
        
        if (typeof hora === 'string' && /^\d{2}:\d{2}$/.test(hora)) {
          return hora;
        }
        
        if (typeof hora === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(hora)) {
          return hora.substring(0, 5);
        }
        
        if (typeof hora === 'string') {
          const partes = hora.split(':');
          if (partes.length >= 2) {
            const horas = partes[0].padStart(2, '0');
            const minutos = partes[1].padStart(2, '0');
            return `${horas}:${minutos}`;
          }
        }
        
        return String(hora);
      };

      const dataToSend = {
        dia_codigo: parseInt(formData.dia_codigo),
        hora_entrada: formatearHora(formData.hora_entrada),
        hora_salida: formatearHora(formData.hora_salida),
        forzar_creacion: true,
        observaciones: formData.observaciones || null
      };

      console.log('🔍 Datos para enviar:', dataToSend);

      // Validar formato antes de enviar
      const horaRegex = /^\d{2}:\d{2}$/;
      if (!horaRegex.test(dataToSend.hora_entrada)) {
        throw new Error(`Formato de hora de entrada incorrecto: ${dataToSend.hora_entrada}`);
      }
      if (!horaRegex.test(dataToSend.hora_salida)) {
        throw new Error(`Formato de hora de salida incorrecto: ${dataToSend.hora_salida}`);
      }

      const response = await adminService.horariosUsuarios.crearHorario(usuarioId, dataToSend);

      if (response.status === 'success') {
        showMessage("success", 'Horario guardado correctamente');
        setShowForm(false);
        setEditingDia(null);
        resetFormData();
        await cargarDatosCompletos();
      } else {
        throw new Error(response.message || 'Error al guardar horario');
      }
    } catch (error) {
      console.error('❌ Error guardando horario:', error);
      
      if (error.status === 'error' && error.errors) {
        console.error('📋 Errores de validación específicos:', error.errors);
        
        const errorsArray = Object.entries(error.errors).map(([field, messages]) => {
          const messageText = Array.isArray(messages) ? messages.join(', ') : messages;
          return `${field}: ${messageText}`;
        });
        
        const detailedMessage = `Errores de validación:\n${errorsArray.join('\n')}`;
        setError(detailedMessage);
        showMessage("error", detailedMessage);
      } else {
        setError(error.message || 'Error al guardar horario');
        showMessage("error", error.message || 'Error al guardar horario');
      }
    } finally {
      setSaving(false);
    }
  };

  // ✅ FUNCIÓN PARA GUARDAR HORARIO TEMPORAL
  const guardarHorarioTemporal = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validar datos usando función local
      const validacion = validarDatosHorarioTemporal(temporalFormData);
      if (!validacion.valido) {
        throw new Error(validacion.errores.join('\n'));
      }

      const response = await adminService.horariosUsuarios.crearHorarioTemporal(usuarioId, temporalFormData);

      if (response.status === 'success') {
        showMessage("success", 'Horario temporal creado correctamente');
        setShowTemporalForm(false);
        resetTemporalFormData();
        await cargarDatosCompletos();
      } else {
        throw new Error(response.message || 'Error al crear horario temporal');
      }
    } catch (error) {
      console.error('❌ Error creando horario temporal:', error);
      setError(error.message || 'Error al crear horario temporal');
      showMessage("error", error.message || 'Error al crear horario temporal');
    } finally {
      setSaving(false);
    }
  };

  // ✅ FUNCIÓN PARA ELIMINAR HORARIO PERMANENTE
  const eliminarHorario = async (diaId) => {
    if (!confirm('¿Está seguro que desea eliminar este horario?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.horariosUsuarios.eliminarHorario(usuarioId, diaId);

      if (response.status === 'success') {
        showMessage("success", 'Horario eliminado correctamente');
        await cargarDatosCompletos();
      } else {
        throw new Error(response.message || 'Error al eliminar horario');
      }
    } catch (error) {
      console.error('❌ Error eliminando horario:', error);
      setError(error.message || 'Error al eliminar horario');
      showMessage("error", error.message || 'Error al eliminar horario');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA ELIMINAR HORARIO TEMPORAL
  const eliminarHorarioTemporal = async (temporalId, eliminarTodoPeriodo = false) => {
    const mensaje = eliminarTodoPeriodo 
      ? '¿Está seguro que desea eliminar todo el período temporal?' 
      : '¿Está seguro que desea eliminar este horario temporal?';
    
    if (!confirm(mensaje)) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.horariosUsuarios.eliminarHorarioTemporal(usuarioId, temporalId, eliminarTodoPeriodo);

      if (response.status === 'success') {
        showMessage("success", 'Horario temporal eliminado correctamente');
        await cargarDatosCompletos();
      } else {
        throw new Error(response.message || 'Error al eliminar horario temporal');
      }
    } catch (error) {
      console.error('❌ Error eliminando horario temporal:', error);
      setError(error.message || 'Error al eliminar horario temporal');
      showMessage("error", error.message || 'Error al eliminar horario temporal');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA CLONAR DESDE OFICINA
  const clonarDesdeOficina = async () => {
    if (!confirm('¿Está seguro que desea clonar los horarios de la oficina? Esto sobrescribirá los horarios existentes.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.horariosUsuarios.clonarDesdeOficina(usuarioId, {
        sobrescribir_existentes: true,
        solo_dias_activos: true
      });

      if (response.status === 'success') {
        showMessage("success", 'Horarios clonados desde oficina correctamente');
        await cargarDatosCompletos();
      } else {
        throw new Error(response.message || 'Error al clonar horarios');
      }
    } catch (error) {
      console.error('❌ Error clonando horarios:', error);
      setError(error.message || 'Error al clonar horarios');
      showMessage("error", error.message || 'Error al clonar horarios');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA EXPORTAR HORARIOS (SIMULADA)
  const exportarHorarios = async (formato = 'excel') => {
    try {
      setLoading(true);
      
      // Simular exportación por ahora
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showMessage("success", `Horarios exportados en formato ${formato} (simulado)`);
    } catch (error) {
      console.error('❌ Error exportando horarios:', error);
      showMessage("error", error.message || 'Error al exportar horarios');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA ABRIR FORMULARIO
  const abrirFormulario = (diaData = null) => {
    if (diaData) {
      setFormData({
        dia_codigo: diaData.dia_codigo,
        hora_entrada: diaData.horario_efectivo?.hora_entrada || '08:00',
        hora_salida: diaData.horario_efectivo?.hora_salida || '17:00'
      });
      setEditingDia(diaData);
    } else {
      resetFormData();
      setEditingDia(null);
    }
    setShowForm(true);
  };

  // ✅ FUNCIÓN PARA ABRIR FORMULARIO TEMPORAL
  const abrirFormularioTemporal = () => {
    resetTemporalFormData();
    setShowTemporalForm(true);
  };

  // ✅ FUNCIÓN PARA RESETEAR FORMULARIO
  const resetFormData = () => {
    setFormData({
      dia_codigo: '',
      hora_entrada: '08:00',
      hora_salida: '17:00'
    });
  };

  // ✅ FUNCIÓN PARA RESETEAR FORMULARIO TEMPORAL
  const resetTemporalFormData = () => {
    setTemporalFormData({
      fecha_inicio: '',
      fecha_fin: '',
      tipo_temporal: 'VACACIONES',
      motivo: '',
      horarios: []
    });
  };

  // ✅ FUNCIÓN PARA AGREGAR DÍA AL HORARIO TEMPORAL
  const agregarDiaATemporal = () => {
    const nuevoDia = {
      dia_codigo: 1,
      hora_entrada: '08:00',
      hora_salida: '17:00'
    };
    
    setTemporalFormData(prev => ({
      ...prev,
      horarios: [...prev.horarios, nuevoDia]
    }));
  };

  // ✅ FUNCIÓN PARA REMOVER DÍA DEL HORARIO TEMPORAL
  const removerDiaDeTemporal = (index) => {
    setTemporalFormData(prev => ({
      ...prev,
      horarios: prev.horarios.filter((_, i) => i !== index)
    }));
  };

  // ✅ FUNCIÓN PARA ACTUALIZAR DÍA EN HORARIO TEMPORAL
  const actualizarDiaEnTemporal = (index, campo, valor) => {
    setTemporalFormData(prev => ({
      ...prev,
      horarios: prev.horarios.map((horario, i) => 
        i === index ? { ...horario, [campo]: valor } : horario
      )
    }));
  };

  // ✅ FUNCIÓN PARA OBTENER COLOR DEL DÍA
  const getColorDia = (dia) => {
    if (!dia.puede_acceder) return 'bg-gray-100 text-gray-500 border-gray-200';
    
    switch (dia.origen_horario) {
      case 'TEMPORAL':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'PERSONALIZADO':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'HEREDADO_OFICINA':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  // ✅ FUNCIÓN PARA OBTENER ÍCONO DEL DÍA
  const getIconoDia = (dia) => {
    if (!dia.puede_acceder) return <Icon name="X" size={16} />;
    
    switch (dia.origen_horario) {
      case 'TEMPORAL':
        return <Icon name="Clock" size={16} />;
      case 'PERSONALIZADO':
        return <Icon name="User" size={16} />;
      case 'HEREDADO_OFICINA':
        return <Icon name="Building2" size={16} />;
      default:
        return <Icon name="X" size={16} />;
    }
  };

  // ✅ FUNCIÓN PARA MANEJAR EVENTOS DEL CALENDARIO
  const handleCalendarEventClick = (clickInfo) => {
    const { extendedProps } = clickInfo.event;
    
    if (extendedProps.diaData) {
      abrirFormulario(extendedProps.diaData);
    }
  };

  // ✅ FUNCIÓN PARA MANEJAR SELECCIÓN DE RANGO EN CALENDARIO
  const handleCalendarDateSelect = (selectInfo) => {
    setSelectedDateRange({
      start: selectInfo.start,
      end: selectInfo.end
    });
    abrirFormularioTemporal();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (usuarioId) {
      cargarDatosCompletos();
    }
  }, [usuarioId, cargarDatosCompletos]);

  const handleCancel = useCallback(() => {
    console.log("❌ Cancelando vista de horarios - volviendo a lista");
    onCancel();
  }, [onCancel]);

  // Renderizado sin usuario
  if (!usuarioId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Icon name="User" size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No hay usuario seleccionado
          </h2>
          <p className="text-gray-500 mb-6">
            Seleccione un usuario de la lista para gestionar sus horarios
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
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-100 to-blue-200 border-b border-blue-300 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon name="User" size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-800">
                Gestión de Horarios
              </h2>
              <p className="text-blue-600 flex items-center gap-2">
                <span className="bg-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  ID: {usuarioId}
                </span>
                <span className="text-blue-700 font-medium">
                  {usuarioNombre || usuario?.nombre_completo || 'Cargando...'}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botón de exportar */}
            <button
              onClick={() => exportarHorarios('excel')}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              disabled={loading}
            >
              <Icon name="Download" size={14} />
              Exportar
            </button>
            
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Icon name="ArrowLeft" size={16} />
              Volver
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
              {tab.id === 'conflictos' && conflictos.length > 0 && (
                <span className="ml-1 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {conflictos.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Botones de acción */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex flex-wrap gap-2">
          {activeTab === 'permanentes' && (
            <>
              <button
                onClick={() => abrirFormulario()}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                disabled={loading}
              >
                <Icon name="Plus" size={14} />
                Nuevo Horario
              </button>
              <button
                onClick={clonarDesdeOficina}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                disabled={loading}
              >
                <Icon name="Copy" size={14} />
                Clonar desde Oficina
              </button>
            </>
          )}
          {activeTab === 'temporales' && (
            <button
              onClick={abrirFormularioTemporal}
              className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              disabled={loading}
            >
              <Icon name="Plus" size={14} />
              Nuevo Horario Temporal
            </button>
          )}
          {activeTab === 'conflictos' && conflictos.length > 0 && (
            <button
              onClick={cargarConflictos}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              disabled={loading}
            >
              <Icon name="RefreshCw" size={14} />
              Recargar Conflictos
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-600">Cargando horarios...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar horarios</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={cargarDatosCompletos}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* ===== PESTAÑA HORARIOS PERMANENTES ===== */}
            {activeTab === 'permanentes' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Horarios Permanentes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {horariosData?.horarios_por_dia?.map((dia) => (
                      <div
                        key={dia.dia_codigo}
                        className={`border-2 rounded-lg p-4 transition-all ${getColorDia(dia)} hover:shadow-md`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getIconoDia(dia)}
                            <h4 className="font-medium">{dia.dia_nombre}</h4>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                            {dia.dia_abreviatura}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {dia.puede_acceder && dia.horario_efectivo ? (
                            <>
                              <div className="flex items-center gap-2 text-sm">
                                <Icon name="Clock" size={14} />
                                <span className="font-mono">
                                  {dia.horario_efectivo.hora_entrada} - {dia.horario_efectivo.hora_salida}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`px-2 py-1 rounded-full ${
                                  dia.origen_horario === 'PERSONALIZADO' ? 'bg-green-200 text-green-800' :
                                  dia.origen_horario === 'TEMPORAL' ? 'bg-orange-200 text-orange-800' :
                                  'bg-blue-200 text-blue-800'
                                }`}>
                                  {dia.origen_horario === 'PERSONALIZADO' ? 'Personalizado' :
                                   dia.origen_horario === 'TEMPORAL' ? 'Temporal' : 'Oficina'}
                                </span>
                              </div>
                              {dia.horario_temporal && (
                                <div className="text-xs text-gray-600 bg-orange-50 p-2 rounded">
                                  <div className="font-medium">Temporal activo:</div>
                                  <div>Tipo: {dia.horario_temporal.tipo}</div>
                                  <div>Hasta: {dia.horario_temporal.fecha_fin}</div>
                                  <div>Días restantes: {dia.horario_temporal.dias_restantes}</div>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">Sin horario configurado</p>
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
                          {dia.origen_horario === 'PERSONALIZADO' && (
                            <button
                              onClick={() => eliminarHorario(dia.dia_codigo)}
                              className="flex-1 px-3 py-1 bg-white bg-opacity-50 rounded text-xs hover:bg-opacity-75 transition-colors"
                              title="Eliminar horario personalizado"
                            >
                              <Icon name="Trash2" size={12} className="mx-auto" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comparación con oficina */}
                {comparacionOficina && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Comparación con Oficina</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-800">Días coincidentes:</span>
                        <span className="ml-2 text-blue-600">{comparacionOficina.dias_coincidentes || 0}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Días diferentes:</span>
                        <span className="ml-2 text-blue-600">{comparacionOficina.dias_diferentes || 0}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Independencia:</span>
                        <span className="ml-2 text-blue-600">{comparacionOficina.porcentaje_independencia || 0}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== PESTAÑA HORARIOS TEMPORALES ===== */}
            {activeTab === 'temporales' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Horarios Temporales</h3>
                
                {horariosTemporales.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon name="Calendar" size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-4">No hay horarios temporales configurados</p>
                    <button
                      onClick={abrirFormularioTemporal}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Crear Primer Horario Temporal
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {horariosTemporales.map((periodo, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              periodo.esta_vigente ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <div>
                              <h4 className="font-medium text-gray-900">{periodo.tipo_temporal}</h4>
                              <p className="text-sm text-gray-500">{periodo.motivo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              periodo.esta_vigente ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {periodo.esta_vigente ? 'Activo' : 'Inactivo'}
                            </span>
                            <button
                              onClick={() => eliminarHorarioTemporal(periodo.horarios_por_dia[0]?.temp_id, true)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                              title="Eliminar período completo"
                            >
                              <Icon name="Trash2" size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Período:</span>
                            <span className="ml-2 text-gray-600">
                              {periodo.fecha_inicio} - {periodo.fecha_fin}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Duración:</span>
                            <span className="ml-2 text-gray-600">{periodo.duracion_dias} días</span>
                          </div>
                        </div>

                        {periodo.esta_vigente && periodo.dias_restantes >= 0 && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium text-gray-700">Días restantes:</span>
                            <span className="ml-2 text-gray-600">{periodo.dias_restantes}</span>
                          </div>
                        )}

                        <div className="mt-3">
                          <h5 className="font-medium text-gray-700 mb-2">Horarios por día:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {periodo.horarios_por_dia?.map((horario, idx) => (
                              <div key={idx} className="bg-gray-50 rounded p-2 text-xs">
                                <div className="font-medium text-gray-700">{horario.dia_nombre}</div>
                                <div className="text-gray-600">{horario.formato_visual}</div>
                                <div className="text-gray-500">{horario.jornada}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== PESTAÑA CALENDARIO ===== */}
            {activeTab === 'calendario' && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Calendario de Horarios</h3>
                
                <div className="h-96">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={esLocale}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={calendarEvents}
                    eventClick={handleCalendarEventClick}
                    selectable={true}
                    selectMirror={true}
                    select={handleCalendarDateSelect}
                    eventDisplay="block"
                    dayMaxEvents={3}
                    moreLinkClick="popover"
                    height="100%"
                    eventClassNames="cursor-pointer"
                  />
                </div>

                {/* Leyenda */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Horario Personalizado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span>Horario Temporal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Horario de Oficina</span>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PESTAÑA ESTADÍSTICAS ===== */}
            {activeTab === 'estadisticas' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas y Resumen</h3>
                
                {estadisticas ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Días Operativos</p>
                          <p className="text-2xl font-bold text-blue-600">{estadisticas.dias_con_horario}</p>
                        </div>
                        <Icon name="Calendar" size={32} className="text-blue-400" />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Cobertura</p>
                          <p className="text-2xl font-bold text-green-600">{estadisticas.porcentaje_cobertura}%</p>
                        </div>
                        <Icon name="TrendingUp" size={32} className="text-green-400" />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Personalizados</p>
                          <p className="text-2xl font-bold text-purple-600">{estadisticas.horarios_personalizados}</p>
                        </div>
                        <Icon name="User" size={32} className="text-purple-400" />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Temporales</p>
                          <p className="text-2xl font-bold text-orange-600">{estadisticas.horarios_temporales}</p>
                        </div>
                        <Icon name="Clock" size={32} className="text-orange-400" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon name="BarChart3" size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No hay estadísticas disponibles</p>
                  </div>
                )}

                {horariosData?.resumen_temporales && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2">Resumen de Horarios Temporales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-orange-800">Total activos:</span>
                        <span className="ml-2 text-orange-600">{horariosData.resumen_temporales.total_activos}</span>
                      </div>
                      <div>
                        <span className="font-medium text-orange-800">Tipos presentes:</span>
                        <span className="ml-2 text-orange-600">
                          {horariosData.resumen_temporales.tipos_presentes?.join(', ') || 'Ninguno'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-orange-800">Fecha consulta:</span>
                        <span className="ml-2 text-orange-600">{horariosData.resumen_temporales.fecha_consulta}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== PESTAÑA CONFLICTOS ===== */}
            {activeTab === 'conflictos' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Conflictos de Horarios</h3>
                
                {conflictos.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon name="CheckCircle" size={48} className="mx-auto mb-4 text-green-300" />
                    <p className="text-gray-500">No hay conflictos de horarios detectados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conflictos.map((conflicto, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Icon name="AlertTriangle" size={20} className="text-red-500 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-medium text-red-900">{conflicto.tipo}</h4>
                            <p className="text-sm text-red-700 mt-1">{conflicto.descripcion}</p>
                            {conflicto.sugerencia && (
                              <p className="text-sm text-red-600 mt-2 italic">
                                Sugerencia: {conflicto.sugerencia}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-red-500 font-medium">
                            {conflicto.severidad}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== MODAL FORMULARIO HORARIO PERMANENTE ===== */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">
                {editingDia ? 'Editar Horario' : 'Nuevo Horario'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Día de la semana
                  </label>
                  <select
                    value={formData.dia_codigo}
                    onChange={(e) => setFormData({ ...formData, dia_codigo: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={editingDia}
                  >
                    <option value="">Seleccionar día</option>
                    {diasSemana.map(dia => (
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
                      value={formData.hora_entrada}
                      onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora fin
                    </label>
                    <input
                      type="time"
                      value={formData.hora_salida}
                      onChange={(e) => setFormData({ ...formData, hora_salida: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={formData.observaciones || ''}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Observaciones adicionales..."
                  />
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
                    {saving ? 'Guardando...' : 'Guardar'}
              </button>
                            </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL FORMULARIO HORARIO TEMPORAL ===== */}
      {showTemporalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Nuevo Horario Temporal</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={temporalFormData.fecha_inicio}
                      onChange={(e) => setTemporalFormData({ ...temporalFormData, fecha_inicio: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      value={temporalFormData.fecha_fin}
                      onChange={(e) => setTemporalFormData({ ...temporalFormData, fecha_fin: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de horario temporal
                  </label>
                  <select
                    value={temporalFormData.tipo_temporal}
                    onChange={(e) => setTemporalFormData({ ...temporalFormData, tipo_temporal: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {tiposTemporales.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo
                  </label>
                  <textarea
                    value={temporalFormData.motivo}
                    onChange={(e) => setTemporalFormData({ ...temporalFormData, motivo: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe el motivo del horario temporal..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Horarios por día
                    </label>
                    <button
                      type="button"
                      onClick={agregarDiaATemporal}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      <Icon name="Plus" size={14} className="inline mr-1" />
                      Agregar Día
                    </button>
                  </div>

                  {temporalFormData.horarios.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No hay días configurados. Haz clic en "Agregar Día" para empezar.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {temporalFormData.horarios.map((horario, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <select
                            value={horario.dia_codigo}
                            onChange={(e) => actualizarDiaEnTemporal(index, 'dia_codigo', parseInt(e.target.value))}
                            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {diasSemana.map(dia => (
                              <option key={dia.codigo} value={dia.codigo}>
                                {dia.nombre}
                              </option>
                            ))}
                          </select>
                          <input
                            type="time"
                            value={horario.hora_entrada}
                            onChange={(e) => actualizarDiaEnTemporal(index, 'hora_entrada', e.target.value)}
                            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="time"
                            value={horario.hora_salida}
                            onChange={(e) => actualizarDiaEnTemporal(index, 'hora_salida', e.target.value)}
                            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removerDiaDeTemporal(index)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowTemporalForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarHorarioTemporal}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Horario Temporal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuarioHorarioWindow;
