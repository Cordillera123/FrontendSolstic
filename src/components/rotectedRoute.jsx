// src/components/ProtectedRoute.jsx - Middleware actualizado con validación de horarios individuales
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useSchedule } from '../context/AuthContext';

/**
 * Componente de ruta protegida que valida:
 * 1. Autenticación del usuario
 * 2. Horarios individuales del usuario
 * 3. Permisos de acceso a rutas específicas
 */
const ProtectedRoute = ({
    children,
    requireAuth = true,
    requireSchedule = true,
    allowSuperAdmin = true,
    redirectTo = '/login',
    menuId = null,
    submenuId = null,
    optionId = null
}) => {
    const {
        isAuthenticated,
        loading,
        hasPermission,
        user
    } = useAuth();

    const {
        canAccessNow,
        isSuperAdmin,
        scheduleStatus,
        hasScheduleRestrictions
    } = useSchedule();

    const location = useLocation();
    const [isValidating, setIsValidating] = useState(true);
    const [validationResult, setValidationResult] = useState(null);

    // ✅ Validación completa de acceso
    useEffect(() => {
        const validateAccess = async () => {
            setIsValidating(true);

            try {
                console.log('🔒 ProtectedRoute: Validando acceso para:', location.pathname);

                // 1. Verificar autenticación
                if (requireAuth && !isAuthenticated) {
                    console.log('❌ ProtectedRoute: Usuario no autenticado');
                    setValidationResult({
                        allowed: false,
                        reason: 'NOT_AUTHENTICATED',
                        message: 'Debe iniciar sesión para acceder',
                        redirect: redirectTo
                    });
                    return;
                }

                // Si no requiere autenticación, permitir acceso
                if (!requireAuth) {
                    setValidationResult({
                        allowed: true,
                        reason: 'NO_AUTH_REQUIRED'
                    });
                    return;
                }

                // 2. Verificar permisos de módulo si se especifican
                if (menuId && !hasPermission(menuId, submenuId, optionId)) {
                    console.log('❌ ProtectedRoute: Sin permisos para el módulo');
                    setValidationResult({
                        allowed: false,
                        reason: 'NO_PERMISSION',
                        message: 'No tiene permisos para acceder a este módulo',
                        redirect: '/dashboard'
                    });
                    return;
                }

                // 3. Verificar horarios si se requiere
                if (requireSchedule && hasScheduleRestrictions()) {
                    // Super admins siempre pueden acceder si está permitido
                    if (allowSuperAdmin && isSuperAdmin()) {
                        console.log('✅ ProtectedRoute: Super admin - acceso sin restricciones');
                        setValidationResult({
                            allowed: true,
                            reason: 'SUPER_ADMIN',
                            message: 'Acceso como super administrador'
                        });
                        return;
                    }

                    // Verificar horario individual
                    const canAccess = canAccessNow();

                    if (!canAccess) {
                        console.log('❌ ProtectedRoute: Fuera del horario permitido');
                        setValidationResult({
                            allowed: false,
                            reason: 'OUTSIDE_SCHEDULE',
                            message: scheduleStatus?.mensaje || 'Fuera del horario de acceso permitido',
                            redirect: '/horario-restringido'
                        });
                        return;
                    }
                }

                // ✅ Todas las validaciones pasaron
                console.log('✅ ProtectedRoute: Acceso permitido');
                setValidationResult({
                    allowed: true,
                    reason: 'VALIDATED',
                    message: 'Acceso autorizado'
                });

            } catch (error) {
                console.error('❌ ProtectedRoute: Error en validación:', error);
                setValidationResult({
                    allowed: false,
                    reason: 'VALIDATION_ERROR',
                    message: 'Error validando acceso',
                    redirect: '/error'
                });
            } finally {
                setIsValidating(false);
            }
        };

        // Solo validar si no está cargando la autenticación
        if (!loading) {
            validateAccess();
        }
    }, [
        isAuthenticated,
        loading,
        requireAuth,
        requireSchedule,
        allowSuperAdmin,
        canAccessNow,
        isSuperAdmin,
        hasScheduleRestrictions,
        scheduleStatus,
        hasPermission,
        menuId,
        submenuId,
        optionId,
        location.pathname,
        redirectTo
    ]);

    // Mostrar loading mientras valida
    if (loading || isValidating) {
        return <LoadingValidation />;
    }

    // Si no hay resultado de validación, mostrar loading
    if (!validationResult) {
        return <LoadingValidation />;
    }

    // Si no está permitido, redirigir
    if (!validationResult.allowed) {
        console.log('🚫 ProtectedRoute: Redirigiendo por:', validationResult.reason);

        // Guardar la ruta intentada para redirección posterior
        const state = {
            from: location,
            reason: validationResult.reason,
            message: validationResult.message
        };

        return <Navigate to={validationResult.redirect || redirectTo} state={state} replace />;
    }

    // ✅ Acceso permitido - renderizar children
    return children;
};

