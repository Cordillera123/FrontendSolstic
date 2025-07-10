// src/components/Auth/Login.jsx - CON SOPORTE PARA LOGO PERSONALIZADO
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogo } from '../../context/LogoContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { getLogoUrl, isLoading: logoLoading } = useLogo();

  const from = location.state?.from?.pathname || '/dashboard';

  // Obtener URL del logo para login
  const loginLogoUrl = getLogoUrl('login');

  // Verificar si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Usuario ya autenticado, redirigiendo a:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Cargar usuario recordado
  useEffect(() => {
    const savedUser = localStorage.getItem('rememberedUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setFormData(prev => ({
          ...prev,
          email: userData.email || ''
        }));
        setRememberMe(true);
      } catch (error) {
        console.error('Error al cargar usuario recordado:', error);
        localStorage.removeItem('rememberedUser');
      }
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
  }, [error]);

  const validateForm = useCallback(() => {
    if (!formData.email?.trim() || !formData.password?.trim()) {
      setError('Por favor ingrese su email y contraseña');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Por favor ingrese un email válido');
      return false;
    }
    
    if (formData.password.length < 3) {
      setError('La contraseña debe tener al menos 3 caracteres');
      return false;
    }
    
    return true;
  }, [formData.email, formData.password]);

  // Función principal de login
  const performLogin = useCallback(async () => {
    console.log('🔐 Iniciando proceso de login...');
    
    if (!validateForm()) {
      console.log('❌ Validación fallida');
      return;
    }
    
    if (loading) {
      console.log('⏳ Login ya en progreso...');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('📡 Llamando a la función login...');
      
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanPassword = formData.password.trim();
      
      const result = await login(cleanEmail, cleanPassword);
      console.log('✅ Login exitoso:', result);
      
      // Guardar credenciales si es necesario
      if (rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify({
          email: cleanEmail
        }));
      } else {
        localStorage.removeItem('rememberedUser');
      }
      
      console.log('🔄 Navegando a:', from);
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('❌ Error durante el login:', error);
      
      setLoading(false);
      
      let errorMessage = 'Error al iniciar sesión. Intente nuevamente.';
      
      if (error?.response?.status === 401) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Su cuenta está inactiva. Contacte al administrador';
      } else if (error?.response?.status === 422) {
        errorMessage = 'Datos de login inválidos';
      } else if (error?.response?.status === 429) {
        errorMessage = 'Demasiados intentos. Espere unos minutos';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Error del servidor. Intente más tarde';
      } else if (error?.message?.includes('Network Error') || error?.code === 'NETWORK_ERROR') {
        errorMessage = 'Error de conexión. Verifique su internet';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Tiempo de espera agotado. Intente nuevamente';
      } else if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Focus en email para facilitar reintento
      setTimeout(() => {
        const emailInput = document.getElementById('email');
        if (emailInput) {
          emailInput.focus();
          emailInput.select();
        }
      }, 100);
    }
  }, [formData.email, formData.password, validateForm, loading, login, rememberMe, from, navigate]);

  // Manejo de form submit
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    performLogin();
  }, [performLogin]);

  // Manejo de tecla Enter
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performLogin();
    }
  }, [performLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f9ff' }}>
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header con Logo Personalizado */}
        <div className="py-8 px-6 flex flex-col items-center" style={{ background: 'linear-gradient(to right, #0ea5e9, #0369a1)' }}>
          {/* Logo Container */}
          <div className="h-20 mb-4 flex items-center justify-center w-full">
            {logoLoading ? (
              // Placeholder mientras carga el logo
              <div className="animate-pulse">
                <div className="h-16 w-48 bg-white bg-opacity-20 rounded"></div>
              </div>
            ) : (
              <img
                src={loginLogoUrl}
                alt="Logo COAC"
                className="max-h-16 max-w-full object-contain"
                // ✅ REMOVIDO: filtro que convertía la imagen a blanco
                // style={{ filter: 'brightness(0) invert(1)' }}
                onError={(e) => {
                  // Fallback a texto si la imagen no carga
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            )}
            {/* Fallback text */}
            <h1 
              className="text-2xl font-bold text-white tracking-tight" 
              style={{ display: 'none' }}
            >
              COAC SISTEMA
            </h1>
          </div>
          
          <h2 className="text-white opacity-90 text-sm mt-1">
            Sistema Financiero Integrado
          </h2>
        </div>
        
        {/* Formulario */}
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-6" style={{ color: '#0c4a6e' }}>
            Iniciar Sesión
          </h3>
          
          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md">
              <div className="flex items-start">
                <AlertCircle size={20} className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error de autenticación</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`w-full border rounded-md py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  error && (error.includes('email') || error.includes('Email')) 
                    ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-sky-500'
                }`}
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`w-full border rounded-md py-3 px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                    error && (error.includes('contraseña') || error.includes('password') || error.includes('incorrectos')) 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-sky-500'
                  }`}
                  placeholder="Ingrese su contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="mb-6 flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded transition-colors"
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="ml-3 text-sm text-gray-700">
                Recordar mi email
              </label>
            </div>
            
            {/* Botón de submit */}
            <button
              type="submit"
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
                loading 
                  ? 'bg-sky-400 cursor-not-allowed' 
                  : 'bg-sky-500 hover:bg-sky-600 transform hover:-translate-y-0.5 hover:shadow-lg'
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>
          
          {/* Debug info (solo desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
              <strong>Debug:</strong> Loading: {loading.toString()} | Error: {error ? 'Sí' : 'No'} | Auth: {isAuthenticated ? 'Sí' : 'No'} | Logo: {loginLogoUrl}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Cooperativa de Ahorro y Crédito. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            v2.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;