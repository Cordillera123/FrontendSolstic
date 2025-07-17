// src/hooks/useHorariosUsuario.js - Hook personalizado para gestión de horarios de usuario
import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook personalizado para gestionar horarios de usuarios
 * Proporciona funcionalidades completas para horarios permanentes y temporales
 */
export const useHorariosUsuario = (usuarioId = null) => {
    const { user } = useAuth();

    // Estados
    const [horarios, setHorarios] = useState(null);
    const [horariosTemporales, setHorariosTemporales] = useState([]);
    const [horarioActual, setHorarioActual] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ID efectivo del usuario (props o usuario actual)
    const efectiveUserId = usuarioId || user?.usu_id;

    // ✅ Cargar horarios del usuario
    const cargarHorarios = useCallback(async (params = {}) => {
        if (!efectiveUserId) return;

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.getHorarios(efectiveUserId, params);

            if (result.status === 'success') {
                setHorarios(result.data);
                return result.data;
            } else {
                throw new Error(result.message || 'Error cargando horarios');
            }
        } catch (err) {
            console.error('Error cargando horarios:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [efectiveUserId]);

    // ✅ Cargar horarios temporales
    const cargarHorariosTemporales = useCallback(async (params = {}) => {
        if (!efectiveUserId) return;

        try {
            const result = await adminService.horariosUsuarios.getHorariosTemporales(efectiveUserId, params);

            if (result.status === 'success') {
                setHorariosTemporales(result.data.periodos_temporales || []);
                return result.data;
            } else {
                throw new Error(result.message || 'Error cargando horarios temporales');
            }
        } catch (err) {
            console.error('Error cargando horarios temporales:', err);
            setError(err.message);
            return null;
        }
    }, [efectiveUserId]);

    // ✅ Cargar horario actual
    const cargarHorarioActual = useCallback(async () => {
        if (!efectiveUserId) return;

        try {
            const result = await adminService.horariosUsuarios.getHorarioActual(efectiveUserId);

            if (result.status === 'success') {
                setHorarioActual(result.data);
                return result.data;
            } else {
                throw new Error(result.message || 'Error cargando horario actual');
            }
        } catch (err) {
            console.error('Error cargando horario actual:', err);
            setError(err.message);
            return null;
        }
    }, [efectiveUserId]);

    // ✅ Crear/actualizar horario individual
    const crearHorario = async (horarioData) => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.crearHorario(efectiveUserId, horarioData);

            if (result.status === 'success') {
                // Recargar horarios después de crear
                await cargarHorarios();
                return result.data;
            } else {
                throw new Error(result.message || 'Error creando horario');
            }
        } catch (err) {
            console.error('Error creando horario:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ✅ Crear múltiples horarios
    const crearHorariosBatch = async (horariosData) => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.crearHorariosBatch(efectiveUserId, horariosData);

            if (result.status === 'success') {
                // Recargar horarios después de crear
                await cargarHorarios();
                return result.data;
            } else {
                throw new Error(result.message || 'Error creando horarios múltiples');
            }
        } catch (err) {
            console.error('Error creando horarios batch:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ✅ Clonar horarios desde oficina
    const clonarDesdeOficina = async (opciones = {}) => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.clonarDesdeOficina(efectiveUserId, opciones);

            if (result.status === 'success') {
                // Recargar horarios después de clonar
                await cargarHorarios();
                return result.data;
            } else {
                throw new Error(result.message || 'Error clonando horarios desde oficina');
            }
        } catch (err) {
            console.error('Error clonando desde oficina:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ✅ Eliminar horario de un día
    const eliminarHorario = async (diaId) => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.eliminarHorario(efectiveUserId, diaId);

            if (result.status === 'success') {
                // Recargar horarios después de eliminar
                await cargarHorarios();
                return result.data;
            } else {
                throw new Error(result.message || 'Error eliminando horario');
            }
        } catch (err) {
            console.error('Error eliminando horario:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ✅ Eliminar todos los horarios
    const eliminarTodosLosHorarios = async () => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.eliminarTodosLosHorarios(efectiveUserId);

            if (result.status === 'success') {
                // Limpiar estado después de eliminar todos
                setHorarios(null);
                return result.data;
            } else {
                throw new Error(result.message || 'Error eliminando todos los horarios');
            }
        } catch (err) {
            console.error('Error eliminando todos los horarios:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ✅ Validar acceso para fecha/hora específica
    const validarAcceso = async (fecha, hora) => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            const result = await adminService.horariosUsuarios.validarAcceso(efectiveUserId, fecha, hora);

            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || 'Error validando acceso');
            }
        } catch (err) {
            console.error('Error validando acceso:', err);
            throw err;
        }
    };

    // ✅ HORARIOS TEMPORALES

    // Crear horario temporal
    const crearHorarioTemporal = async (horarioTemporalData) => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.crearHorarioTemporal(efectiveUserId, horarioTemporalData);

            if (result.status === 'success') {
                // Recargar horarios temporales después de crear
                await cargarHorariosTemporales();
                await cargarHorarios(); // También recargar horarios regulares
                return result.data;
            } else {
                throw new Error(result.message || 'Error creando horario temporal');
            }
        } catch (err) {
            console.error('Error creando horario temporal:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Eliminar horario temporal
    const eliminarHorarioTemporal = async (temporalId, eliminarTodoPeriodo = false) => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.eliminarHorarioTemporal(
                efectiveUserId,
                temporalId,
                eliminarTodoPeriodo
            );

            if (result.status === 'success') {
                // Recargar horarios temporales después de eliminar
                await cargarHorariosTemporales();
                await cargarHorarios(); // También recargar horarios regulares
                return result.data;
            } else {
                throw new Error(result.message || 'Error eliminando horario temporal');
            }
        } catch (err) {
            console.error('Error eliminando horario temporal:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ✅ Obtener horario efectivo para una fecha
    const obtenerHorarioEfectivoFecha = async (fecha) => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            const result = await adminService.horariosUsuarios.getHorarioEfectivoFecha(efectiveUserId, fecha);

            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || 'Error obteniendo horario efectivo');
            }
        } catch (err) {
            console.error('Error obteniendo horario efectivo:', err);
            throw err;
        }
    };

    // ✅ FUNCIONES DE TRANSFERENCIA

    // Transferir usuario a nueva oficina
    const transferirOficina = async (transferData) => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.transferirOficina(efectiveUserId, transferData);

            if (result.status === 'success') {
                // Recargar horarios después de transferir
                await cargarHorarios();
                return result.data;
            } else {
                throw new Error(result.message || 'Error transfiriendo oficina');
            }
        } catch (err) {
            console.error('Error transfiriendo oficina:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Copiar horarios a otro usuario
    const copiarHorarios = async (usuarioDestinoId, opciones = {}) => {
        if (!efectiveUserId) throw new Error('Usuario no definido');

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.copiarHorarios(
                efectiveUserId,
                usuarioDestinoId,
                opciones
            );

            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || 'Error copiando horarios');
            }
        } catch (err) {
            console.error('Error copiando horarios:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ✅ FUNCIONES DE UTILIDAD

    // Verificar si tiene horarios personalizados
    const tieneHorariosPersonalizados = () => {
        return horarios && horarios.estadisticas && horarios.estadisticas.total_dias_personalizados > 0;
    };

    // Verificar si tiene horarios temporales activos
    const tieneHorariosTemporalesActivos = () => {
        return horariosTemporales && horariosTemporales.some(periodo => periodo.esta_vigente);
    };

    // Obtener resumen de horarios
    const obtenerResumenHorarios = () => {
        if (!horarios) return null;

        return {
            dias_configurados: horarios.estadisticas?.dias_operativos || 0,
            dias_temporales: horarios.estadisticas?.total_dias_temporales || 0,
            dias_personalizados: horarios.estadisticas?.total_dias_personalizados || 0,
            dias_heredados: horarios.estadisticas?.total_dias_heredados || 0,
            dias_sin_horario: horarios.estadisticas?.total_dias_sin_horario || 0,
            independencia_oficina: horarios.estadisticas?.independencia_oficina || false,
            usuario_operativo: horarios.estadisticas?.usuario_operativo || false
        };
    };

    // Formatear horarios para calendario
    const formatearParaCalendario = () => {
        if (!horarios || !horarios.horarios_por_dia) return [];

        return adminService.horariosUsuarios.formatHorariosParaCalendario(horarios.horarios_por_dia);
    };

    // ✅ Efecto para cargar datos iniciales
    useEffect(() => {
        if (efectiveUserId) {
            cargarHorarios();
            cargarHorariosTemporales();
            cargarHorarioActual();
        }
    }, [efectiveUserId, cargarHorarios, cargarHorariosTemporales, cargarHorarioActual]);

    // ✅ Función de refresco completo
    const refrescarTodo = useCallback(async () => {
        if (!efectiveUserId) return;

        setLoading(true);
        try {
            await Promise.all([
                cargarHorarios(),
                cargarHorariosTemporales(),
                cargarHorarioActual()
            ]);
        } catch (error) {
            console.error('Error refrescando horarios:', error);
        } finally {
            setLoading(false);
        }
    }, [efectiveUserId, cargarHorarios, cargarHorariosTemporales, cargarHorarioActual]);

    return {
        // Estados
        horarios,
        horariosTemporales,
        horarioActual,
        loading,
        error,
        usuarioId: efectiveUserId,

        // Funciones de carga
        cargarHorarios,
        cargarHorariosTemporales,
        cargarHorarioActual,
        refrescarTodo,

        // Funciones de gestión de horarios permanentes
        crearHorario,
        crearHorariosBatch,
        clonarDesdeOficina,
        eliminarHorario,
        eliminarTodosLosHorarios,

        // Funciones de horarios temporales
        crearHorarioTemporal,
        eliminarHorarioTemporal,

        // Funciones de validación
        validarAcceso,
        obtenerHorarioEfectivoFecha,

        // Funciones de transferencia
        transferirOficina,
        copiarHorarios,

        // Funciones de utilidad
        tieneHorariosPersonalizados,
        tieneHorariosTemporalesActivos,
        obtenerResumenHorarios,
        formatearParaCalendario,

        // Limpiar error
        clearError: () => setError(null)
    };
};

// ✅ Hook específico para horarios del usuario actual
export const useMisHorarios = () => {
    const { user } = useAuth();
    return useHorariosUsuario(user?.usu_id);
};

// ✅ Hook específico para horarios temporales
export const useHorariosTemporales = (usuarioId = null) => {
    const { user } = useAuth();
    const efectiveUserId = usuarioId || user?.usu_id;

    const [temporales, setTemporales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cargarTemporales = useCallback(async (params = {}) => {
        if (!efectiveUserId) return;

        try {
            setLoading(true);
            setError(null);

            const result = await adminService.horariosUsuarios.getHorariosTemporales(efectiveUserId, params);

            if (result.status === 'success') {
                setTemporales(result.data.periodos_temporales || []);
                return result.data;
            } else {
                throw new Error(result.message || 'Error cargando horarios temporales');
            }
        } catch (err) {
            console.error('Error cargando horarios temporales:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [efectiveUserId]);

    useEffect(() => {
        if (efectiveUserId) {
            cargarTemporales();
        }
    }, [efectiveUserId, cargarTemporales]);

    return {
        temporales,
        loading,
        error,
        cargarTemporales,
        clearError: () => setError(null)
    };
};

export default useHorariosUsuario;