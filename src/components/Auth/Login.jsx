// src/components/Auth/Login.jsx - CON SOPORTE PARA LOGO PERSONALIZADO
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, Lock, Mail, Shield } from 'lucide-react';
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
    <div className="min-h-screen flex w-full bg-slate-50">
      {/* Left Side - Image & Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-900/90" />
        
        <div className="relative z-10 flex flex-col h-full justify-between p-12 text-white">
          <div>
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                  <Shield className="w-6 h-6 text-blue-200" />
                </div>
                <span className="text-lg font-bold tracking-wider text-blue-100">ECONX 2.0</span>
             </div>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Cooperativa de <br/>
              <span className="text-blue-300">Ahorro y Crédito</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-md leading-relaxed font-light">
              Gestionamos su futuro financiero con seguridad, confianza y la tecnología más avanzada del sector.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>© 2026 Sistema Financiero Integrado</span>
            <span className="w-1 h-1 rounded-full bg-slate-500" />
            <span>v2.0.0</span>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative bg-slate-100">
        <div className="w-full max-w-[480px] bg-white p-8 lg:p-10 rounded-3xl shadow-2xl border border-slate-100 space-y-8">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
             {logoLoading ? (
               <div className="h-16 w-48 bg-gray-100 animate-pulse rounded" />
             ) : (
               <img 
                 src={loginLogoUrl} 
                 alt="Logo" 
                 className="h-16 object-contain"
               />
             )}
          </div>

          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Bienvenido</h2>
            <p className="text-slate-500">Ingrese sus credenciales para acceder al sistema.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error de autenticación</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 block">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 ${
                    error && (error.includes('email') || error.includes('Email'))
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100 bg-slate-50 focus:bg-white hover:border-slate-300'
                  }`}
                  placeholder="ejemplo@cooperativa.com"
                  value={formData.email}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 block">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 ${
                    error && (error.includes('contraseña') || error.includes('password') || error.includes('incorrectos'))
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100 bg-slate-50 focus:bg-white hover:border-slate-300'
                  }`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  disabled={loading}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                  Recordar usuario
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all duration-200 ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar al Sistema
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">
               Protegido por reCAPTCHA y sujeto a la Política de Privacidad y Términos de Servicio.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;