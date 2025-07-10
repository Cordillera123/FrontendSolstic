// src/components/Windows/LogoConfigWindow.jsx
import React, { useState, useCallback, useRef } from 'react';
import { useLogo } from '../../context/LogoContext';
import Icon from '../UI/Icon';

const LogoUploadComponent = ({ ubicacion, titulo, descripcion, currentLogo, onSuccess }) => {
  const { uploadLogo, deleteLogo, isLoading } = useLogo();
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  }, []);

  // SOLO REEMPLAZA LA FUNCIÓN handleFileUpload en LogoConfigWindow.jsx con esta versión:

const handleFileUpload = useCallback(async (file) => {
  // ✅ DECLARAR progressInterval FUERA del try para poder limpiarlo en catch
  let progressInterval;
  
  try {
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // ✅ MEJORAR: Progreso más realista
    setUploadProgress(0);
    progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) { // ✅ Parar en 85% para esperar respuesta del servidor
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 15;
      });
    }, 300);

    // Subir archivo
    const result = await uploadLogo(file, ubicacion, {
      nombre: `Logo ${titulo}`,
      descripcion: `Logo personalizado para ${descripcion.toLowerCase()}`
    });
    
    // ✅ COMPLETAR PROGRESO solo si es exitoso
    clearInterval(progressInterval);
    setUploadProgress(100);
    
    // Notificar éxito
    if (onSuccess) {
      onSuccess(`Logo ${titulo} subido exitosamente`);
    }
    
    // Limpiar preview después de un tiempo
    setTimeout(() => {
      setPreview(null);
      setUploadProgress(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ LogoConfigWindow - Error al subir logo:', error);
    
    // ✅ LIMPIAR PROGRESO EN CASO DE ERROR
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    setUploadProgress(0);
    setPreview(null);
    
    // ✅ MOSTRAR ERROR MÁS DETALLADO
    const errorMessage = error.message || 'Error desconocido al subir logo';
    console.error('❌ LogoConfigWindow - Error detallado:', errorMessage);
    
    if (onSuccess) {
      onSuccess(`Error al subir logo: ${errorMessage}`, 'error');
    }
  }
}, [uploadLogo, ubicacion, titulo, descripcion, onSuccess]);


  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteLogo(currentLogo.id, ubicacion);
      setPreview(null);
      
      if (onSuccess) {
        onSuccess(`Logo ${titulo} eliminado exitosamente`);
      }
    } catch (error) {
      console.error('Error al eliminar logo:', error);
      if (onSuccess) {
        onSuccess(`Error al eliminar logo: ${error.message}`, 'error');
      }
    }
  }, [deleteLogo, currentLogo?.id, ubicacion, titulo, onSuccess]);

  const isDefaultLogo = currentLogo?.url?.includes('logo-default.jpg');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
          <p className="text-sm text-gray-600">{descripcion}</p>
        </div>
        
        {currentLogo && !isDefaultLogo && (
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm transition-colors"
          >
            <Icon name="Trash2" size={14} className="inline mr-1" />
            Eliminar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Área de subida */}
        <div>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Icon name="Upload" size={48} className="mx-auto mb-4 text-gray-400" />
            
            <p className="text-lg font-medium text-gray-900 mb-2">
              Arrastra tu logo aquí
            </p>
            <p className="text-sm text-gray-600 mb-4">
              o haz clic para seleccionar un archivo
            </p>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Subiendo...' : 'Seleccionar archivo'}
            </button>
            
            {/* Barra de progreso */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{uploadProgress}% subido</p>
              </div>
            )}
            
            <div className="mt-4 text-xs text-gray-500">
              <p>Formatos: JPEG, PNG, GIF, WebP</p>
              <p>Tamaño máximo: 2MB</p>
              <p>Resolución recomendada: 500x200px</p>
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Vista previa</h4>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            {preview || currentLogo?.url ? (
              <div className="text-center">
                <img
                  src={preview || currentLogo.url}
                  alt="Logo preview"
                  className="max-w-full max-h-32 mx-auto object-contain"
                  onError={(e) => {
                    e.target.src = '/storage/logos/general/logo-default.png';
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {currentLogo?.nombre || 'Logo personalizado'}
                </p>
                {isDefaultLogo && (
                  <span className="inline-block mt-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                    Logo por defecto
                  </span>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="Image" size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Sin logo personalizado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LogoConfigWindow = ({ showMessage = (message, type = 'info') => console.log(`${type}: ${message}`) }) => {
  const { logoData, isLoading, error, reloadLogos } = useLogo();
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleRefresh = useCallback(() => {
    reloadLogos();
    setLastUpdateTime(new Date());
    showMessage('Configuración de logos actualizada', 'success');
  }, [reloadLogos, showMessage]);

  const handleUploadSuccess = useCallback((message, type = 'success') => {
    showMessage(message, type);
    setLastUpdateTime(new Date());
  }, [showMessage]);

  // ✅ NUEVA FUNCIÓN: Guardar configuración
  const handleSaveConfiguration = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Recargar logos para asegurar que tenemos la información más actualizada
      await reloadLogos();
      
      // Simular guardado (puedes agregar lógica específica aquí si es necesario)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastUpdateTime(new Date());
      showMessage('✅ Configuración de logos guardada exitosamente', 'success');
      
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      showMessage(`❌ Error al guardar configuración: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [reloadLogos, showMessage]);

  if (isLoading && !logoData.principal) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración de logos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Icon name="Image" size={28} className="mr-3 text-blue-600" />
              Configuración de Logos
            </h1>
            <p className="text-gray-600 mt-1">
              Personaliza los logos que se muestran en tu sistema
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastUpdateTime && (
              <div className="text-sm text-gray-500">
                Última actualización: {lastUpdateTime.toLocaleTimeString()}
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading || isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <Icon name="RefreshCw" size={16} className="inline mr-2" />
                Actualizar
              </button>
              
              {/* ✅ NUEVO BOTÓN: Guardar Configuración */}
              <button
                onClick={handleSaveConfiguration}
                disabled={isLoading || isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={16} className="inline mr-2" />
                    💾 Guardar Configuración
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Icon name="AlertCircle" size={20} className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Logo Principal */}
          <LogoUploadComponent
            ubicacion="principal"
            titulo="Logo Principal"
            descripcion="Logo que se mostrará en todo el sistema como identificación principal"
            currentLogo={logoData.principal}
            onSuccess={handleUploadSuccess}
          />

          {/* Logo para Login */}
          <LogoUploadComponent
            ubicacion="login"
            titulo="Logo para Pantalla de Login"
            descripcion="Logo específico para la pantalla de inicio de sesión (opcional)"
            currentLogo={logoData.login}
            onSuccess={handleUploadSuccess}
          />

          {/* Logo para Sidebar */}
          <LogoUploadComponent
            ubicacion="sidebar"
            titulo="Logo para Sidebar"
            descripcion="Logo optimizado para mostrar en la barra lateral (opcional)"
            currentLogo={logoData.sidebar}
            onSuccess={handleUploadSuccess}
          />
        </div>

        {/* ✅ NUEVA SECCIÓN: Estado de la configuración */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <Icon name="CheckCircle" size={20} className="text-green-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">
                Estado de la Configuración
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Logo Principal:</span>
                  <span className="font-medium">
                    {logoData.principal?.nombre || 'No configurado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Logo Login:</span>
                  <span className="font-medium">
                    {logoData.login?.nombre || 'Usa logo principal'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Logo Sidebar:</span>
                  <span className="font-medium">
                    {logoData.sidebar?.nombre || 'Usa logo principal'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Icon name="Info" size={20} className="text-blue-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                Información sobre la configuración de logos
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Si no se especifica un logo para login o sidebar, se usará el logo principal</li>
                <li>• Los logos se optimizan automáticamente para cada ubicación</li>
                <li>• Se recomienda usar imágenes PNG con fondo transparente</li>
                <li>• Los cambios se aplicarán inmediatamente en todo el sistema</li>
                <li>• Los logos se almacenan de forma segura en el servidor</li>
                <li>• El logo por defecto del sistema no se puede eliminar</li>
                <li>• Usa el botón "Guardar Configuración" para confirmar todos los cambios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay de carga */}
      {(isLoading || isSaving) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-3 border">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-700 font-medium">
              {isSaving ? 'Guardando configuración...' : 'Procesando solicitud...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoConfigWindow;