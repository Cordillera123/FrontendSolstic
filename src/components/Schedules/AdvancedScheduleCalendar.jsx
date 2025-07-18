// src/components/Schedules/AdvancedScheduleCalendar.jsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { useUserSchedules } from '../../hooks/useUserSchedules';
import { adminService } from '../../services/apiService';
import Icon from '../UI/Icon';

const AdvancedScheduleCalendar = ({ 
  usuarioId, 
  usuarioNombre,
  onEventClick,
  onDateSelect,
  showMessage,
  height = 'auto',
  initialView = 'dayGridMonth',
  editable = true,
  selectable = true 
}) => {
  const {
    loading,
    horarios,
    horariosTemporales,
    calendarEvents,
    obtenerHorariosRango,
    helpers
  } = useUserSchedules(usuarioId);

  // Estados locales
  const [currentView, setCurrentView] = useState(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventsInRange, setEventsInRange] = useState([]);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    permanentes: true,
    temporales: true,
    oficina: true
  });

  // Configuración del calendario
  const calendarOptions = useMemo(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: currentView,
    locale: esLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    height: height,
    editable: editable,
    selectable: selectable,
    selectMirror: true,
    dayMaxEvents: 3,
    moreLinkClick: 'popover',
    eventDisplay: 'block',
    nowIndicator: true,
    weekNumbers: true,
    weekText: 'Sem',
    allDaySlot: false,
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    slotDuration: '00:30:00',
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '17:00'
    },
    // Eventos personalizados
    eventClassNames: (arg) => {
      const classes = ['cursor-pointer', 'shadow-sm', 'border-0'];
      
      if (arg.event.extendedProps.origen === 'TEMPORAL') {
        classes.push('animate-pulse');
      }
      
      return classes;
    },
    eventContent: (arg) => {
      const { event } = arg;
      const props = event.extendedProps;
      
      return {
        html: `
          <div class="fc-event-content-wrapper">
            <div class="fc-event-title-container">
              <div class="fc-event-title fc-sticky">
                <strong>${event.title}</strong>
                ${props.origen === 'TEMPORAL' ? 
                  `<span class="ml-1 text-xs opacity-75">(${props.tipo})</span>` : 
                  ''
                }
              </div>
            </div>
          </div>
        `
      };
    },
    // Tooltips personalizados
    eventMouseEnter: (info) => {
      const { event } = info;
      const props = event.extendedProps;
      
      let tooltipContent = `
        <div class="p-2 bg-gray-900 text-white rounded shadow-lg text-sm max-w-xs">
          <div class="font-medium mb-1">${event.title}</div>
          <div class="text-gray-300">
            Origen: ${props.origen === 'TEMPORAL' ? 'Temporal' : 
                     props.origen === 'PERSONALIZADO' ? 'Personalizado' : 'Oficina'}
          </div>
      `;
      
      if (props.origen === 'TEMPORAL') {
        tooltipContent += `
          <div class="text-gray-300">Tipo: ${props.tipo}</div>
          <div class="text-gray-300">Motivo: ${props.motivo}</div>
        `;
      }
      
      tooltipContent += `</div>`;
      
      // Crear tooltip
      const tooltip = document.createElement('div');
      tooltip.innerHTML = tooltipContent;
      tooltip.className = 'fixed z-50 pointer-events-none';
      tooltip.style.left = `${info.jsEvent.pageX + 10}px`;
      tooltip.style.top = `${info.jsEvent.pageY - 10}px`;
      tooltip.id = 'schedule-tooltip';
      
      document.body.appendChild(tooltip);
    },
    eventMouseLeave: () => {
      const tooltip = document.getElementById('schedule-tooltip');
      if (tooltip) {
        document.body.removeChild(tooltip);
      }
    }
  }), [currentView, height, editable, selectable]);

  // Filtrar eventos según filtros seleccionados
  const filteredEvents = useMemo(() => {
    if (!calendarEvents) return [];
    
    return calendarEvents.filter(event => {
      const origen = event.extendedProps?.origen;
      
      if (origen === 'TEMPORAL' && !selectedFilters.temporales) return false;
      if (origen === 'PERSONALIZADO' && !selectedFilters.permanentes) return false;
      if (origen === 'HEREDADO_OFICINA' && !selectedFilters.oficina) return false;
      
      return true;
    });
  }, [calendarEvents, selectedFilters]);

  // Manejar cambio de vista
  const handleViewChange = useCallback((view) => {
    setCurrentView(view.type);
    setCurrentDate(view.activeStart);
  }, []);

  // Manejar click en evento
  const handleEventClick = useCallback((clickInfo) => {
    const { event } = clickInfo;
    
    if (onEventClick) {
      onEventClick({
        event: event,
        diaData: event.extendedProps.diaData,
        origen: event.extendedProps.origen,
        jsEvent: clickInfo.jsEvent
      });
    }
  }, [onEventClick]);

  // Manejar selección de fechas
  const handleDateSelect = useCallback(async (selectInfo) => {
    const { start, end } = selectInfo;
    
    try {
      // Obtener horarios en el rango seleccionado
      const resultado = await obtenerHorariosRango(
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      );
      
      if (onDateSelect) {
        onDateSelect({
          start: start,
          end: end,
          horariosEnRango: resultado.success ? resultado.data : [],
          jsEvent: selectInfo.jsEvent
        });
      }
    } catch (error) {
      console.error('Error obteniendo horarios en rango:', error);
      showMessage?.('error', 'Error al obtener horarios en el rango seleccionado');
    }
  }, [obtenerHorariosRango, onDateSelect, showMessage]);

  // Manejar cambio de filtros
  const handleFilterChange = useCallback((filterType) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  }, []);

  // Estadísticas del calendario
  const stats = useMemo(() => {
    if (!filteredEvents.length) return null;
    
    const totalEventos = filteredEvents.length;
    const eventosPorOrigen = filteredEvents.reduce((acc, event) => {
      const origen = event.extendedProps?.origen || 'DESCONOCIDO';
      acc[origen] = (acc[origen] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: totalEventos,
      porOrigen: eventosPorOrigen,
      porcentajes: Object.entries(eventosPorOrigen).map(([origen, count]) => ({
        origen,
        count,
        porcentaje: Math.round((count / totalEventos) * 100)
      }))
    };
  }, [filteredEvents]);

  // Cargar eventos adicionales cuando cambie la vista
  useEffect(() => {
    if (currentView === 'timeGridWeek' || currentView === 'timeGridDay') {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 14);
      
      obtenerHorariosRango(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ).then(resultado => {
        if (resultado.success && resultado.eventos) {
          setEventsInRange(resultado.eventos);
        }
      }).catch(error => {
        console.error('Error cargando eventos adicionales:', error);
      });
    }
  }, [currentView, currentDate, obtenerHorariosRango]);

  // Combinar eventos
  const allEvents = useMemo(() => {
    const baseEvents = filteredEvents || [];
    const rangeEvents = eventsInRange || [];
    
    // Evitar duplicados
    const eventIds = new Set(baseEvents.map(e => e.id));
    const uniqueRangeEvents = rangeEvents.filter(e => !eventIds.has(e.id));
    
    return [...baseEvents, ...uniqueRangeEvents];
  }, [filteredEvents, eventsInRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <span className="text-gray-600">Cargando calendario...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header del calendario */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium text-gray-900">
              Calendario de Horarios
            </h3>
            {usuarioNombre && (
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {usuarioNombre}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filtros */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filtros:</span>
              <button
                onClick={() => handleFilterChange('permanentes')}
                className={`px-2 py-1 rounded text-xs ${
                  selectedFilters.permanentes 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Permanentes
              </button>
              <button
                onClick={() => handleFilterChange('temporales')}
                className={`px-2 py-1 rounded text-xs ${
                  selectedFilters.temporales 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Temporales
              </button>
              <button
                onClick={() => handleFilterChange('oficina')}
                className={`px-2 py-1 rounded text-xs ${
                  selectedFilters.oficina 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Oficina
                </button>
            </div>
            {/* Botón de leyenda */}
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Icon name="info" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
        {/* Leyenda de colores */}
        {showLegend && (
            <div className="absolute top-0 right-0 bg-white p-4 border border-gray
            -200 rounded-md shadow-md z-10">
                <h2 className="text-lg font-bold mb-2">Leyenda de colores
                </h2>
                <ul className="space-y-2">
                    <li className="flex items-center">
                        <span className="w-4 h-4 bg-green-100 rounded mr-2"></span>
                        <span className="text-sm text-gray-600">Permanentes</span>
                    </li>
                    <li className="flex items-center">
                        <span className="w-4 h-4 bg-orange-100 rounded mr-2"></span>
                        <span className="text-sm text-gray-600">Temporales</span>
                    </li>
                    <li className="flex items-center">
                        <span className="w-4 h-4 bg-blue-100 rounded mr-2"></span>
                        <span className="text-sm text-gray-600">Oficina</span>
                    </li>
                </ul>
            </div>
        )}
        {/* Calendario */}
        <FullCalendar
            {...calendarOptions}
            events={allEvents}
            dateClick={handleDateSelect}
            eventClick={handleEventClick}
            viewDidMount={handleViewChange}
            eventDidMount={(info) => {
                const { event } = info;
                // Aquí puedes agregar lógica para manejar la visualización de eventos
            }}