// ✅ Componente de loading para validación
const LoadingValidation = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                Validando acceso
            </h3>
            <p className="text-sm text-gray-500">
                Verificando autenticación y horarios...
            </p>
        </div>
    </div>
);

// ✅ Componente para mostrar cuando está fuera de horario
export const OutsideSchedulePage = () => {
    const { user, logout } = useAuth();
    const { scheduleStatus, getTimeRemaining, isSuperAdmin } = useSchedule();
    const location = useLocation();

    const timeLeft = getTimeRemaining();
    const message = location.state?.message || scheduleStatus?.mensaje || 'Fuera del horario de acceso';

    const formatTime = (minutes) => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
        return `${minutes} minutos`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Fuera del Horario de Acceso
                </h2>

                <p className="text-gray-600 mb-4">
                    {message}
                </p>

                {timeLeft !== null && timeLeft > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                            <strong>Tiempo restante:</strong> {formatTime(timeLeft)}
                        </p>
                    </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                    <p className="text-sm text-gray-600">
                        <strong>Usuario:</strong> {user?.fullName || user?.email}
                    </p>
                    {scheduleStatus?.horario_detalle && (
                        <p className="text-sm text-gray-600 mt-1">
                            <strong>Horario:</strong> {scheduleStatus.horario_detalle.hora_inicio} - {scheduleStatus.horario_detalle.hora_fin}
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Verificar Horario Nuevamente
                    </button>

                    <button
                        onClick={logout}
                        className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                    Si cree que esto es un error, contacte al administrador del sistema.
                </p>
            </div>
        </div>
    );
};

// ✅ Hook para usar en componentes que necesiten validación de horario
export const useRouteProtection = () => {
    const { isAuthenticated } = useAuth();
    const { canAccessNow, isSuperAdmin, hasScheduleRestrictions } = useSchedule();

    const validateAccess = (options = {}) => {
        const {
            requireAuth = true,
            requireSchedule = true,
            allowSuperAdmin = true
        } = options;

        // Verificar autenticación
        if (requireAuth && !isAuthenticated) {
            return {
                allowed: false,
                reason: 'NOT_AUTHENTICATED',
                message: 'Debe iniciar sesión'
            };
        }

        // Verificar horarios
        if (requireSchedule && hasScheduleRestrictions()) {
            if (allowSuperAdmin && isSuperAdmin()) {
                return {
                    allowed: true,
                    reason: 'SUPER_ADMIN',
                    message: 'Acceso como super administrador'
                };
            }

            if (!canAccessNow()) {
                return {
                    allowed: false,
                    reason: 'OUTSIDE_SCHEDULE',
                    message: 'Fuera del horario de acceso'
                };
            }
        }

        return {
            allowed: true,
            reason: 'VALIDATED',
            message: 'Acceso autorizado'
        };
    };

    return {
        validateAccess,
        isAuthenticated,
        canAccessNow: canAccessNow(),
        isSuperAdmin: isSuperAdmin(),
        hasScheduleRestrictions: hasScheduleRestrictions()
    };
};

// ✅ Wrapper para rutas que solo requieren autenticación (sin horarios)
export const AuthOnlyRoute = ({ children, ...props }) => (
    <ProtectedRoute requireSchedule={false} {...props}>
        {children}
    </ProtectedRoute>
);

// ✅ Wrapper para rutas que requieren permisos específicos
export const PermissionRoute = ({ children, menuId, submenuId, optionId, ...props }) => (
    <ProtectedRoute
        menuId={menuId}
        submenuId={submenuId}
        optionId={optionId}
        {...props}
    >
        {children}
    </ProtectedRoute>
);

// ✅ Wrapper para rutas de super admin
export const SuperAdminRoute = ({ children, ...props }) => (
    <ProtectedRoute requireSchedule={false} {...props}>
        {children}
    </ProtectedRoute>
);

export default ProtectedRoute;