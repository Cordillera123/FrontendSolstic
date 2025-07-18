// src/components/Schedules/ScheduleManagementSummary.jsx
import React, { useState, useEffect } from 'react';
import { useUserSchedules } from '../../hooks/useUserSchedules';
import { adminService } from '../../services/apiService';
import Icon from '../UI/Icon';

const ScheduleManagementSummary = ({ usuarioId, showMessage }) => {
  const {
    loading,
    horarios,
    estadisticas,
    horariosTemporales,
    conflictos,
    alertas,
    calculos,
    helpers,
    exportarHorarios,
    marcarAlertaLeida
  } = useUserSchedules(usuarioId);

  const [showFullStats, setShowFullStats] = useState(false);
  const [showConflictos, setShowConflictos] = useState(false);
  const [showSugerencias, setShowSugerencias] = useState(false);

  // Función para exportar con confirmación
  const handleExport = async (formato) => {
    try {
      await exportarHorarios(formato);
      showMessage?.('success', `Horarios exportados en formato ${formato.toUpperCase()}`);
    } catch (error) {
      showMessage?.('error', `Error al exportar: ${error.message}`);
    }
  };

  // Función para manejar alertas
  const handleAlertaClick = async (alerta) => {
    try {
      await marcarAlertaLeida(alerta.id);
      showMessage?.('success', 'Alerta marcada como leída');
    } catch (error) {
      showMessage?.('error', `Error al marcar alerta: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Cargando resumen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Días Operativos</p>
              <p className="text-2xl font-bold text-blue-600">
                {estadisticas?.dias_con_horario || 0}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Icon name="Calendar" size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            de {estadisticas?.total_dias || 7} días configurados
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cobertura</p>
              <p className="text-2xl font-bold text-green-600">
                {estadisticas?.porcentaje_cobertura || 0}%
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Icon name="TrendingUp" size={20} className="text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            de horarios configurados
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Personalizados</p>
              <p className="text-2xl font-bold text-purple-600">
                {estadisticas?.horarios_personalizados || 0}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Icon name="User" size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            horarios únicos del usuario
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Temporales</p>
              <p className="text-2xl font-bold text-orange-600">
                {horariosTemporales?.length || 0}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <Icon name="Clock" size={20} className="text-orange-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {helpers.tieneHorariosTemporalesActivos ? 'períodos activos' : 'períodos configurados'}
          </div>
        </div>
      </div>

      {/* Alertas y conflictos */}
      {(alertas.length > 0 || conflictos.length > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Alertas y Conflictos
            </h3>
            {conflictos.length > 0 && (
              <button
                onClick={() => setShowConflictos(!showConflictos)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showConflictos ? 'Ocultar' : 'Ver'} Conflictos
              </button>
            )}
          </div>

          {/* Alertas */}
          {alertas.length > 0 && (
            <div className="space-y-2 mb-4">
              {alertas.slice(0, 3).map((alerta, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    alerta.leida ? 'bg-gray-50 border-gray-400' : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {alerta.titulo || 'Alerta de horario'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {alerta.descripcion || alerta.mensaje}
                      </p>
                    </div>
                    {!alerta.leida && (
                      <button
                        onClick={() => handleAlertaClick(alerta)}
                        className="ml-3 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Marcar leída
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {alertas.length > 3 && (
                <p className="text-sm text-gray-500">
                  Y {alertas.length - 3} alertas más...
                </p>
              )}
            </div>
          )}

          {/* Conflictos */}
          {showConflictos && conflictos.length > 0 && (
            <div className="space-y-2">
              {conflictos.map((conflicto, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-red-50 border-l-4 border-red-400"
                >
                  <div className="flex items-start gap-3">
                    <Icon name="AlertTriangle" size={16} className="text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">
                        {conflicto.tipo || 'Conflicto de horario'}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        {conflicto.descripcion}
                      </p>
                      {conflicto.sugerencia && (
                        <p className="text-sm text-red-600 mt-2 italic">
                          Sugerencia: {conflicto.sugerencia}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Análisis y sugerencias */}
      {calculos.sugerencias.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Análisis y Sugerencias
            </h3>
            <button
              onClick={() => setShowSugerencias(!showSugerencias)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showSugerencias ? 'Ocultar' : 'Ver'} Sugerencias
            </button>
          </div>

          {showSugerencias && (
            <div className="space-y-3">
              {calculos.sugerencias.map((sugerencia, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    sugerencia.prioridad === 'alta' ? 'bg-red-50 border-red-400' :
                    sugerencia.prioridad === 'media' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon 
                      name={sugerencia.prioridad === 'alta' ? 'AlertTriangle' : 'Info'} 
                      size={16} 
                      className={`mt-0.5 ${
                        sugerencia.prioridad === 'alta' ? 'text-red-500' :
                        sugerencia.prioridad === 'media' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {sugerencia.titulo}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {sugerencia.descripcion}
                      </p>
                      <p className="text-sm text-gray-700 mt-2 font-medium">
                        {sugerencia.accion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Estadísticas detalladas */}
      {calculos.tiempoTrabajado && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Análisis de Tiempo
            </h3>
            <button
              onClick={() => setShowFullStats(!showFullStats)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showFullStats ? 'Ocultar' : 'Ver'} Detalles
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {calculos.tiempoTrabajado.total_horas}h
              </p>
              <p className="text-sm text-gray-600">Horas totales semanales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {calculos.tiempoTrabajado.promedio_horas_dia}h
              </p>
              <p className="text-sm text-gray-600">Promedio horas/día</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {calculos.tiempoTrabajado.total_dias}
              </p>
              <p className="text-sm text-gray-600">Días trabajados</p>
            </div>
          </div>

          {showFullStats && calculos.patrones && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Patrones Detectados</h4>
              <div className="space-y-2">
                {calculos.patrones.patrones.map((patron, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{patron.descripcion}</span>
                    <span className="text-sm font-medium text-gray-900">{patron.porcentaje}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <strong>Consistencia general:</strong> {calculos.patrones.consistencia}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Icon name="Download" size={16} />
            <span>Exportar Excel</span>
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Icon name="FileText" size={16} />
            <span>Exportar PDF</span>
          </button>
          
          <button
            onClick={() => showMessage?.('info', 'Función de validación ejecutada')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon name="CheckCircle" size={16} />
            <span>Validar Horarios</span>
          </button>
          
          <button
            onClick={() => showMessage?.('info', 'Sincronización iniciada')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Icon name="RefreshCw" size={16} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>
              <Icon name="Clock" size={14} className="inline mr-1" />
              Última actualización: {new Date().toLocaleString()}
            </span>
            {calculos.problemasIntegridad.length > 0 && (
              <span className="text-red-600">
                <Icon name="AlertTriangle" size={14} className="inline mr-1" />
                {calculos.problemasIntegridad.length} problemas de integridad
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
              Usuario ID: {usuarioId}
            </span>
            {helpers.tieneHorariosTemporalesActivos && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Temporales activos
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagementSummary;